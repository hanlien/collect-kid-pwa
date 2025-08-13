'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, BookOpen } from 'lucide-react';
import Image from 'next/image';
import BigButton from '@/components/BigButton';
import Badge from '@/components/Badge';
import ProfileManager from '@/lib/profileManager';
import { Capture, Badge as BadgeType } from '@/types/profile';
import { ALL_BADGES, getAllBadgesForCategory, getBadgeDefinition } from '@/lib/badgeDefinitions';

type TabType = 'discoveries' | 'badges';
type DiscoveryCategory = 'all' | 'animal' | 'bug' | 'flower';

export default function BookPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('discoveries');
  const [discoveryCategory, setDiscoveryCategory] = useState<DiscoveryCategory>('all');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollection();
  }, []);

  // Refresh collection when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing collection...');
        loadCollection();
      }
    };

    const handleFocus = () => {
      console.log('Window focused, refreshing collection...');
      loadCollection();
    };

    // Also refresh when the page loads
    console.log('Book page loaded, refreshing collection...');
    loadCollection();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadCollection = async () => {
    try {
      console.log('Loading collection...');
      const profileManager = ProfileManager.getInstance();
      const currentProfile = profileManager.getCurrentProfile();
      
      console.log('Current profile:', currentProfile);
      
      if (!currentProfile) {
        console.log('No current profile found');
        setIsLoading(false);
        return;
      }

      // Load captures and badges from profile
      const profileCaptures = profileManager.getCaptures();
      const profileBadges = profileManager.getBadges();

      console.log('Profile captures:', profileCaptures);
      console.log('Profile badges:', profileBadges);

      setCaptures(profileCaptures);
      setBadges(profileBadges);
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'animal':
        return '🐦';
      case 'bug':
        return '🦋';
      case 'flower':
        return '🌸';
      default:
        return '❓';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'animal':
        return 'Animals';
      case 'bug':
        return 'Bugs';
      case 'flower':
        return 'Flowers';
      default:
        return 'Unknown';
    }
  };

  // Filter captures by discovery category
  const filteredCaptures = activeTab === 'discoveries' 
    ? discoveryCategory === 'all' 
      ? captures 
      : captures.filter(capture => capture.category === discoveryCategory)
    : [];
  const allPossibleBadges = ALL_BADGES; // Show all badges
  const userBadges = badges; // Show all user badges

  // Create a map of earned badges for quick lookup
  const earnedBadgesMap = new Map();
  userBadges.forEach(badge => {
    earnedBadgesMap.set(`${badge.category}-${badge.subtype}`, badge);
  });

  // Combine all possible badges with earned status
  const filteredBadges = allPossibleBadges.map(badgeDef => {
    const earnedBadge = earnedBadgesMap.get(`${badgeDef.category}-${badgeDef.subtype}`);
    return {
      ...badgeDef,
      isEarned: !!earnedBadge,
      earnedLevel: earnedBadge?.level || 0,
      earnedCount: earnedBadge?.count || 0,
    };
  });

  const tabs: { id: TabType; label: string; emoji: string }[] = [
    { id: 'discoveries', label: 'Discoveries', emoji: '📸' },
    { id: 'badges', label: 'Badges', emoji: '🏆' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin-slow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BigButton
          onClick={() => router.push('/scan')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </BigButton>
        
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Collection
        </h1>
        
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{tab.emoji}</span>
              <span className="text-sm">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {filteredCaptures.length}
            </div>
            <div className="text-sm text-gray-600">Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">
              {filteredBadges.filter(b => b.isEarned).length}
            </div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredBadges.filter(b => b.isEarned && b.earnedLevel === 3).length}
            </div>
            <div className="text-sm text-gray-600">Gold</div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'discoveries' ? (
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📸 Discoveries ({filteredCaptures.length})
          </h2>
          
          {/* Discovery Category Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All', emoji: '🌟', count: captures.length },
              { id: 'animal', label: 'Animals', emoji: '🐦', count: captures.filter(c => c.category === 'animal').length },
              { id: 'bug', label: 'Bugs', emoji: '🦋', count: captures.filter(c => c.category === 'bug').length },
              { id: 'flower', label: 'Flowers', emoji: '🌸', count: captures.filter(c => c.category === 'flower').length },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setDiscoveryCategory(category.id as DiscoveryCategory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  discoveryCategory === category.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm">{category.emoji}</span>
                <span className="text-sm">{category.label}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
          
          {filteredCaptures.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">📸</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No discoveries yet!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Go out and scan some creatures to start your collection!
              </p>
              <BigButton
                onClick={() => router.push('/scan')}
                variant="primary"
                size="md"
              >
                Start Scanning
              </BigButton>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCaptures.map((capture) => (
                <div key={capture.id} className="card p-4">
                  <div className="text-center">
                    {capture.capturedImageUrl ? (
                      <Image 
                        src={capture.capturedImageUrl} 
                        alt={capture.commonName || capture.canonicalName}
                        width={200}
                        height={96}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="text-3xl mb-2">
                        {getCategoryEmoji(capture.category)}
                      </div>
                    )}
                    <h3 className="font-medium text-gray-800 text-sm mb-1">
                      {capture.commonName || capture.canonicalName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(capture.createdAt).toLocaleDateString()}
                    </p>
                    <div className="text-xs text-gray-400 mt-1">
                      {capture.category} • {Math.round(capture.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Badges ({filteredBadges.filter(b => b.isEarned).length}/{filteredBadges.length})
          </h2>
          
          {filteredBadges.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🏆</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No badges available yet!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Start collecting species to earn badges!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredBadges.map((badge) => (
                <div key={badge.id} className={`text-center ${!badge.isEarned ? 'opacity-50' : ''}`}>
                  <div className={`relative ${!badge.isEarned ? 'grayscale' : ''}`}>
                    <Badge
                      level={badge.isEarned ? badge.earnedLevel : 1}
                      count={badge.earnedCount}
                      className="mx-auto mb-2"
                    />
                    {!badge.isEarned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-2xl">🔒</div>
                      </div>
                    )}
                  </div>
                  <div className={`text-xs capitalize ${badge.isEarned ? 'text-gray-600' : 'text-gray-400'}`}>
                    {badge.name}
                  </div>
                  <div className={`text-xs ${badge.isEarned ? 'text-gray-400' : 'text-gray-300'}`}>
                    {badge.isEarned ? `Level ${badge.earnedLevel}` : 'Locked'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        <BigButton
          onClick={() => router.push('/scan')}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          Scan More
        </BigButton>
        <BigButton
          onClick={() => router.push('/quest')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Daily Quest
        </BigButton>
      </div>
    </div>
  );
}
