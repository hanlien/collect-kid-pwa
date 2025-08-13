import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const trainingFeedbackSchema = z.object({
  imageUrl: z.string().optional(),
  originalResult: z.object({
    category: z.enum(['flower', 'bug', 'animal']),
    canonicalName: z.string(),
    commonName: z.string().optional(),
    confidence: z.number(),
  }),
  isCorrect: z.boolean(),
  correction: z.string().optional(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedback = trainingFeedbackSchema.parse(body);

    // Store feedback for training data
    // This could be saved to a database or file system for later model training
    console.log('Training feedback received:', {
      ...feedback,
      // Add any additional processing here
    });

    // For now, we'll just log the feedback
    // In a real implementation, this would be stored in a training dataset
    const trainingData = {
      imageUrl: feedback.imageUrl,
      originalPrediction: feedback.originalResult,
      isCorrect: feedback.isCorrect,
      correction: feedback.correction,
      timestamp: feedback.timestamp,
      // Add metadata for training
      metadata: {
        source: 'user_feedback',
        confidence: feedback.originalResult.confidence,
        category: feedback.originalResult.category,
      }
    };

    // TODO: Store this in a proper training dataset
    // This could be saved to Supabase, a file, or sent to a training pipeline
    console.log('Training data prepared:', trainingData);

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received for model training' 
    });
  } catch (error) {
    console.error('Training feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to process training feedback' },
      { status: 500 }
    );
  }
}
