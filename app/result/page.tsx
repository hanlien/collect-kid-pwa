'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, Heart, ArrowLeft, RotateCcw } from 'lucide-react';
import BigButton from '@/components/BigButton';
import ColorChips from '@/components/ColorChips';
import Confetti from '@/components/Confetti';
import Toast from '@/components/Toast';
import { isDangerousSpecies } from '@/lib/utils';
import { SpeciesResult } from '@/types/species';

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<SpeciesResult | null>(null);
  const [facts, setFacts] = useState<any>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedResult = JSON.parse(decodeURIComponent(data));
        setResult(parsedResult);
        fetchFacts(parsedResult);
      } catch (error) {
        console.error('Failed to parse result data:', error);
        router.push('/scan');
      }
    } else {
      router.push('/scan');
    }
  }, [searchParams, router]);

  const fetchFacts = async (speciesResult: SpeciesResult) => {
    try {
      const response = await fetch(
        `/api/facts?canonicalName=${encodeURIComponent(speciesResult.canonicalName)}&gbifKey=${speciesResult.gbifKey || ''}`
      );
      
      if (response.ok) {
        const factsData = await response.json();
        setFacts(factsData);
        
        // Update result with facts
        setResult(prev => prev ? {
          ...prev,
          wiki: {
            summary: factsData.summary,
            imageUrl: factsData.imageUrl,
          },
          ui: {
            ...prev.ui,
            funFacts: factsData.funFacts,
          },
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch facts:', error);
    }
  };

  const handleSpeak = () => {
    if (!result) return;

    const text = `${result.commonName || result.canonicalName}. ${facts?.summary || 'This is a fascinating creature!'}`;
    
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCollect = async () => {
    if (!result) return;

    try {
      setIsCollecting(true);

      // Generate a simple user ID (in production, use proper auth)
      const userId = localStorage.getItem('userId') || crypto.randomUUID();
      localStorage.setItem('userId', userId);

      const response = await fetch('/api/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          result,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowConfetti(true);
        setToast({
          message: data.leveledUp ? 'Level up! 🎉' : 'Added to collection!',
          type: 'success',
        });
        
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        throw new Error('Failed to collect');
      }
    } catch (error) {
      console.error('Collect error:', error);
      setToast({
        message: 'Failed to save to collection',
        type: 'error',
      });
    } finally {
      setIsCollecting(false);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin-slow">Loading...</div>
      </div>
    );
  }

  const displayName = result.commonName || result.canonicalName;
  const isDangerous = isDangerousSpecies(result);

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
        
        <h1 className="text-xl font-bold text-gray-800">Discovery!</h1>
        
        <BigButton
          onClick={() => router.push('/scan')}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Scan Again
        </BigButton>
      </div>

      {/* Safety Warning */}
      {isDangerous && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-800">Look, don't touch!</h3>
              <p className="text-sm text-red-700">This creature might be dangerous. Keep your distance!</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Card */}
      <div className="card mb-6">
        {/* Image */}
        {result.wiki?.imageUrl && (
          <div className="mb-4">
            <img
              src={result.wiki.imageUrl}
              alt={displayName}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Name and Category */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{displayName}</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600 capitalize">{result.category}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">{result.provider}</span>
          </div>
        </div>

        {/* Color Chips */}
        {result.ui?.colorChips && (
          <ColorChips colors={result.ui.colorChips} className="mb-4" />
        )}

        {/* Fun Facts */}
        {result.ui?.funFacts && result.ui.funFacts.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-2">Fun Facts:</h3>
            <div className="space-y-2">
              {result.ui.funFacts.map((fact, index) => (
                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {fact}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {result.wiki?.summary && (
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-2">About:</h3>
            <p className="text-sm text-gray-600">{result.wiki.summary}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <BigButton
          onClick={handleSpeak}
          variant="outline"
          size="md"
          disabled={isSpeaking}
          className="flex-1"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          {isSpeaking ? 'Speaking...' : 'Speak'}
        </BigButton>

        <BigButton
          onClick={handleCollect}
          variant="primary"
          size="md"
          disabled={isCollecting}
          className="flex-1"
        >
          <Heart className="w-4 h-4 mr-2" />
          {isCollecting ? 'Collecting...' : 'Collect!'}
        </BigButton>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <BigButton
          onClick={() => router.push('/book')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          View Collection
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
