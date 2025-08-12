'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Collect Kid</h1>
        <p className="text-gray-600">Take a photo to discover nature!</p>
      </div>

      {/* Scan Button */}
      <div className="relative mb-8">
        <div className="relative">
          <BigButton
            onClick={handleScanClick}
            disabled={isScanning}
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <div className="animate-spin-slow">
                  <Sparkles className="w-8 h-8" />
                </div>
                <span className="text-sm">Scanning...</span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8" />
                <span className="text-sm">Scan</span>
              </>
            )}
          </BigButton>

          {/* Scan ring animation */}
          {showScanRing && (
            <>
              <div className="scan-ring" />
              <div className="scan-ring animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="scan-ring animate-pulse" style={{ animationDelay: '1s' }} />
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center max-w-sm">
        <div className="card mb-4">
          <h3 className="font-bold text-gray-800 mb-2">How to scan:</h3>
          <ul className="text-sm text-gray-600 space-y-1 text-left">
            <li>• Get close to your subject</li>
            <li>• Hold your phone steady</li>
            <li>• Make sure there&apos;s good lighting</li>
            <li>• Tap the scan button to take a photo</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-2">What you can find:</h3>
          <div className="flex justify-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl">🌸</div>
              <span className="text-gray-600">Flowers</span>
            </div>
            <div className="text-center">
              <div className="text-2xl">🦋</div>
              <span className="text-gray-600">Bugs</span>
            </div>
            <div className="text-center">
              <div className="text-2xl">🐦</div>
              <span className="text-gray-600">Animals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-6 right-6 flex justify-center gap-4">
        <BigButton
          onClick={() => router.push('/book')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Collection
        </BigButton>
        <BigButton
          onClick={() => router.push('/quest')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Quest
        </BigButton>
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
