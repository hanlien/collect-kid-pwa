import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAvailable } from '@/lib/supabase';
import { validateEnv } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const env = validateEnv();
    
    // Check if active learning is enabled
    if (process.env.AL_ENABLE !== 'true') {
      return NextResponse.json(
        { error: 'Active learning is disabled' },
        { status: 403 }
      );
    }

    // Check if Supabase is available
    if (!isSupabaseAvailable() || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Active learning database unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      userId,
      thumbUrl,
      providerSuggestion,
      visionLabels,
      localModel,
      hint,
      locationHint
    } = body;

    // Validate required fields
    if (!thumbUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check daily queue limit
    const today = new Date().toDateString();
    const { count } = await supabaseAdmin
      .from('active_learning_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);

    const maxQueuePerDay = parseInt(process.env.AL_MAX_QUEUE_PER_DAY || '50');
    if (count && count >= maxQueuePerDay) {
      return NextResponse.json(
        { error: 'Daily queue limit reached' },
        { status: 429 }
      );
    }

    // Insert into queue
    const { data, error } = await supabaseAdmin
      .from('active_learning_queue')
      .insert({
        user_id: userId,
        thumb_url: thumbUrl,
        provider_suggestion: providerSuggestion,
        vision_labels: visionLabels,
        local_model: localModel,
        hint,
        location_hint: locationHint,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to queue sample:', error);
      return NextResponse.json(
        { error: 'Failed to queue sample' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      queueId: data.id 
    });

  } catch (error) {
    console.error('Active learning queue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const env = validateEnv();
    
    // Check if active learning is enabled
    if (process.env.AL_ENABLE !== 'true') {
      return NextResponse.json(
        { error: 'Active learning is disabled' },
        { status: 403 }
      );
    }

    // Check if Supabase is available
    if (!isSupabaseAvailable() || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Active learning database unavailable' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get pending samples
    const { data, error } = await supabaseAdmin
      .from('active_learning_queue')
      .select(`
        id,
        created_at,
        user_id,
        thumb_url,
        provider_suggestion,
        vision_labels,
        local_model,
        hint,
        location_hint,
        status,
        final_label_id,
        notes
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch queue:', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    return NextResponse.json({ samples: data });

  } catch (error) {
    console.error('Active learning fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
