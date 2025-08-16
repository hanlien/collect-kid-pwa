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

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
    }
  }, [isAuthorized]);

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
        // For AI-only, we might not have cost/tokens in the success log
        if (!llmResults.cost && log.data.cost) {
          llmResults.cost = log.data.cost;
        }
        if (!llmResults.responseTime && log.data.responseTime) {
          llmResults.responseTime = log.data.responseTime;
        }
      }
      // Also check for ai_router_model_selected for model info
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

  // Extract scoring information
  const extractScoring = (sessionLogs: LogEntry[]) => {
    const scoring: any = {};
    
    sessionLogs.forEach(log => {
      if (log.message.includes('scoring_details') && log.data?.candidate) {
        scoring.candidate = log.data.candidate;
      }
      if (log.message.includes('decision_making') && log.data) {
        scoring.mode = log.data.mode;
        scoring.margin = log.data.margin;
        scoring.topCandidates = log.data.topCandidates;
      }
    });
    
    return scoring;
  };

  // Extract decision information
  const extractDecision = (sessionLogs: LogEntry[]) => {
    const decision: any = {};
    
    sessionLogs.forEach(log => {
      if (log.message.includes('hybrid_success') && log.data) {
        decision.finalProvider = log.data.finalProvider;
        decision.backupProvider = log.data.backupProvider;
        decision.aiConfidence = log.data.aiConfidence;
        decision.traditionalConfidence = log.data.traditionalConfidence;
      }
      if (log.message.includes('ai_only_success') && log.data) {
        decision.provider = log.data.provider;
        decision.confidence = log.data.confidence;
      }
      if (log.message.includes('llm_only_success') && log.data) {
        decision.provider = 'ai-router';
        decision.confidence = log.data.confidence;
        decision.model = log.data.model;
      }
    });
    
    return decision;
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
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Recognition Sessions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="space-y-3">
                {sessionSummaries.slice(0, 10).map((session) => (
                  <div
                    key={session.sessionId}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => fetchSessionLogs(session.sessionId)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {session.logCount} logs
                        </span>
                      </div>
                                             <span className="text-xs text-gray-400">
                         {session.lastActivity ? new Date(session.lastActivity).toLocaleTimeString() : 'Unknown'}
                       </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="font-mono text-xs">{session.sessionId}</div>
                      {session.duration && (
                        <div>⏱️ Duration: {session.duration}ms</div>
                      )}
                      {session.finalResult && (
                        <div className="font-medium text-green-700">
                          🎯 Result: {session.finalResult.commonName || session.finalResult.canonicalName}
                          {session.finalResult.confidence && (
                            <span className="text-xs ml-2">
                              ({Math.round(session.finalResult.confidence * 100)}%)
                            </span>
                          )}
                        </div>
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
              <div className="flex justify-between items-center mb-4">
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
                <div className="space-y-4">
                  {/* LLM Results */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Typography variant="h3" className="mb-2 text-blue-800">🤖 LLM Results</Typography>
                    {(() => {
                      const llmResults = extractLLMResults(sessionLogs);
                      return Object.keys(llmResults).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {llmResults.model && <div><strong>Model:</strong> {llmResults.model}</div>}
                          {llmResults.provider && <div><strong>Provider:</strong> {llmResults.provider}</div>}
                          {llmResults.confidence && <div><strong>Confidence:</strong> {Math.round(llmResults.confidence * 100)}%</div>}
                          {llmResults.cost && <div><strong>Cost:</strong> ${llmResults.cost.toFixed(6)}</div>}
                          {llmResults.responseTime && <div><strong>Response Time:</strong> {llmResults.responseTime}ms</div>}
                          {llmResults.tokens && <div><strong>Tokens:</strong> {llmResults.tokens}</div>}
                        </div>
                      ) : (
                        <div className="text-gray-500">No LLM results found</div>
                      );
                    })()}
                  </div>

                  {/* Scoring */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Typography variant="h3" className="mb-2 text-green-800">📊 Scoring</Typography>
                    {(() => {
                      const scoring = extractScoring(sessionLogs);
                      return Object.keys(scoring).length > 0 ? (
                        <div className="space-y-2 text-sm">
                          {scoring.mode && <div><strong>Decision Mode:</strong> {scoring.mode}</div>}
                          {scoring.margin && <div><strong>Margin:</strong> {scoring.margin}</div>}
                          {scoring.candidate && (
                            <div>
                              <strong>Top Candidate:</strong> {scoring.candidate.commonName || scoring.candidate.scientificName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500">No scoring data found</div>
                      );
                    })()}
                  </div>

                  {/* Final Decision */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <Typography variant="h3" className="mb-2 text-purple-800">🎯 Final Decision</Typography>
                    {(() => {
                      const decision = extractDecision(sessionLogs);
                      return Object.keys(decision).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {decision.finalProvider && <div><strong>Primary:</strong> {decision.finalProvider}</div>}
                          {decision.backupProvider && <div><strong>Backup:</strong> {decision.backupProvider}</div>}
                          {decision.provider && <div><strong>Provider:</strong> {decision.provider}</div>}
                          {decision.confidence && <div><strong>Confidence:</strong> {Math.round(decision.confidence * 100)}%</div>}
                          {decision.aiConfidence && <div><strong>AI Confidence:</strong> {Math.round(decision.aiConfidence * 100)}%</div>}
                          {decision.traditionalConfidence && <div><strong>Traditional:</strong> {Math.round(decision.traditionalConfidence * 100)}%</div>}
                        </div>
                      ) : (
                        <div className="text-gray-500">No decision data found</div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Detailed Logs */}
        {selectedSession && (
          <Card className="p-6">
            <Typography variant="h2" className="mb-4">
              Detailed Logs: {selectedSession}
            </Typography>
            
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

        {/* All Logs Summary */}
        <Card className="p-6">
          <Typography variant="h2" className="mb-4">
            All Logs Summary ({logs.length})
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-sm text-blue-800">Total Logs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.level === 0).length}
              </div>
              <div className="text-sm text-green-800">Debug Logs</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.level === 1).length}
              </div>
              <div className="text-sm text-yellow-800">Info Logs</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {logs.filter(log => log.level === 2).length}
              </div>
              <div className="text-sm text-orange-800">Warning Logs</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.level === 3).length}
              </div>
              <div className="text-sm text-red-800">Error Logs</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sessionSummaries.length}</div>
              <div className="text-sm text-purple-800">Recognition Sessions</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
