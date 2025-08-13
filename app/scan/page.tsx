'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Camera, Upload, Sparkles, Search, BookOpen, Trophy, Coins, Target, X, RotateCcw, User, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BigButton from '@/components/BigButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ConfettiBurst } from '@/components/anim/ConfettiBurst';
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

  // Animated background elements
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  // Refresh profile data when pathname changes (user navigates back)
  useEffect(() => {
    refreshProfileData();
  }, [pathname]);

  // Initialize camera with better error handling and fallbacks
  const startCamera = async () => {
    try {
      // First, try to get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Available video devices:', videoDevices);
      
      // Try different camera configurations
      const cameraConfigs = [
        // Try back camera first (environment)
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        },
        // Fallback to any camera
        {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        },
        // Minimal requirements
        {
          video: {
            width: { min: 320 },
            height: { min: 240 }
          }
        }
      ];

      let mediaStream = null;
      let lastError = null;

      // Try each configuration until one works
      for (const config of cameraConfigs) {
        try {
          console.log('Trying camera config:', config);
          mediaStream = await navigator.mediaDevices.getUserMedia(config);
          console.log('Camera started successfully with config:', config);
          break;
        } catch (error) {
          console.log('Camera config failed:', config, error);
          lastError = error;
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('No camera configuration worked');
      }

      setStream(mediaStream);
      setCameraActive(true);
      
      // Set up video element with better error handling
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Clear any existing srcObject
        video.srcObject = null;
        
        // Set the new stream
        video.srcObject = mediaStream;
        
        // Wait for metadata to load
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });
          
          // Ensure video plays
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
      }
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

      // Create a data URL for the original image
      const imageUrl = URL.createObjectURL(file);

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

      // Add scan record to profile
      const profileManager = ProfileManager.getInstance();
      profileManager.addScanRecord({
        speciesName: data.result.commonName || data.result.canonicalName,
        category: data.result.category,
        confidence: data.result.confidence,
        imageUrl: imageUrl,
      });

      // Navigate to result page with data and image
      const result: SpeciesResult = {
        ...data.result,
        capturedImageUrl: imageUrl, // Add the captured image URL
      };
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

  const handleProfileSwitch = (profile: Profile) => {
    setCurrentProfile(profile);
    setUserData({
      coins: profile.coins,
      level: profile.level,
      totalCaptures: profile.totalCaptures,
      uniqueSpeciesCount: profile.uniqueSpeciesCount,
    });
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-300 via-green-200 to-yellow-200 relative overflow-hidden">
      {/* Animated Garden Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Moving Sun */}
        <motion.div
          className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg"
          animate={{
            x: [0, -20, 0],
            y: [0, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Sun rays */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-3 bg-yellow-300 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-12px)`,
              }}
              animate={{
                scaleY: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Floating Clouds */}
        <motion.div
          className="absolute top-12 left-8 w-20 h-12 bg-white/70 rounded-full"
          animate={{
            x: [0, 60, 0],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-6 right-16 w-16 h-10 bg-white/60 rounded-full"
          animate={{
            x: [0, -40, 0],
            y: [0, -5, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        <motion.div
          className="absolute top-16 left-1/3 w-14 h-8 bg-white/50 rounded-full"
          animate={{
            x: [0, 30, 0],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />

        {/* Animated Hills */}
        <div className="absolute bottom-0 left-0 right-0">
          <motion.div
            className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-green-500 to-green-400 rounded-t-full"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 left-1/4 w-1/2 h-24 bg-gradient-to-t from-green-600 to-green-500 rounded-t-full"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        {/* Blooming Flowers */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-12 w-10 h-10"
            style={{
              left: `${10 + i * 12}%`,
            }}
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: [0, 1, 1.1, 1],
              rotate: [0, 180, 360],
              y: [0, -12, 0],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          >
            {/* Flower petals */}
            {[...Array(6)].map((_, petalIndex) => (
              <motion.div
                key={petalIndex}
                className="absolute w-4 h-6 bg-pink-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${petalIndex * 60}deg) translateY(-8px)`,
                  transformOrigin: 'center bottom',
                }}
                animate={{
                  scaleY: [1, 1.3, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: petalIndex * 0.1 + i * 0.2,
                }}
              />
            ))}
            {/* Flower center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full" />
          </motion.div>
        ))}

        {/* Swaying Trees */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-14 h-24"
            style={{
              left: `${8 + i * 20}%`,
            }}
            animate={{
              y: [0, -4, 0],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            {/* Tree trunk */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-10 bg-amber-800 rounded-full" />
            {/* Tree leaves */}
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-14 bg-green-600 rounded-full"
              animate={{
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          </motion.div>
        ))}

        {/* Flying Butterflies */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-6"
            style={{
              left: `${15 + i * 25}%`,
              top: `${25 + (i % 2) * 15}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1.5,
            }}
          >
            {/* Butterfly wings */}
            <div className="absolute left-0 w-4 h-5 bg-purple-300 rounded-full" />
            <div className="absolute right-0 w-4 h-5 bg-purple-300 rounded-full" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-2 bg-black rounded-full" />
          </motion.div>
        ))}

        {/* Small Animals */}
        {/* Birds */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`bird-${i}`}
            className="absolute w-6 h-4"
            style={{
              left: `${20 + i * 30}%`,
              top: `${15 + (i % 2) * 10}%`,
            }}
            animate={{
              x: [0, 40, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          >
            <div className="w-full h-full bg-blue-400 rounded-full" />
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
          </motion.div>
        ))}

        {/* Bees */}
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`bee-${i}`}
            className="absolute w-4 h-4"
            style={{
              left: `${30 + i * 40}%`,
              top: `${35 + i * 10}%`,
            }}
            animate={{
              x: [0, 15, 0],
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1,
            }}
          >
            <div className="w-full h-full bg-yellow-400 rounded-full" />
            <div className="absolute inset-0 border-2 border-black rounded-full" />
          </motion.div>
        ))}

        {/* Waving Grass */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 h-8 bg-green-500"
            style={{
              left: `${3 + i * 6}%`,
            }}
            animate={{
              y: [0, -4, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        ))}

        {/* Floating Leaves */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`leaf-${i}`}
            className="absolute w-3 h-3 bg-green-400 rounded-full"
            style={{
              left: `${25 + i * 15}%`,
              top: `${60 + i * 8}%`,
            }}
            animate={{
              x: [0, 10, 0],
              y: [0, -15, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1.5,
            }}
          />
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
                <motion.button
                  onClick={() => setShowProfileSelector(true)}
                  className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(251, 191, 36, 0.5)",
                      "0 0 30px rgba(251, 191, 36, 0.8)",
                      "0 0 20px rgba(251, 191, 36, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white font-bold text-lg">{currentProfile?.emoji || '👦'}</span>
                </motion.button>
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-lg">Level {userData.level}</h2>
                  <p className="text-sm text-white/80 drop-shadow-md">{currentProfile?.name || 'Brandon'}&apos;s Explorer</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl px-4 py-2 shadow-lg"
                  whileHover={{ scale: 1.05, y: -2 }}
                  animate={{
                    boxShadow: [
                      "0 5px 15px rgba(251, 191, 36, 0.3)",
                      "0 10px 25px rgba(251, 191, 36, 0.5)",
                      "0 5px 15px rgba(251, 191, 36, 0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Coins className="w-5 h-5 text-white" />
                  <span className="font-bold">${userData.coins} BRANDON</span>
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
                className="text-5xl font-bold text-white mb-4 drop-shadow-2xl"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(255,255,255,0.5)",
                    "0 0 30px rgba(255,255,255,0.8)",
                    "0 0 20px rgba(255,255,255,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🐛 Buggies with Brandon
              </motion.h1>
              <motion.p 
                className="text-xl text-white/90 drop-shadow-lg"
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
                    "0 0 30px rgba(255, 255, 255, 0.3)",
                    "0 0 50px rgba(255, 255, 255, 0.6)",
                    "0 0 30px rgba(255, 255, 255, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <motion.button
                className={`w-36 h-36 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl flex items-center justify-center ${
                  isScanning ? 'animate-pulse' : ''
                }`}
                onClick={handleCameraClick}
                disabled={isScanning}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  boxShadow: "0 25px 80px rgba(255, 255, 255, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 20px 60px rgba(255, 255, 255, 0.2)",
                    "0 20px 60px rgba(255, 255, 255, 0.4)",
                    "0 20px 60px rgba(255, 255, 255, 0.2)"
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

            {/* Action buttons */}
            <motion.div
              className="flex flex-col space-y-4 w-full max-w-sm"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-center space-x-3 backdrop-blur-sm"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUploadClick}
                disabled={isScanning}
                animate={{
                  boxShadow: [
                    "0 5px 15px rgba(59, 130, 246, 0.3)",
                    "0 10px 25px rgba(59, 130, 246, 0.5)",
                    "0 5px 15px rgba(59, 130, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Upload className="w-6 h-6" />
                <span className="text-lg font-bold">Upload Photo</span>
              </motion.button>

              <motion.button
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-center space-x-3 backdrop-blur-sm"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/quest')}
                animate={{
                  boxShadow: [
                    "0 5px 15px rgba(34, 197, 94, 0.3)",
                    "0 10px 25px rgba(34, 197, 94, 0.5)",
                    "0 5px 15px rgba(34, 197, 94, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Target className="w-6 h-6" />
                <span className="text-lg font-bold">Quests</span>
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
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-center space-x-3 backdrop-blur-sm"
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
                  "linear-gradient(to right, #ec4899, #a855f7, #4f46e5)",
                  "linear-gradient(to right, #db2777, #9333ea, #3730a3)",
                  "linear-gradient(to right, #ec4899, #a855f7, #4f46e5)"
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

      {/* Confetti burst */}
      <ConfettiBurst trigger={showConfetti} />

      {/* Profile Selector */}
      <ProfileSelector
        isOpen={showProfileSelector}
        onClose={() => setShowProfileSelector(false)}
        onProfileSwitch={handleProfileSwitch}
      />
    </div>
  );
}
