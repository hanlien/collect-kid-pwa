'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';

interface LogEntry {
  id?: string;
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
  logCount: number;
  error?: string;
  finalResult?: any;
  lastActivity: string;
}

interface DebugTestResult {
  success: boolean;
  timestamp: string;
  environment: string;
  tests: {
    databaseConnection: boolean;
    loggingTest: boolean;
    recentLogsCount: number;
  };
  environmentVariables: {
    supabaseUrl: boolean;
    supabaseServiceKey: boolean;
    supabaseAnonKey: boolean;
    nodeEnv: string;
  };
  recentLogs: Array<{
    timestamp: string;
    message: string;
    level: number;
  }>;
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
  const [testResult, setTestResult] = useState<DebugTestResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');

  // Simple password protection for production
  const DEBUG_PASSWORD = process.env.NEXT_PUBLIC_DEBUG_PASSWORD || 'brandon2025';

  const checkAuth = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsAuthorized(true);
    } else {
      // In production, require password
      setIsAuthorized(password === DEBUG_PASSWORD);
    }
  }, [password, DEBUG_PASSWORD]);

  useEffect(() => {
    checkAuth();
  }, [password, checkAuth]);

  const testConnection = useCallback(async () => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch(`/api/debug/test?password=${password}`);
      const data = await response.json();
      
      if (data.success) {
        setTestResult(data);
        setConnectionStatus(data.tests.databaseConnection ? 'connected' : 'disconnected');
      } else {
        setError(data.error || 'Connection test failed');
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError('Connection test failed');
      setConnectionStatus('error');
    }
  }, [isAuthorized, password]);

  const fetchLogs = useCallback(async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/debug/logs?password=${password}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs || []);
        setSessionSummaries(data.sessionSummaries || []);
        setConnectionStatus(data.connectionStatus || 'unknown');
      } else {
        setError(data.error || 'Failed to fetch logs');
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError('Failed to fetch logs');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, password]);

  const fetchSessionLogs = async (sessionId: string) => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch(`/api/debug/logs?recognitionId=${sessionId}&password=${password}`);
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
    
    if (!confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const response = await fetch(`/api/debug/logs?password=${password}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setLogs([]);
        setSessionSummaries([]);
        setSessionLogs([]);
        setSelectedSession(null);
        alert('All logs cleared successfully');
      } else {
        setError(data.error || 'Failed to clear logs');
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
      setError('Failed to clear logs');
    }
  };

  const getLevelEmoji = (level: number) => {
    switch (level) {
      case 0: return '🔍';
      case 1: return 'ℹ️';
      case 2: return '⚠️';
      case 3: return '❌';
      default: return '📝';
    }
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 0: return 'DEBUG';
      case 1: return 'INFO';
      case 2: return 'WARN';
      case 3: return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'in_progress': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6">
            <Typography variant="h1" className="mb-4">🔧 Debug Dashboard</Typography>
            <Typography variant="body" className="mb-4">
              Enter the debug password to access the dashboard:
            </Typography>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Debug password"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={checkAuth}>
                Access Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h1">🔧 Debug Dashboard</Typography>
            <div className="flex gap-2">
              <Button onClick={testConnection} variant="outline">
                Test Connection
              </Button>
              <Button onClick={fetchLogs} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh Logs'}
              </Button>
                             <Button onClick={clearLogs} variant="danger">
                 Clear All Logs
               </Button>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'disconnected' ? 'bg-red-500' :
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="font-medium">
                Database: {connectionStatus.toUpperCase()}
              </span>
            </div>
            {error && (
              <div className="text-red-600">
                Error: {error}
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Typography variant="h3" className="mb-2">Connection Test Results</Typography>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Database:</strong> {testResult.tests.databaseConnection ? '✅ Connected' : '❌ Disconnected'}
                </div>
                <div>
                  <strong>Logging:</strong> {testResult.tests.loggingTest ? '✅ Working' : '❌ Failed'}
                </div>
                <div>
                  <strong>Recent Logs:</strong> {testResult.tests.recentLogsCount}
                </div>
                <div>
                  <strong>Environment:</strong> {testResult.environment}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Session Summaries */}
        <Card className="p-6">
          <Typography variant="h2" className="mb-4">
            Recognition Sessions ({sessionSummaries.length})
          </Typography>
          
          {sessionSummaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recognition sessions found. Try scanning an image to generate logs.
            </div>
          ) : (
            <div className="space-y-2">
              {sessionSummaries.map((session) => (
                <div
                  key={session.sessionId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => fetchSessionLogs(session.sessionId)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-medium ${getStatusColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {session.logCount} logs
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Session: {session.sessionId}</div>
                        <div>Started: {session.startTime ? new Date(session.startTime).toLocaleString() : 'Unknown'}</div>
                        {session.duration && <div>Duration: {session.duration}ms</div>}
                        {session.imageSize && <div>Image Size: {session.imageSize} bytes</div>}
                        {session.error && <div className="text-red-600">Error: {session.error}</div>}
                        {session.finalResult && (
                          <div>
                            Result: {session.finalResult.commonName || session.finalResult.canonicalName}
                            (Confidence: {Math.round(session.finalResult.confidence * 100)}%)
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(session.lastActivity).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Session Logs */}
        {selectedSession && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h2">
                Session Logs: {selectedSession}
              </Typography>
              <Button
                onClick={() => setSelectedSession(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessionLogs.map((log, index) => (
                <div key={log.id || index} className="border rounded p-3 bg-white">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getLevelEmoji(log.level)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-600">
                          {getLevelName(log.level)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">{log.message}</div>
                      {log.data && (
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                      {log.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {log.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Logs */}
        <Card className="p-6">
          <Typography variant="h2" className="mb-4">
            All Logs ({logs.length})
          </Typography>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={log.id || index} className="border rounded p-3 bg-white">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getLevelEmoji(log.level)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-600">
                        {getLevelName(log.level)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.recognitionId && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {log.recognitionId}
                        </span>
                      )}
                    </div>
                    <div className="text-sm">{log.message}</div>
                    {log.data && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                    {log.error && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
