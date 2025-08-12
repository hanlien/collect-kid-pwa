import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { validateEnv, recognizeRequestSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { SpeciesResult, Category, Provider } from '@/types/species';
import { colorNameToHex, getBadgeSubtype } from '@/lib/utils';

// Simple in-memory rate limiting (TODO: use Redis in production)
const rateLimitCounts = {
  gcv: 0,
  plantid: 0,
  lastReset: new Date().toDateString(),
};

function resetRateLimitIfNeeded() {
  const today = new Date().toDateString();
  if (rateLimitCounts.lastReset !== today) {
    rateLimitCounts.gcv = 0;
    rateLimitCounts.plantid = 0;
    rateLimitCounts.lastReset = today;
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = validateEnv();
    resetRateLimitIfNeeded();

    // Parse multipart form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const hint = formData.get('hint') as string || 'auto';

    // Validate request
    const validatedHint = recognizeRequestSchema.parse({ hint }).hint;

    // Validate image
    if (!image || !image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid image file' },
        { status: 400 }
      );
    }

    const maxSizeMB = env.MAX_IMAGE_MB;
    if (image.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Image too large. Max size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Initialize Google Vision client
    const credentials = JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    const visionClient = new ImageAnnotatorClient({ credentials });

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Call Google Vision API
    if (rateLimitCounts.gcv >= env.GCV_MAX_DAY) {
      return NextResponse.json(
        { error: 'Daily Google Vision limit reached' },
        { status: 429 }
      );
    }

    const [result] = await visionClient.annotateImage({
      image: { content: base64Image },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES', maxResults: 5 },
      ],
    });

    rateLimitCounts.gcv++;

    const labels = result.labelAnnotations?.map(l => l.description || '') || [];
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    // Extract color chips
    const colorChips = colors
      .slice(0, 5)
      .map(color => {
        const rgb = color.color;
        if (rgb) {
          return `rgb(${rgb.red || 0}, ${rgb.green || 0}, ${rgb.blue || 0})`;
        }
        return null;
      })
      .filter(Boolean) as string[];

    // Routing logic
    let speciesResult: SpeciesResult;

    const plantTerms = ['plant', 'flower', 'tree', 'leaf', 'petal', 'bloom'];
    const bugTerms = ['insect', 'bug', 'bee', 'butterfly', 'ant', 'spider'];
    const animalTerms = ['animal', 'mammal', 'bird', 'reptile', 'amphibian', 'fish'];

    const hasPlantLabels = labels.some(label => 
      plantTerms.some(term => label.toLowerCase().includes(term))
    );
    const hasBugLabels = labels.some(label => 
      bugTerms.some(term => label.toLowerCase().includes(term))
    );
    const hasAnimalLabels = labels.some(label => 
      animalTerms.some(term => label.toLowerCase().includes(term))
    );

    if ((hasPlantLabels || validatedHint === 'flower') && rateLimitCounts.plantid < env.PLANT_MAX_DAY) {
      // Call Plant.id API
      try {
        const plantResponse = await fetch('https://api.plant.id/v2/identify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': env.PLANT_ID_API_KEY,
          },
          body: JSON.stringify({
            images: [base64Image],
            modifiers: ['health_all', 'disease_similar_images'],
            plant_details: ['common_names', 'taxonomy', 'wiki_description'],
          }),
        });

        if (plantResponse.ok) {
          const plantData = await plantResponse.json();
          const suggestion = plantData.suggestions?.[0];
          
          if (suggestion) {
            rateLimitCounts.plantid++;
            
            speciesResult = {
              category: 'flower',
              canonicalName: suggestion.plant_name || 'Unknown Plant',
              commonName: suggestion.plant_details?.common_names?.[0],
              rank: suggestion.plant_details?.taxonomy?.rank || 'species',
              confidence: suggestion.probability || 0.5,
              provider: 'plantid',
              ui: { colorChips },
            };
          } else {
            throw new Error('No plant suggestions found');
          }
        } else {
          throw new Error('Plant.id API error');
        }
      } catch (error) {
        console.error('Plant.id API error:', error);
        // Fallback to generic plant result
        speciesResult = {
          category: 'flower',
          canonicalName: 'Plant',
          commonName: 'Plant',
          rank: 'kingdom',
          confidence: 0.3,
          provider: 'gcv',
          ui: { colorChips },
        };
      }
    } else if (hasBugLabels || validatedHint === 'bug') {
      // MVP bug detection (no paid API yet)
      const bugName = labels.find(label => 
        bugTerms.some(term => label.toLowerCase().includes(term))
      ) || 'Bug';
      
      speciesResult = {
        category: 'bug',
        canonicalName: 'Insecta sp.',
        commonName: bugName,
        rank: 'class',
        confidence: 0.6,
        provider: 'gcv',
        ui: { colorChips },
      };
    } else if (hasAnimalLabels || validatedHint === 'animal') {
      // Use Vision result for animals
      const animalLabel = labels.find(label => 
        animalTerms.some(term => label.toLowerCase().includes(term)) ||
        ['dog', 'cat', 'bird', 'squirrel', 'rabbit'].some(term => 
          label.toLowerCase().includes(term)
        )
      ) || 'Animal';
      
      speciesResult = {
        category: 'animal',
        canonicalName: animalLabel,
        commonName: animalLabel,
        rank: 'species',
        confidence: 0.7,
        provider: 'gcv',
        ui: { colorChips },
      };
    } else {
      // Generic result
      const topLabel = labels[0] || 'Unknown';
      speciesResult = {
        category: 'flower',
        canonicalName: topLabel,
        commonName: topLabel,
        rank: 'species',
        confidence: 0.4,
        provider: 'gcv',
        ui: { colorChips },
      };
    }

    // Check confidence threshold
    if (speciesResult.confidence < 0.6) {
      return NextResponse.json(
        {
          error: 'LOW_CONFIDENCE',
          message: 'Try getting closer, holding steady, or finding better lighting!',
          result: speciesResult,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ result: speciesResult });
  } catch (error) {
    console.error('Recognition error:', error);
    return NextResponse.json(
      { error: 'Recognition failed' },
      { status: 500 }
    );
  }
}
