'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Sparkles, Search, BookOpen, Trophy, Coins, Target } from 'lucide-react';
import BigButton from '@/components/BigButton';
import Toast from '@/components/Toast';
import { downscaleImage } from '@/lib/utils';
import { SpeciesResult, RecognitionHint } from '@/types/species';

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanRing, setShowScanRing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [userData, setUserData] = useState({
    coins: 0,
    level: 1,
    totalCaptures: 0,
    uniqueSpeciesCount: 0,
  });

  // Animated background elements
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load user data
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      // In a real app, fetch from API
      // For now, load from localStorage
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        setUserData(JSON.parse(savedData));
      }
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImage(file);
  };

  const processImage = async (file: File) => {
    try {
      setIsScanning(true);
      setShowScanRing(true);

      // Downscale image
      const processedImage = await downscaleImage(file, 1024);

      // Create FormData
      const formData = new FormData();
      formData.append('image', processedImage, 'image.jpg');
      formData.append('hint', 'auto');

      // Call recognition API
      const response = await fetch('/api/recognize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'LOW_CONFIDENCE') {
          setToast({
            message: data.message || 'Try getting closer, holding steady, or finding better lighting!',
            type: 'error',
          });
          return;
        }
        throw new Error(data.error || 'Recognition failed');
      }

      // Navigate to result page with data
      const result: SpeciesResult = data.result;
      router.push(`/result?data=${encodeURIComponent(JSON.stringify(result))}`);
    } catch (error) {
      console.error('Scan error:', error);
      setToast({
        message: 'Something went wrong. Please try again!',
        type: 'error',
      });
    } finally {
      setIsScanning(false);
      setShowScanRing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-mint-50 to-teal-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-float ${pulseAnimation ? 'scale-110' : 'scale-100'} transition-transform duration-1000`}></div>
        <div className={`absolute top-40 right-16 w-16 h-16 bg-orange-200 rounded-full opacity-20 animate-float delay-1000 ${pulseAnimation ? 'scale-90' : 'scale-100'} transition-transform duration-1000`}></div>
        <div className={`absolute bottom-32 left-20 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-float delay-2000 ${pulseAnimation ? 'scale-110' : 'scale-100'} transition-transform duration-1000`}></div>
        <div className={`absolute bottom-20 right-10 w-24 h-24 bg-teal-200 rounded-full opacity-20 animate-float delay-3000 ${pulseAnimation ? 'scale-90' : 'scale-100'} transition-transform duration-1000`}></div>
      </div>

      {/* Header with 3D Avatar and Coin System */}
      <div className="relative z-10 text-center pt-8 pb-6 px-6">
        {/* 3D Avatar */}
        <div className="avatar-3d mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl mx-auto">
            <div className="text-4xl">🧒</div>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Backyard Brandon
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>Level {userData.level}</span>
            <span>•</span>
            <span>{userData.uniqueSpeciesCount} species found</span>
          </div>
        </div>

        {/* Coin Jar */}
        <div className="coin-jar w-32 h-32 mx-auto mb-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-1">🪙</div>
            <div className="coin-text text-lg">{userData.coins.toLocaleString()}</div>
            <div className="text-xs text-yellow-700">$BRANDON coins</div>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="progress-ring mx-auto mb-6">
          <svg className="w-16 h-16" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray={`${(userData.totalCaptures / 10) * 100}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{userData.totalCaptures}</span>
          </div>
        </div>
      </div>

      {/* Main Scan Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Scan Button with Enhanced Animation */}
        <div className="relative mb-8">
          {/* Outer pulse ring */}
          {showScanRing && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-teal-500 animate-ping opacity-20"></div>
          )}
          
          {/* Inner pulse ring */}
          {showScanRing && (
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-green-400 to-teal-500 animate-pulse opacity-30"></div>
          )}

          <BigButton
            onClick={handleScanClick}
            disabled={isScanning}
            className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-green-400 via-teal-500 to-blue-600 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
          >
            {isScanning ? (
              <>
                <div className="animate-spin-slow">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <span className="text-white font-semibold text-lg">Scanning...</span>
                <span className="text-white/80 text-sm">Finding creatures!</span>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-white" />
                <span className="text-white font-bold text-xl">SCAN</span>
                <span className="text-white/80 text-sm">Tap to explore</span>
              </>
            )}
          </BigButton>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <BigButton
            onClick={() => router.push('/book')}
            variant="ghost"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm"
          >
            <BookOpen className="w-5 h-5" />
            <span>Collection</span>
          </BigButton>
          <BigButton
            onClick={() => router.push('/quest')}
            variant="ghost"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm"
          >
            <Trophy className="w-5 h-5" />
            <span>Quests</span>
          </BigButton>
        </div>

        {/* Tips Section */}
        <div className="card-3d max-w-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Get close to your subject</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Make sure there&apos;s good lighting</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Hold your camera steady</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

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
