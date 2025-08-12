import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { validateEnv, recognizeRequestSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { SpeciesResult, Category, Provider } from '@/types/species';
import { colorNameToHex, getBadgeSubtype } from '@/lib/utils';
import { findSpeciesByKeywords, localSpeciesToResult } from '@/lib/species-database';
import { mlRouter } from '@/lib/ml/router';

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
    console.log(' Dominant colors:', colors.map(c => c.color));

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

    // Create ImageData for local model inference
    let imageData: ImageData | undefined;
    try {
      const img = new Image();
      const blob = new Blob([imageBuffer], { type: image.type });
      const url = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, img.width, img.height);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to create ImageData for local model:', error);
    }

    // Use ML Router to decide on the best approach
    const routerInput = {
      visionLabels: labels,
      hint: validatedHint,
      imageData,
      userId
    };

    const { result: speciesResult, decision, localResult } = await mlRouter.route(routerInput);

    // Add color chips to result
    speciesResult.ui = { ...speciesResult.ui, colorChips };

    // Log the decision
    console.log('🎯 ML Router Decision:', decision);

    // Check if we need to queue for active learning
    const needsReview = decision.needsReview || 
                       speciesResult.confidence < 0.6 ||
                       (decision.useLocal && !decision.usePlantId && speciesResult.confidence < 0.7);

    if (needsReview && userId && process.env.AL_ENABLE === 'true') {
      try {
        // Create thumbnail for active learning
        const thumbUrl = await createThumbnail(imageBuffer, image.type);
        
        // Queue for active learning
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/active-learning`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            thumbUrl,
            providerSuggestion: speciesResult.provider,
            visionLabels: labels,
            localModel: localResult ? {
              version: 'v001',
              topK: localResult.topK
            } : null,
            hint: validatedHint,
            locationHint: null
          })
        });
        
        console.log('📝 Queued for active learning review');
      } catch (error) {
        console.error('Failed to queue for active learning:', error);
      }
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

    return NextResponse.json({ 
      result: speciesResult,
      meta: {
        decision,
        needsReview
      }
    });

  } catch (error) {
    console.error('Recognition error:', error);
    return NextResponse.json(
      { error: 'Recognition failed' },
      { status: 500 }
    );
  }
}

async function createThumbnail(imageBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  // Create a thumbnail for active learning
  // This is a simplified version - in production, you'd want to resize and compress
  const blob = new Blob([imageBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}
