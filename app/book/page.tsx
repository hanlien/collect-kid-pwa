'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, BookOpen } from 'lucide-react';
import BigButton from '@/components/BigButton';
import Badge from '@/components/Badge';
import ProfileManager from '@/lib/profileManager';
import { Capture, Badge as BadgeType } from '@/types/profile';

type TabType = 'animals' | 'bugs' | 'flowers';

export default function BookPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('animals');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = async () => {
    try {
      const profileManager = ProfileManager.getInstance();
      const currentProfile = profileManager.getCurrentProfile();
      
      if (!currentProfile) {
        setIsLoading(false);
        return;
      }

      // Load captures and badges from profile
      const profileCaptures = profileManager.getCaptures();
      const profileBadges = profileManager.getBadges();

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

  const filteredCaptures = captures.filter(capture => {
    if (activeTab === 'animals') return capture.category === 'animal';
    if (activeTab === 'bugs') return capture.category === 'bug';
    if (activeTab === 'flowers') return capture.category === 'flower';
    return false;
  });

  const filteredBadges = badges.filter(badge => {
    if (activeTab === 'animals') return badge.category === 'animal';
    if (activeTab === 'bugs') return badge.category === 'bug';
    if (activeTab === 'flowers') return badge.category === 'flower';
    return false;
  });

  const tabs: { id: TabType; label: string; emoji: string }[] = [
    { id: 'animals', label: 'Animals', emoji: '🐦' },
    { id: 'bugs', label: 'Bugs', emoji: '🦋' },
    { id: 'flowers', label: 'Flowers', emoji: '🌸' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin-slow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 safe-area-top safe-area-bottom">
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
              {filteredBadges.length}
            </div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredBadges.filter(b => b.level === 3).length}
            </div>
            <div className="text-sm text-gray-600">Gold</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {filteredBadges.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Badges
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <div key={badge.id} className="text-center">
                <Badge
                  level={badge.level}
                  count={badge.count}
                  className="mx-auto mb-2"
                />
                <div className="text-xs text-gray-600 capitalize">
                  {badge.subtype}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Captures Grid */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Discoveries
        </h2>
        
        {filteredCaptures.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">
              {getCategoryEmoji(activeTab === 'animals' ? 'animal' : activeTab === 'bugs' ? 'bug' : 'flower')}
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No {getCategoryName(activeTab === 'animals' ? 'animal' : activeTab === 'bugs' ? 'bug' : 'flower')} found yet!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Go out and scan some {activeTab} to start your collection!
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
                  <div className="text-3xl mb-2">
                    {getCategoryEmoji(capture.category)}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm mb-1">
                    {capture.commonName || capture.canonicalName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(capture.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
