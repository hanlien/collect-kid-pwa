'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import BigButton from '@/components/BigButton';
import ProgressRing from '@/components/ui/ProgressRing';
import Confetti from '@/components/Confetti';
import Toast from '@/components/Toast';
import { localModel } from '@/lib/ml/localModel';
import { postprocessLocalResult } from '@/lib/ml/postprocess';
import { SpeciesResult } from '@/types/species';

export default function ScanLocalPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [showScanRing, setShowScanRing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    try {
      setIsScanning(true);
      setShowScanRing(true);

      // Create a data URL for the original image
      const imageUrl = URL.createObjectURL(file);

      // Load local model if not loaded
      if (!localModel.isLoaded()) {
        setToast({
          message: 'Loading local model...',
          type: 'info',
        });
        await localModel.load();
      }

      // Create an image element
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Run local inference
      const localResult = await localModel.infer(img);
      
      // Check confidence
      const isConfident = localModel.isConfident(localResult);
      
      if (!isConfident) {
        setToast({
          message: 'Try getting closer, holding steady, or finding better lighting!',
          type: 'error',
        });
        return;
      }

      // Show confetti for successful scan
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      // Process result
      const result = postprocessLocalResult(localResult);
      
      // Add captured image URL
      const speciesResult: SpeciesResult = {
        ...result,
        capturedImageUrl: imageUrl,
      };

      // Navigate to result page
      router.push(`/result?data=${encodeURIComponent(JSON.stringify(speciesResult))}`);
    } catch (error) {
      console.error('Local scan error:', error);
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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
      setToast({
        message: 'Could not access camera',
        type: 'error',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
        await processImage(file);
      }
    }, 'image/jpeg');

    // Stop camera after capture
    stopCamera();
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-300 via-green-200 to-yellow-200 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-12 h-12 bg-green-300 rounded-full opacity-20 animate-pulse"></div>
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
            <h1 className="text-lg font-semibold text-gray-800">Local Scan</h1>
            <p className="text-sm text-gray-500">Using your device's AI</p>
          </div>
          
          <div className="w-20"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Camera/Upload Area */}
        <div className="w-full max-w-md">
          {/* Camera View */}
          {cameraActive && (
            <div className="mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg shadow-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Scan Ring */}
          {showScanRing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ProgressRing size={200} strokeWidth={4} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <BigButton
              onClick={handleCameraClick}
              disabled={isScanning}
              className="w-full h-16 text-lg"
            >
              <Camera className="w-6 h-6 mr-2" />
              {cameraActive ? 'Take Photo' : 'Use Camera'}
            </BigButton>

            <BigButton
              onClick={handleUploadClick}
              variant="outline"
              disabled={isScanning}
              className="w-full h-16 text-lg"
            >
              <Upload className="w-6 h-6 mr-2" />
              Upload Photo
            </BigButton>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="mt-8 text-center text-gray-600">
            <h3 className="font-semibold mb-2">Local Model Species</h3>
            <p className="text-sm">
              This model recognizes 22 species including dogs, cats, roses, bees, and more.
              <br />
              Works offline - no internet required!
            </p>
          </div>
        </div>
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}

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
