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
  correction: z.string().optional().nullable(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  let feedback: any;
  
  try {
    const body = await request.json();
    feedback = trainingFeedbackSchema.parse(body);

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
      
      // If table doesn't exist, return a more helpful error
      if (error.message.includes('relation "training_feedback" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Training feedback table not found. Please run the database migration first.',
            details: 'Run the SQL in training_tables.sql in your Supabase dashboard'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to store training feedback', details: error.message },
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
    
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json({
        error: 'Invalid feedback data format',
        details: error.message
      }, { status: 400 });
    }
    
    // Fallback: Store in memory for now (will be lost on restart)
    if (feedback) {
      console.log('⚠️ Supabase unavailable, storing feedback in memory:', {
        imageUrl: feedback.imageUrl,
        originalResult: feedback.originalResult,
        isCorrect: feedback.isCorrect,
        correction: feedback.correction,
        timestamp: feedback.timestamp,
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Training feedback received (stored locally)',
        warning: 'Database unavailable, feedback stored in memory only'
      });
    }
    
    return NextResponse.json({
      error: 'Failed to process training feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
