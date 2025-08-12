import { NextRequest, NextResponse } from 'next/server';
import { collectRequestSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { getBadgeSubtype, getBadgeLevel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, result } = collectRequestSchema.parse(body);

    // Insert capture
    const { data: capture, error: captureError } = await supabaseAdmin
      .from('captures')
      .insert({
        user_id: userId,
        category: result.category,
        provider: result.provider,
        canonical_name: result.canonicalName,
        common_name: result.commonName,
        rank: result.rank,
        confidence: result.confidence,
        gbif_key: result.gbifKey,
        thumb_url: result.wiki?.imageUrl,
      })
      .select()
      .single();

    if (captureError) {
      console.error('Capture insert error:', captureError);
      return NextResponse.json(
        { error: 'Failed to save capture' },
        { status: 500 }
      );
    }

    // Determine badge subtype from labels (simplified for MVP)
    const labels = [result.canonicalName, result.commonName].filter(Boolean);
    const subtype = getBadgeSubtype(labels, result.category);

    // Get or create badge
    const { data: existingBadge } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .eq('category', result.category)
      .eq('subtype', subtype)
      .single();

    const newCount = (existingBadge?.count || 0) + 1;
    const newLevel = getBadgeLevel(newCount);

    if (existingBadge) {
      // Update existing badge
      const { data: updatedBadge, error: updateError } = await supabaseAdmin
        .from('badges')
        .update({
          count: newCount,
          level: newLevel,
        })
        .eq('id', existingBadge.id)
        .select()
        .single();

      if (updateError) {
        console.error('Badge update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update badge' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        capture,
        badge: updatedBadge,
        level: newLevel,
        nextGoal: newLevel === 1 ? 3 : newLevel === 2 ? 7 : null,
        leveledUp: newLevel > existingBadge.level,
      });
    } else {
      // Create new badge
      const { data: newBadge, error: createError } = await supabaseAdmin
        .from('badges')
        .insert({
          user_id: userId,
          category: result.category,
          subtype,
          level: 1,
          count: 1,
        })
        .select()
        .single();

      if (createError) {
        console.error('Badge create error:', createError);
        return NextResponse.json(
          { error: 'Failed to create badge' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        capture,
        badge: newBadge,
        level: 1,
        nextGoal: 3,
        leveledUp: true,
      });
    }
  } catch (error) {
    console.error('Collect API error:', error);
    return NextResponse.json(
      { error: 'Failed to collect item' },
      { status: 500 }
    );
  }
}
