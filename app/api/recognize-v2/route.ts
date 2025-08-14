import { NextRequest, NextResponse } from 'next/server';
import {
  RecognitionRequest,
  RecognitionResponse,
  VisionBundle,
  Canonical,
  ProviderHit,
  Candidate,
  RecognitionDecision
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

    // Start recognition pipeline with unique ID
    recognitionId = logger.recognitionStart(imageBase64.length);
    logger.recognitionStep('request_received', { imageSize: imageBase64.length }, { recognitionId });

    console.log('🚀 Starting multi-signal recognition pipeline...');

    // Step 1: Get Vision Bundle (Google Vision API)
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
    logger.visionResults(visionBundle, visionData.processingTime, { recognitionId });
    logger.recognitionStep('vision_api_complete', {
      processingTime: visionData.processingTime,
      labelCount: visionBundle.labels?.length || 0
    }, { recognitionId });

    // Step 2: Check if it's a plant and call Plant.id in parallel
    logger.recognitionStep('plant_gate_check', { step: 'Checking plant gate' }, { recognitionId });
    console.log('🌱 Step 2: Checking plant gate...');

    const isPlant = plantGate(visionBundle);
    const plantConfidence = getPlantConfidence(visionBundle);

    // Log plant gate decision
    logger.plantGateDecision(isPlant, plantConfidence, { recognitionId });

    let plantResults: ProviderHit[] = [];
    if (isPlant) {
      logger.recognitionStep('plantid_api_call', { step: 'Calling Plant.id API' }, { recognitionId });
      console.log('🌱 Plant detected, calling Plant.id API...');

      const plantPromise = fetch(`${request.nextUrl.origin}/api/plantid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      }).then(res => res.ok ? res.json() : { results: [] });

      try {
        const plantData = await plantPromise;
        plantResults = plantData.results || [];

        // Log Plant.id results
        logger.providerResults('Plant.id', plantResults, plantData.processingTime || 0, { recognitionId });
        logger.recognitionStep('plantid_api_complete', {
          resultCount: plantResults.length,
          processingTime: plantData.processingTime || 0
        }, { recognitionId });

      } catch (error) {
        console.error('Plant.id API error:', error);
        logger.recognitionStep('plantid_api_error', { error: error instanceof Error ? error.message : 'Unknown error' }, { recognitionId });
      }
    } else {
      logger.recognitionStep('plantid_api_skipped', { reason: 'Not a plant' }, { recognitionId });
    }

    // Step 3: Build candidate strings from Vision
    logger.recognitionStep('candidate_strings_building', { step: 'Building candidate strings' }, { recognitionId });
    console.log('🧠 Step 3: Building candidate strings...');

    const candidateStrings = [
      ...visionBundle.labels.map(l => l.desc),
      ...visionBundle.webBestGuess,
      ...visionBundle.cropLabels.map(l => l.desc),
    ].filter(Boolean);

    logger.recognitionStep('candidate_strings_complete', {
      totalStrings: candidateStrings.length,
      topStrings: candidateStrings.slice(0, 5)
    }, { recognitionId });

    // Step 4: Canonicalize names with Knowledge Graph
    logger.recognitionStep('knowledge_graph_call', { step: 'Calling Knowledge Graph' }, { recognitionId });
    console.log('🧠 Step 4: Canonicalizing with Knowledge Graph...');

    let canonicalResults: Canonical[] = [];
    if (candidateStrings.length > 0) {
      try {
        const kgResponse = await fetch(`${request.nextUrl.origin}/api/kg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: candidateStrings }),
        });

        if (kgResponse.ok) {
          const kgData = await kgResponse.json();
          canonicalResults = kgData.results || [];

          // Log Knowledge Graph results
          logger.kgResults(canonicalResults, kgData.processingTime || 0, { recognitionId });
          logger.recognitionStep('knowledge_graph_complete', {
            resultCount: canonicalResults.length,
            processingTime: kgData.processingTime || 0
          }, { recognitionId });

        } else {
          logger.recognitionStep('knowledge_graph_error', { status: kgResponse.status }, { recognitionId });
        }
      } catch (error) {
        console.error('Knowledge Graph API error:', error);
        logger.recognitionStep('knowledge_graph_error', { error: error instanceof Error ? error.message : 'Unknown error' }, { recognitionId });
      }
    } else {
      logger.recognitionStep('knowledge_graph_skipped', { reason: 'No candidate strings' }, { recognitionId });
    }

    // Step 5: Search iNaturalist with canonical names
    logger.recognitionStep('inaturalist_call', { step: 'Calling iNaturalist' }, { recognitionId });
    console.log('🌿 Step 5: Searching iNaturalist...');

    let inatResults: ProviderHit[] = [];
    if (canonicalResults.length > 0) {
      try {
        const inatQueries = canonicalResults
          .map(c => [c.commonName, c.scientificName])
          .flat()
          .filter(Boolean);

        logger.recognitionStep('inaturalist_queries', {
          queryCount: inatQueries.length,
          topQueries: inatQueries.slice(0, 5)
        }, { recognitionId });

        const inatResponse = await fetch(`${request.nextUrl.origin}/api/inat/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: inatQueries }),
        });

        if (inatResponse.ok) {
          const inatData = await inatResponse.json();
          inatResults = inatData.results || [];

          // Log iNaturalist results
          logger.providerResults('iNaturalist', inatResults, inatData.processingTime || 0, { recognitionId });
          logger.recognitionStep('inaturalist_complete', {
            resultCount: inatResults.length,
            processingTime: inatData.processingTime || 0
          }, { recognitionId });

        } else {
          logger.recognitionStep('inaturalist_error', { status: inatResponse.status }, { recognitionId });
        }
      } catch (error) {
        console.error('iNaturalist API error:', error);
        logger.recognitionStep('inaturalist_error', { error: error instanceof Error ? error.message : 'Unknown error' }, { recognitionId });
      }
    } else {
      logger.recognitionStep('inaturalist_skipped', { reason: 'No canonical results' }, { recognitionId });
    }

    // Step 6: Merge and deduplicate candidates
    logger.recognitionStep('candidate_merging', { step: 'Merging candidates' }, { recognitionId });
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
        fuzzyMatch(p.scientificName, candidate.scientificName) > 0.5 ||
        fuzzyMatch(p.commonName || '', candidate.commonName || '') > 0.5
      );

      if (providerMatch) {
        candidate.scores.provider = providerMatch.confidence;
      }

      candidates.push(candidate);

      // Log scoring details for each candidate
      logger.scoringDetails(candidate, { recognitionId });
    }

    // Add candidates from provider results that weren't in canonical results
    for (const providerResult of allProviderResults) {
      const exists = candidates.some(c =>
        fuzzyMatch(c.scientificName, providerResult.scientificName) > 0.5
      );

      if (!exists) {
        const candidate: Candidate = {
          scientificName: providerResult.scientificName,
          commonName: providerResult.commonName,
          scores: {
            provider: providerResult.confidence,
            vision: Math.max(
              ...visionBundle.labels
                .filter(l => fuzzyMatch(l.desc, providerResult.scientificName) > 0.3)
                .map(l => l.score)
            ),
            cropAgree: calculateCropAgreement(visionBundle.labels, visionBundle.cropLabels),
            habitatTime: 0.0,
          },
        };
        candidates.push(candidate);

        // Log scoring details for provider-only candidates
        logger.scoringDetails(candidate, { recognitionId });
      }
    }

    // Log candidate building summary
    logger.candidateBuilding(candidates, { recognitionId });
    logger.recognitionStep('candidate_merging_complete', {
      totalCandidates: candidates.length,
      canonicalCandidates: canonicalResults.length,
      providerCandidates: allProviderResults.length
    }, { recognitionId });

    // Step 7: Make decision
    logger.recognitionStep('decision_making', { step: 'Making final decision' }, { recognitionId });
    console.log('🎯 Step 7: Making decision...');

    const decision: RecognitionDecision = decide(candidates, 0.15);

    // Log decision making process
    logger.decisionMaking(decision, 0.15, { recognitionId });

    const totalTime = Date.now() - startTime;
    console.log(`✅ Multi-signal recognition completed in ${totalTime}ms`);
    console.log(`📊 Processed ${candidates.length} candidates, decision: ${decision.mode}`);

        // Log final success
    if (decision.mode === 'pick' && decision.pick) {
      const result = {
        canonicalName: decision.pick.scientificName,
        commonName: decision.pick.commonName || decision.pick.scientificName,
        category: 'mysterious',
        confidence: decision.pick.totalScore || 0.8,
        provider: 'multi-signal',
        rank: 'species',
        capturedImageUrl: `captured-image-${Date.now()}`,
      };
      
      logger.recognitionSuccess(result, totalTime, { recognitionId });
    } else if (decision.mode === 'disambiguate' && decision.top3 && decision.top3.length > 0) {
      const topResult = decision.top3[0]!; // Non-null assertion as we checked length > 0
      const result = {
        canonicalName: topResult.scientificName,
        commonName: topResult.commonName || topResult.scientificName,
        category: 'mysterious',
        confidence: topResult.totalScore || 0.6,
        provider: 'multi-signal',
        rank: 'species',
        capturedImageUrl: `captured-image-${Date.now()}`,
      };
      
      logger.recognitionSuccess(result, totalTime, { recognitionId });
    }

    const response: RecognitionResponse = {
      success: true,
      decision: {
        ...decision,
        debug: {
          visionBundle,
          candidates,
          processingTime: totalTime,
        },
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Multi-signal recognition error:', error);
    const totalTime = Date.now() - startTime;

    // Log the error with recognition ID
    logger.recognitionError(error as Error, { recognitionId });

    return NextResponse.json(
      {
        success: false,
        error: 'Recognition failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: totalTime,
        recognitionId, // Include recognition ID in error response for debugging
      },
      { status: 500 }
    );
  }
}
