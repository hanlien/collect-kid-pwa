import { NextRequest, NextResponse } from 'next/server';
import { aiRouter, LLMParams } from '@/lib/ai-router';
import { PROMPT_TEMPLATES, validateAIResponse, extractStructuredData } from '@/lib/prompt-templates';
import logger from '@/lib/logger';
import { getVisionLabels } from '@/lib/vision';
import { getPlantIdResults } from '@/lib/plantid';
import { getINaturalistResults } from '@/lib/inaturalist';
import { getKnowledgeGraphResults } from '@/lib/kg';
import { getWikipediaSummary } from '@/lib/wiki';
import { plantGate } from '@/lib/plantGate';
import { scoreCandidates, decide } from '@/lib/rankSpecies';

export const dynamic = 'force-dynamic';

interface RecognitionV3Request {
  imageBase64: string;
  lat?: number;
  lon?: number;
  enableAIRouter?: boolean;
  aiBudget?: number;
  aiPriority?: 'speed' | 'accuracy' | 'cost';
}

interface AIRecognitionResult {
  commonName: string;
  scientificName: string;
  confidence: number;
  category: 'plant' | 'animal' | 'bug' | 'mysterious';
  funFacts: string[];
  safetyNotes: string;
  habitat: string;
  identification: string;
  educationalValue: string;
  provider: 'ai-router';
  model: string;
  cost: number;
  responseTime: number;
}

