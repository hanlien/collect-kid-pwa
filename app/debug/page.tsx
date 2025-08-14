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

        {/* Detailed Session Logs */}
        {selectedSession && (
          <Card className="mb-6 p-6">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h2">
                🔍 Session Analysis: {selectedSession.slice(-8)}
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sessionLogs.map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className="border-l-4 border-blue-200 pl-4 py-3 bg-blue-50 rounded-r-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getLevelIcon(log.level)}</span>
                      <span className={`text-sm font-semibold ${getLevelColor(log.level)}`}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-sm text-gray-700 font-medium">
                        {log.message}
                      </span>
                    </div>
                    
                    {log.data && (
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <div className="text-xs font-semibold text-gray-600 mb-2">📊 Data:</div>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {log.error && (
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <div className="text-xs font-semibold text-red-700 mb-1">❌ Error:</div>
                        <div className="text-xs text-red-600">{log.error}</div>
                      </div>
                    )}
                  </div>
                ))}
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
