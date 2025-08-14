import { NextRequest, NextResponse } from 'next/server';
import { collectRequestSchema } from '@/lib/validation';
import { getBadgeSubtype, getBadgeLevel } from '@/lib/utils';
import ProfileManager from '@/lib/profileManager';

export async function POST(request: NextRequest) {
  try {
    console.log('Collect API called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { userId, result: speciesResult } = collectRequestSchema.parse(body);
    console.log('Parsed request:', { userId, speciesResult });

    // Use ProfileManager to check if this is a new species
    const profileManager = ProfileManager.getInstance();
    const currentProfile = profileManager.getCurrentProfile();
    console.log('Current profile:', currentProfile);
    
    // Check if this is a new species for this profile
    const existingCaptures = profileManager.getCaptures();
    const isNewSpecies = !existingCaptures.some(capture => 
      capture.canonicalName === speciesResult.canonicalName
    );
    
    // Prevent duplicate collection - if already collected, return error
    if (!isNewSpecies) {
      return NextResponse.json(
        { error: 'Species already collected!', alreadyCollected: true },
        { status: 400 }
      );
    }
    
    const coinsEarned = 50; // Only 50 coins for new species, no duplicates allowed

    // Calculate new stats based on current profile
    const newCoins = currentProfile.coins + coinsEarned;
    const newTotalCaptures = currentProfile.totalCaptures + 1;
    const newUniqueSpeciesCount = isNewSpecies 
      ? currentProfile.uniqueSpeciesCount + 1 
      : currentProfile.uniqueSpeciesCount;

    // Calculate new level based on unique species count
    const newLevel = Math.floor(newUniqueSpeciesCount / 10) + 1;

    // Check if badge already exists for this species
    const existingBadges = profileManager.getBadges();
    const badgeSubtype = getBadgeSubtype([speciesResult.commonName, speciesResult.canonicalName], speciesResult.category);
    const existingBadge = existingBadges.find(b => 
      b.category === speciesResult.category && 
      b.subtype === badgeSubtype
    );

    console.log('Badge check:', {
      category: speciesResult.category,
      badgeSubtype,
      existingBadges: existingBadges.length,
      existingBadge: !!existingBadge,
      isNewSpecies
    });

    let badge: any = null;
    let leveledUp = false;
    let achievements: any[] = [];

    // Create badge for new species (since we already checked it's new above)
    if (isNewSpecies) {
      const badgeLevel = getBadgeLevel(1); // Level 1 for first capture
      
      console.log('Creating badge with data:', {
        category: speciesResult.category,
        subtype: badgeSubtype,
        level: badgeLevel,
        count: 1,
        nextGoal: 3
      });
      
      badge = profileManager.addBadge({
        category: speciesResult.category,
        subtype: badgeSubtype,
        level: badgeLevel,
        count: 1,
        nextGoal: 3, // Next goal is 3 for level 2
      });
      
      console.log('Created new badge:', badge);
      
      // Verify badge was saved
      const allBadges = profileManager.getBadges();
      console.log('All badges after creation:', allBadges);
    }

    // Create capture data (don't save to ProfileManager on server)
    const newCapture = {
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
    };

    // Create badge data (don't save to ProfileManager on server)
    const badgeData = isNewSpecies ? {
      category: speciesResult.category,
      subtype: badgeSubtype,
      level: getBadgeLevel(1),
      count: 1,
      nextGoal: 3,
    } : null;

    return NextResponse.json({
      capture: newCapture,
      badge: badgeData,
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
