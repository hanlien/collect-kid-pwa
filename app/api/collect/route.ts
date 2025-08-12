import { NextRequest, NextResponse } from 'next/server';
import { collectRequestSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { getBadgeSubtype, getBadgeLevel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, result: speciesResult } = collectRequestSchema.parse(body);

    // Check if this is a new species for this user
    const { data: existingCaptures } = await supabaseAdmin
      .from('captures')
      .select('canonical_name')
      .eq('user_id', userId)
      .eq('canonical_name', speciesResult.canonicalName);

    const isNewSpecies = existingCaptures.length === 0;
    const coinsEarned = isNewSpecies ? 50 : 10; // 50 coins for new species, 10 for duplicates

    // Insert capture with enhanced data
    const { data: capture, error: captureError } = await supabaseAdmin
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

    if (captureError) {
      console.error('Capture insert error:', captureError);
      return NextResponse.json(
        { error: 'Failed to save capture' },
        { status: 500 }
      );
    }

    // Update user coins and stats
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('coins, total_captures, unique_species_count')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const newCoins = (user.coins || 0) + coinsEarned;
    const newTotalCaptures = (user.total_captures || 0) + 1;
    const newUniqueSpeciesCount = isNewSpecies 
      ? (user.unique_species_count || 0) + 1 
      : (user.unique_species_count || 0);

    // Calculate new level based on unique species count
    const newLevel = Math.floor(newUniqueSpeciesCount / 10) + 1;

    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({
        coins: newCoins,
        total_captures: newTotalCaptures,
        unique_species_count: newUniqueSpeciesCount,
        level: newLevel,
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateUserError) {
      console.error('User update error:', updateUserError);
      return NextResponse.json(
        { error: 'Failed to update user data' },
        { status: 500 }
      );
    }

    // Determine badge subtype and handle badges
    const labels = [speciesResult.canonicalName, speciesResult.commonName].filter(Boolean);
    const subtype = getBadgeSubtype(labels, speciesResult.category);

    // Get or create badge
    const { data: existingBadge } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .eq('category', speciesResult.category)
      .eq('subtype', subtype)
      .single();

    const newCount = (existingBadge?.count || 0) + 1;
    const newBadgeLevel = getBadgeLevel(newCount);
    const nextGoal = newBadgeLevel === 1 ? 3 : newBadgeLevel === 2 ? 7 : 15;

    let badge;
    let leveledUp = false;

    if (existingBadge) {
      // Update existing badge
      const { data: updatedBadge, error: updateError } = await supabaseAdmin
        .from('badges')
        .update({
          count: newCount,
          level: newBadgeLevel,
          next_goal: nextGoal,
        })
        .eq('id', existingBadge.id)
        .select()
        .single();

      if (updateError) {
        console.error('Badge update error:', updateError);
      } else {
        badge = updatedBadge;
        leveledUp = newBadgeLevel > existingBadge.level;
      }
    } else {
      // Create new badge
      const { data: newBadge, error: createError } = await supabaseAdmin
        .from('badges')
        .insert({
          user_id: userId,
          category: speciesResult.category,
          subtype,
          level: 1,
          count: 1,
          next_goal: 3,
        })
        .select()
        .single();

      if (createError) {
        console.error('Badge create error:', createError);
      } else {
        badge = newBadge;
        leveledUp = true;
      }
    }

    // Check for achievements
    const achievements = [];

    // First species achievement
    if (newUniqueSpeciesCount === 1) {
      const { data: firstSpeciesAchievement } = await supabaseAdmin
        .from('achievements')
        .insert({
          user_id: userId,
          type: 'first_species',
          title: 'First Discovery!',
          description: 'Found your first species',
          coins_rewarded: 100,
          icon: '🌟',
        })
        .select()
        .single();
      
      if (firstSpeciesAchievement) {
        achievements.push(firstSpeciesAchievement);
        // Add bonus coins
        await supabaseAdmin
          .from('users')
          .update({ coins: newCoins + 100 })
          .eq('id', userId);
      }
    }

    // Level up achievement
    if (newLevel > (user.level || 1)) {
      const { data: levelUpAchievement } = await supabaseAdmin
        .from('achievements')
        .insert({
          user_id: userId,
          type: `level_${newLevel}`,
          title: `Level ${newLevel} Explorer!`,
          description: `Reached level ${newLevel}`,
          coins_rewarded: newLevel * 50,
          icon: '🏆',
        })
        .select()
        .single();
      
      if (levelUpAchievement) {
        achievements.push(levelUpAchievement);
        // Add bonus coins
        await supabaseAdmin
          .from('users')
          .update({ coins: newCoins + (newLevel * 50) })
          .eq('id', userId);
      }
    }

    // Category completion achievements
    const { data: categoryCounts } = await supabaseAdmin
      .from('captures')
      .select('category')
      .eq('user_id', userId)
      .eq('is_new_species', true);

    const categoryTotals = categoryCounts?.reduce((acc, capture) => {
      acc[capture.category] = (acc[capture.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    for (const [category, count] of Object.entries(categoryTotals)) {
      if (count === 5) {
        const { data: categoryAchievement } = await supabaseAdmin
          .from('achievements')
          .insert({
            user_id: userId,
            type: `${category}_collector`,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Collector!`,
            description: `Found 5 different ${category}s`,
            coins_rewarded: 200,
            icon: category === 'flower' ? '🌸' : category === 'bug' ? '🦋' : '🐾',
          })
          .select()
          .single();
        
        if (categoryAchievement) {
          achievements.push(categoryAchievement);
        }
      }
    }

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
