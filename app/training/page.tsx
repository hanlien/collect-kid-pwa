'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BigButton } from '@/components/ui/BigButton';
import { ArrowLeft, Download, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface TrainingSample {
  id: string;
  image_url: string;
  original_prediction: {
    category: string;
    canonicalName: string;
    commonName?: string;
    confidence: number;
  };
  is_correct: boolean;
  correction?: string;
  confidence: number;
  category: string;
  provider: string;
  created_at: string;
  training_status?: string;
}

interface TrainingStats {
  total_samples: number;
  correct_predictions: number;
  incorrect_predictions: number;
  accuracy_rate: string;
  by_category: {
    flower: number;
    bug: number;
    animal: number;
  };
  by_provider: {
    inaturalist: number;
    plantid: number;
    gcv: number;
  };
}

export default function TrainingPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/export-training-data?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setSamples(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTrainingData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/export-training-data?format=${format}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export training data:', error);
    }
  };

  const markForTraining = async () => {
    if (selectedSamples.length === 0) return;

    try {
      const response = await fetch('/api/export-training-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_for_training',
          sample_ids: selectedSamples
        })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedSamples([]);
        loadTrainingData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to mark samples for training:', error);
    }
  };

  const filteredSamples = samples.filter(sample => {
    if (filter === 'correct') return sample.is_correct;
    if (filter === 'incorrect') return !sample.is_correct;
    return true;
  });

  const toggleSampleSelection = (sampleId: string) => {
    setSelectedSamples(prev => 
      prev.includes(sampleId) 
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    );
  };

  const selectAll = () => {
    setSelectedSamples(filteredSamples.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSamples([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BigButton
            onClick={() => router.push('/parent')}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Parent Dashboard
          </BigButton>
          <h1 className="text-3xl font-bold text-gray-800">Training Data Dashboard</h1>
        </div>
        
        <div className="flex gap-2">
          <BigButton
            onClick={() => exportTrainingData('json')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </BigButton>
          <BigButton
            onClick={() => exportTrainingData('csv')}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </BigButton>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total_samples}</div>
            <div className="text-sm text-gray-600">Total Samples</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-green-600">{stats.correct_predictions}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-red-600">{stats.incorrect_predictions}</div>
            <div className="text-sm text-gray-600">Incorrect</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.accuracy_rate}</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All ({samples.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'correct' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Correct ({samples.filter(s => s.is_correct).length})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'incorrect' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Incorrect ({samples.filter(s => !s.is_correct).length})
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
            >
              Deselect All
            </button>
            {selectedSamples.length > 0 && (
              <BigButton
                onClick={markForTraining}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Mark {selectedSamples.length} for Training
              </BigButton>
            )}
          </div>
        </div>
      </div>

      {/* Samples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            className={`bg-white rounded-xl p-4 shadow-lg border-2 transition-all ${
              selectedSamples.includes(sample.id) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedSamples.includes(sample.id)}
                  onChange={() => toggleSampleSelection(sample.id)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  sample.is_correct 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {sample.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(sample.created_at).toLocaleDateString()}
              </span>
            </div>

            {sample.image_url && (
              <img
                src={sample.image_url}
                alt="Sample"
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-gray-700">Prediction:</div>
                <div className="text-sm text-gray-900">
                  {sample.original_prediction.commonName || sample.original_prediction.canonicalName}
                </div>
              </div>

              {sample.correction && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Correction:</div>
                  <div className="text-sm text-red-600">{sample.correction}</div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Confidence: {Math.round(sample.confidence * 100)}%</span>
                <span className="capitalize">{sample.category}</span>
                <span>{sample.provider}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No training data yet</h3>
          <p className="text-gray-600">Start using the app to collect training feedback!</p>
        </div>
      )}
    </div>
  );
}
