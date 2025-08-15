import { NextRequest, NextResponse } from 'next/server';
import { aiRouter } from '@/lib/ai-router';
import { PROMPT_TEMPLATES } from '@/lib/prompt-templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, testType = 'quick' } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Test different prompt types
    let prompt;
    switch (testType) {
      case 'species':
        prompt = PROMPT_TEMPLATES.speciesIdentification;
        break;
      case 'description':
        prompt = PROMPT_TEMPLATES.kidFriendlyDescription;
        break;
      case 'quick':
      default:
        prompt = PROMPT_TEMPLATES.quickIdentification;
        break;
    }

    const result = await aiRouter.invokeLLM({
      image: imageBase64,
      prompt,
      budget: 0.05,
      priority: 'accuracy',
      requiredCapabilities: ['vision', 'text', 'accurate'],
      maxTokens: 1000,
      temperature: 0.7,
      recognitionId: `test-${Date.now()}`
    });

    return NextResponse.json({
      success: true,
      result,
      testType,
      prompt: prompt.substring(0, 200) + '...' // Show first 200 chars of prompt
    });

  } catch (error) {
    console.error('AI Router test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Router test endpoint',
    usage: 'POST with { imageBase64, testType: "quick" | "species" | "description" }'
  });
}
