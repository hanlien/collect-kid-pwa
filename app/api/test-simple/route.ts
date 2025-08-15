import { NextRequest, NextResponse } from 'next/server';
import { aiRouter } from '@/lib/ai-router';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('🔍 [TEST] Starting AI router test...');

    // Test the AI router directly
    const result = await aiRouter.invokeLLM({
      image: imageBase64,
      prompt: "What do you see in this image? Be specific and kid-friendly.",
      budget: 0.05,
      priority: 'accuracy',
      requiredCapabilities: ['vision', 'text', 'accurate'],
      maxTokens: 500,
      temperature: 0.7,
      recognitionId: `test-simple-${Date.now()}`
    });

    console.log('🔍 [TEST] AI router result:', result);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 [TEST] AI router error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple AI Router test endpoint',
    usage: 'POST with { imageBase64 } - will test AI router directly'
  });
}
