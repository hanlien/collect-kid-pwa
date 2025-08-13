import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const trainingFeedbackSchema = z.object({
  imageUrl: z.string().optional(),
  originalResult: z.object({
    category: z.enum(['flower', 'bug', 'animal']),
    canonicalName: z.string(),
    commonName: z.string().optional(),
    confidence: z.number(),
    provider: z.string().optional(),
  }),
  isCorrect: z.boolean(),
  correction: z.string().optional(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedback = trainingFeedbackSchema.parse(body);

    // Store feedback in Supabase for training data
    const trainingData = {
      image_url: feedback.imageUrl,
      original_prediction: feedback.originalResult,
      is_correct: feedback.isCorrect,
      correction: feedback.correction,
      timestamp: feedback.timestamp,
      metadata: {
        source: 'user_feedback',
        confidence: feedback.originalResult.confidence,
        category: feedback.originalResult.category,
      }
    };

    // Insert into training_feedback table
    const { data, error } = await supabaseAdmin
      .from('training_feedback')
      .insert({
        image_url: feedback.imageUrl,
        original_prediction: JSON.stringify(feedback.originalResult),
        is_correct: feedback.isCorrect,
        correction: feedback.correction || null,
        confidence: feedback.originalResult.confidence,
        category: feedback.originalResult.category,
        provider: feedback.originalResult.provider || 'unknown',
        created_at: new Date().toISOString(),
        metadata: JSON.stringify(trainingData.metadata)
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store training feedback:', error);
      return NextResponse.json(
        { error: 'Failed to store training feedback' },
        { status: 500 }
      );
    }

    console.log('✅ Training feedback stored:', data);

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
