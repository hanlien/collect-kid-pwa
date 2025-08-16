'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';

interface LogEntry {
  id?: string;
  timestamp: string;
  level: number;
  message: string;
  data?: any;
  error?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  api?: string;
  duration?: number;
  environment?: string;
  deployment?: string;
  recognitionId?: string;
}

interface SessionSummary {
  sessionId: string;
  startTime?: string;
  duration?: number;
  status: string;
  imageSize?: number;
  logCount: number;
  error?: string;
  finalResult?: any;
  lastActivity?: string;
  llmResults?: any;
  scoring?: any;
  decision?: any;
}

export default function DebugPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('brandon2025');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [testResult, setTestResult] = useState<any>(null);

  // Simple password protection for production
  const DEBUG_PASSWORD = process.env.NEXT_PUBLIC_DEBUG_PASSWORD || 'brandon2025';

  const checkAuth = useCallback(() => {
    // In development, always allow access
    if (process.env.NODE_ENV === 'development') {
      setIsAuthorized(true);
      return;
    }
    // In production, require password
    setIsAuthorized(password === DEBUG_PASSWORD);
  }, [password, DEBUG_PASSWORD]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const testConnection = async () => {
    if (!isAuthorized) return;
    
    try {
      const response = await fetch(`/api/debug/test?password=${password}`);
      const data = await response.json();
      
      if (data.success) {
        setTestResult(data);
        setConnectionStatus('connected');
      } else {
        setError(data.error || 'Connection test failed');
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError('Connection test failed');
      setConnectionStatus('error');
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/logs-recognition`);
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
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
    }
  }, [isAuthorized, fetchLogs]);

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
    
    if (!window.confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const response = await fetch(`/api/logs-recognition`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setLogs([]);
        setSessionSummaries([]);
        setSessionLogs([]);
        setSelectedSession(null);
        window.alert('All logs cleared successfully');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  // Extract LLM results from session logs
  const extractLLMResults = (sessionLogs: LogEntry[]) => {
    const llmResults: any = {};
    
    sessionLogs.forEach(log => {
      if (log.message.includes('ai_router_complete') && log.data) {
        llmResults.model = log.data.model;
        llmResults.provider = log.data.provider;
        llmResults.cost = log.data.actualCost;
        llmResults.responseTime = log.data.responseTime;
        llmResults.tokens = log.data.tokens;
      }
      if (log.message.includes('llm_only_success') && log.data) {
        llmResults.confidence = log.data.confidence;
        llmResults.model = log.data.model;
        llmResults.provider = 'ai-router';
        if (!llmResults.cost && log.data.cost) {
          llmResults.cost = log.data.cost;
        }
        if (!llmResults.responseTime && log.data.responseTime) {
          llmResults.responseTime = log.data.responseTime;
        }
      }
      if (log.message.includes('ai_router_model_selected') && log.data) {
        if (!llmResults.model) {
          llmResults.model = log.data.model;
        }
        if (!llmResults.provider) {
          llmResults.provider = log.data.provider;
        }
      }
    });
    
    return llmResults;
  };

  // Extract final result from session logs
  const extractFinalResult = (sessionLogs: LogEntry[]) => {
    let finalResult: any = null;
    
    sessionLogs.forEach(log => {
      if (log.message.includes('llm_only_final_success') && log.data?.result) {
        finalResult = log.data.result;
      } else if (log.message.includes('llm_only_success') && log.data) {
        finalResult = {
          commonName: log.data.commonName || 'Unknown',
          scientificName: log.data.scientificName || '',
          confidence: log.data.confidence || 0.6,
          category: log.data.category || 'mysterious',
          provider: 'ai-router',
          model: log.data.model
        };
      }
    });
    
    return finalResult;
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
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

        {/* Recent Sessions */}
        <Card className="p-6">
          <Typography variant="h2" className="mb-4">
            Recent Recognition Sessions ({sessionSummaries.length})
          </Typography>
          
          {sessionSummaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recognition sessions found. Try scanning an image to generate logs.
            </div>
          ) : (
            <div className="space-y-4">
              {sessionSummaries.slice(0, 5).map((session) => (
                <div
                  key={session.sessionId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => fetchSessionLogs(session.sessionId)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                        {session.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {session.logCount} logs • {session.duration ? `${session.duration}ms` : 'Unknown duration'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {session.lastActivity ? new Date(session.lastActivity).toLocaleTimeString() : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="font-mono text-xs text-gray-400">{session.sessionId}</div>
                    {session.finalResult && (
                      <div className="font-medium text-green-700 text-lg">
                        🎯 {session.finalResult.commonName || session.finalResult.canonicalName}
                        {session.finalResult.confidence && (
                          <span className="text-sm ml-2 text-gray-500">
                            ({Math.round(session.finalResult.confidence * 100)}% confidence)
                          </span>
                        )}
                      </div>
                    )}
                    {session.error && (
                      <div className="text-red-600">❌ Error: {session.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Session Details */}
        {selectedSession && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h2">
                Session Analysis: {selectedSession.slice(0, 20)}...
              </Typography>
              <Button
                onClick={() => setSelectedSession(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            
            {sessionLogs.length > 0 && (
              <div className="space-y-6">
                {/* Final Result */}
                {(() => {
                  const finalResult = extractFinalResult(sessionLogs);
                  return finalResult ? (
                    <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                      <Typography variant="h3" className="mb-3 text-green-800">🎯 Final Result</Typography>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                        <div>
                          <strong>Species:</strong> {finalResult.commonName}
                        </div>
                        <div>
                          <strong>Confidence:</strong> {Math.round(finalResult.confidence * 100)}%
                        </div>
                        <div>
                          <strong>Category:</strong> {finalResult.category}
                        </div>
                        <div>
                          <strong>Provider:</strong> {finalResult.provider}
                        </div>
                        {finalResult.scientificName && (
                          <div className="md:col-span-2">
                            <strong>Scientific Name:</strong> {finalResult.scientificName}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* LLM Results */}
                {(() => {
                  const llmResults = extractLLMResults(sessionLogs);
                  return Object.keys(llmResults).length > 0 ? (
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <Typography variant="h3" className="mb-3 text-blue-800">🤖 AI Model Used</Typography>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-lg">
                        {llmResults.model && <div><strong>Model:</strong> {llmResults.model}</div>}
                        {llmResults.provider && <div><strong>Provider:</strong> {llmResults.provider}</div>}
                        {llmResults.confidence && <div><strong>Confidence:</strong> {Math.round(llmResults.confidence * 100)}%</div>}
                        {llmResults.cost && <div><strong>Cost:</strong> ${llmResults.cost.toFixed(6)}</div>}
                        {llmResults.responseTime && <div><strong>Time:</strong> {llmResults.responseTime}ms</div>}
                        {llmResults.tokens && <div><strong>Tokens:</strong> {llmResults.tokens}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                      <Typography variant="h3" className="mb-3 text-gray-800">🤖 AI Model Used</Typography>
                      <div className="text-gray-500">No AI model information found</div>
                    </div>
                  );
                })()}

                {/* Processing Steps */}
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <Typography variant="h3" className="mb-3 text-purple-800">⚡ Processing Steps</Typography>
                  <div className="space-y-2">
                    {sessionLogs.slice(0, 10).map((log, index) => (
                      <div key={log.id || index} className="flex items-center gap-3 text-sm">
                        <span className="text-lg">{getLevelEmoji(log.level)}</span>
                        <span className="text-gray-600">{log.message}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Summary Stats */}
        <Card className="p-6">
          <Typography variant="h2" className="mb-4">
            Summary ({logs.length} total logs)
          </Typography>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-sm text-blue-800">Total Logs</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {sessionSummaries.filter(s => s.status === 'success').length}
              </div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {sessionSummaries.filter(s => s.status === 'failed').length}
              </div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{sessionSummaries.length}</div>
              <div className="text-sm text-purple-800">Sessions</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
