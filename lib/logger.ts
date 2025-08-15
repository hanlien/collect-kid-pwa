import { createClient } from '@supabase/supabase-js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: string | undefined;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  api?: string;
  duration?: number;
  environment?: string;
  deployment?: string;
  recognitionId?: string;
}

// Supabase client
let supabase: any = null;

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase logger initialized');
  } else {
    console.warn('⚠️ Supabase credentials not found - logging to console only');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase logger:', error);
  supabase = null;
}

class Logger {
  private deploymentId = process.env.VERCEL_GIT_COMMIT_SHA || 'local';

  constructor() {
    console.log(`🔧 Logger initialized - Environment: ${process.env.NODE_ENV}, Supabase: ${supabase ? 'Connected' : 'Not connected'}`);
  }

  private async createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    context?: { userId?: string; sessionId?: string; requestId?: string; api?: string; duration?: number; recognitionId?: string }
  ): Promise<LogEntry> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : undefined,
      error: error?.message || undefined,
      environment: process.env.NODE_ENV || 'unknown',
      deployment: this.deploymentId,
      ...context,
    };

    // Always log to console
    const emoji = level === LogLevel.ERROR ? '❌' : level === LogLevel.WARN ? '⚠️' : level === LogLevel.INFO ? 'ℹ️' : '🔍';
    console.log(`${emoji} [${LogLevel[level]}] ${message}`, data || '');

    // Store in Supabase if available
    if (supabase) {
      try {
        const { data: dbEntry, error: dbError } = await supabase
          .from('logs')
          .insert({
            timestamp: entry.timestamp,
            level: entry.level,
            message: entry.message,
            data: entry.data,
            error: entry.error,
            user_id: entry.userId,
            session_id: entry.sessionId,
            request_id: entry.requestId,
            api: entry.api,
            duration: entry.duration,
            environment: entry.environment,
            deployment: entry.deployment,
            recognition_id: entry.recognitionId
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Failed to store log in database:', dbError);
        } else if (dbEntry) {
          entry.id = dbEntry.id;
        }
      } catch (dbError: any) {
        console.error('❌ Database logging failed:', dbError.message);
      }
    }

    return entry;
  }

  debug(message: string, data?: any, context?: any) {
    return this.createLogEntry(LogLevel.DEBUG, message, data, undefined, context);
  }

  info(message: string, data?: any, context?: any) {
    return this.createLogEntry(LogLevel.INFO, message, data, undefined, context);
  }

  warn(message: string, data?: any, context?: any) {
    return this.createLogEntry(LogLevel.WARN, message, data, undefined, context);
  }

  error(message: string, error?: Error, data?: any, context?: any) {
    return this.createLogEntry(LogLevel.ERROR, message, data, error, context);
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

  // Recognition-specific logging
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

  // Collection-specific logging
  collectionSuccess(speciesData: any, coinsEarned: number, context?: any) {
    return this.info('💰 Collection successful', { speciesData, coinsEarned }, { ...context, api: 'collect' });
  }

  collectionError(error: Error, context?: any) {
    return this.error('❌ Collection failed', error, undefined, { ...context, api: 'collect' });
  }

  // Get logs from database
  async getLogs(limit: number = 100): Promise<LogEntry[]> {
    if (!supabase) {
      console.warn('⚠️ No Supabase connection - cannot fetch logs');
      return [];
    }

    try {
      const { data: dbLogs, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to fetch logs:', error);
        return [];
      }

      if (!dbLogs) return [];

      // Convert database format to LogEntry format
      return dbLogs.map((dbLog: any) => ({
        id: dbLog.id,
        timestamp: dbLog.timestamp,
        level: dbLog.level,
        message: dbLog.message,
        data: dbLog.data ? JSON.parse(dbLog.data) : undefined,
        error: dbLog.error,
        userId: dbLog.user_id,
        sessionId: dbLog.session_id,
        requestId: dbLog.request_id,
        api: dbLog.api,
        duration: dbLog.duration,
        environment: dbLog.environment,
        deployment: dbLog.deployment,
        recognitionId: dbLog.recognition_id
      }));
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      return [];
    }
  }

  // Get recognition-specific logs
  async getRecognitionLogs(recognitionId?: string, limit: number = 50): Promise<LogEntry[]> {
    if (!supabase) {
      console.warn('⚠️ No Supabase connection - cannot fetch recognition logs');
      return [];
    }

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

      if (error) {
        console.error('❌ Failed to fetch recognition logs:', error);
        return [];
      }

      if (!dbLogs) return [];

      // Convert database format to LogEntry format
      return dbLogs.map((dbLog: any) => ({
        id: dbLog.id,
        timestamp: dbLog.timestamp,
        level: dbLog.level,
        message: dbLog.message,
        data: dbLog.data ? JSON.parse(dbLog.data) : undefined,
        error: dbLog.error,
        userId: dbLog.user_id,
        sessionId: dbLog.session_id,
        requestId: dbLog.request_id,
        api: dbLog.api,
        duration: dbLog.duration,
        environment: dbLog.environment,
        deployment: dbLog.deployment,
        recognitionId: dbLog.recognition_id
      }));
    } catch (error) {
      console.error('❌ Error fetching recognition logs:', error);
      return [];
    }
  }

  // Clear all logs
  async clearLogs(): Promise<boolean> {
    if (!supabase) {
      console.warn('⚠️ No Supabase connection - cannot clear logs');
      return false;
    }

    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        console.error('❌ Failed to clear logs:', error);
        return false;
      }

      console.log('✅ All logs cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing logs:', error);
      return false;
    }
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    if (!supabase) {
      console.warn('⚠️ No Supabase connection');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('logs')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test error:', error);
      return false;
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
