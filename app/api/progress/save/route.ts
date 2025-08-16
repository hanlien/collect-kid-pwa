import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
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
      if (error.code === 'PGRST116') {
        // No progress found, return default values
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
      
      console.error('Error fetching progress:', error);
      await logger.error('Failed to fetch user progress', new Error(error.message), { profileId });
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
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
