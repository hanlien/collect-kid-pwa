import { NextRequest, NextResponse } from 'next/server';
import { collectRequestSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { getBadgeSubtype, getBadgeLevel } from '@/lib/utils';
import ProfileManager from '@/lib/profileManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, result: speciesResult } = collectRequestSchema.parse(body);

    // Use ProfileManager to check if this is a new species
    const profileManager = ProfileManager.getInstance();
    const currentProfile = profileManager.getCurrentProfile();
    
    // Check if this is a new species for this profile
    const existingCaptures = profileManager.getCaptures();
    const isNewSpecies = !existingCaptures.some(capture => 
      capture.canonicalName === speciesResult.canonicalName
    );
    const coinsEarned = isNewSpecies ? 50 : 10; // 50 coins for new species, 10 for duplicates

    // Calculate new stats based on current profile
    const newCoins = currentProfile.coins + coinsEarned;
    const newTotalCaptures = currentProfile.totalCaptures + 1;
    const newUniqueSpeciesCount = isNewSpecies 
      ? currentProfile.uniqueSpeciesCount + 1 
      : currentProfile.uniqueSpeciesCount;

    // Calculate new level based on unique species count
    const newLevel = Math.floor(newUniqueSpeciesCount / 10) + 1;

    // Skip badges for now
    let badge: any = null;
    let leveledUp = false;
    let achievements: any[] = [];

    // Update profile stats
    profileManager.updateProfile(currentProfile.id, {
      coins: newCoins,
      level: newLevel,
      totalCaptures: newTotalCaptures,
      uniqueSpeciesCount: newUniqueSpeciesCount,
    });

    // Add capture to profile collection
    const newCapture = profileManager.addCapture({
      category: speciesResult.category,
      provider: speciesResult.provider,
      canonicalName: speciesResult.canonicalName,
      commonName: speciesResult.commonName,
      rank: speciesResult.rank,
      confidence: speciesResult.confidence,
      gbifKey: speciesResult.gbifKey,
      thumbUrl: speciesResult.wiki?.imageUrl,
      createdAt: new Date().toISOString(),
      summary: speciesResult.wiki?.summary,
      funFacts: speciesResult.ui?.funFacts,
      colorChips: speciesResult.ui?.colorChips,
      coinsEarned: coinsEarned,
      isNewSpecies: isNewSpecies,
      capturedImageUrl: speciesResult.capturedImageUrl,
    });

    return NextResponse.json({
      capture: newCapture,
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
