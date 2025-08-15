import { NextRequest, NextResponse } from 'next/server';
import {
  RecognitionRequest,
  RecognitionResponse,
  VisionBundle,
  Canonical,
  ProviderHit,
  Candidate
} from '@/types/recognition';
import { plantGate, getPlantConfidence } from '@/lib/plantGate';
import { decide, calculateCropAgreement, fuzzyMatch } from '@/lib/rankSpecies';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let recognitionId: string | undefined;

  try {
    // Parse request
    const { imageBase64 }: RecognitionRequest = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 parameter' },
        { status: 400 }
      );
    }

    // Validate image size (max 10MB base64)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageBase64.length > maxSize) {
      return NextResponse.json(
        { error: 'Image too large. Please use an image smaller than 10MB.' },
        { status: 400 }
      );
    }

    // Validate minimum size
    if (imageBase64.length < 1000) {
      return NextResponse.json(
        { error: 'Image data too small. Please try a different image.' },
        { status: 400 }
      );
    }

    // Start recognition pipeline with unique ID
    recognitionId = logger.recognitionStart(imageBase64.length);
    logger.recognitionStep('request_received', { imageSize: imageBase64.length }, { recognitionId });

    console.log('🚀 Starting optimized multi-signal recognition pipeline...');

    // Step 1: Get Vision Bundle (Google Vision API) - This must be first
    logger.recognitionStep('vision_api_call', { step: 'Starting Vision API' }, { recognitionId });
    console.log('🔍 Step 1: Getting Vision Bundle...');

    const visionResponse = await fetch(`${request.nextUrl.origin}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!visionResponse.ok) {
      const error = new Error('Vision API failed');
      logger.recognitionError(error, { recognitionId });
      throw error;
    }

    const visionData = await visionResponse.json();
    const visionBundle: VisionBundle = visionData.visionBundle;

    // Log Vision API results
    await logger.recognitionStep('vision_api_results', {
      processingTime: visionData.processingTime,
      labelCount: visionBundle.labels?.length || 0,
      labels: visionBundle.labels?.slice(0, 5) || [],
      webBestGuess: visionBundle.webBestGuess || []
    }, { recognitionId });

    // Step 2: Build candidate strings from Vision
    await logger.recognitionStep('candidate_strings_building', { step: 'Building candidate strings' }, { recognitionId });
    console.log('🧠 Step 2: Building candidate strings...');

    const candidateStrings = [
      ...(visionBundle.labels || []).map(l => l.desc),
      ...(visionBundle.webBestGuess || []),
      ...(visionBundle.cropLabels || []).map(l => l.desc),
    ].filter(Boolean);

    await logger.recognitionStep('candidate_strings_complete', {
      totalStrings: candidateStrings.length,
      topStrings: candidateStrings.slice(0, 5)
    }, { recognitionId });

    // Step 3: Check plant gate and prepare parallel API calls
    await logger.recognitionStep('plant_gate_check', { step: 'Checking plant gate' }, { recognitionId });
    console.log('🌱 Step 3: Checking plant gate...');

    const isPlant = plantGate(visionBundle);
    const plantConfidence = getPlantConfidence(visionBundle);

    // Log plant gate decision
    await logger.recognitionStep('plant_gate_decision', {
      isPlant,
      plantConfidence,
      decision: isPlant ? 'Will call Plant.id API' : 'Skipping Plant.id API'
    }, { recognitionId });

    // Step 4: PARALLEL API CALLS - This is the key optimization!
    await logger.recognitionStep('parallel_api_calls', { step: 'Starting parallel API calls' }, { recognitionId });
    console.log('⚡ Step 4: Making parallel API calls...');

    const parallelPromises: Promise<any>[] = [];

    // Knowledge Graph API call
    if (candidateStrings.length > 0) {
      parallelPromises.push(
        fetch(`${request.nextUrl.origin}/api/kg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: candidateStrings }),
        }).then(res => res.ok ? res.json() : { results: [] })
          .catch(error => {
            console.error('Knowledge Graph API error:', error);
            return { results: [] };
          })
      );
    }

    // Plant.id API call (if plant detected)
    if (isPlant) {
      parallelPromises.push(
        fetch(`${request.nextUrl.origin}/api/plantid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64 }),
        }).then(res => res.ok ? res.json() : { results: [] })
          .catch(error => {
            console.error('Plant.id API error:', error);
            return { results: [] };
          })
      );
    }

    // iNaturalist API call (in parallel)
    if (candidateStrings.length > 0) {
      parallelPromises.push(
        fetch(`${request.nextUrl.origin}/api/inat/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: candidateStrings.slice(0, 5) }),
        }).then(res => res.ok ? res.json() : { results: [] })
          .catch(error => {
            console.error('iNaturalist API error:', error);
            return { results: [] };
          })
      );
    }

    // Wait for all parallel API calls to complete
    const parallelResults = await Promise.all(parallelPromises);
    
    // Extract results - track which API is which
    let canonicalResults: Canonical[] = [];
    let plantResults: ProviderHit[] = [];
    let inatResults: ProviderHit[] = [];
    
    let resultIndex = 0;
    
    // Knowledge Graph results (always first if candidateStrings exist)
    if (candidateStrings.length > 0 && parallelResults[resultIndex]) {
      canonicalResults = parallelResults[resultIndex].results || [];
      await logger.recognitionStep('kg_results', {
        resultCount: canonicalResults.length,
        topResults: canonicalResults.slice(0, 3).map(r => ({
          commonName: r.commonName,
          scientificName: r.scientificName,
          kgId: r.kgId,
          wikipediaTitle: r.wikipediaTitle
        })),
        processingTime: parallelResults[resultIndex].processingTime || 0
      }, { recognitionId });
      resultIndex++;
    }
    
    // Plant.id results (if plant detected)
    if (isPlant && parallelResults[resultIndex]) {
      plantResults = parallelResults[resultIndex].results || [];
      await logger.recognitionStep('plantid_results', {
        provider: 'Plant.id',
        resultCount: plantResults.length,
        topResults: plantResults.slice(0, 3).map(r => ({
          name: r.scientificName || r.commonName,
          confidence: r.confidence,
          source: r.source
        })),
        processingTime: parallelResults[resultIndex].processingTime || 0
      }, { recognitionId });
      resultIndex++;
    }

    // iNaturalist results (always last)
    if (candidateStrings.length > 0 && parallelResults[resultIndex]) {
      inatResults = parallelResults[resultIndex].results || [];
      await logger.recognitionStep('inat_results', {
        provider: 'iNaturalist',
        resultCount: inatResults.length,
        topResults: inatResults.slice(0, 3).map(r => ({
          name: r.scientificName || r.commonName,
          confidence: r.confidence,
          source: r.source
        })),
        processingTime: parallelResults[resultIndex].processingTime || 0
      }, { recognitionId });
    }

    await logger.recognitionStep('parallel_api_complete', {
      kgResults: canonicalResults.length,
      plantResults: plantResults.length,
      totalTime: Date.now() - startTime
    }, { recognitionId });

    // Step 5: iNaturalist search is now done in parallel above

    // Step 6: Merge and deduplicate candidates
    await logger.recognitionStep('candidate_merging', { step: 'Merging candidates' }, { recognitionId });
    console.log('🔄 Step 6: Merging and deduplicating candidates...');

    const allProviderResults = [...plantResults, ...inatResults];

    // Create candidates from canonical results and provider results
    const candidates: Candidate[] = [];

    // Add candidates from canonical results
    for (const canonical of canonicalResults) {
      const candidate: Candidate = {
        scientificName: canonical.scientificName || canonical.commonName,
        commonName: canonical.commonName,
        kgId: canonical.kgId,
        wikipediaTitle: canonical.wikipediaTitle,
        scores: {
          vision: Math.max(
            ...visionBundle.labels
              .filter(l => fuzzyMatch(l.desc, canonical.commonName) > 0.3)
              .map(l => l.score)
          ),
          webGuess: Math.max(
            ...visionBundle.webBestGuess
              .map(guess => fuzzyMatch(guess, canonical.commonName))
          ),
          kgMatch: canonical.kgId ? 1.0 : 0.0,
          cropAgree: calculateCropAgreement(visionBundle.labels, visionBundle.cropLabels),
          habitatTime: 0.0, // TODO: Implement location-based scoring
        },
      };

      // Add provider confidence if available
      const providerMatch = allProviderResults.find(p => 
        fuzzyMatch(p.scientificName || '', canonical.scientificName || '') > 0.7 ||
        fuzzyMatch(p.commonName || '', canonical.commonName || '') > 0.7
      );
      
      if (providerMatch) {
        candidate.scores.provider = providerMatch.confidence || 0.5;
      }

      candidates.push(candidate);
      await logger.recognitionStep('scoring_details', {
        candidate: {
          scientificName: candidate.scientificName,
          commonName: candidate.commonName,
          scores: candidate.scores
        }
      }, { recognitionId });
    }

    // Add provider-only candidates (not found in Knowledge Graph)
    for (const providerResult of allProviderResults) {
      const isDuplicate = candidates.some(c => 
        fuzzyMatch(c.scientificName || '', providerResult.scientificName || '') > 0.7 ||
        fuzzyMatch(c.commonName || '', providerResult.commonName || '') > 0.7
      );

      if (!isDuplicate) {
        const candidate: Candidate = {
          scientificName: providerResult.scientificName,
          commonName: providerResult.commonName,
          scores: {
            provider: providerResult.confidence || 0.5,
            vision: 0,
            cropAgree: 0,
            habitatTime: 0
          },
        };

        candidates.push(candidate);
        await logger.recognitionStep('scoring_details', {
          candidate: {
            scientificName: candidate.scientificName,
            commonName: candidate.commonName,
            scores: candidate.scores
          }
        }, { recognitionId });
      }
    }

    await logger.recognitionStep('candidate_building', {
      totalCandidates: candidates.length,
      candidates: candidates.map(c => ({
        scientificName: c.scientificName,
        commonName: c.commonName,
        scores: c.scores
      }))
    }, { recognitionId });
    await logger.recognitionStep('candidate_merging_complete', {
      totalCandidates: candidates.length,
      canonicalCandidates: canonicalResults.length,
      providerCandidates: allProviderResults.length
    }, { recognitionId });

    // Step 7: Make decision
    await logger.recognitionStep('decision_making', { step: 'Making decision' }, { recognitionId });
    console.log('🎯 Step 7: Making final decision...');

    const decision = decide(candidates, 0.15);
    await logger.recognitionStep('decision_making', {
      mode: decision.mode,
      margin: 0.15,
      topCandidates: decision.mode === 'pick' ? 
        [decision.pick] : 
        decision.top3?.slice(0, 3),
      decisionReason: decision.mode === 'pick' ? 
        'High confidence single result' : 
        'Multiple candidates, showing top 3 for disambiguation'
    }, { recognitionId });

    // Step 8: Return response
    const totalTime = Date.now() - startTime;
    const result: RecognitionResponse = {
      success: true,
      decision,
      debug: {
        visionBundle,
        candidates,
        processingTime: totalTime
      }
    };

    await logger.recognitionSuccess(result, totalTime, { recognitionId });

    return NextResponse.json(result);

  } catch (error) {
    await logger.recognitionError(error as Error, { recognitionId });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        recognitionId 
      },
      { status: 500 }
    );
  }
}
