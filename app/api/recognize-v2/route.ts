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
import { plantGate } from '@/lib/plantGate';
import { decide, calculateCropAgreement, fuzzyMatch } from '@/lib/rankSpecies';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request
    const { imageBase64 }: RecognitionRequest = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 parameter' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting multi-signal recognition pipeline...');

    // Step 1: Get Vision Bundle (Google Vision API)
    console.log('🔍 Step 1: Getting Vision Bundle...');
    const visionResponse = await fetch(`${request.nextUrl.origin}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!visionResponse.ok) {
      throw new Error('Vision API failed');
    }

    const visionData = await visionResponse.json();
    const visionBundle: VisionBundle = visionData.visionBundle;

    // Step 2: Check if it's a plant and call Plant.id in parallel
    console.log('🌱 Step 2: Checking plant gate...');
    const isPlant = plantGate(visionBundle);
    
    let plantResults: ProviderHit[] = [];
    if (isPlant) {
      console.log('🌱 Plant detected, calling Plant.id API...');
      const plantPromise = fetch(`${request.nextUrl.origin}/api/plantid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      }).then(res => res.ok ? res.json() : { results: [] });
      
      try {
        const plantData = await plantPromise;
        plantResults = plantData.results || [];
      } catch (error) {
        console.error('Plant.id API error:', error);
      }
    }

    // Step 3: Build candidate strings from Vision
    console.log('🧠 Step 3: Building candidate strings...');
    const candidateStrings = [
      ...visionBundle.labels.map(l => l.desc),
      ...visionBundle.webBestGuess,
      ...visionBundle.cropLabels.map(l => l.desc),
    ].filter(Boolean);

    // Step 4: Canonicalize names with Knowledge Graph
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
        }
      } catch (error) {
        console.error('Knowledge Graph API error:', error);
      }
    }

    // Step 5: Search iNaturalist with canonical names
    console.log('🌿 Step 5: Searching iNaturalist...');
    let inatResults: ProviderHit[] = [];
    if (canonicalResults.length > 0) {
      try {
        const inatQueries = canonicalResults
          .map(c => [c.commonName, c.scientificName])
          .flat()
          .filter(Boolean);
        
        const inatResponse = await fetch(`${request.nextUrl.origin}/api/inat/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: inatQueries }),
        });
        
        if (inatResponse.ok) {
          const inatData = await inatResponse.json();
          inatResults = inatData.results || [];
        }
      } catch (error) {
        console.error('iNaturalist API error:', error);
      }
    }

    // Step 6: Merge and deduplicate candidates
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
      }
    }

    // Step 7: Make decision
    console.log('🎯 Step 7: Making decision...');
    const decision: RecognitionDecision = decide(candidates, 0.15);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Multi-signal recognition completed in ${totalTime}ms`);
    console.log(`📊 Processed ${candidates.length} candidates, decision: ${decision.mode}`);

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
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Recognition failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: totalTime,
      },
      { status: 500 }
    );
  }
}
