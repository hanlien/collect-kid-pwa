'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Sparkles, Search, BookOpen, Trophy, Coins, Target, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BigButton from '@/components/BigButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ConfettiBurst } from '@/components/anim/ConfettiBurst';
import Toast from '@/components/Toast';
import { downscaleImage } from '@/lib/utils';
import { SpeciesResult, RecognitionHint } from '@/types/species';

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanRing, setShowScanRing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanningText, setScanningText] = useState('');
  const [userData, setUserData] = useState({
    coins: 0,
    level: 1,
    totalCaptures: 0,
    uniqueSpeciesCount: 0,
  });

  // Scanning text animation
  useEffect(() => {
    if (isScanning) {
      const texts = [
        "Looking for patterns...",
        "Analyzing colors...",
        "Checking shapes...",
        "Identifying species...",
        "Almost there..."
      ];
      let index = 0;
      const interval = setInterval(() => {
        setScanningText(texts[index]);
        index = (index + 1) % texts.length;
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

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
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        setUserData(JSON.parse(savedData));
      }
    }
  }, []);

  // Initialize camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setToast({
        message: 'Camera access required. Please allow camera permissions.',
        type: 'error',
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        await processImage(file);
      }
    }, 'image/jpeg', 0.9);
  };

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

      // Show confetti for successful scan
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

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

  const handleCameraClick = () => {
    if (cameraActive) {
      capturePhoto();
    } else {
      startCamera();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Camera viewfinder */}
      {cameraActive && (
        <div className="absolute inset-0 z-10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Camera overlay */}
          <div className="absolute inset-0 bg-black/20">
            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
              <motion.button
                className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  stopCamera();
                  router.push('/scan');
                }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
              
              <div className="flex items-center space-x-4">
                <div className="bg-black/50 rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">Level {userData.level}</span>
                </div>
                <div className="bg-black/50 rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">👦 Brandon</span>
                </div>
              </div>
            </div>

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    className="w-32 h-32 border-4 border-white/30 rounded-full flex items-center justify-center mb-4"
                    animate={{
                      scale: [1, 1.2, 1],
                      borderColor: ['rgba(255,255,255,0.3)', 'rgba(74,222,128,0.8)', 'rgba(255,255,255,0.3)'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Search className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.p
                    className="text-white text-lg font-medium"
                    key={scanningText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {scanningText}
                  </motion.p>
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex justify-center items-center space-x-8">
                <motion.button
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleUploadClick}
                >
                  <Upload className="w-6 h-6 text-white" />
                </motion.button>

                <motion.button
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCameraClick}
                  disabled={isScanning}
                >
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </motion.button>

                <motion.button
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => router.push('/book')}
                >
                  <BookOpen className="w-6 h-6 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main UI when camera is not active */}
      {!cameraActive && (
        <>
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-20 h-20 bg-brand-200 rounded-full opacity-30"
              animate={{
                scale: [1, 1.2, 1],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-16 h-16 bg-accent-200 rounded-full opacity-30"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, 15, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute bottom-40 left-20 w-12 h-12 bg-sky-200 rounded-full opacity-30"
              animate={{
                scale: [1, 1.4, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </div>

          {/* Header with user stats */}
          <motion.header 
            className="relative z-10 p-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-brand to-brand-dark rounded-full flex items-center justify-center shadow-candy"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-white font-bold text-lg">👦</span>
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Level {userData.level}</h2>
                  <p className="text-sm text-gray-600">Brandon&apos;s Explorer</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-candy"
                  whileHover={{ scale: 1.05 }}
                >
                  <Coins className="w-5 h-5 text-accent" />
                  <span className="font-bold text-gray-800">{userData.coins}</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-candy"
                  whileHover={{ scale: 1.05 }}
                >
                  <Trophy className="w-5 h-5 text-brand" />
                  <span className="font-bold text-gray-800">{userData.uniqueSpeciesCount}</span>
                </motion.div>
              </div>
            </div>
          </motion.header>

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <motion.div
              className="text-center mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🐛 Buggies with Brandon
              </h1>
              <p className="text-lg text-gray-600">
                Point your camera at plants, bugs, and animals!
              </p>
            </motion.div>

            {/* Camera button */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <motion.button
                className={`w-32 h-32 rounded-full bg-gradient-to-br from-brand to-brand-dark shadow-candy-lg flex items-center justify-center ${
                  isScanning ? 'animate-pulse' : ''
                }`}
                onClick={handleCameraClick}
                disabled={isScanning}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={pulseAnimation ? {
                  boxShadow: [
                    "0 20px 60px rgba(74, 222, 128, 0.3)",
                    "0 20px 60px rgba(74, 222, 128, 0.6)",
                    "0 20px 60px rgba(74, 222, 128, 0.3)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Camera className="w-12 h-12 text-white" />
              </motion.button>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col space-y-4 w-full max-w-sm"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <BigButton
                onClick={handleUploadClick}
                variant="secondary"
                size="lg"
                disabled={isScanning}
              >
                <Upload className="w-6 h-6 mr-2" />
                Upload Photo
              </BigButton>

              <motion.button
                className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-candy flex flex-col items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/quest')}
              >
                <Target className="w-6 h-6 text-accent mb-2" />
                <span className="text-sm font-semibold text-gray-800">Quests</span>
              </motion.button>
            </motion.div>

            {/* Progress indicator */}
            {isScanning && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <ProgressRing progress={75} size={80} />
                <p className="text-center mt-4 text-gray-600 font-medium">
                  Analyzing your photo...
                </p>
              </motion.div>
            )}
          </main>

          {/* Bottom Collection button for quick access */}
          <motion.footer
            className="relative z-10 p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.button
              className="w-full bg-gradient-to-r from-brand to-brand-dark text-white rounded-2xl p-4 shadow-candy-lg flex items-center justify-center space-x-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/book')}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-lg font-bold">My Collection</span>
              <span className="text-sm opacity-90">({userData.uniqueSpeciesCount} species)</span>
            </motion.button>
          </motion.footer>
        </>
      )}

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Confetti burst */}
      <ConfettiBurst trigger={showConfetti} />
    </div>
  );
}
