'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Camera, Upload, Sparkles, Search, BookOpen, Trophy, Coins, Target, X, RotateCcw, User, Heart, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BigButton from '@/components/BigButton';
import Toast from '@/components/Toast';
import ProfileSelector from '@/components/ProfileSelector';
import ProfileManager from '@/lib/profileManager';
import { downscaleImage } from '@/lib/utils';
import { SpeciesResult, RecognitionHint } from '@/types/species';
import { Profile } from '@/types/profile';

export default function ScanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
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
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

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

  // Load profile data
  useEffect(() => {
    refreshProfileData();
  }, []);

  // Ensure video plays when camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && stream) {
      const video = videoRef.current;
      
      // Add a small delay to ensure everything is set up
      setTimeout(() => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          video.play().catch(console.error);
        }
      }, 100);
    }
  }, [cameraActive, stream]);

  // Refresh profile data when page becomes visible (user returns from result page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProfileData();
      }
    };

    const handleFocus = () => {
      refreshProfileData();
    };

    // Refresh on page load and when returning from other pages
    refreshProfileData();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const refreshProfileData = () => {
    const profileManager = ProfileManager.getInstance();
    const profile = profileManager.getCurrentProfile();
    setCurrentProfile(profile);
    setUserData({
      coins: profile.coins,
      level: profile.level,
      totalCaptures: profile.totalCaptures,
      uniqueSpeciesCount: profile.uniqueSpeciesCount,
    });
  };

  const handleProfileSwitch = (profile: Profile) => {
    const profileManager = ProfileManager.getInstance();
    profileManager.switchProfile(profile.id);
    refreshProfileData();
    setShowProfileSelector(false);
  };

  // Start camera
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

      // Wait for video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = mediaStream;
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Video playing successfully');
                })
                .catch((error) => {
                  console.error('Video play failed:', error);
                  // Try again after a short delay
                  setTimeout(() => {
                    video.play().catch(console.error);
                  }, 100);
                });
            }
          };

          // Handle video errors
          video.onerror = (error) => {
            console.error('Video error:', error);
            setToast({
              message: 'Camera video error. Please try again.',
              type: 'error',
            });
          };

          // Handle video loading
          video.onloadstart = () => console.log('Video loading started');
          video.oncanplay = () => console.log('Video can play');
          video.onplaying = () => console.log('Video is playing');
          
          // Force a small delay to ensure video element is ready
          setTimeout(() => {
            if (video.srcObject !== mediaStream) {
              console.log('Re-applying stream to video element');
              video.srcObject = mediaStream;
            }
          }, 100);
        } else {
          console.error('Video ref is still null after delay!');
        }
      }, 100); // Wait 100ms for the video element to be rendered
    } catch (error) {
      console.error('Camera access failed:', error);
      
      let errorMessage = 'Camera access required. Please allow camera permissions.';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found. Please check your device has a camera.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is in use by another application. Please close other camera apps.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera requirements not met. Please try again.';
            break;
          default:
            errorMessage = `Camera error: ${error.message}`;
        }
      }
      
      setToast({
        message: errorMessage,
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
        await processImage(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  // Process image for recognition
  const processImage = async (file: File | Blob) => {
    try {
      setIsScanning(true);
      console.log('Starting image processing...');

      // Convert to blob if it's a File
      const blob = file instanceof File ? file : file;
      
      // Create URL for the image
      const imageUrl = URL.createObjectURL(blob);
      console.log('Created image URL:', imageUrl);

             // Downscale image for better performance
       const downscaledBlob = await downscaleImage(file instanceof File ? file : new File([blob], 'image.jpg', { type: 'image/jpeg' }), 1024);
      console.log('Image downscaled');

      // Convert to base64 for API
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(downscaledBlob);
      });

      // Send to recognition API
      console.log('Sending to /api/recognize...');
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          hint: 'auto' as RecognitionHint,
        }),
      });

      const data = await response.json();
      console.log('Recognition response:', data);

      if (response.ok && data.result) {
        // Add captured image URL to result
        const resultWithImage: SpeciesResult = {
          ...data.result,
          capturedImageUrl: imageUrl,
        };

        console.log('Navigating to result page with result:', resultWithImage);
        router.push(`/result?data=${encodeURIComponent(JSON.stringify(resultWithImage))}`);
      } else {
        throw new Error(data.error || 'Recognition failed');
      }
    } catch (error) {
      console.error('Image processing error:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to process image',
        type: 'error',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Handle camera button click
  const handleCameraClick = () => {
    if (cameraActive) {
      capturePhoto();
    } else {
      startCamera();
    }
  };

  // Handle file upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-green-100 to-yellow-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-200"></div>
        
        {/* Clouds */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute w-16 h-8 bg-white rounded-full opacity-80"
            style={{
              left: `${10 + i * 15}%`,
              top: `${5 + i * 8}%`,
            }}
            animate={{
              x: [0, 20, 0],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1,
            }}
          />
        ))}

        {/* Sun */}
        <motion.div
          className="absolute top-8 right-8 w-20 h-20 bg-yellow-300 rounded-full flex items-center justify-center"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="text-2xl">☀️</div>
        </motion.div>

        {/* Hills */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-400 to-green-300 rounded-t-full"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-500 to-green-400 rounded-t-full transform translate-y-4"></div>

        {/* House */}
        <motion.div
          className="absolute bottom-20 left-8 w-16 h-12"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* House body */}
          <div className="w-full h-8 bg-blue-300 rounded-t-lg"></div>
          {/* Roof */}
          <div className="w-full h-4 bg-orange-400 rounded-t-lg transform -translate-y-1"></div>
          {/* Door */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-amber-800 rounded-t"></div>
          {/* Windows */}
          <div className="absolute top-2 left-1 w-2 h-2 bg-yellow-200 rounded"></div>
          <div className="absolute top-2 right-1 w-2 h-2 bg-yellow-200 rounded"></div>
        </motion.div>

        {/* Trees */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`tree-${i}`}
            className="absolute bottom-0 w-8 h-12"
            style={{
              left: `${20 + i * 25}%`,
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {/* Tree trunk */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-amber-800"></div>
            {/* Tree leaves */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full"></div>
          </motion.div>
        ))}

        {/* Butterflies */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`butterfly-${i}`}
            className="absolute w-6 h-4"
            style={{
              left: `${15 + i * 10}%`,
              top: `${20 + i * 8}%`,
            }}
            animate={{
              x: [0, 15, 0],
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            <div className="text-orange-400 text-lg">🦋</div>
          </motion.div>
        ))}

        {/* Flowers */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`flower-${i}`}
            className="absolute w-3 h-3"
            style={{
              left: `${5 + i * 8}%`,
              bottom: `${5 + i % 3 * 5}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          >
            <div className={`w-full h-full rounded-full ${
              i % 3 === 0 ? 'bg-yellow-300' : 
              i % 3 === 1 ? 'bg-pink-300' : 'bg-orange-300'
            }`}></div>
          </motion.div>
        ))}
      </div>

      {/* Camera viewfinder */}
      {cameraActive && (
        <div className="absolute inset-0 z-10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('Video metadata loaded')}
            onCanPlay={() => console.log('Video can play')}
            onPlaying={() => console.log('Video is playing')}
            onError={(e) => console.error('Video error:', e)}
          />
          
          {/* Camera overlay */}
          <div className="absolute inset-0 bg-black/10">
            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
              <motion.button
                className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  stopCamera();
                  router.push('/scan');
                }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-blue-400 rounded-full px-4 py-2 shadow-lg">
                  <span className="text-white text-sm font-bold">Level {userData.level}</span>
                </div>
                <div className="bg-green-400 rounded-full px-4 py-2 shadow-lg">
                  <span className="text-white text-sm font-bold">👦 Brandon</span>
                </div>
              </div>
            </div>

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    className="relative w-32 h-32"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    {/* Outer scanning ring */}
                    <div className="absolute inset-0 border-4 border-yellow-400 rounded-full"></div>
                    
                    {/* Middle scanning ring */}
                    <div className="absolute inset-4 border-4 border-orange-400 rounded-full animate-pulse"></div>
                    
                    {/* Inner scanning ring */}
                    <div className="absolute inset-8 border-4 border-pink-400 rounded-full animate-ping"></div>
                    
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, -360]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Search className="w-12 h-12 text-white drop-shadow-lg" />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <motion.p
                    className="text-white text-xl font-bold mt-6 drop-shadow-lg"
                    key={scanningText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {scanningText}
                  </motion.p>
                  
                  {/* Progress dots */}
                  <div className="flex justify-center space-x-2 mt-4">
                    <motion.div
                      className="w-3 h-3 bg-yellow-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-3 h-3 bg-orange-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-3 h-3 bg-pink-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Camera button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <motion.button
                className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
                onClick={capturePhoto}
                disabled={isScanning}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(251, 146, 60, 0.5)",
                    "0 0 30px rgba(251, 146, 60, 0.8)",
                    "0 0 20px rgba(251, 146, 60, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Camera className="w-10 h-10 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!cameraActive && (
        <>
          {/* Header */}
          <motion.header
            className="relative z-10 p-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowProfileSelector(true)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">👦</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Buggies with Brandon</h1>
                  <p className="text-sm text-gray-600">Level {userData.level} Explorer</p>
                </div>
              </motion.div>
              
              <div className="flex items-center space-x-3">
                <motion.div
                  className="bg-yellow-400 rounded-full px-4 py-2 shadow-lg flex items-center space-x-2"
                  animate={{
                    boxShadow: [
                      "0 4px 12px rgba(251, 191, 36, 0.3)",
                      "0 6px 20px rgba(251, 191, 36, 0.5)",
                      "0 4px 12px rgba(251, 191, 36, 0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Coins className="w-5 h-5 text-white" />
                  <span className="font-bold text-white">${userData.coins} BRANDON</span>
                </motion.div>
                
                <motion.button
                  className="flex items-center space-x-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  onClick={() => router.push('/book')}
                >
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-gray-800">{userData.uniqueSpeciesCount}</span>
                </motion.button>
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
              <motion.h1 
                className="text-5xl font-bold text-gray-800 mb-4 drop-shadow-lg"
                animate={{
                  textShadow: [
                    "0 2px 4px rgba(0,0,0,0.1)",
                    "0 4px 8px rgba(0,0,0,0.2)",
                    "0 2px 4px rgba(0,0,0,0.1)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🐛 Buggies with Brandon
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-700 drop-shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Point your camera at plants, bugs, and animals!
              </motion.p>
            </motion.div>

            {/* Camera button */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
            >
              {/* Glowing ring around camera button */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(251, 146, 60, 0.3)",
                    "0 0 50px rgba(251, 146, 60, 0.6)",
                    "0 0 30px rgba(251, 146, 60, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <motion.button
                className={`w-36 h-36 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-2xl flex items-center justify-center border-4 border-white ${
                  isScanning ? 'animate-pulse' : ''
                }`}
                onClick={handleCameraClick}
                disabled={isScanning}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  boxShadow: "0 25px 80px rgba(251, 146, 60, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 20px 60px rgba(251, 146, 60, 0.2)",
                    "0 20px 60px rgba(251, 146, 60, 0.4)",
                    "0 20px 60px rgba(251, 146, 60, 0.2)"
                  ],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Camera className="w-16 h-16 text-white drop-shadow-lg" />
                </motion.div>
              </motion.button>
            </motion.div>

            {/* Category buttons */}
            <motion.div
              className="flex space-x-4 mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.button
                className="bg-green-400 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/book?category=animal')}
              >
                <span>🐦</span>
                <span>Animals</span>
              </motion.button>
              
              <motion.button
                className="bg-orange-400 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/book?category=bug')}
              >
                <span>🦋</span>
                <span>Bugs</span>
              </motion.button>
              
              <motion.button
                className="bg-pink-400 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/book?category=flower')}
              >
                <span>🌸</span>
                <span>Flowers</span>
              </motion.button>
            </motion.div>

            {/* Upload button */}
            <motion.button
              className="bg-blue-400 text-white px-8 py-3 rounded-2xl font-bold shadow-lg flex items-center space-x-2"
              onClick={handleUploadClick}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Upload className="w-5 h-5" />
              <span>Upload Photo</span>
            </motion.button>
          </main>

          {/* Bottom Collection button for quick access */}
          <motion.footer
            className="relative z-10 p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.button
              className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-center space-x-3 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.02, 
                y: -3,
                boxShadow: "0 15px 40px rgba(236, 72, 153, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/book')}
              animate={{
                boxShadow: [
                  "0 10px 30px rgba(236, 72, 153, 0.3)",
                  "0 15px 40px rgba(236, 72, 153, 0.5)",
                  "0 10px 30px rgba(236, 72, 153, 0.3)"
                ],
                background: [
                  "linear-gradient(to right, #f472b6, #a78bfa, #60a5fa)",
                  "linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6)",
                  "linear-gradient(to right, #f472b6, #a78bfa, #60a5fa)"
                ]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                boxShadow: { duration: 2, repeat: Infinity }
              }}
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

      {/* Profile Selector */}
      <ProfileSelector
        isOpen={showProfileSelector}
        onClose={() => setShowProfileSelector(false)}
        onProfileSwitch={handleProfileSwitch}
      />
    </div>
  );
}
