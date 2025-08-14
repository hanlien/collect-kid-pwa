import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { validateEnv } from '@/lib/validation';
import { VisionBundle } from '@/types/recognition';

export async function POST(request: NextRequest) {
  try {
    const env = validateEnv();
    
    // Parse request
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 parameter' },
        { status: 400 }
      );
    }

    // Initialize Google Vision client
    const credentials = JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    const visionClient = new ImageAnnotatorClient({ credentials });

    const startTime = Date.now();

    // Step 1: Get main image labels and properties
    const [mainResult] = await visionClient.annotateImage({
      image: { content: imageBase64 },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'WEB_DETECTION', maxResults: 10 },
      ],
    });

    // Step 2: Get object localization and crop labels
    const [localizationResult] = await visionClient.annotateImage({
      image: { content: imageBase64 },
      features: [
        { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
      ],
    });

    // Extract crop regions and get labels for main object
    let cropLabels: { desc: string; score: number }[] = [];
    
    if (localizationResult.localizedObjectAnnotations && 
        localizationResult.localizedObjectAnnotations.length > 0) {
      
      // Get the largest object (most prominent)
      const mainObject = localizationResult.localizedObjectAnnotations[0];
      if (mainObject?.boundingPoly?.normalizedVertices) {
        
        // Create a cropped image request for the main object
        const vertices = mainObject.boundingPoly.normalizedVertices;
        const cropArea = {
          left: Math.min(...vertices.map(v => v.x || 0)),
          top: Math.min(...vertices.map(v => v.y || 0)),
          right: Math.max(...vertices.map(v => v.x || 0)),
          bottom: Math.max(...vertices.map(v => v.y || 0)),
        };

        // Get labels for the cropped area
        const [cropResult] = await visionClient.annotateImage({
          image: { content: imageBase64 },
          features: [{ type: 'LABEL_DETECTION', maxResults: 5 }],
          imageContext: {
            productSearchParams: {
              boundingPoly: {
                normalizedVertices: [
                  { x: cropArea.left, y: cropArea.top },
                  { x: cropArea.right, y: cropArea.top },
                  { x: cropArea.right, y: cropArea.bottom },
                  { x: cropArea.left, y: cropArea.bottom },
                ],
              },
            },
          },
        });

        cropLabels = cropResult.labelAnnotations?.map(l => ({
          desc: l.description || '',
          score: l.score || 0,
        })) || [];
      }
    }

    // Extract main labels
    const labels = mainResult.labelAnnotations?.map(l => ({
      desc: l.description || '',
      score: l.score || 0,
    })) || [];

    // Extract web detection results
    const webBestGuess = mainResult.webDetection?.webEntities
      ?.filter(entity => entity.score && entity.score > 0.5)
      ?.map(entity => entity.description || '')
      ?.filter(Boolean) || [];

    const webPageTitles = mainResult.webDetection?.fullMatchingImages
      ?.map(img => img.url || '')
      ?.filter(Boolean)
      ?.slice(0, 5) || [];

    // Extract safe search results
    const safe = {
      adult: String(mainResult.safeSearchAnnotation?.adult || 'UNKNOWN'),
      violence: String(mainResult.safeSearchAnnotation?.violence || 'UNKNOWN'),
      racy: String(mainResult.safeSearchAnnotation?.racy || 'UNKNOWN'),
      medical: String(mainResult.safeSearchAnnotation?.medical || 'UNKNOWN'),
    };

    const processingTime = Date.now() - startTime;

    // Check for inappropriate content
    if (safe.adult === 'LIKELY' || safe.adult === 'VERY_LIKELY' ||
        safe.violence === 'LIKELY' || safe.violence === 'VERY_LIKELY') {
      return NextResponse.json(
        { error: 'Inappropriate content detected' },
        { status: 400 }
      );
    }

    const visionBundle: VisionBundle = {
      labels,
      cropLabels,
      webBestGuess,
      webPageTitles,
      safe,
    };

    console.log(`🔍 Vision API completed in ${processingTime}ms`);
    console.log(`📊 Labels: ${labels.length}, Crop labels: ${cropLabels.length}, Web guesses: ${webBestGuess.length}`);

    return NextResponse.json({
      success: true,
      visionBundle,
      processingTime,
    });

  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: 'Vision API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
