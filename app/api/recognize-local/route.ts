import { NextRequest, NextResponse } from 'next/server';
import { localModel } from '@/lib/ml/localModel';
import { postprocessLocalResult } from '@/lib/ml/postprocess';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert file to ImageData
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create a blob URL and load the image
    const blob = new Blob([uint8Array], { type: imageFile.type });
    const imageUrl = URL.createObjectURL(blob);
    
    // For server-side processing, we need to use a different approach
    // Since we can't use browser Image API on the server, we'll need to process the image differently
    // For now, let's create a simple test response
    const testResult = {
      labelId: 'dog',
      probs: new Array(22).fill(0.045), // Equal probability for all classes
      topK: [
        { labelId: 'dog', prob: 0.15 },
        { labelId: 'cat', prob: 0.12 },
        { labelId: 'squirrel_gray', prob: 0.10 },
        { labelId: 'rabbit_cottontail', prob: 0.09 },
        { labelId: 'bird_sparrow', prob: 0.08 }
      ],
      inferenceTime: 50
    };

    // Load local model if not loaded
    if (!localModel.isLoaded()) {
      await localModel.load();
    }

    // Use test result for now (server-side image processing needs different approach)
    const localResult = testResult;
    
    // Check confidence
    const isConfident = localModel.isConfident(localResult);
    
    if (!isConfident) {
      return NextResponse.json(
        {
          error: 'LOW_CONFIDENCE',
          message: 'Try getting closer, holding steady, or finding better lighting!',
          result: postprocessLocalResult(localResult),
          meta: {
            confidence: localResult.topK[0].prob,
            topK: localResult.topK,
            inferenceTime: localResult.inferenceTime
          }
        },
        { status: 400 }
      );
    }

    // Clean up
    URL.revokeObjectURL(imageUrl);

    return NextResponse.json({
      result: postprocessLocalResult(localResult),
      meta: {
        confidence: localResult.topK[0].prob,
        topK: localResult.topK,
        inferenceTime: localResult.inferenceTime,
        modelVersion: 'v001'
      }
    });

  } catch (error) {
    console.error('Local recognition error:', error);
    return NextResponse.json(
      { error: 'Local recognition failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
