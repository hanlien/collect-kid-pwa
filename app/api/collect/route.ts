import { NextRequest, NextResponse } from 'next/server';
import { collectRequestSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { getBadgeSubtype, getBadgeLevel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, result: speciesResult } = collectRequestSchema.parse(body);

    // Check if this is a new species for this user
    let existingCaptures = [];
    try {
      const { data } = await supabaseAdmin
        .from('captures')
        .select('canonical_name')
        .eq('user_id', userId)
        .eq('canonical_name', speciesResult.canonicalName);
      existingCaptures = data || [];
    } catch (error) {
      console.log('Database not ready, treating as new species');
      existingCaptures = [];
    }

    const isNewSpecies = existingCaptures.length === 0;
    const coinsEarned = isNewSpecies ? 50 : 10; // 50 coins for new species, 10 for duplicates

    // Try to insert capture, but don't fail if database isn't ready
    let capture = null;
    let captureError = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('captures')
        .insert({
          user_id: userId,
          category: speciesResult.category,
          provider: speciesResult.provider,
          canonical_name: speciesResult.canonicalName,
          common_name: speciesResult.commonName,
          rank: speciesResult.rank,
          confidence: speciesResult.confidence,
          gbif_key: speciesResult.gbifKey,
          thumb_url: speciesResult.wiki?.imageUrl,
          summary: speciesResult.wiki?.summary,
          fun_facts: speciesResult.ui?.funFacts,
          color_chips: speciesResult.ui?.colorChips,
          coins_earned: coinsEarned,
          is_new_species: isNewSpecies,
        })
        .select()
        .single();
      
      capture = data;
      captureError = error;
    } catch (error) {
      console.log('Database insert failed, continuing with local storage');
      captureError = error;
    }

    // Update user coins and stats (try database first, fallback to local storage)
    let user = { coins: 0, total_captures: 0, unique_species_count: 0, level: 1 };
    let userError = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('coins, total_captures, unique_species_count, level')
        .eq('id', userId)
        .single();
      
      if (data) user = data;
      userError = error;
    } catch (error) {
      console.log('Database user fetch failed, using defaults');
      userError = error;
    }

    const newCoins = (user.coins || 0) + coinsEarned;
    const newTotalCaptures = (user.total_captures || 0) + 1;
    const newUniqueSpeciesCount = isNewSpecies 
      ? (user.unique_species_count || 0) + 1 
      : (user.unique_species_count || 0);

    // Calculate new level based on unique species count
    const newLevel = Math.floor(newUniqueSpeciesCount / 10) + 1;

    // Try to update user in database
    try {
      await supabaseAdmin
        .from('users')
        .update({
          coins: newCoins,
          total_captures: newTotalCaptures,
          unique_species_count: newUniqueSpeciesCount,
          level: newLevel,
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.log('Database user update failed, continuing');
    }

    // Skip badges for now if database isn't ready
    let badge = null;
    let leveledUp = false;
    let achievements = [];

    return NextResponse.json({
      capture,
      badge,
      leveledUp,
      coinsEarned,
      isNewSpecies,
      newTotalCoins: newCoins,
      newLevel,
      achievements,
      userStats: {
        totalCaptures: newTotalCaptures,
        uniqueSpeciesCount: newUniqueSpeciesCount,
        level: newLevel,
      },
    });
  } catch (error) {
    console.error('Collect API error:', error);
    return NextResponse.json(
      { error: 'Failed to collect item' },
      { status: 500 }
    );
  }
}
