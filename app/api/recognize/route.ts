import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { validateEnv, recognizeRequestSchema } from '@/lib/validation';
import { SpeciesResult, Category, Provider } from '@/types/species';
// import { colorNameToHex, getBadgeSubtype } from '@/lib/utils'; // TODO: Use when needed
import { iNaturalistAPI } from '@/lib/inaturalistAPI';

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
    const userId = formData.get('userId') as string;

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

    // Add comprehensive debugging
    console.log('🔍 === SEARCH ENGINE DEBUG ===');
    console.log('🔍 Google Vision detected labels:', labels);
    console.log('🔍 User hint:', validatedHint);
    console.log('🎨 Dominant colors:', colors.map(c => c.color));

    // Try iNaturalist identification using Google Vision labels
    console.log('🌿 Trying iNaturalist label-based identification...');
    let iNaturalistResult = null;
    try {
      // Filter labels to relevant species terms
      const speciesLabels = labels.filter(label => {
        const lowerLabel = label.toLowerCase();
        const speciesTerms = [
          'butterfly', 'bee', 'ant', 'spider', 'fly', 'mosquito', 'beetle', 'grasshopper', 'cricket', 'dragonfly', 'ladybug',
          'bird', 'dog', 'cat', 'squirrel', 'rabbit', 'deer', 'fox', 'raccoon', 'possum', 'skunk', 'chipmunk', 'groundhog', 'beaver', 'hedgehog', 'mole', 'mouse', 'rat', 'hamster',
          'rose', 'daisy', 'tulip', 'sunflower', 'lily', 'orchid', 'dandelion', 'lavender', 'marigold', 'pansy', 'carnation', 'iris', 'peony', 'azalea', 'camellia', 'gardenia', 'hydrangea', 'geranium', 'zinnia'
        ];
        return speciesTerms.some(term => lowerLabel.includes(term) || term.includes(lowerLabel));
      });

      if (speciesLabels.length > 0) {
        console.log('🔍 Relevant species labels found:', speciesLabels);
        const iNaturalistIdentifications = await iNaturalistAPI.identifySpeciesFromLabels(speciesLabels);
        
        if (iNaturalistIdentifications.length > 0) {
          const bestMatch = iNaturalistIdentifications[0];
          iNaturalistResult = iNaturalistAPI.convertToAppFormat(bestMatch!);
          
          console.log('✅ iNaturalist result:', {
            commonName: iNaturalistResult.commonName,
            scientificName: iNaturalistResult.scientificName,
            category: iNaturalistResult.category,
            confidence: iNaturalistResult.confidence
          });
        } else {
          console.log('❌ iNaturalist no species matches found');
        }
      } else {
        console.log('❌ iNaturalist no relevant species labels found');
      }
    } catch (error) {
      console.error('❌ iNaturalist error:', error);
    }

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

    // Determine category and use appropriate API
    const plantTerms = ['plant', 'flower', 'tree', 'leaf', 'petal', 'bloom', 'garden', 'flora'];
    const bugTerms = ['insect', 'bug', 'bee', 'butterfly', 'ant', 'spider', 'fly', 'mosquito', 'beetle', 'grasshopper', 'cricket', 'dragonfly', 'ladybug'];
    const animalTerms = ['animal', 'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'pet', 'wildlife'];

    const hasPlantLabels = labels.some(label => 
      plantTerms.some(term => label.toLowerCase().includes(term))
    );
    const hasBugLabels = labels.some(label => 
      bugTerms.some(term => label.toLowerCase().includes(term))
    );
    const hasAnimalLabels = labels.some(label => 
      animalTerms.some(term => label.toLowerCase().includes(term))
    );

    console.log('📊 Category detection:');
    console.log('  - Plant labels:', hasPlantLabels);
    console.log('  - Bug labels:', hasBugLabels);
    console.log('  - Animal labels:', hasAnimalLabels);

    let speciesResult: SpeciesResult;

    // Priority 1: Use iNaturalist result if available and confident
    if (iNaturalistResult && iNaturalistResult.confidence > 0.5) {
      console.log('🌿 Using iNaturalist result (high confidence)');
      speciesResult = {
        category: iNaturalistResult.category as Category,
        canonicalName: iNaturalistResult.scientificName,
        commonName: iNaturalistResult.commonName,
        rank: 'species',
        confidence: iNaturalistResult.confidence,
        provider: 'inaturalist' as Provider,
        ui: { colorChips },
        details: iNaturalistResult.details
      };
    } else if ((hasPlantLabels || validatedHint === 'flower') && rateLimitCounts.plantid < env.PLANT_MAX_DAY) {
      console.log('🌱 Using PLANT.ID API engine');
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
      console.log('🐛 Using GOOGLE VISION + BUG MAPPING engine');
      // Enhanced bug detection with species mapping
      const bugSpeciesMap: Record<string, { name: string; scientific: string; confidence: number }> = {
        'bee': { name: 'Bee', scientific: 'Apis mellifera', confidence: 0.85 },
        'butterfly': { name: 'Butterfly', scientific: 'Lepidoptera sp.', confidence: 0.8 },
        'ant': { name: 'Ant', scientific: 'Formicidae sp.', confidence: 0.8 },
        'spider': { name: 'Spider', scientific: 'Araneae sp.', confidence: 0.8 },
        'fly': { name: 'Fly', scientific: 'Diptera sp.', confidence: 0.7 },
        'mosquito': { name: 'Mosquito', scientific: 'Culicidae sp.', confidence: 0.8 },
        'beetle': { name: 'Beetle', scientific: 'Coleoptera sp.', confidence: 0.8 },
        'grasshopper': { name: 'Grasshopper', scientific: 'Caelifera sp.', confidence: 0.8 },
        'cricket': { name: 'Cricket', scientific: 'Gryllidae sp.', confidence: 0.8 },
        'dragonfly': { name: 'Dragonfly', scientific: 'Anisoptera sp.', confidence: 0.8 },
        'ladybug': { name: 'Ladybug', scientific: 'Coccinellidae sp.', confidence: 0.8 },
      };
      
      let bestMatch = null;
      let bestConfidence = 0;
      
      // Check each label against our bug species map
      for (const label of labels) {
        const lowerLabel = label.toLowerCase();
        
        // Direct match
        if (bugSpeciesMap[lowerLabel]) {
          const match = bugSpeciesMap[lowerLabel];
          if (match.confidence > bestConfidence) {
            bestMatch = match;
            bestConfidence = match.confidence;
          }
        }
        
        // Partial match
        for (const [species, match] of Object.entries(bugSpeciesMap)) {
          if (lowerLabel.includes(species) && match.confidence > bestConfidence) {
            bestMatch = match;
            bestConfidence = match.confidence;
          }
        }
      }
      
      if (bestMatch) {
        speciesResult = {
          category: 'bug',
          canonicalName: bestMatch.scientific,
          commonName: bestMatch.name,
          rank: 'species',
          confidence: bestMatch.confidence,
          provider: 'gcv',
          ui: { colorChips },
        };
      } else {
        // Fallback to generic bug detection
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
      }
    } else if (hasAnimalLabels || validatedHint === 'animal') {
      console.log('🐾 Using GOOGLE VISION + ANIMAL MAPPING engine');
      // Enhanced animal detection with species mapping
      const animalSpeciesMap: Record<string, { name: string; scientific: string; confidence: number }> = {
        'tiger': { name: 'Tiger', scientific: 'Panthera tigris', confidence: 0.95 },
        'lion': { name: 'Lion', scientific: 'Panthera leo', confidence: 0.95 },
        'leopard': { name: 'Leopard', scientific: 'Panthera pardus', confidence: 0.95 },
        'cheetah': { name: 'Cheetah', scientific: 'Acinonyx jubatus', confidence: 0.95 },
        'jaguar': { name: 'Jaguar', scientific: 'Panthera onca', confidence: 0.95 },
        'panther': { name: 'Panther', scientific: 'Panthera pardus', confidence: 0.95 },
        'cat': { name: 'Cat', scientific: 'Felis catus', confidence: 0.9 },
        'dog': { name: 'Dog', scientific: 'Canis familiaris', confidence: 0.9 },
        'bird': { name: 'Bird', scientific: 'Aves sp.', confidence: 0.8 },
        'squirrel': { name: 'Squirrel', scientific: 'Sciurus sp.', confidence: 0.85 },
        'rabbit': { name: 'Rabbit', scientific: 'Oryctolagus cuniculus', confidence: 0.85 },
        'deer': { name: 'Deer', scientific: 'Cervidae sp.', confidence: 0.8 },
        'fox': { name: 'Fox', scientific: 'Vulpes sp.', confidence: 0.8 },
        'raccoon': { name: 'Raccoon', scientific: 'Procyon lotor', confidence: 0.8 },
        'skunk': { name: 'Skunk', scientific: 'Mephitidae sp.', confidence: 0.8 },
        'chipmunk': { name: 'Chipmunk', scientific: 'Tamias sp.', confidence: 0.8 },
        'mouse': { name: 'Mouse', scientific: 'Mus musculus', confidence: 0.8 },
        'rat': { name: 'Rat', scientific: 'Rattus sp.', confidence: 0.8 },
        'hamster': { name: 'Hamster', scientific: 'Cricetinae sp.', confidence: 0.8 },
        'guinea pig': { name: 'Guinea Pig', scientific: 'Cavia porcellus', confidence: 0.8 },
        'ferret': { name: 'Ferret', scientific: 'Mustela putorius furo', confidence: 0.8 },
        'horse': { name: 'Horse', scientific: 'Equus caballus', confidence: 0.9 },
        'cow': { name: 'Cow', scientific: 'Bos taurus', confidence: 0.9 },
        'pig': { name: 'Pig', scientific: 'Sus scrofa', confidence: 0.9 },
        'sheep': { name: 'Sheep', scientific: 'Ovis aries', confidence: 0.9 },
        'goat': { name: 'Goat', scientific: 'Capra hircus', confidence: 0.9 },
        'duck': { name: 'Duck', scientific: 'Anatidae sp.', confidence: 0.8 },
        'goose': { name: 'Goose', scientific: 'Anser sp.', confidence: 0.8 },
        'chicken': { name: 'Chicken', scientific: 'Gallus gallus', confidence: 0.8 },
        'turkey': { name: 'Turkey', scientific: 'Meleagris gallopavo', confidence: 0.8 },
        'pigeon': { name: 'Pigeon', scientific: 'Columba livia', confidence: 0.8 },
        'sparrow': { name: 'Sparrow', scientific: 'Passer sp.', confidence: 0.8 },
        'robin': { name: 'Robin', scientific: 'Turdus migratorius', confidence: 0.8 },
        'cardinal': { name: 'Cardinal', scientific: 'Cardinalis cardinalis', confidence: 0.8 },
        'blue jay': { name: 'Blue Jay', scientific: 'Cyanocitta cristata', confidence: 0.8 },
        'crow': { name: 'Crow', scientific: 'Corvus sp.', confidence: 0.8 },
        'hawk': { name: 'Hawk', scientific: 'Accipitridae sp.', confidence: 0.8 },
        'eagle': { name: 'Eagle', scientific: 'Aquila sp.', confidence: 0.8 },
        'owl': { name: 'Owl', scientific: 'Strigiformes sp.', confidence: 0.8 },
        'snake': { name: 'Snake', scientific: 'Serpentes sp.', confidence: 0.8 },
        'lizard': { name: 'Lizard', scientific: 'Lacertilia sp.', confidence: 0.8 },
        'turtle': { name: 'Turtle', scientific: 'Testudines sp.', confidence: 0.8 },
        'frog': { name: 'Frog', scientific: 'Anura sp.', confidence: 0.8 },
        'toad': { name: 'Toad', scientific: 'Bufonidae sp.', confidence: 0.8 },
        'fish': { name: 'Fish', scientific: 'Actinopterygii sp.', confidence: 0.7 },
        'goldfish': { name: 'Goldfish', scientific: 'Carassius auratus', confidence: 0.8 },
        'koi': { name: 'Koi', scientific: 'Cyprinus carpio', confidence: 0.8 },
      };
      
      let bestMatch = null;
      let bestConfidence = 0;
      
      // Check each label against our species map
      for (const label of labels) {
        const lowerLabel = label.toLowerCase();
        console.log(`🔍 Checking label: "${label}" (lowercase: "${lowerLabel}")`);
        
        // Direct match (highest priority)
        if (animalSpeciesMap[lowerLabel]) {
          const match = animalSpeciesMap[lowerLabel];
          console.log(`✅ Direct match found: ${match.name} (confidence: ${match.confidence})`);
          if (match.confidence > bestConfidence) {
            bestMatch = match;
            bestConfidence = match.confidence;
          }
        }
        
        // Partial match (lower priority)
        for (const [species, match] of Object.entries(animalSpeciesMap)) {
          if (lowerLabel.includes(species) && match.confidence > bestConfidence) {
            console.log(`✅ Partial match found: ${match.name} (from "${species}" in "${lowerLabel}")`);
            bestMatch = match;
            bestConfidence = match.confidence;
          }
        }
      }
      
      console.log(`🏆 Best match: ${bestMatch?.name || 'None'} (confidence: ${bestConfidence})`);
      
      if (bestMatch) {
        speciesResult = {
          category: 'animal',
          canonicalName: bestMatch.scientific,
          commonName: bestMatch.name,
          rank: 'species',
          confidence: bestMatch.confidence,
          provider: 'gcv',
          ui: { colorChips },
        };
      } else {
        // Fallback to generic animal detection
        const animalLabel = labels.find(label => 
          animalTerms.some(term => label.toLowerCase().includes(term)) ||
          ['dog', 'cat', 'bird', 'squirrel', 'rabbit', 'pet', 'wildlife'].some(term => 
            label.toLowerCase().includes(term)
          )
        ) || 'Animal';
        
        speciesResult = {
          category: 'animal',
          canonicalName: animalLabel,
          commonName: animalLabel,
          rank: 'species',
          confidence: 0.6,
          provider: 'gcv',
          ui: { colorChips },
        };
      }
    } else {
      console.log('❓ Using GENERIC GOOGLE VISION fallback engine');
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

    // Fallback to iNaturalist if confidence is low and we haven't used it yet
    if (speciesResult.confidence < 0.6 && (!iNaturalistResult || speciesResult.provider !== 'inaturalist')) {
      console.log('🔄 Trying iNaturalist as fallback...');
      try {
        // Use all labels for fallback search
        const fallbackIdentifications = await iNaturalistAPI.identifySpeciesFromLabels(labels);
        if (fallbackIdentifications.length > 0) {
          const fallbackResult = iNaturalistAPI.convertToAppFormat(fallbackIdentifications[0]!);
          if (fallbackResult.confidence > 0.3) {
            console.log('✅ Using iNaturalist fallback result');
            speciesResult = {
              category: fallbackResult.category as Category,
              canonicalName: fallbackResult.scientificName,
              commonName: fallbackResult.commonName,
              rank: 'species',
              confidence: fallbackResult.confidence,
              provider: 'inaturalist' as Provider,
              ui: { colorChips },
              details: fallbackResult.details
            };
          }
        }
      } catch (error) {
        console.error('❌ iNaturalist fallback error:', error);
      }
    }

    // Check confidence threshold and queue for active learning if low
    if (speciesResult.confidence < 0.6) {
      // Queue for active learning review
      try {
        const activeLearningResponse = await fetch(`${request.nextUrl.origin}/api/active-learning`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId || 'anonymous',
            thumbUrl: speciesResult.capturedImageUrl,
            providerSuggestion: {
              provider: speciesResult.provider,
              category: speciesResult.category,
              canonicalName: speciesResult.canonicalName,
              commonName: speciesResult.commonName,
              confidence: speciesResult.confidence,
            },
            visionLabels: labels,
            localModel: null, // Will be implemented later
            hint: validatedHint,
            locationHint: null, // Will be implemented with GPS later
          }),
        });

        if (activeLearningResponse.ok) {
          console.log('✅ Queued for active learning review');
        }
      } catch (error) {
        console.error('❌ Failed to queue for active learning:', error);
      }

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
