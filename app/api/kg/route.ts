import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from '@/lib/validation';
import { Canonical } from '@/types/recognition';

export async function POST(request: NextRequest) {
  try {
    const env = validateEnv();
    
    // Parse request
    const { queries } = await request.json();
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid queries array' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results: Canonical[] = [];

    // Process each query
    for (const query of queries.slice(0, 10)) { // Limit to 10 queries
      try {
        const kgResponse = await fetch(
          `https://kgsearch.googleapis.com/v1/entities:search?` +
          `query=${encodeURIComponent(query)}&` +
          `types=Species|Animal|Plant&` +
          `limit=3&` +
          `key=${env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!kgResponse.ok) {
          console.warn(`KG API error for query "${query}": ${kgResponse.status}`);
          continue;
        }

        const kgData = await kgResponse.json();
        
        if (kgData.itemListElement && kgData.itemListElement.length > 0) {
          const entity = kgData.itemListElement[0].result;
          
          // Extract Wikipedia title from detailed description URL
          let wikipediaTitle: string | undefined;
          if (entity.detailedDescription?.url) {
            const wikiMatch = entity.detailedDescription.url.match(/wikipedia\.org\/wiki\/(.+)$/);
            if (wikiMatch) {
              wikipediaTitle = decodeURIComponent(wikiMatch[1]);
            }
          }
          
          // Check sitelinks for Wikipedia
          if (!wikipediaTitle && entity.sitelinks) {
            const wikiSitelink = entity.sitelinks.find((link: any) => 
              link.site?.includes('wikipedia')
            );
            if (wikiSitelink?.title) {
              wikipediaTitle = wikiSitelink.title;
            }
          }

          const canonical: Canonical = {
            commonName: entity.name || query,
            scientificName: entity.description || undefined,
            kgId: entity['@id'] || undefined,
            wikipediaTitle,
            source: 'vision' as const,
          };

          results.push(canonical);
        } else {
          // No KG result, create fallback
          results.push({
            commonName: query,
            source: 'vision' as const,
          });
        }

      } catch (error) {
        console.error(`KG API error for query "${query}":`, error);
        // Add fallback result
        results.push({
          commonName: query,
          source: 'vision' as const,
        });
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(`🧠 KG API completed in ${processingTime}ms`);
    console.log(`📊 Processed ${queries.length} queries, found ${results.length} entities`);

    return NextResponse.json({
      success: true,
      results,
      processingTime,
    });

  } catch (error) {
    console.error('KG API error:', error);
    return NextResponse.json(
      { error: 'KG API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
