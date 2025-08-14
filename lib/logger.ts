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
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private logLevel: LogLevel = LogLevel.INFO;

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
      ...context,
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  debug(message: string, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data, undefined, context);
    console.log(`🔍 [DEBUG] ${message}`, data || '');
    return entry;
  }

  info(message: string, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, data, undefined, context);
    console.log(`ℹ️ [INFO] ${message}`, data || '');
    return entry;
  }

  warn(message: string, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, data, undefined, context);
    console.warn(`⚠️ [WARN] ${message}`, data || '');
    return entry;
  }

  error(message: string, error?: Error, data?: any, context?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, data, error, context);
    console.error(`❌ [ERROR] ${message}`, error || '', data || '');
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

  // Get logs for debugging
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;
    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    return filtered;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
