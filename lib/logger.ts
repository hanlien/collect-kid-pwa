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
    context?: { userId?: string; sessionId?: string; requestId?: string; api?: string; duration?: number }
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

    // Add to in-memory logs (development only)
    if (!this.isProduction) {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift(); // Remove oldest log
      }
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

  // Recognition-specific logging
  recognitionStart(imageSize?: number, context?: any) {
    return this.info('Recognition started', { imageSize }, { ...context, api: 'recognition' });
  }

  recognitionStep(step: string, data?: any, context?: any) {
    return this.debug(`Recognition step: ${step}`, data, { ...context, api: 'recognition' });
  }

  recognitionSuccess(result: any, duration: number, context?: any) {
    return this.info('Recognition successful', { result, duration }, { ...context, api: 'recognition' });
  }

  recognitionError(error: Error, context?: any) {
    return this.error('Recognition failed', error, undefined, { ...context, api: 'recognition' });
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

  // Get logs for debugging (development only)
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    if (this.isProduction) {
      console.warn('Log retrieval not available in production');
      return [];
    }

    let filtered = this.logs;
    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    return filtered;
  }

  // Clear logs (development only)
  clearLogs() {
    if (this.isProduction) {
      console.warn('Log clearing not available in production');
      return;
    }
    this.logs = [];
  }

  // Export logs for debugging (development only)
  exportLogs(): string {
    if (this.isProduction) {
      return JSON.stringify({ error: 'Log export not available in production' });
    }
    return JSON.stringify(this.logs, null, 2);
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
