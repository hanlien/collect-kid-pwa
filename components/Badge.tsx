'use client';

import { useEffect, useState } from 'react';

interface BadgeProps {
  level: number;
  count: number;
  nextGoal?: number;
  leveledUp?: boolean;
  className?: string;
}

export default function Badge({ level, count, nextGoal, leveledUp = false, className = '' }: BadgeProps) {
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (leveledUp) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [leveledUp]);

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { name: 'Bronze', color: 'bronze', emoji: '🥉' };
      case 2:
        return { name: 'Silver', color: 'silver', emoji: '🥈' };
      case 3:
        return { name: 'Gold', color: 'gold', emoji: '🥇' };
      default:
        return { name: 'Bronze', color: 'bronze', emoji: '🥉' };
    }
  };

  const levelInfo = getLevelInfo(level);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Badge container */}
      <div className="relative w-16 h-16 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center">
        {/* Level ring */}
        <div className={`badge-ring ${levelInfo.color} ${showSparkles ? 'animate-pulse' : ''}`} />
        
        {/* Badge content */}
        <div className="relative z-10 text-center">
          <div className="text-2xl">{levelInfo.emoji}</div>
          <div className="text-xs font-bold text-gray-600">{level}</div>
        </div>

        {/* Sparkles animation */}
        {showSparkles && (
          <>
            <div className="sparkle top-0 left-1/2 transform -translate-x-1/2" />
            <div className="sparkle top-1/2 right-0 transform translate-y-1/2" />
            <div className="sparkle bottom-0 left-1/2 transform -translate-x-1/2" />
            <div className="sparkle top-1/2 left-0 transform -translate-y-1/2" />
            <div className="sparkle top-1/4 right-1/4" />
            <div className="sparkle bottom-1/4 left-1/4" />
          </>
        )}
      </div>

      {/* Progress indicator */}
      {nextGoal && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 text-center">
          {count}/{nextGoal}
        </div>
      )}
    </div>
  );
}
