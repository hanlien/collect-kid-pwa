'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Target, Gift } from 'lucide-react';
import BigButton from '@/components/BigButton';
import Confetti from '@/components/Confetti';
import Toast from '@/components/Toast';

interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'animal' | 'bug' | 'flower';
  emoji: string;
  completed: boolean;
  reward: number;
}

export default function QuestPage() {
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stars, setStars] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = () => {
    // Load from localStorage or generate new quests
    const storedQuests = localStorage.getItem('quests');
    const storedStars = localStorage.getItem('stars');
    
    if (storedQuests) {
      setQuests(JSON.parse(storedQuests));
    } else {
      generateDailyQuests();
    }
    
    if (storedStars) {
      setStars(parseInt(storedStars));
    }
  };

  const generateDailyQuests = () => {
    const today = new Date().toDateString();
    const lastQuestDate = localStorage.getItem('lastQuestDate');
    
    if (lastQuestDate === today) {
      // Load existing quests for today
      const storedQuests = localStorage.getItem('quests');
      if (storedQuests) {
        setQuests(JSON.parse(storedQuests));
        return;
      }
    }

    // Generate new daily quests
    const newQuests: Quest[] = [
      {
        id: '1',
        title: 'Find something yellow',
        description: 'Scan a yellow flower or animal',
        category: 'flower',
        emoji: '🌻',
        completed: false,
        reward: 5,
      },
      {
        id: '2',
        title: 'Find a flyer',
        description: 'Scan a bird or butterfly',
        category: 'animal',
        emoji: '🦋',
        completed: false,
        reward: 10,
      },
      {
        id: '3',
        title: 'Find a tiny friend',
        description: 'Scan a small bug or insect',
        category: 'bug',
        emoji: '🐛',
        completed: false,
        reward: 8,
      },
    ];

    setQuests(newQuests);
    localStorage.setItem('quests', JSON.stringify(newQuests));
    localStorage.setItem('lastQuestDate', today);
  };

  const claimQuest = (questId: string) => {
    const updatedQuests = quests.map(quest => {
      if (quest.id === questId && !quest.completed) {
        const newStars = stars + quest.reward;
        setStars(newStars);
        localStorage.setItem('stars', newStars.toString());
        
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        setToast({
          message: `+${quest.reward} stars! Great job!`,
          type: 'success',
        });
        
        return { ...quest, completed: true };
      }
      return quest;
    });
    
    setQuests(updatedQuests);
    localStorage.setItem('quests', JSON.stringify(updatedQuests));
  };

  const completedQuests = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;

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
          <Target className="w-5 h-5" />
          Daily Quest
        </h1>
        
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-yellow-600">{stars}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Today&apos;s Progress</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {completedQuests}/{totalQuests}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stars}
              </div>
              <div className="text-sm text-gray-600">Stars</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedQuests / totalQuests) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quests */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Today&apos;s Challenges</h2>
        
        <div className="space-y-4">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`card p-4 transition-all ${
                quest.completed ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{quest.emoji}</div>
                  <div>
                    <h3 className="font-bold text-gray-800">{quest.title}</h3>
                    <p className="text-sm text-gray-600">{quest.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-yellow-600">{quest.reward}</span>
                  </div>
                  
                  {quest.completed ? (
                    <div className="text-green-600 text-sm font-medium">✓ Completed!</div>
                  ) : (
                    <BigButton
                      onClick={() => claimQuest(quest.id)}
                      variant="primary"
                      size="sm"
                    >
                      <Gift className="w-4 h-4 mr-1" />
                      Claim
                    </BigButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        <BigButton
          onClick={() => router.push('/scan')}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          Start Scanning
        </BigButton>
        <BigButton
          onClick={() => router.push('/book')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          View Collection
        </BigButton>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
