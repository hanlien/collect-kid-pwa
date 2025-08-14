'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, Heart, ArrowLeft, RotateCcw, Star, MapPin, Award, BookOpen, Bookmark, Target } from 'lucide-react';
import Image from 'next/image';
import BigButton from '@/components/BigButton';
// import ColorChips from '@/components/ColorChips'; // TODO: Use when needed
import Toast from '@/components/Toast';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const LazyBadgePopup = dynamic(() => import('@/components/lazy/LazyBadgePopup'), { ssr: false });
const LazyConfetti = dynamic(() => import('@/components/lazy/LazyConfetti'), { ssr: false });
import { isDangerousSpecies } from '@/lib/utils';
import ProfileManager from '@/lib/profileManager';
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
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [badgeData, setBadgeData] = useState<{ speciesName: string; category: string; imageUrl?: string } | null>(null);
  const [showAccuracyFeedback, setShowAccuracyFeedback] = useState(false);
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [correctionInput, setCorrectionInput] = useState('');

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedResult = JSON.parse(decodeURIComponent(data));
        
        // If capturedImageUrl is an ID, retrieve the actual image from sessionStorage
        if (parsedResult.capturedImageUrl && parsedResult.capturedImageUrl.startsWith('captured-image-')) {
          const actualImageUrl = sessionStorage.getItem(parsedResult.capturedImageUrl);
          if (actualImageUrl) {
            parsedResult.capturedImageUrl = actualImageUrl;
          }
        }
        
        setResult(parsedResult);
        fetchFacts(parsedResult);
        
        // Don't automatically show feedback - user should click feedback button
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

    // Create more natural, engaging text like Grok's style
    const speciesName = result.commonName || result.canonicalName;
    const summary = facts?.summary || 'This is a fascinating creature!';
    
    // Make it more welcoming and natural
    const text = `Hey there! Check out this amazing ${speciesName}! ${summary} Nature is absolutely incredible, don't you think?`;
    
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      // Get available voices and select the most natural one
      const voices = window.speechSynthesis.getVoices();
      
      // Priority list for natural, welcoming voices (similar to Grok's style)
      const preferredVoices = [
        // iOS/macOS natural voices
        'Samantha', 'Alex', 'Victoria', 'Allison', 'Ava', 'Susan', 'Karen',
        // Google's natural voices
        'Google US English', 'Google UK English Female', 'Google UK English Male',
        // Windows natural voices
        'Microsoft Zira', 'Microsoft David', 'Microsoft Hazel',
        // Other high-quality voices
        'Eloquence', 'Reed', 'Sandy', 'Tessa'
      ];
      
      let selectedVoice = null;
      
      // Try to find the best natural voice
      for (const preferredName of preferredVoices) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en') && 
          voice.name.includes(preferredName)
        );
        if (selectedVoice) break;
      }
      
      // Fallback to any good English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en') && 
          !voice.name.includes('eSpeak') && // Avoid robotic voices
          !voice.name.includes('Festival')
        ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Grok-like voice settings: natural, warm, and engaging
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name);
      }
      utterance.rate = 0.85; // Slightly slower for clarity and warmth
      utterance.pitch = 1.1; // Slightly higher for friendliness
      utterance.volume = 0.95; // Clear but not overwhelming
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAccuracyFeedback = async (isCorrect: boolean, correction?: string) => {
    if (!result) return;

    console.log('handleAccuracyFeedback called:', { isCorrect, correction });

    try {
      // Send feedback to training data
      const response = await fetch('/api/training-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: result.capturedImageUrl || null, // Handle blob URLs gracefully
          originalResult: {
            category: result.category,
            canonicalName: result.canonicalName,
            commonName: result.commonName,
            confidence: result.confidence,
          },
          isCorrect,
          correction: correction || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('Feedback response status:', response.status);
      const responseData = await response.json();
      console.log('Feedback response data:', responseData);
      
      if (response.ok) {
        let message = '';
        if (isCorrect) {
          message = '🎉 Great! Brandon\'s AI learned from your confirmation!';
        } else if (correction) {
          message = '🚀 Amazing! You just taught Brandon\'s AI something new!';
        } else {
          message = '✅ Thanks! Brandon\'s AI noted this was incorrect.';
        }
        
        setToast({
          message,
          type: 'success',
        });
        setShowAccuracyFeedback(false);
        setShowCorrectionInput(false);
        setCorrectionInput('');
      } else {
        console.error('Feedback API error:', responseData);
        setToast({
          message: `Feedback failed: ${responseData.error || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setToast({
        message: 'Failed to send feedback. Please try again!',
        type: 'error',
      });
    }
  };

  const handleCollect = async () => {
    if (!result) return;

    console.log('Starting collection process...');
    console.log('Result to collect:', result);

    try {
      setIsCollecting(true);

      // Use profile manager instead of simple user ID
      const profileManager = ProfileManager.getInstance();
      const currentProfile = profileManager.getCurrentProfile();
      console.log('Current profile for collection:', currentProfile);
      
      // Test ProfileManager functionality
      console.log('Testing ProfileManager - current captures:', profileManager.getCaptures());
      console.log('Testing ProfileManager - current badges:', profileManager.getBadges());

      const requestBody = {
        userId: currentProfile.id,
        result: result,
      };
      console.log('Sending collect request:', requestBody);

      const response = await fetch('/api/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Collect response status:', response.status);

      const data = await response.json();
      console.log('Collect API response data:', JSON.stringify(data, null, 2));
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        setShowConfetti(true);
        
        console.log('About to update profile with data:', data);
        
        // Save capture to ProfileManager
        if (data.capture) {
          console.log('Saving capture to ProfileManager:', data.capture);
          profileManager.addCapture(data.capture);
        }
        
        // Save badge to ProfileManager
        if (data.badge) {
          console.log('Saving badge to ProfileManager:', data.badge);
          profileManager.addBadge(data.badge);
        }
        
        // Update profile stats
        profileManager.updateProfile(currentProfile.id, {
          coins: data.newTotalCoins,
          level: data.newLevel,
          totalCaptures: data.userStats.totalCaptures,
          uniqueSpeciesCount: data.userStats.uniqueSpeciesCount,
        });

        // Debug: Check what's in the profile after update
        console.log('Profile after update:', profileManager.getCurrentProfile());
        console.log('Captures after update:', profileManager.getCaptures());
        console.log('Badges after update:', profileManager.getBadges());

        // Show badge popup for new species
        if (data.badge) {
          setBadgeData({
            speciesName: result.commonName || result.canonicalName,
            category: result.category,
            imageUrl: result.capturedImageUrl || '',
          });
          setShowBadgePopup(true);
        }

        // Show success message with coin reward
        const coinMessage = `New species! +${data.coinsEarned} $BRANDON coins! 🎉`;
        
        setToast({
          message: coinMessage,
          type: 'success',
        });
        
        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        console.log('Collection failed with status:', response.status);
        console.log('Error response data:', JSON.stringify(data, null, 2));
        
        if (data.alreadyCollected) {
          setToast({
            message: 'Species already collected!',
            type: 'error',
          });
        } else {
          throw new Error('Failed to collect');
        }
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
    unknown: '❓',
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
          {/* Back button - subtle header navigation */}
          <button
            onClick={() => router.push('/scan')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white/80 hover:text-gray-900 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          {/* Title section */}
          <div className="text-center flex-1 mx-4">
            <h1 className="text-lg font-semibold text-gray-800">Discovery</h1>
            <p className="text-sm text-gray-500">Found something amazing!</p>
          </div>
          
          {/* Scan again button - subtle header navigation */}
          <button
            onClick={() => router.push('/scan')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 transition-all duration-200 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Scan</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Species Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Image Section */}
          <div className="relative h-64 bg-gradient-to-br from-green-100 to-blue-100">
            {result.capturedImageUrl ? (
              <Image
                src={result.capturedImageUrl}
                alt={result.commonName || result.canonicalName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : result.wiki?.imageUrl ? (
              <Image
                src={result.wiki.imageUrl}
                alt={result.commonName || result.canonicalName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
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
                  
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">
                      {result.provider === 'inaturalist' ? '🌿' : 
                       result.provider === 'plantid' ? '🌱' : 
                       result.provider === 'gcv' ? '🔍' : '🤖'}
                    </div>
                    <div className="text-sm text-gray-500">AI Engine</div>
                    <div className="font-semibold text-gray-800">
                      {result.provider === 'inaturalist' ? 'iNaturalist' : 
                       result.provider === 'plantid' ? 'Plant.id' : 
                       result.provider === 'gcv' ? 'Google Vision' : 'Brandon\'s AI'}
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
        <div className="flex gap-4 mb-4">
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

        {/* Feedback Button */}
        <div className="flex gap-4 mb-4">
          <BigButton
            onClick={() => setShowAccuracyFeedback(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600"
          >
            <Target className="w-5 h-5" />
            <span>Train Brandon&apos;s AI</span>
          </BigButton>
        </div>

        {/* Collection Button */}
        <BigButton
          onClick={() => router.push('/book')}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white"
        >
          <Bookmark className="w-5 h-5" />
          <span>View My Collection</span>
        </BigButton>
      </div>

      {/* Confetti */}
      <LazyConfetti trigger={showConfetti} />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Badge Popup */}
      {badgeData && (
        <LazyBadgePopup
          isOpen={showBadgePopup}
          onClose={() => setShowBadgePopup(false)}
          onNavigate={() => {
            setShowBadgePopup(false);
            router.push('/book');
          }}
          speciesName={badgeData.speciesName}
          category={badgeData.category}
          imageUrl={badgeData.imageUrl || ''}
        />
      )}

      {/* Accuracy Feedback Modal */}
      {showAccuracyFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border-4 border-purple-500 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Help Train Brandon&apos;s AI!
              </h3>
              <p className="text-purple-600 font-semibold text-sm mb-2">
                Your feedback helps make our AI smarter! 🧠✨
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <p className="text-gray-700 text-sm">
                We identified: <strong className="text-purple-700">{result?.commonName || result?.canonicalName}</strong>
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleAccuracyFeedback(true)}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                ✅ Yes, perfect! Help AI learn this!
              </button>
              
              <button
                onClick={() => setShowCorrectionInput(true)}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                🔧 No, let me teach the AI the right answer
              </button>
              
              <button
                onClick={() => handleAccuracyFeedback(false)}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                ❌ No, that&apos;s wrong (mark as incorrect)
              </button>
            </div>

            {showCorrectionInput && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-2xl mb-1">🎓</div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Teach Brandon&apos;s AI the correct answer!
                  </label>
                </div>
                <input
                  type="text"
                  value={correctionInput}
                  onChange={(e) => setCorrectionInput(e.target.value)}
                  placeholder="Enter the correct species name..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccuracyFeedback(false, correctionInput)}
                    disabled={!correctionInput.trim()}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    🚀 Train AI with this!
                  </button>
                  <button
                    onClick={() => {
                      setCorrectionInput('');
                      setShowCorrectionInput(false);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowAccuracyFeedback(false)}
              className="mt-4 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
            >
              Maybe later (Skip for now)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
