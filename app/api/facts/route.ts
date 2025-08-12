import { NextRequest, NextResponse } from 'next/server';
import { factsRequestSchema } from '@/lib/validation';
import { generateFunFacts } from '@/lib/utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const canonicalName = request.nextUrl.searchParams.get('canonicalName');
    const gbifKey = request.nextUrl.searchParams.get('gbifKey');

    // Validate request
    const validatedParams = factsRequestSchema.parse({
      canonicalName,
      gbifKey,
    });

    let gbifData: any = null;
    let wikiData: any = null;

    // Get GBIF data if we don't have a key
    if (!validatedParams.gbifKey) {
      try {
        const gbifResponse = await fetch(
          `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(validatedParams.canonicalName)}`
        );
        
        if (gbifResponse.ok) {
          gbifData = await gbifResponse.json();
        }
      } catch (error) {
        console.error('GBIF API error:', error);
      }
    }

    const speciesKey = validatedParams.gbifKey || gbifData?.usageKey;

    // Get Wikipedia data
    if (speciesKey) {
      try {
        // First get the Wikipedia page title from GBIF
        const gbifPageResponse = await fetch(
          `https://api.gbif.org/v1/species/${speciesKey}/descriptions`
        );
        
        if (gbifPageResponse.ok) {
          const descriptions = await gbifPageResponse.json();
          const wikiDescription = descriptions.results?.find(
            (d: any) => d.type === 'WIKIPEDIA'
          );
          
          if (wikiDescription?.source) {
            // Extract Wikipedia page title from URL
            const wikiTitle = wikiDescription.source.split('/').pop();
            
            // Get Wikipedia content
            const wikiResponse = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
            );
            
            if (wikiResponse.ok) {
              wikiData = await wikiResponse.json();
            }
          }
        }
      } catch (error) {
        console.error('Wikipedia API error:', error);
      }
    }

    // Generate fun facts
    let funFacts: string[] = [];
    if (wikiData?.extract) {
      funFacts = generateFunFacts(wikiData.extract);
    } else {
      // Fallback facts based on category
      const category = validatedParams.canonicalName.toLowerCase();
      if (category.includes('flower') || category.includes('plant')) {
        funFacts = [
          'Plants make their own food using sunlight!',
          'Flowers help plants make seeds for new plants.',
          'Some flowers can change color to attract bees!',
        ];
      } else if (category.includes('bird')) {
        funFacts = [
          'Birds are the only animals with feathers!',
          'Most birds can fly, but some prefer to walk.',
          'Birds build nests to keep their eggs safe.',
        ];
      } else if (category.includes('bug') || category.includes('insect')) {
        funFacts = [
          'Insects have six legs and three body parts!',
          'Bees help flowers grow by carrying pollen.',
          'Butterflies taste with their feet!',
        ];
      } else {
        funFacts = [
          'Animals come in all shapes and sizes!',
          'Each animal has special ways to survive.',
          'Animals are amazing and unique!',
        ];
      }
    }

    return NextResponse.json({
      funFacts,
      summary: wikiData?.extract || `Learn more about ${validatedParams.canonicalName}!`,
      imageUrl: wikiData?.thumbnail?.source,
    });
  } catch (error) {
    console.error('Facts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facts' },
      { status: 500 }
    );
  }
}
