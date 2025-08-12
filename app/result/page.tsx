'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, Heart, ArrowLeft, RotateCcw, Star, MapPin, Calendar, Users, Award, BookOpen } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'info' | 'facts' | 'colors'>('info');

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
          speciesResult: result,
        }),
      });

      if (response.ok) {
        setShowConfetti(true);
        setToast({
          message: 'Added to your collection! 🎉',
          type: 'success',
        });
        
        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        throw new Error('Failed to collect');
      }
    } catch (error) {
      console.error('Collection error:', error);
      setToast({
        message: 'Failed to add to collection. Please try again!',
        type: 'error',
      });
    } finally {
      setIsCollecting(false);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin-slow">
          <RotateCcw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  const isDangerous = isDangerousSpecies(result);
  const categoryEmoji = {
    flower: '🌸',
    bug: '🦋',
    animal: '🐾',
  }[result.category];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200 rounded-full opacity-10 animate-float"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-blue-200 rounded-full opacity-10 animate-float delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <BigButton
            onClick={() => router.push('/scan')}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </BigButton>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-800">Discovery</h1>
            <p className="text-sm text-gray-500">Found something amazing!</p>
          </div>
          
          <BigButton
            onClick={() => router.push('/scan')}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Scan Again</span>
          </BigButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Species Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Image Section */}
          <div className="relative h-64 bg-gradient-to-br from-green-100 to-blue-100">
            {result.wiki?.imageUrl ? (
              <img
                src={result.wiki.imageUrl}
                alt={result.commonName || result.canonicalName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-8xl">{categoryEmoji}</div>
              </div>
            )}
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
              <span className="text-2xl">{categoryEmoji}</span>
              <span className="font-semibold text-gray-800 capitalize">{result.category}</span>
            </div>
            
            {/* Confidence Badge */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="font-semibold text-green-600">
                {Math.round(result.confidence * 100)}% match
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {result.commonName || result.canonicalName}
              </h2>
              <p className="text-gray-600 italic">{result.canonicalName}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'info', label: 'Info', icon: Star },
                { id: 'facts', label: 'Facts', icon: Award },
                { id: 'colors', label: 'Colors', icon: MapPin },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">🔬</div>
                      <div className="text-sm text-gray-500">Rank</div>
                      <div className="font-semibold text-gray-800 capitalize">{result.rank || 'Unknown'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-sm text-gray-500">Confidence</div>
                      <div className="font-semibold text-gray-800">{Math.round(result.confidence * 100)}%</div>
                    </div>
                  </div>
                  
                  {facts?.summary && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        About this species
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{facts.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'facts' && (
                <div className="space-y-4">
                  {facts?.funFacts ? (
                    facts.funFacts.map((fact: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-l-4 border-yellow-400">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">💡</div>
                          <p className="text-gray-700 text-sm leading-relaxed">{fact}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🤔</div>
                      <p>Facts coming soon!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Dominant Colors</h4>
                  {result.ui?.colorChips && result.ui.colorChips.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {result.ui.colorChips.map((color, index) => (
                        <div
                          key={index}
                          className="w-16 h-16 rounded-xl shadow-md"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🎨</div>
                      <p>No color data available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Safety Warning */}
        {isDangerous && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-semibold text-red-800">Safety Notice</h4>
                <p className="text-red-700 text-sm">Look, don&apos;t touch! This species might be dangerous.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <BigButton
            onClick={handleSpeak}
            disabled={isSpeaking}
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2 py-4"
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
          </BigButton>
          
          <BigButton
            onClick={handleCollect}
            disabled={isCollecting}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
          >
            <Heart className={`w-5 h-5 ${isCollecting ? 'animate-pulse' : ''}`} />
            <span>{isCollecting ? 'Collecting...' : 'Collect'}</span>
          </BigButton>
        </div>
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
