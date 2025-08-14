import { NextRequest, NextResponse } from 'next/server';
import { WikiCard } from '@/types/recognition';

// Simple in-memory cache (TODO: use Redis in production)
const wikiCache = new Map<string, { data: WikiCard; timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    
    if (!title) {
      return NextResponse.json(
        { error: 'Missing title parameter' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = title.toLowerCase().trim();
    const cached = wikiCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`📚 Wikipedia cache hit for: ${title}`);
      return NextResponse.json({
        success: true,
        wikiCard: cached.data,
        fromCache: true,
      });
    }

    const startTime = Date.now();

    // Fetch from Wikipedia API
    const wikiResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BuggiesWithBrandon/1.0 (https://buggies-with-brandon.vercel.app)',
        },
      }
    );

    if (!wikiResponse.ok) {
      console.warn(`Wikipedia API error for "${title}": ${wikiResponse.status}`);
      return NextResponse.json(
        { error: 'Wikipedia page not found' },
        { status: 404 }
      );
    }

    const wikiData = await wikiResponse.json();
    
    // Extract thumbnail URL
    let thumbnail: string | undefined;
    if (wikiData.thumbnail?.source) {
      thumbnail = wikiData.thumbnail.source;
    }

    // Create kid-friendly extract (limit length and simplify language)
    let extract = wikiData.extract || '';
    
    // Truncate if too long
    if (extract.length > 200) {
      extract = extract.substring(0, 200).replace(/\s+\w+$/, '') + '...';
    }
    
    // Simplify some complex terms for kids
    extract = extract
      .replace(/species/g, 'type of animal or plant')
      .replace(/genus/g, 'group')
      .replace(/family/g, 'family group')
      .replace(/order/g, 'big group')
      .replace(/phylum/g, 'very big group')
      .replace(/kingdom/g, 'huge group');

    const wikiCard: WikiCard = {
      title: wikiData.title || title,
      extract,
      thumbnail,
      url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };

    // Cache the result
    wikiCache.set(cacheKey, {
      data: wikiCard,
      timestamp: Date.now(),
    });

    const processingTime = Date.now() - startTime;

    console.log(`📚 Wikipedia API completed in ${processingTime}ms`);
    console.log(`📖 Fetched summary for: ${title}`);

    return NextResponse.json({
      success: true,
      wikiCard,
      fromCache: false,
      processingTime,
    });

  } catch (error) {
    console.error('Wikipedia API error:', error);
    return NextResponse.json(
      { error: 'Wikipedia API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(wikiCache.entries()).forEach(([key, value]) => {
    if ((now - value.timestamp) > CACHE_DURATION) {
      wikiCache.delete(key);
    }
  });
}, 60 * 60 * 1000); // Clean every hour
