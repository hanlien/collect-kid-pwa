import { NextRequest, NextResponse } from 'next/server';
import { aiRouter, LLMParams } from '@/lib/ai-router';
import logger from '@/lib/logger';
import { PROMPT_TEMPLATES, extractStructuredData, validateAIResponse } from '@/lib/prompt-templates';

export const dynamic = 'force-dynamic';

type Category = 'plant' | 'animal' | 'bug' | 'mysterious';

function looseExtractFromFreeform(content: string): { commonName: string; confidence: number; category: Category } | null {
  if (!content) return null;
  const text = content.toLowerCase();
  const matches = Array.from(text.matchAll(/\b(?:a|an|the)\s+([a-z][a-z\-]+(?:\s+[a-z][a-z\-]+){0,3})/g)).map(m => m[1]);
  const stop = new Set(['animal','creature','thing','photo','image','picture','background','scene','nature']);
  const candidates = matches
    .filter((p): p is string => Boolean(p))
    .map(p => p.trim())
    .filter(p => p.split(' ').every(w => !stop.has(w)));
  const guess = candidates.find(p => p.includes('panda') || p.includes('rose') || p.includes('flower') || p.includes('bird') || p.includes('butterfly') || p.includes('dog') || p.includes('cat'))
            || candidates[0];
  if (!guess) return null;
  const commonName = guess.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const category: Category =
    /rose|flower|tree|plant/.test(guess) ? 'plant' :
    /butterfly|bee|ant|ladybug|beetle|dragonfly|spider/.test(guess) ? 'bug' :
    /panda|dog|cat|bird|heron|jay|fox|bear|deer|fish|frog|lizard/.test(guess) ? 'animal' : 'mysterious';
  return { commonName, confidence: 0.6, category };
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const recognitionId = `llm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const { imageBase64, aiBudget = 0.08, aiPriority = 'accuracy' }: { imageBase64: string; aiBudget?: number; aiPriority?: 'speed' | 'accuracy' | 'cost' } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    logger.recognitionStep('llm_only_start', { aiBudget, aiPriority }, { recognitionId });

    // Primary attempt: structured kid-friendly speciesIdentification
    const primaryParams: LLMParams = {
      image: imageBase64,
      prompt: PROMPT_TEMPLATES.speciesIdentification,
      budget: aiBudget,
      priority: aiPriority,
      requiredCapabilities: ['vision', 'text', 'accurate', 'kidFriendly'],
      maxTokens: 1200,
      temperature: 0.6,
      recognitionId
    };

    let ai = await aiRouter.invokeLLM(primaryParams);
    let parsed = extractStructuredData(ai.content);

    let pick: any | null = null;
    if (parsed && validateAIResponse(JSON.stringify(parsed))) {
      pick = {
        commonName: parsed.commonName,
        scientificName: parsed.scientificName || '',
        confidence: parsed.confidence ?? 0.6,
        category: parsed.category as Category,
        funFacts: parsed.funFacts || [],
        safetyNotes: parsed.safetyNotes || '',
        habitat: parsed.habitat || '',
        identification: parsed.identification || '',
        educationalValue: parsed.educationalValue || '',
        provider: 'ai-router' as const,
        model: ai.model,
        cost: ai.cost,
        responseTime: ai.responseTime
      };
      logger.recognitionStep('llm_only_success', { model: ai.model, confidence: pick.confidence }, { recognitionId });
    } else {
      // Fallback 1: quick identification prompt
      logger.recognitionStep('llm_only_retry_quick', {}, { recognitionId });
      const quickParams: LLMParams = {
        image: imageBase64,
        prompt: PROMPT_TEMPLATES.quickIdentification,
        budget: Math.max(0.02, aiBudget * 0.4),
        priority: aiPriority,
        requiredCapabilities: ['vision', 'text', 'accurate'],
        maxTokens: 400,
        temperature: 0.5,
        recognitionId
      };
      ai = await aiRouter.invokeLLM(quickParams);
      parsed = extractStructuredData(ai.content);
      if (parsed && validateAIResponse(JSON.stringify(parsed))) {
        pick = {
          commonName: parsed.commonName,
          scientificName: parsed.scientificName || '',
          confidence: parsed.confidence ?? 0.55,
          category: parsed.category as Category,
          funFacts: [],
          safetyNotes: '',
          habitat: '',
          identification: '',
          educationalValue: '',
          provider: 'ai-router' as const,
          model: ai.model,
          cost: ai.cost,
          responseTime: ai.responseTime
        };
      } else {
        // Fallback 2: loose freeform extraction
        const loose = looseExtractFromFreeform(ai.content);
        if (loose) {
          pick = {
            commonName: loose.commonName,
            scientificName: '',
            confidence: loose.confidence,
            category: loose.category,
            funFacts: [], safetyNotes: '', habitat: '', identification: '', educationalValue: '',
            provider: 'ai-router' as const,
            model: ai.model,
            cost: ai.cost,
            responseTime: ai.responseTime
          };
          logger.recognitionStep('llm_only_loose_parse', { guess: loose.commonName, confidence: loose.confidence }, { recognitionId });
        }
      }
    }

    const total = Date.now() - start;
    if (pick) {
      return NextResponse.json({
        success: true,
        decision: {
          mode: 'pick' as const,
          pick,
          debug: { processingTime: total, costs: { traditional: 0, ai: pick.cost, total: pick.cost } }
        }
      });
    }

    return NextResponse.json({
      success: true,
      decision: { mode: 'no_match' as const, debug: { processingTime: total, costs: { traditional: 0, ai: 0, total: 0 } } }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.recognitionStep('llm_only_error', { error: errorMessage }, { recognitionId });
    return NextResponse.json({ 
      success: false, 
      error: `LLM recognition failed: ${errorMessage}`,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


