import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET: list profiles across devices. Prefer `profiles` table; fallback to distinct ids from user_progress
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      await logger.warn('Supabase env missing on GET /api/profiles; returning empty list');
      return NextResponse.json({ success: true, profiles: [] });
    }

    // Try to read from `profiles` table if exists
    const { data: profilesTable, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, name, emoji, last_seen')
      .order('last_seen', { ascending: false });

    if (!profilesErr && Array.isArray(profilesTable)) {
      return NextResponse.json({ success: true, profiles: profilesTable });
    }

    // Fallback: derive distinct profile ids from user_progress
    const { data: progressRows, error: progressErr } = await supabase
      .from('user_progress')
      .select('profile_id, coins, level, last_updated');

    if (progressErr) {
      await logger.warn('Failed to list profiles; returning empty', { error: progressErr.message });
      return NextResponse.json({ success: true, profiles: [] });
    }

    const map = new Map<string, any>();
    for (const row of progressRows || []) {
      const existing = map.get(row.profile_id);
      if (!existing || new Date(row.last_updated || 0) > new Date(existing.last_updated || 0)) {
        map.set(row.profile_id, {
          id: row.profile_id,
          name: row.profile_id,
          emoji: '👤',
          last_seen: row.last_updated || null,
          coins: row.coins,
          level: row.level,
        });
      }
    }

    return NextResponse.json({ success: true, profiles: Array.from(map.values()) });

  } catch (error) {
    await logger.error('GET /api/profiles failed', error as Error);
    return NextResponse.json({ success: true, profiles: [] });
  }
}

// POST: upsert a profile metadata record
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, name, emoji } = body as { id: string; name: string; emoji: string };

    if (!id || !name || !emoji) {
      return NextResponse.json({ success: false, error: 'Missing id, name, or emoji' }, { status: 400 });
    }

    if (!supabase) {
      await logger.warn('Supabase env missing on POST /api/profiles; noop success');
      return NextResponse.json({ success: true });
    }

    // Create table if not exists is not supported directly; attempt upsert and allow failure gracefully
    const { error } = await supabase.from('profiles').upsert({
      id,
      name,
      emoji,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      await logger.warn('Upsert profiles failed; likely table missing', { error: error.message });
      return NextResponse.json({ success: false, warning: 'profiles table missing' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await logger.error('POST /api/profiles failed', error as Error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// PATCH: update profile metadata (name, emoji)
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, name, emoji } = body as { id: string; name?: string; emoji?: string };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    if (!supabase) {
      await logger.warn('Supabase env missing on PATCH /api/profiles; noop success');
      return NextResponse.json({ success: true });
    }

    const updates: any = { id, last_seen: new Date().toISOString() };
    if (typeof name === 'string') updates.name = name;
    if (typeof emoji === 'string') updates.emoji = emoji;

    const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'id' });
    if (error) {
      await logger.warn('Update profiles failed', { error: error.message });
      return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    await logger.error('PATCH /api/profiles failed', error as Error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// DELETE: remove profile metadata (does not cascade other tables here)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    if (!supabase) {
      await logger.warn('Supabase env missing on DELETE /api/profiles; noop success');
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      await logger.warn('Delete profile failed', { error: error.message });
      return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    await logger.error('DELETE /api/profiles failed', error as Error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}


