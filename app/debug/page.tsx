'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';

interface LogEntry {
  timestamp: string;
  level: number;
  message: string;
  data?: any;
  error?: string;
  recognitionId?: string;
  api?: string;
  duration?: number;
}

interface SessionSummary {
  sessionId: string;
  startTime: string;
  duration?: number;
  status: 'failed' | 'success' | 'in_progress';
  imageSize?: number;
  visionLabels: number;
  decision?: string;
  logCount: number;
  error?: string;
  finalResult?: any;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');

  // Simple password protection for production
  const DEBUG_PASSWORD = process.env.NEXT_PUBLIC_DEBUG_PASSWORD || 'brandon2024';

  const checkAuth = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsAuthorized(true);
    } else {
      // In production, require password
      setIsAuthorized(password === DEBUG_PASSWORD);
    }
  }, [password]);

  useEffect(() => {
    checkAuth();
  }, [password, checkAuth]);

  const fetchLogs = useCallback(async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    try {
                    const response = await fetch('/api/logs-recognition');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs || []);
        setSessionSummaries(data.sessionSummaries || []);
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  const fetchSessionLogs = async (sessionId: string) => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch(`/api/logs-recognition?recognitionId=${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSessionLogs(data.logs || []);
        setSelectedSession(sessionId);
      } else {
        setError(data.error || 'Failed to fetch session logs');
      }
    } catch (error) {
      console.error('Failed to fetch session logs:', error);
      setError('Failed to fetch session logs');
    }
  };

  const clearLogs = async () => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch('/api/logs-recognition', { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setLogs([]);
        setSessionSummaries([]);
        setSessionLogs([]);
        setSelectedSession(null);
      } else {
        setError(data.error || 'Failed to clear logs');
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
      setError('Failed to clear logs');
    }
  };

  const exportLogs = async () => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch('/api/logs-recognition?export=true');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recognition-logs.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
      setError('Failed to export logs');
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
    }
  }, [isAuthorized, fetchLogs]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'text-blue-600'; // DEBUG
      case 1: return 'text-green-600'; // INFO
      case 2: return 'text-yellow-600'; // WARN
      case 3: return 'text-red-600'; // ERROR
      default: return 'text-gray-600';
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 0: return '🔍';
      case 1: return 'ℹ️';
      case 2: return '⚠️';
      case 3: return '❌';
      default: return '📝';
    }
  };

  // Helper functions to extract API results
  const extractApiPerformance = (logs: any[]) => {
    const apis = [
      { name: 'Google Vision', pattern: 'Vision API Results', color: 'green' },
      { name: 'Knowledge Graph', pattern: 'Knowledge Graph Results', color: 'purple' },
      { name: 'Plant.id', pattern: 'Plant.id Provider Results', color: 'emerald' },
      { name: 'iNaturalist', pattern: 'iNaturalist Provider Results', color: 'orange' }
    ];

    return apis.map(api => {
      const log = logs.find(l => l.message.includes(api.pattern));
      if (log) {
        return {
          name: api.name,
          time: log.data?.processingTime || 0,
          status: log.data?.processingTime ? '✅ Success' : '❌ Failed',
          color: api.color
        };
      }
      return {
        name: api.name,
        time: 0,
        status: '⏭️ Skipped',
        color: api.color
      };
    });
  };

  const extractVisionResults = (logs: any[]) => {
    const visionLog = logs.find(l => l.message.includes('Vision API Results'));
    if (!visionLog?.data) return <div className="text-gray-500">No Vision results found</div>;

    const { labels, webBestGuess, processingTime } = visionLog.data;
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600">Processing Time: <span className="font-semibold">{processingTime}ms</span></div>
        
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Top Labels:</div>
          <div className="space-y-1">
            {labels?.slice(0, 5).map((label: any, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{label.desc}</span>
                <span className="font-semibold">{(label.score * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Web Best Guesses:</div>
          <div className="space-y-1">
            {webBestGuess?.slice(0, 3).map((guess: string, index: number) => (
              <div key={index} className="text-xs text-gray-600">• {guess}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const extractKGResults = (logs: any[]) => {
    const kgLog = logs.find(l => l.message.includes('Knowledge Graph Results'));
    if (!kgLog?.data) return <div className="text-gray-500">No Knowledge Graph results found</div>;

    const { topResults, processingTime } = kgLog.data;
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600">Processing Time: <span className="font-semibold">{processingTime}ms</span></div>
        
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Top Results:</div>
          <div className="space-y-1">
            {topResults?.slice(0, 5).map((result: any, index: number) => (
              <div key={index} className="text-xs">
                <div className="font-semibold">{result.commonName}</div>
                {result.scientificName && <div className="text-gray-500 italic">{result.scientificName}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const extractPlantIdResults = (logs: any[]) => {
    const plantLog = logs.find(l => l.message.includes('Plant.id Provider Results'));
    if (!plantLog?.data) return <div className="text-gray-500">No Plant.id results found</div>;

    const { topResults, processingTime } = plantLog.data;
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600">Processing Time: <span className="font-semibold">{processingTime}ms</span></div>
        
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Top Results:</div>
          <div className="space-y-1">
            {topResults?.slice(0, 3).map((result: any, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{result.name}</span>
                <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const extractINatResults = (logs: any[]) => {
    const inatLog = logs.find(l => l.message.includes('iNaturalist Provider Results'));
    if (!inatLog?.data) return <div className="text-gray-500">No iNaturalist results found</div>;

    const { topResults, processingTime } = inatLog.data;
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600">Processing Time: <span className="font-semibold">{processingTime}ms</span></div>
        
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Top Results:</div>
          <div className="space-y-1">
            {topResults?.slice(0, 3).map((result: any, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{result.name}</span>
                <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const extractScoringBreakdown = (logs: any[]) => {
    const decisionLog = logs.find(l => l.message.includes('Decision Making'));
    const candidateLog = logs.find(l => l.message.includes('Candidate Building'));
    
    if (!decisionLog?.data) return <div className="text-gray-500">No scoring breakdown found</div>;

    const { mode, topCandidates, decisionReason } = decisionLog.data;
    
    return (
      <div className="space-y-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-semibold text-gray-700 mb-2">Final Decision:</div>
          <div className="text-sm">
            <span className="font-semibold">Mode:</span> {mode} | 
            <span className="font-semibold ml-2">Reason:</span> {decisionReason}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Top Candidates & Scores:</div>
          <div className="space-y-2">
            {topCandidates?.slice(0, 3).map((candidate: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  #{index + 1}: {candidate.commonName}
                </div>
                <div className="text-xs text-gray-600 mb-2">{candidate.scientificName}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>Vision: <span className="font-semibold">{(candidate.scores.vision * 100).toFixed(1)}%</span></div>
                  <div>Web: <span className="font-semibold">{(candidate.scores.webGuess * 100).toFixed(1)}%</span></div>
                  <div>KG: <span className="font-semibold">{(candidate.scores.kgMatch * 100).toFixed(1)}%</span></div>
                  <div>Provider: <span className="font-semibold">{(candidate.scores.provider * 100).toFixed(1)}%</span></div>
                  <div>Crop: <span className="font-semibold">{(candidate.scores.cropAgree * 100).toFixed(1)}%</span></div>
                  <div>Total: <span className="font-semibold text-green-600">{((candidate.totalScore || 0) * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Authentication screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <Typography variant="h1" className="text-center mb-6">
            🔐 Debug Access
          </Typography>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter debug password"
              />
            </div>
            
            <Button onClick={checkAuth} className="w-full">
              🔓 Access Debug Panel
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded">
              💡 Development mode: No password required
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Typography variant="h1" className="text-center mb-8">
          🐛 Recognition Pipeline Debug
        </Typography>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
            <Typography variant="body" className="text-red-700">
              ❌ {error}
            </Typography>
          </Card>
        )}

        {/* Controls */}
        <Card className="mb-6 p-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={fetchLogs} disabled={loading}>
              {loading ? 'Loading...' : '🔄 Refresh Logs'}
            </Button>
            <Button onClick={clearLogs} variant="outline">
              🗑️ Clear Logs
            </Button>
            <Button onClick={exportLogs} variant="outline">
              📥 Export Logs
            </Button>
            <div className="text-sm text-gray-600">
              Environment: {process.env.NODE_ENV}
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <Card className="mb-6 p-6">
          <Typography variant="h2" className="mb-6 text-center">
            📈 Recognition Performance Overview
          </Typography>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl font-bold">{sessionSummaries.length}</div>
              <div className="text-sm">Total Sessions</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-sm">Log Entries</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl font-bold">
                {sessionSummaries.filter(s => s.status === 'success').length}
              </div>
              <div className="text-sm">Successful</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl font-bold">
                {sessionSummaries.filter(s => s.status === 'failed').length}
              </div>
              <div className="text-sm">Failed</div>
            </div>
          </div>

          {/* Average Performance */}
          {sessionSummaries.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(sessionSummaries.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionSummaries.length)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(sessionSummaries.reduce((sum, s) => sum + (s.visionLabels || 0), 0) / sessionSummaries.length)}
                </div>
                <div className="text-sm text-gray-600">Avg Vision Labels</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(sessionSummaries.reduce((sum, s) => sum + (s.imageSize || 0), 0) / sessionSummaries.length).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Avg Image Size</div>
              </div>
            </div>
          )}
        </Card>

        {/* Session Summaries */}
        <Card className="mb-6 p-6">
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h2">
              🔍 Recent Recognition Sessions ({sessionSummaries.length})
            </Typography>
            <div className="text-sm text-gray-500">
              Showing last 20 sessions
            </div>
          </div>
          
          {sessionSummaries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <Typography variant="h3" className="text-gray-500 mb-2">
                No Recognition Sessions Found
              </Typography>
              <Typography variant="body" className="text-gray-400">
                Try scanning an image to see recognition results here!
              </Typography>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessionSummaries.slice(0, 20).map((session, index) => (
                <Card 
                  key={session.sessionId} 
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedSession === session.sessionId ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => fetchSessionLogs(session.sessionId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">#{index + 1}</span>
                      <Typography variant="h3" className="text-sm font-mono text-gray-600">
                        {session.sessionId.slice(-6)}
                      </Typography>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'success' ? 'bg-green-100 text-green-800' :
                      session.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status === 'success' ? '✅ Success' : 
                       session.status === 'failed' ? '❌ Failed' : '⏳ Processing'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">🕒 Time:</span>
                      <span className="font-medium">{new Date(session.startTime).toLocaleTimeString()}</span>
                    </div>
                    {session.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">⏱️ Duration:</span>
                        <span className={`font-medium ${session.duration > 5000 ? 'text-red-600' : session.duration > 3000 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {session.duration}ms
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">📏 Size:</span>
                      <span className="font-medium">{session.imageSize ? (session.imageSize / 1024).toFixed(1) : '0'}KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">🏷️ Labels:</span>
                      <span className="font-medium">{session.visionLabels}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">🎯 Decision:</span>
                      <span className="font-medium">{session.decision || 'N/A'}</span>
                    </div>
                  </div>

                  {session.error && (
                    <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                      <div className="font-semibold">❌ Error:</div>
                      <div className="truncate">{session.error}</div>
                    </div>
                  )}

                  {session.finalResult && (
                    <div className="mt-3 p-2 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                      <div className="font-semibold">✅ Result:</div>
                      <div className="truncate">
                        {session.finalResult.commonName || session.finalResult.canonicalName}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* API Results Analysis */}
        {selectedSession && (
          <Card className="mb-6 p-6">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h2">
                🔬 API Results Analysis: {selectedSession.slice(-8)}
              </Typography>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                ✕ Close
              </button>
            </div>
            
            {sessionLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <div>No detailed logs found for this session</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* API Performance Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <Typography variant="h3" className="mb-3 text-blue-900">
                    ⚡ API Performance Summary
                  </Typography>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {extractApiPerformance(sessionLogs).map((api, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="text-sm font-semibold text-gray-700">{api.name}</div>
                        <div className={`text-lg font-bold ${api.time > 2000 ? 'text-red-600' : api.time > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {api.time}ms
                        </div>
                        <div className="text-xs text-gray-500">{api.status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Results Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Google Vision Results */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <Typography variant="h3" className="mb-3 text-green-900">
                      🔍 Google Vision Results
                    </Typography>
                    {extractVisionResults(sessionLogs)}
                  </div>

                  {/* Knowledge Graph Results */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                    <Typography variant="h3" className="mb-3 text-purple-900">
                      🧠 Knowledge Graph Results
                    </Typography>
                    {extractKGResults(sessionLogs)}
                  </div>

                  {/* Plant.id Results */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                    <Typography variant="h3" className="mb-3 text-emerald-900">
                      🌱 Plant.id Results
                    </Typography>
                    {extractPlantIdResults(sessionLogs)}
                  </div>

                  {/* iNaturalist Results */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                    <Typography variant="h3" className="mb-3 text-orange-900">
                      🌿 iNaturalist Results
                    </Typography>
                    {extractINatResults(sessionLogs)}
                  </div>
                </div>

                {/* Scoring Breakdown */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                  <Typography variant="h3" className="mb-3 text-indigo-900">
                    🎯 Scoring Breakdown & Final Decision
                  </Typography>
                  {extractScoringBreakdown(sessionLogs)}
                </div>

                {/* Raw Logs */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <Typography variant="h3" className="mb-3 text-gray-900">
                    📋 Raw Logs
                  </Typography>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sessionLogs.map((log, index) => (
                      <div key={`${log.timestamp}-${index}`} className="border-l-4 border-gray-300 pl-3 py-2 bg-white rounded-r">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{getLevelIcon(log.level)}</span>
                          <span className={`text-xs font-semibold ${getLevelColor(log.level)}`}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-gray-600">
                            {log.message}
                          </span>
                        </div>
                        
                        {log.data && (
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-20 overflow-y-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* All Logs */}
        <Card className="p-4">
          <Typography variant="h2" className="mb-4">
            📝 All Recognition Logs ({logs.length})
          </Typography>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={`${log.timestamp}-${log.recognitionId}-${index}`} className="border-l-4 border-gray-200 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{getLevelIcon(log.level)}</span>
                  <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-sm text-gray-500 font-mono">
                    {log.recognitionId?.slice(-8)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {log.message}
                  </span>
                </div>
                
                {log.data && (
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
