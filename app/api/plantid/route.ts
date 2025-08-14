import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from '@/lib/validation';
import { ProviderHit } from '@/types/recognition';

export async function POST(request: NextRequest) {
  try {
    const env = validateEnv();
    
    // Parse request
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 parameter' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Call Plant.id API
    const plantResponse = await fetch('https://api.plant.id/v2/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': env.PLANT_ID_API_KEY,
      },
      body: JSON.stringify({
        images: [imageBase64],
        modifiers: ['health_all', 'disease_similar_images'],
        plant_details: ['common_names', 'taxonomy', 'wiki_description'],
        language: 'en',
      }),
    });

    if (!plantResponse.ok) {
      console.error(`Plant.id API error: ${plantResponse.status}`);
      return NextResponse.json(
        { error: 'Plant.id API failed' },
        { status: 500 }
      );
    }

    const plantData = await plantResponse.json();
    const suggestions = plantData.suggestions || [];
    
    const results: ProviderHit[] = suggestions.slice(0, 3).map((suggestion: any) => ({
      scientificName: suggestion.plant_name || 'Unknown Plant',
      commonName: suggestion.plant_details?.common_names?.[0] || suggestion.plant_name,
      source: 'plantid' as const,
      confidence: suggestion.probability || 0.5,
      meta: {
        taxonomy: suggestion.plant_details?.taxonomy,
        wikiDescription: suggestion.plant_details?.wiki_description,
        similarImages: suggestion.similar_images?.slice(0, 3) || [],
        health: suggestion.health,
        disease: suggestion.disease,
      },
    }));

    const processingTime = Date.now() - startTime;

    console.log(`🌱 Plant.id API completed in ${processingTime}ms`);
    console.log(`📊 Found ${results.length} plant suggestions`);

    return NextResponse.json({
      success: true,
      results,
      processingTime,
    });

  } catch (error) {
    console.error('Plant.id API error:', error);
    return NextResponse.json(
      { error: 'Plant.id API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
