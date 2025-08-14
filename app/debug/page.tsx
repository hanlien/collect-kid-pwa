'use client';

import { useState, useEffect } from 'react';
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

  const checkAuth = () => {
    if (process.env.NODE_ENV === 'development') {
      setIsAuthorized(true);
    } else {
      // In production, require password
      setIsAuthorized(password === DEBUG_PASSWORD);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [password]);

  const fetchLogs = async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/logs/recognition');
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
  };

  const fetchSessionLogs = async (sessionId: string) => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch(`/api/logs/recognition?recognitionId=${sessionId}`);
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
      const response = await fetch('/api/logs/recognition', { method: 'DELETE' });
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
      const response = await fetch('/api/logs/recognition?export=true');
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
  }, [isAuthorized]);

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

        {/* Session Summaries */}
        <Card className="mb-6 p-4">
          <Typography variant="h2" className="mb-4">
            📊 Recognition Sessions ({sessionSummaries.length})
          </Typography>
          
          {sessionSummaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recognition sessions found. Try scanning an image first!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessionSummaries.map((session) => (
                <Card 
                  key={session.sessionId} 
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedSession === session.sessionId ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => fetchSessionLogs(session.sessionId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Typography variant="h3" className="text-sm font-mono">
                      {session.sessionId.slice(-8)}
                    </Typography>
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.status === 'success' ? 'bg-green-100 text-green-800' :
                      session.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>🕒 {new Date(session.startTime).toLocaleTimeString()}</div>
                    {session.duration && <div>⏱️ {session.duration}ms</div>}
                    <div>📏 {session.imageSize?.toLocaleString()} bytes</div>
                    <div>🏷️ {session.visionLabels} labels</div>
                    <div>🎯 {session.decision || 'N/A'}</div>
                    <div>📝 {session.logCount} logs</div>
                  </div>

                  {session.error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded">
                      ❌ {session.error}
                    </div>
                  )}

                  {session.finalResult && (
                    <div className="mt-2 p-2 bg-green-50 text-green-700 text-xs rounded">
                      ✅ {session.finalResult.commonName || session.finalResult.canonicalName}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Detailed Session Logs */}
        {selectedSession && (
          <Card className="mb-6 p-4">
            <Typography variant="h2" className="mb-4">
              📋 Session Details: {selectedSession.slice(-8)}
            </Typography>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessionLogs.map((log, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getLevelIcon(log.level)}</span>
                    <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>
                      {new Date(log.timestamp).toLocaleTimeString()}
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
                  
                  {log.error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {log.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Logs */}
        <Card className="p-4">
          <Typography variant="h2" className="mb-4">
            📝 All Recognition Logs ({logs.length})
          </Typography>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
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
