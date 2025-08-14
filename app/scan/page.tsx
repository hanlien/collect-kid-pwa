'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Camera, Upload, Search, BookOpen, Coins, Target, X, Cpu, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import BigButton from '@/components/BigButton'; // TODO: Use when needed
// import { ProgressRing } from '@/components/ui/ProgressRing'; // TODO: Use when needed
import { ConfettiBurst } from '@/components/anim/ConfettiBurst';
import Toast from '@/components/Toast';
import { FloatingElements, AnimalSilhouettes } from '@/components/decorative/AnimalPatterns';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import dynamic from 'next/dynamic';

// Lazy load ProfileSelector
const LazyProfileSelector = dynamic(() => import('@/components/lazy/LazyProfileSelector'), { ssr: false });
import ProfileManager from '@/lib/profileManager';
import { SpeciesResult } from '@/types/species';
import { Profile } from '@/types/profile';
import logger from '@/lib/logger';

export default function ScanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  // const [showScanRing, setShowScanRing] = useState(false); // TODO: Use when needed
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  // const [pulseAnimation, setPulseAnimation] = useState(false); // TODO: Use when needed
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
        setScanningText(texts[index] || '');
        index = (index + 1) % texts.length;
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isScanning]);

  // Animated background elements
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setPulseAnimation(prev => !prev);
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, []);

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

  // Cleanup camera when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (stream) {
        console.log('Cleaning up camera stream on unmount');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
      
      // Wait for the video element to be rendered before setting it up
      setTimeout(() => {
        console.log('Setting up video element...');
        // Set up video element with better error handling
        if (videoRef.current) {
          const video = videoRef.current;
          
          // Clear any existing srcObject
          video.srcObject = null;
          console.log('Cleared existing srcObject');
          
          // Set the new stream
          video.srcObject = mediaStream;
          console.log('Set new srcObject:', mediaStream);
          
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
    const startTime = Date.now();
    try {
      console.log('Starting image processing...');
      setIsScanning(true);
              // setShowScanRing(true); // TODO: Implement scan ring animation

      // Create a persistent data URL for the original image
      const imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      console.log('Created persistent image URL (base64)');

      // Convert image to base64 for new multi-signal recognition
      const base64Image = imageUrl.split(',')[1]; // Remove data:image/jpeg;base64, prefix

      logger.recognitionStart(base64Image.length);
      logger.recognitionStep('sending_request', { imageSize: base64Image.length });
      
      // Call new multi-signal recognition API
      const response = await fetch('/api/recognize-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      const data = await response.json();
      logger.recognitionStep('received_response', data);

      if (!response.ok) {
        const error = new Error(data.error || 'Recognition failed');
        logger.recognitionError(error, { imageSize: base64Image.length });
        throw error;
      }

      if (!data.success) {
        const error = new Error(data.error || 'Recognition failed');
        logger.recognitionError(error, { imageSize: base64Image.length });
        throw error;
      }

      // Show confetti for successful scan
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      // Handle the new multi-signal response format
      const decision = data.decision;
      let result: SpeciesResult;

      if (decision.mode === 'pick' && decision.pick) {
        // Single species identified with high confidence
        const candidate = decision.pick;
        result = {
          canonicalName: candidate.scientificName,
          commonName: candidate.commonName || candidate.scientificName,
          category: 'mysterious', // Default category, will be refined
          confidence: candidate.totalScore || 0.8,
          provider: 'multi-signal',
          rank: 'species',
          capturedImageUrl: `captured-image-${Date.now()}`,
        };
      } else if (decision.mode === 'disambiguate' && decision.top3) {
        // Multiple candidates - use the top one for now
        const topCandidate = decision.top3[0];
        result = {
          canonicalName: topCandidate.scientificName,
          commonName: topCandidate.commonName || topCandidate.scientificName,
          category: 'mysterious', // Default category, will be refined
          confidence: topCandidate.totalScore || 0.6,
          provider: 'multi-signal',
          rank: 'species',
          capturedImageUrl: `captured-image-${Date.now()}`,
        };
      } else {
        throw new Error('No valid recognition result');
      }

      // Add scan record to profile with actual image
      const profileManager = ProfileManager.getInstance();
      profileManager.addScanRecord({
        speciesName: result.commonName || result.canonicalName,
        category: result.category,
        confidence: result.confidence,
        imageUrl: imageUrl, // Store the actual base64 image in scan record
      });

      // Store image in sessionStorage to avoid URL length limits
      sessionStorage.setItem(result.capturedImageUrl!, imageUrl);
      
      logger.recognitionSuccess(result, Date.now() - startTime, { imageSize: base64Image.length });
      logger.info('Navigating to result page', result);
      router.push(`/result?data=${encodeURIComponent(JSON.stringify(result))}`);
    } catch (error) {
      logger.error('Scan error', error as Error, { imageSize: base64Image?.length });
      setToast({
        message: 'Something went wrong. Please try again!',
        type: 'error',
      });
    } finally {
      setIsScanning(false);
              // setShowScanRing(false); // TODO: Implement scan ring animation
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
    <div className="page-container bg-gradient-to-br from-green-100 via-blue-100 to-orange-100 relative overflow-hidden">
      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 bg-white/20"></div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <AnimalSilhouettes />
      </div>
      
      {/* Floating nature elements */}
      <FloatingElements count={6} className="animate-float" />
      
      {/* Animated Garden Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bigger Moving Sun */}
        <motion.div
          className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-2xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Enhanced Sun rays */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-4 bg-yellow-300 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-18px)`,
              }}
              animate={{
                scaleY: [1, 1.8, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>

        {/* House in Background */}
        <div className="absolute bottom-20 left-8 w-16 h-12 z-10">
          {/* House body */}
          <div className="absolute bottom-0 w-full h-8 bg-gray-600 rounded-t-lg" />
          {/* Roof */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-red-500 transform -skew-x-12" />
          {/* Door */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-amber-800 rounded-t" />
          {/* Windows */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-blue-300 rounded" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-300 rounded" />
        </div>

        {/* Street Lights */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="absolute bottom-0 z-10" style={{ left: `${25 + i * 50}%` }}>
            {/* Pole */}
            <div className="w-1 h-16 bg-gray-700 mx-auto" />
            {/* Light */}
            <motion.div
              className="w-4 h-4 bg-yellow-300 rounded-full mx-auto -mt-1 shadow-lg"
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1,
              }}
            />
          </div>
        ))}

        {/* Cars */}
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-4 w-8 h-4 z-10"
            style={{ left: `${15 + i * 60}%` }}
            animate={{
              x: [0, 100, 0],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 8,
            }}
          >
            {/* Car body */}
            <div className="w-full h-3 bg-blue-500 rounded-lg" />
            {/* Wheels */}
            <div className="absolute bottom-0 left-1 w-2 h-2 bg-black rounded-full" />
            <div className="absolute bottom-0 right-1 w-2 h-2 bg-black rounded-full" />
          </motion.div>
        ))}

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

        {/* Bigger Flying Butterflies */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-12 h-8"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 12}%`,
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              rotate: [0, 20, -20, 0],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          >
            {/* Butterfly wings with flapping animation */}
            <motion.div
              className="absolute left-0 w-6 h-7 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full"
              animate={{
                rotateY: [0, 15, 0],
                scaleX: [1, 0.8, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
            <motion.div
              className="absolute right-0 w-6 h-7 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full"
              animate={{
                rotateY: [0, -15, 0],
                scaleX: [1, 0.8, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1 + 0.25,
              }}
            />
            {/* Butterfly body */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-3 bg-black rounded-full" />
            {/* Butterfly antennae */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-black rounded-full rotate-12" />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-black rounded-full -rotate-12" />
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
        <div className="absolute inset-0 z-50">
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
          
          {/* Modern Tech Camera Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40">
            {/* Top Tech Bar */}
            <div className="absolute top-0 left-0 right-0 p-6">
              <div className="flex justify-between items-center">
                <motion.button
                  className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    stopCamera();
                    router.push('/scan');
                  }}
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
                
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full px-4 py-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-white text-sm font-bold">LEVEL {userData.level}</span>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-full px-4 py-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-white text-sm font-bold">👦 BRANDON</span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Tech Status Indicators */}
            <div className="absolute top-20 left-6 space-y-2">
              <motion.div 
                className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/30"
                animate={{ borderColor: ['rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.8)', 'rgba(34, 211, 238, 0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-cyan-400 text-xs font-bold">CAMERA ACTIVE</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/30"
                animate={{ borderColor: ['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0.8)', 'rgba(168, 85, 247, 0.3)'] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-400 text-xs font-bold">AI READY</span>
                </div>
              </motion.div>
            </div>

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    className="relative w-40 h-40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    {/* Outer scanning ring */}
                    <div className="absolute inset-0 border-4 border-cyan-500/50 rounded-full"></div>
                    
                    {/* Middle scanning ring */}
                    <div className="absolute inset-4 border-4 border-purple-500/50 rounded-full animate-pulse"></div>
                    
                    {/* Inner scanning ring */}
                    <div className="absolute inset-8 border-4 border-pink-500/50 rounded-full animate-ping"></div>
                    
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
                  

                  
                  {/* Progress dots */}
                  <div className="flex justify-center space-x-2 mt-4">
                    <motion.div
                      className="w-3 h-3 bg-cyan-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-3 h-3 bg-purple-400 rounded-full"
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

            {/* Bottom controls - Mobile optimized */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8">
              <div className="flex justify-center items-center space-x-6">
                <motion.button
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleUploadClick}
                >
                  <Upload className="w-5 h-5 text-white" />
                </motion.button>

                <motion.button
                  className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCameraClick}
                  disabled={isScanning}
                >
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                </motion.button>

                <motion.button
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => router.push('/book')}
                >
                  <BookOpen className="w-5 h-5 text-white" />
                </motion.button>
              </div>
              
              {/* Capture hint text */}
              <div className="text-center mt-4">
                <p className="text-white/80 text-sm font-medium">Tap to capture!</p>
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

          {/* Header with user stats - Mobile optimized */}
          <motion.header 
            className="relative z-10 p-4 sm:p-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              {/* Left section - Profile */}
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={() => setShowProfileSelector(true)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(251, 191, 36, 0.5)",
                      "0 0 25px rgba(251, 191, 36, 0.8)",
                      "0 0 15px rgba(251, 191, 36, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white font-bold text-sm sm:text-lg">{currentProfile?.emoji || '👦'}</span>
                </motion.button>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 drop-shadow-lg">Level {userData.level}</h2>
                  <p className="text-xs sm:text-sm text-gray-700 drop-shadow-md">{currentProfile?.name || 'Brandon'}&apos;s Explorer</p>
                  {/* Level Progress Bar */}
                  <div className="mt-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500 ease-out"
                          style={{ 
                            width: `${((userData.uniqueSpeciesCount % 5) / 5) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-700 font-medium min-w-fit drop-shadow-sm">
                        {5 - (userData.uniqueSpeciesCount % 5)} to go
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right section - Combined Shop button with coins */}
              <div className="flex items-center justify-end">
                <Button
                  variant="accent"
                  size="md"
                  animation="sparkle"
                  className="px-3 sm:px-5 py-2 sm:py-3"
                  onClick={() => router.push('/gift-shop')}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                      <span className="font-bold text-xs sm:text-sm">${userData.coins}</span>
                    </div>
                    <div className="w-px h-4 bg-white/30 hidden sm:block"></div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-bold text-xs sm:text-sm">Shop</span>
                    </div>
                  </div>
                </Button>
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
              <div className="flex justify-center mb-4">
                <Logo size="lg" />
              </div>
              <motion.p 
                className="text-xl text-gray-700 drop-shadow-lg"
                style={{
                  textShadow: "1px 1px 2px rgba(0,0,0,0.2)"
                }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Point your camera at plants, bugs, and animals!
              </motion.p>
            </motion.div>

            {/* Modern Tech Camera Button */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
            >
              {/* Tech scanning rings */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full border-4 border-cyan-500/30 rounded-full"></div>
              </motion.div>
              
              <motion.div
                className="absolute inset-4 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full border-4 border-purple-500/40 rounded-full"></div>
              </motion.div>
              
              <motion.div
                className="absolute inset-8 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full border-4 border-pink-500/50 rounded-full"></div>
              </motion.div>
              
              <motion.button
                className={`w-36 h-36 rounded-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 shadow-2xl flex items-center justify-center border-4 border-cyan-500/50 ${
                  isScanning ? 'animate-pulse' : ''
                }`}
                onClick={handleCameraClick}
                disabled={isScanning}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 25px 80px rgba(34, 211, 238, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 20px 60px rgba(34, 211, 238, 0.2)",
                    "0 20px 60px rgba(34, 211, 238, 0.4)",
                    "0 20px 60px rgba(34, 211, 238, 0.2)"
                  ],
                  borderColor: [
                    "rgba(34, 211, 238, 0.5)",
                    "rgba(168, 85, 247, 0.8)",
                    "rgba(236, 72, 153, 0.8)",
                    "rgba(34, 211, 238, 0.5)"
                  ]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  boxShadow: { duration: 2, repeat: Infinity },
                  borderColor: { duration: 4, repeat: Infinity }
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    rotate: { duration: 4, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <Camera className="w-16 h-16 text-cyan-400 drop-shadow-lg" />
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

            {/* Modern Tech-like Scanning UI */}
            {isScanning && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-purple-500/20 shadow-2xl">
                  {/* Scanning Ring */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* Outer ring */}
                      <div className="w-32 h-32 rounded-full border-4 border-purple-500/30 animate-pulse"></div>
                      
                      {/* Middle ring */}
                      <div className="absolute inset-2 w-28 h-28 rounded-full border-4 border-blue-500/50 animate-spin" style={{ animationDuration: '3s' }}></div>
                      
                      {/* Inner ring */}
                      <div className="absolute inset-4 w-24 h-24 rounded-full border-4 border-cyan-500/70 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                      
                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 360]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Cpu className="w-8 h-8 text-cyan-400" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-cyan-400 text-sm font-medium">AI Analysis</span>
                      <span className="text-purple-400 text-sm font-bold">75%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Scanning Text */}
                  <motion.div
                    className="text-center"
                    key={scanningText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-white font-semibold text-lg mb-2">
                      {scanningText}
                    </p>
                    <div className="flex justify-center space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-pink-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </motion.div>

                  {/* Tech Details */}
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="text-cyan-400 text-xs font-medium">VISION</div>
                      <div className="text-white text-sm font-bold">Active</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="text-purple-400 text-xs font-medium">ML</div>
                      <div className="text-white text-sm font-bold">Processing</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="text-pink-400 text-xs font-medium">API</div>
                      <div className="text-white text-sm font-bold">Connected</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </main>

          {/* Bottom Collection button for quick access - hidden when camera is active */}
          {!cameraActive && (
            <motion.footer
              className="relative z-5 p-6 pb-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                variant="nature"
                size="xl"
                className="w-full"
                animation="float"
                leftIcon={<BookOpen className="w-6 h-6" />}
                onClick={() => router.push('/book')}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-bold">My Collection</span>
                  <span className="text-sm opacity-90">({userData.uniqueSpeciesCount} species)</span>
                </div>
              </Button>
            </motion.footer>
          )}
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
      <LazyProfileSelector
        isOpen={showProfileSelector}
        onClose={() => setShowProfileSelector(false)}
        onProfileSwitch={handleProfileSwitch}
      />
    </div>
  );
}