interface HybridRecognitionResponse {
  success: boolean;
  decision: {
    mode: 'pick' | 'disambiguate' | 'no_match';
    pick?: any;
    top3?: any[];
    debug?: {
      traditionalResults?: any;
      aiResults?: AIRecognitionResult;
      processingTime?: number;
      costs?: {
        traditional: number;
        ai: number;
        total: number;
      };
    };
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<HybridRecognitionResponse>> {
  const startTime = Date.now();
  const recognitionId = `recognition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔍 [DEBUG] Starting recognition v3...');
  
  try {
    const { imageBase64, lat, lon, enableAIRouter = true, aiBudget = 0.05, aiPriority = 'accuracy' }: RecognitionV3Request = await request.json();

    // Validate input
    if (!imageBase64) {
      return NextResponse.json({ 
        success: false, 
        error: 'No image provided',
        decision: { mode: 'no_match' as const }
      }, { status: 400 });
    }

    // Check image size
    if (imageBase64.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ 
        success: false, 
        error: 'Image too large',
        decision: { mode: 'no_match' as const }
      }, { status: 400 });
    }

    logger.recognitionStep('recognition_v3_start', {
      imageSize: imageBase64.length,
      enableAIRouter,
      aiBudget,
      aiPriority,
      hasLocation: !!(lat && lon)
    }, { recognitionId });

    // Step 1: Traditional multi-signal recognition (fast, cost-effective)
    logger.recognitionStep('traditional_pipeline_start', {}, { recognitionId });
    
    const traditionalStartTime = Date.now();
    console.log('🔍 [DEBUG] About to call runTraditionalPipeline...');
    const traditionalResults = await runTraditionalPipeline(imageBase64, recognitionId);
    console.log('🔍 [DEBUG] Traditional results returned:', traditionalResults);
    const traditionalTime = Date.now() - traditionalStartTime;
    const traditionalCost = 0.012; // Estimated cost for traditional pipeline

    logger.recognitionStep('traditional_pipeline_complete', {
      processingTime: traditionalTime,
      estimatedCost: traditionalCost,
      hasResults: !!traditionalResults
    }, { recognitionId });

    // Step 2: AI Router recognition (detailed, contextual)
    let aiResults: AIRecognitionResult | null = null;
    let aiCost = 0;
    let aiTime = 0;

    // Run AI Router regardless of traditional results so we still get an answer
    if (enableAIRouter) {
      logger.recognitionStep('ai_router_start', {
        budget: aiBudget,
        priority: aiPriority
      }, { recognitionId });

      try {
        const aiStartTime = Date.now();
        
        // Use AI router for detailed analysis
        const llmParams: LLMParams = {
          image: imageBase64,
          prompt: PROMPT_TEMPLATES.speciesIdentification,
          budget: aiBudget,
          priority: aiPriority,
          requiredCapabilities: ['vision', 'text', 'accurate'],
          maxTokens: 1500,
          temperature: 0.7,
          recognitionId
        };

        const aiResponse = await aiRouter.invokeLLM(llmParams);
        aiTime = Date.now() - aiStartTime;
        aiCost = aiResponse.cost;

        // Parse AI response
        const structuredData = extractStructuredData(aiResponse.content);
        
        // Validate the extracted JSON, not the raw content
        if (structuredData && validateAIResponse(JSON.stringify(structuredData))) {
          aiResults = {
            commonName: structuredData.commonName,
            scientificName: structuredData.scientificName,
            confidence: structuredData.confidence,
            category: structuredData.category,
            funFacts: structuredData.funFacts || [],
            safetyNotes: structuredData.safetyNotes || '',
            habitat: structuredData.habitat || '',
            identification: structuredData.identification || '',
            educationalValue: structuredData.educationalValue || '',
            provider: 'ai-router',
            model: aiResponse.model,
            cost: aiCost,
            responseTime: aiTime
          };

          logger.recognitionStep('ai_router_success', {
            model: aiResponse.model,
            provider: aiResponse.provider,
            cost: aiCost,
            responseTime: aiTime,
            confidence: structuredData.confidence
          }, { recognitionId });

        } else {
          // Heuristic fallback for freeform text responses
          const fallback = looseExtractFromFreeform(aiResponse.content);
          if (fallback) {
            aiResults = {
              commonName: fallback.commonName,
              scientificName: '',
              confidence: fallback.confidence,
              category: fallback.category,
              funFacts: [],
              safetyNotes: '',
              habitat: '',
              identification: '',
              educationalValue: '',
              provider: 'ai-router',
              model: aiResponse.model,
              cost: aiCost,
              responseTime: aiTime
            };
            logger.recognitionStep('ai_router_loose_parse', {
              guess: fallback.commonName,
              confidence: fallback.confidence,
              model: aiResponse.model
            }, { recognitionId });
          } else {
            logger.recognitionStep('ai_router_invalid_response', {
              content: aiResponse.content.substring(0, 200) + '...',
              model: aiResponse.model
            }, { recognitionId });
          }
        }

      } catch (aiError) {
        logger.recognitionStep('ai_router_error', {
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        }, { recognitionId });
        // Continue with traditional results only
      }
    }

    // Step 3: Combine and decide
    const totalTime = Date.now() - startTime;
    const totalCost = traditionalCost + aiCost;

    logger.recognitionStep('hybrid_decision_start', {
      traditionalResults: !!traditionalResults,
      aiResults: !!aiResults,
      totalTime,
      totalCost
    }, { recognitionId });

    let finalDecision;

    // Helper function to extract traditional results safely
    const getTraditionalPick = (results: any) => {
      if (results?.decision?.mode === 'pick') {
        return results.decision.pick;
      } else if (results?.mode === 'pick') {
        return results.pick;
      }
      return null;
    };

    const traditionalPick = getTraditionalPick(traditionalResults);

    if (aiResults && traditionalPick) {
      // Both systems succeeded - use AI results as primary, traditional as backup
      finalDecision = {
        mode: 'pick' as const,
        pick: {
          ...aiResults,
          backupProvider: traditionalPick.provider || 'multi-signal',
          backupConfidence: traditionalPick.confidence || 0.7
        },
        debug: {
          traditionalResults,
          aiResults,
          processingTime: totalTime,
          costs: {
            traditional: traditionalCost,
            ai: aiCost,
            total: totalCost
          }
        }
      };

      logger.recognitionStep('hybrid_success', {
        finalProvider: 'ai-router',
        backupProvider: traditionalPick.provider || 'multi-signal',
        aiConfidence: aiResults.confidence,
        traditionalConfidence: traditionalPick.confidence || 0.7
      }, { recognitionId });

    } else if (aiResults) {
      // Only AI succeeded
      finalDecision = {
        mode: 'pick' as const,
        pick: aiResults,
        debug: {
          aiResults,
          processingTime: totalTime,
          costs: {
            traditional: 0,
            ai: aiCost,
            total: aiCost
          }
        }
      };

      logger.recognitionStep('ai_only_success', {
        provider: 'ai-router',
        confidence: aiResults.confidence
      }, { recognitionId });

    } else if (traditionalPick) {
      // Only traditional succeeded
      finalDecision = {
        mode: 'pick' as const,
        pick: traditionalPick,
        debug: {
          traditionalResults,
          processingTime: totalTime,
          costs: {
            traditional: traditionalCost,
            ai: 0,
            total: traditionalCost
          }
        }
      };

      logger.recognitionStep('traditional_only_success', {
        provider: traditionalPick.provider || 'multi-signal',
        confidence: traditionalPick.confidence || 0.7
      }, { recognitionId });

    } else {
      // Both failed
      finalDecision = {
        mode: 'no_match' as const,
        debug: {
          processingTime: totalTime,
          costs: {
            traditional: traditionalCost,
            ai: aiCost,
            total: totalCost
          }
        }
      };

      logger.recognitionStep('both_systems_failed', {
        totalTime,
        totalCost
      }, { recognitionId });
    }

    logger.recognitionStep('recognition_v3_complete', {
      mode: finalDecision.mode,
      totalTime,
      totalCost,
      success: finalDecision.mode !== 'no_match'
    }, { recognitionId });

    return NextResponse.json({
      success: true,
      decision: finalDecision
    });

  } catch (error) {
    logger.recognitionStep('recognition_v3_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { recognitionId });

    return NextResponse.json({
      success: false,
      error: 'Recognition failed',
      decision: {
        mode: 'no_match' as const,
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        }
      }
    }, { status: 500 });
  }
}

async function runTraditionalPipeline(imageBase64: string, recognitionId?: string) {
  console.log('🔍 [DEBUG] Starting traditional pipeline...');
  try {
    // Step 1: Google Vision for quick labels
    console.log('🔍 [DEBUG] Calling getVisionLabels...');
    const visionStartTime = Date.now();
    const visionBundle = await getVisionLabels(imageBase64);
    const visionTime = Date.now() - visionStartTime;

    console.log('🔍 [DEBUG] Vision bundle:', JSON.stringify(visionBundle, null, 2));

    logger.recognitionStep('vision_complete', {
      labels: visionBundle.labels?.length || 0,
      processingTime: visionTime,
      actualLabels: visionBundle.labels?.slice(0, 3).map(l => l.desc) || []
    }, { recognitionId });

    // Step 2: Check if it's a plant
    const isPlant = plantGate(visionBundle);
    console.log('🔍 [DEBUG] Is plant:', isPlant);
    
    // Step 3: Parallel API calls
    const parallelPromises = [];

    // Knowledge Graph normalization
    if (visionBundle.labels && visionBundle.labels.length > 0) {
      const candidateStrings = visionBundle.labels
        .filter(label => label.score && label.score > 0.6)
        .map(label => label.desc)
        .slice(0, 5);

      if (candidateStrings.length > 0) {
        parallelPromises.push(
          getKnowledgeGraphResults(candidateStrings)
        );
      }
    }

    // Plant.id (if plant detected)
    if (isPlant) {
      parallelPromises.push(
        getPlantIdResults(imageBase64)
      );
    }

    // iNaturalist search
    if (visionBundle.labels && visionBundle.labels.length > 0) {
      const candidateStrings = visionBundle.labels
        .filter(label => label.score && label.score > 0.6)
        .map(label => label.desc)
        .slice(0, 5);

      if (candidateStrings.length > 0) {
        parallelPromises.push(
          getINaturalistResults(candidateStrings)
        );
      }
    }

    // Wait for all parallel API calls
    const parallelResults = await Promise.all(parallelPromises);
    console.log('🔍 [DEBUG] Parallel results:', JSON.stringify(parallelResults, null, 2));

    // Extract results
    let canonicalResults: any[] = [];
    let plantResults: any[] = [];
    let inatResults: any[] = [];

    let resultIndex = 0;

    // Knowledge Graph results
    if (parallelResults[resultIndex]) {
      canonicalResults = parallelResults[resultIndex]!.results || [];
      resultIndex++;
    }

    // Plant.id results
    if (isPlant && parallelResults[resultIndex]) {
      plantResults = parallelResults[resultIndex]!.results || [];
      resultIndex++;
    }

    // iNaturalist results
    if (parallelResults[resultIndex]) {
      inatResults = parallelResults[resultIndex]!.results || [];
    }

    // Step 4: Score and decide
    const allCandidates = [
      ...canonicalResults.map(c => ({ ...c, source: 'kg' })),
      ...plantResults.map(p => ({ ...p, source: 'plantid' })),
      ...inatResults.map(i => ({ ...i, source: 'inat' }))
    ];

    console.log('🔍 [DEBUG] All candidates before scoring:', JSON.stringify(allCandidates, null, 2));

    const scoredCandidates = scoreCandidates(allCandidates);
    console.log('🔍 [DEBUG] Scored candidates:', JSON.stringify(scoredCandidates, null, 2));

    const decision = decide(scoredCandidates);
    console.log('🔍 [DEBUG] Decision:', JSON.stringify(decision, null, 2));

    if (decision.mode === 'pick' && decision.pick) {
      // Add Wikipedia summary if we have a pick
      try {
        if (decision.pick.commonName) {
          const wikiSummary = await getWikipediaSummary(decision.pick.commonName);
          if (wikiSummary) {
            decision.pick.wikipediaSummary = wikiSummary;
          }
        }
      } catch (wikiError) {
        logger.recognitionStep('wikipedia_error', {
          error: wikiError instanceof Error ? wikiError.message : 'Unknown error'
        }, { recognitionId });
      }

      return {
        ...decision.pick,
        provider: 'multi-signal',
        confidence: decision.pick.totalScore || 0.7
      };
    }

    // Return the decision for debugging even if it's not a pick
    return {
      decision,
      candidates: scoredCandidates,
      debug: {
        visionBundle,
        allCandidates,
        scoredCandidates,
        decision
      }
    };

  } catch (error) {
    console.error('🔍 [DEBUG] Traditional pipeline error:', error);
    logger.recognitionStep('traditional_pipeline_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { recognitionId });
    return null;
  }
}

// Very small heuristic to salvage a species/common name from freeform LLM text
function looseExtractFromFreeform(content: string): { commonName: string; confidence: number; category: 'plant' | 'animal' | 'bug' | 'mysterious' } | null {
  if (!content) return null;
  const text = content.toLowerCase();
  const matches = Array.from(text.matchAll(/\b(?:a|an|the)\s+([a-z][a-z\-]+(?:\s+[a-z][a-z\-]+){0,3})/g)).map(m => m[1]);
  const stop = new Set(['animal','creature','thing','photo','image','picture','background','scene','nature']);
  const candidates = matches
    .filter((p): p is string => Boolean(p))
    .map(p => p.trim())
    .filter(p => p.split(' ').every(w => !stop.has(w)))
    .map(p => p.replace(/\bred\s+panda\b/,'red panda'));
  const guess = candidates.find(p => p.includes('panda') || p.includes('rose') || p.includes('flower') || p.includes('bird') || p.includes('butterfly') || p.includes('dog') || p.includes('cat'))
            || candidates[0];
  if (!guess) return null;
  const commonName = guess.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const category: 'plant' | 'animal' | 'bug' | 'mysterious' =
    /rose|flower|tree|plant/.test(guess) ? 'plant' :
    /butterfly|bee|ant|ladybug|beetle|dragonfly|spider/.test(guess) ? 'bug' :
    /panda|dog|cat|bird|heron|jay|fox|bear|deer|fish|frog|lizard/.test(guess) ? 'animal' : 'mysterious';
  return { commonName, confidence: 0.6, category };
}
