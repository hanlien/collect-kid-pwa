import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

// Lazy Supabase client getter to avoid build-time crashes when env is missing
function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      await logger.warn('Supabase env missing when saving progress; returning 503');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const body = await request.json();
    const { profileId, collections, badges, coins, level, experience } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Save progress to database
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        profile_id: profileId,
        collections: collections || [],
        badges: badges || [],
        coins: coins || 0,
        level: level || 1,
        experience: experience || 0,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      });

    if (error) {
      console.error('Error saving progress:', error);
      await logger.error('Failed to save user progress', new Error(error.message), { profileId });
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    await logger.info('User progress saved successfully', { profileId, collections: collections?.length, badges: badges?.length, coins, level });

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully',
      data
    });

  } catch (error) {
    console.error('Error in save progress:', error);
    await logger.error('Error saving user progress', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      await logger.warn('Supabase env missing when fetching progress; returning 503');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Get progress from database
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      // Any error: serve safe defaults (avoids breaking client UX)
      console.warn('Error fetching progress (serving defaults):', error);
      await logger.warn('Failed to fetch user progress; serving defaults', { profileId, code: (error as any).code });
      return NextResponse.json({
        success: true,
        data: {
          profile_id: profileId,
          collections: [],
          badges: [],
          coins: 0,
          level: 1,
          experience: 0,
          last_updated: null
        }
      });
    }

    await logger.info('User progress fetched successfully', { profileId });

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in fetch progress:', error);
    await logger.error('Error fetching user progress', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
