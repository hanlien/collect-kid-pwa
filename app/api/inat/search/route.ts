import { NextRequest, NextResponse } from 'next/server';
import { ProviderHit } from '@/types/recognition';
import { iNaturalistAPI } from '@/lib/inaturalistAPI';

export async function POST(request: NextRequest) {
  try {
    // Parse request
    const { queries } = await request.json();
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid queries array' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const allResults: ProviderHit[] = [];

    // Process each query
    for (const query of queries.slice(0, 5)) { // Limit to 5 queries
      try {
        console.log(`🌿 Searching iNaturalist for: "${query}"`);
        
        const identifications = await iNaturalistAPI.identifySpeciesFromLabels([query]);
        
        if (identifications.length > 0) {
          const topResults = identifications.slice(0, 2).map(identification => {
            const appFormat = iNaturalistAPI.convertToAppFormat(identification);
            
            return {
              scientificName: appFormat.scientificName,
              commonName: appFormat.commonName,
              source: 'inat' as const,
              confidence: appFormat.confidence,
              meta: {
                taxonId: identification.taxon?.id,
                rank: identification.taxon?.rank,
                iconicTaxonName: identification.taxon?.iconic_taxon_name,
                score: identification.score,
                visionScore: identification.vision_score,
                frequencyScore: identification.frequency_score,
                category: identification.category,
              },
            } as ProviderHit;
          });
          
          allResults.push(...topResults);
        }
        
      } catch (error) {
        console.error(`iNaturalist search error for "${query}":`, error);
        // Continue with other queries
      }
    }

    // Remove duplicates based on scientific name
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.scientificName === result.scientificName)
    );

    // Sort by confidence and take top 5
    const sortedResults = uniqueResults
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const processingTime = Date.now() - startTime;

    console.log(`🌿 iNaturalist API completed in ${processingTime}ms`);
    console.log(`📊 Processed ${queries.length} queries, found ${sortedResults.length} unique species`);

    return NextResponse.json({
      success: true,
      results: sortedResults,
      processingTime,
    });

  } catch (error) {
    console.error('iNaturalist API error:', error);
    return NextResponse.json(
      { error: 'iNaturalist API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
