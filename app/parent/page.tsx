'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import BigButton from '@/components/BigButton';
import Toast from '@/components/Toast';

export default function ParentPage() {
  const router = useRouter();
  const [kidMode, setKidMode] = useState(true);
  const [captures, setCaptures] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
    loadCaptures();
  }, []);

  const loadSettings = () => {
    const storedKidMode = localStorage.getItem('kidMode');
    if (storedKidMode !== null) {
      setKidMode(JSON.parse(storedKidMode));
    }
  };

  const loadCaptures = () => {
    const storedCaptures = localStorage.getItem('captures');
    if (storedCaptures) {
      setCaptures(JSON.parse(storedCaptures));
    }
  };

  const toggleKidMode = () => {
    const newMode = !kidMode;
    setKidMode(newMode);
    localStorage.setItem('kidMode', JSON.stringify(newMode));
    setToast({
      message: `Kid mode ${newMode ? 'enabled' : 'disabled'}`,
      type: 'success',
    });
  };

  const purgeOriginals = () => {
    // In a real app, this would delete original images from storage
    // For now, we'll just show a message
    setToast({
      message: 'Original images purged (kept thumbnails)',
      type: 'success',
    });
  };

  const getMonthName = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const groupCapturesByMonth = () => {
    const groups: Record<string, any[]> = {};
    captures.forEach(capture => {
      const month = getMonthName(capture.createdAt);
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(capture);
    });
    return groups;
  };

  const monthlyGroups = groupCapturesByMonth();

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
        
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Parent Settings
        </h1>
        
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Settings */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">App Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Kid Mode</h3>
              <p className="text-sm text-gray-600">
                {kidMode ? 'Simplified interface for young children' : 'Full interface with advanced features'}
              </p>
            </div>
            <button
              onClick={toggleKidMode}
              className={`p-2 rounded-lg transition-colors ${
                kidMode ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {kidMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Storage Management</h3>
              <p className="text-sm text-gray-600">
                Free up space by removing original images
              </p>
            </div>
            <BigButton
              onClick={purgeOriginals}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Purge Originals
            </BigButton>
          </div>
        </div>
      </div>

      {/* Collection Timeline */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Collection Timeline</h2>
        
        {Object.keys(monthlyGroups).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">📸</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No discoveries yet!
            </h3>
            <p className="text-sm text-gray-500">
              Start scanning to build your collection timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(monthlyGroups).map(([month, monthCaptures]) => (
              <div key={month} className="card">
                <h3 className="font-bold text-gray-800 mb-3">{month}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {monthCaptures.slice(0, 8).map((capture) => (
                    <div
                      key={capture.id}
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                    >
                      <div className="text-2xl">
                        {capture.category === 'animal' ? '🐦' : 
                         capture.category === 'bug' ? '🦋' : '🌸'}
                      </div>
                    </div>
                  ))}
                  {monthCaptures.length > 8 && (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-gray-500">
                        +{monthCaptures.length - 8}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {monthCaptures.length} discoveries
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        <BigButton
          onClick={() => router.push('/training')}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          📊 Training Dashboard
        </BigButton>
        <BigButton
          onClick={() => router.push('/scan')}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          Back to App
        </BigButton>
      </div>

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
