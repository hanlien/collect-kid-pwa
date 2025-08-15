import { createClient } from '@supabase/supabase-js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error | undefined;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  api?: string;
  duration?: number;
  environment?: string;
  deployment?: string;
  recognitionId?: string; // Track individual recognition sessions
}

// Supabase client for persistent logging (only create if environment variables are available)
let supabase: any = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.warn('Supabase client creation failed:', error);
  supabase = null;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private logLevel: LogLevel = LogLevel.INFO;
  private isProduction = process.env.NODE_ENV === 'production';
  private deploymentId = process.env.VERCEL_GIT_COMMIT_SHA || 'local';

  constructor() {
    // In production, we might want to send logs to a service
    if (typeof window !== 'undefined') {
      // Browser environment
      this.logLevel = LogLevel.DEBUG;
    } else {
      // Server environment
      this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    context?: { userId?: string; sessionId?: string; requestId?: string; api?: string; duration?: number; recognitionId?: string }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
      environment: process.env.NODE_ENV || 'unknown',
      deployment: this.deploymentId,
      ...context,
    };

    // Add to in-memory logs immediately (non-blocking)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Store in Supabase for persistence (when available) - NON-BLOCKING
    if (supabase) {
      // Fire and forget - don't await this
      (async () => {
        try {
          await supabase
            .from('logs')
            .insert({
              timestamp: entry.timestamp,
              level: entry.level,
              message: entry.message,
              data: entry.data ? JSON.stringify(entry.data) : null,
              error: entry.error ? entry.error.message : null,
              user_id: entry.userId,
              session_id: entry.sessionId,
              request_id: entry.requestId,
              api: entry.api,
              duration: entry.duration,
              environment: entry.environment,
              deployment: entry.deployment,
              recognition_id: entry.recognitionId
            });
        } catch (dbError: any) {
          console.error('Failed to store log in database:', dbError);
          // Continue with in-memory logging even if DB fails
        }
      })();
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private async sendToExternalService(entry: LogEntry) {
    if (!this.isProduction) return;

    try {
      // Option 1: Send to Vercel Analytics (if configured)
      if (process.env.VERCEL_ANALYTICS_ID) {
        // Vercel Analytics integration would go here
        console.log('📊 [VERCEL]', entry.message, entry.data || '');
      }

      // Option 2: Send to external logging service
      // Example: LogRocket, Sentry, DataDog, etc.
      if (process.env.LOG_SERVICE_URL) {
        await fetch(process.env.LOG_SERVICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      }

      // Option 3: Send to Supabase (if you want to store logs in your database)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Supabase logging integration would go here
        console.log('🗄️ [SUPABASE]', entry.message, entry.data || '');
      }

    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data, undefined, context);
    console.log(`🔍 [DEBUG] ${message}`, data || '');
    this.sendToExternalService(entry);
    return entry;
  }

  info(message: string, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, data, undefined, context);
    console.log(`ℹ️ [INFO] ${message}`, data || '');
    this.sendToExternalService(entry);
    return entry;
  }

  warn(message: string, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, data, undefined, context);
    console.warn(`⚠️ [WARN] ${message}`, data || '');
    this.sendToExternalService(entry);
    return entry;
  }

  error(message: string, error?: Error, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, data, error, context);
    console.error(`❌ [ERROR] ${message}`, error || '', data || '');
    this.sendToExternalService(entry);
    return entry;
  }

  // API-specific logging
  apiCall(api: string, method: string, data?: any, context?: any) {
    const startTime = Date.now();
    this.info(`API Call: ${method} ${api}`, data, { ...context, api });
    
    return {
      end: (result?: any, error?: Error, context?: any) => {
        const duration = Date.now() - startTime;
        if (error) {
          this.error(`API Error: ${method} ${api}`, error, result, { ...context, api, duration });
        } else {
          this.info(`API Success: ${method} ${api}`, result, { ...context, api, duration });
        }
      }
    };
  }

  // Recognition-specific logging with detailed pipeline tracking
  recognitionStart(imageSize?: number, context?: any) {
    const recognitionId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.info('🚀 Recognition Pipeline Started', { 
      imageSize, 
      recognitionId,
      timestamp: new Date().toISOString()
    }, { ...context, api: 'recognition', recognitionId });
    return recognitionId;
  }

  recognitionStep(step: string, data?: any, context?: any) {
    return this.debug(`🔄 Recognition Step: ${step}`, data, { ...context, api: 'recognition' });
  }

  // Vision API logging
  visionResults(visionBundle: any, processingTime: number, context?: any) {
    this.info('🔍 Vision API Results', {
      labels: visionBundle.labels?.slice(0, 5) || [],
      cropLabels: visionBundle.cropLabels?.slice(0, 3) || [],
      webBestGuess: visionBundle.webBestGuess || [],
      processingTime,
      totalLabels: visionBundle.labels?.length || 0,
      totalCropLabels: visionBundle.cropLabels?.length || 0,
    }, { ...context, api: 'recognition' });
  }

  // Plant gate decision
  plantGateDecision(isPlant: boolean, confidence: number, context?: any) {
    this.info('🌱 Plant Gate Decision', {
      isPlant,
      confidence,
      decision: isPlant ? 'Will call Plant.id API' : 'Skipping Plant.id API'
    }, { ...context, api: 'recognition' });
  }

  // Provider results logging
  providerResults(provider: string, results: any[], processingTime: number, context?: any) {
    this.info(`📊 ${provider} Provider Results`, {
      provider,
      resultCount: results.length,
      topResults: results.slice(0, 3).map(r => ({
        name: r.scientificName || r.commonName,
        confidence: r.confidence,
        source: r.source
      })),
      processingTime,
      allResults: results
    }, { ...context, api: 'recognition' });
  }

  // Knowledge Graph results
  kgResults(canonicalResults: any[], processingTime: number, context?: any) {
    this.info('🧠 Knowledge Graph Results', {
      resultCount: canonicalResults.length,
      topResults: canonicalResults.slice(0, 3).map(r => ({
        commonName: r.commonName,
        scientificName: r.scientificName,
        kgId: r.kgId,
        wikipediaTitle: r.wikipediaTitle
      })),
      processingTime,
      allResults: canonicalResults
    }, { ...context, api: 'recognition' });
  }

  // Candidate building and scoring
  candidateBuilding(candidates: any[], context?: any) {
    this.info('🏗️ Candidate Building', {
      totalCandidates: candidates.length,
      candidates: candidates.map(c => ({
        scientificName: c.scientificName,
        commonName: c.commonName,
        scores: c.scores,
        totalScore: c.totalScore
      }))
    }, { ...context, api: 'recognition' });
  }

  // Scoring details
  scoringDetails(candidate: any, context?: any) {
    this.debug('📈 Scoring Details', {
      candidate: {
        scientificName: candidate.scientificName,
        commonName: candidate.commonName,
        scores: {
          vision: candidate.scores?.vision,
          webGuess: candidate.scores?.webGuess,
          kgMatch: candidate.scores?.kgMatch,
          provider: candidate.scores?.provider,
          cropAgree: candidate.scores?.cropAgree,
          habitatTime: candidate.scores?.habitatTime
        },
        totalScore: candidate.totalScore
      }
    }, { ...context, api: 'recognition' });
  }

  // Decision making
  decisionMaking(decision: any, margin: number, context?: any) {
    this.info('🎯 Decision Making', {
      mode: decision.mode,
      margin,
      topCandidates: decision.mode === 'pick' ? 
        [decision.pick] : 
        decision.top3?.slice(0, 3),
      decisionReason: decision.mode === 'pick' ? 
        'High confidence single result' : 
        'Multiple candidates, showing top 3 for disambiguation'
    }, { ...context, api: 'recognition' });
  }

  // Final result
  recognitionSuccess(result: any, duration: number, context?: any) {
    this.info('✅ Recognition Successful', { 
      result: {
        canonicalName: result.canonicalName,
        commonName: result.commonName,
        category: result.category,
        confidence: result.confidence,
        provider: result.provider
      },
      duration,
      finalDecision: result
    }, { ...context, api: 'recognition' });
  }

  recognitionError(error: Error, context?: any) {
    return this.error('❌ Recognition Failed', error, undefined, { ...context, api: 'recognition' });
  }

  // User feedback logging
  userFeedback(originalResult: any, userCorrection: string, context?: any) {
    this.info('👤 User Feedback', {
      originalResult: {
        canonicalName: originalResult.canonicalName,
        commonName: originalResult.commonName,
        confidence: originalResult.confidence
      },
      userCorrection,
      feedbackType: 'correction'
    }, { ...context, api: 'recognition' });
  }

  // Collection-specific logging
  collectionAttempt(speciesData: any, context?: any) {
    return this.info('Collection attempt', speciesData, { ...context, api: 'collect' });
  }

  collectionSuccess(speciesData: any, coinsEarned: number, context?: any) {
    return this.info('Collection successful', { speciesData, coinsEarned }, { ...context, api: 'collect' });
  }

  collectionError(error: Error, speciesData?: any, context?: any) {
    return this.error('Collection failed', error, speciesData, { ...context, api: 'collect' });
  }

  // Get logs for debugging (works in both dev and prod)
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    // First get in-memory logs
    let filtered = this.logs;
    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }
    if (limit) {
      filtered = filtered.slice(-limit);
    }

    // In production, also fetch from database (non-blocking)
    if (this.isProduction && supabase) {
      // Fire and forget - don't block the response
      (async () => {
        try {
          let query = supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false });

          if (level !== undefined) {
            query = query.gte('level', level);
          }
          if (limit) {
            query = query.limit(limit);
          }

          const { data: dbLogs, error } = await query;
          if (!error && dbLogs) {
            // Convert database format to LogEntry format
            const convertedLogs = dbLogs.map((dbLog: any) => ({
              timestamp: dbLog.timestamp,
              level: dbLog.level,
              message: dbLog.message,
              data: dbLog.data ? JSON.parse(dbLog.data) : undefined,
              error: dbLog.error ? new Error(dbLog.error) : undefined,
              userId: dbLog.user_id,
              sessionId: dbLog.session_id,
              requestId: dbLog.request_id,
              api: dbLog.api,
              duration: dbLog.duration,
              environment: dbLog.environment,
              deployment: dbLog.deployment,
              recognitionId: dbLog.recognition_id
            }));

            // Merge with in-memory logs, removing duplicates
            const allLogs = [...filtered, ...convertedLogs];
            const uniqueLogs = allLogs.filter((log, index, self) => 
              index === self.findIndex(l => l.timestamp === log.timestamp && l.message === log.message)
            );

            // Update the in-memory logs with database results
            this.logs = uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
        } catch (error) {
          console.error('Failed to fetch logs from database:', error);
        }
      })();
    }

    return filtered;
  }

  // Get recognition-specific logs (works in both dev and prod)
  async getRecognitionLogs(recognitionId?: string, limit?: number): Promise<LogEntry[]> {
    // Always try to get from Supabase first (both dev and prod)
    if (supabase) {
      try {
        let query = supabase
          .from('logs')
          .select('*')
          .eq('api', 'recognition')
          .order('timestamp', { ascending: false });

        if (recognitionId) {
          query = query.eq('recognition_id', recognitionId);
        }
        if (limit) {
          query = query.limit(limit);
        }

        const { data: dbLogs, error } = await query;
        if (!error && dbLogs && dbLogs.length > 0) {
          // Convert database format to LogEntry format
          const convertedLogs = dbLogs.map((dbLog: any) => ({
            timestamp: dbLog.timestamp,
            level: dbLog.level,
            message: dbLog.message,
            data: dbLog.data ? JSON.parse(dbLog.data) : undefined,
            error: dbLog.error ? new Error(dbLog.error) : undefined,
            userId: dbLog.user_id,
            sessionId: dbLog.session_id,
            requestId: dbLog.request_id,
            api: dbLog.api,
            duration: dbLog.duration,
            environment: dbLog.environment,
            deployment: dbLog.deployment,
            recognitionId: dbLog.recognition_id
          }));

          return convertedLogs;
        }
      } catch (error) {
        console.error('Failed to fetch recognition logs from database:', error);
        // Fall back to in-memory logs
      }
    }

    // Fallback to in-memory logs
    let filtered = this.logs.filter(log => log.api === 'recognition');
    
    if (recognitionId) {
      filtered = filtered.filter(log => log.recognitionId === recognitionId);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  // Clear logs (works in both dev and prod)
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging (works in both dev and prod)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Export recognition logs specifically (works in both dev and prod)
  async exportRecognitionLogs(recognitionId?: string): Promise<string> {
    const recognitionLogs = await this.getRecognitionLogs(recognitionId);
    return JSON.stringify(recognitionLogs, null, 2);
  }

  // Production-specific methods
  async logToDatabase(entry: LogEntry) {
    if (!this.isProduction) return;

    try {
      // Example: Log to your Supabase database
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Implementation would go here
        console.log('📊 [DB] Logged to database:', entry.message);
      }
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
