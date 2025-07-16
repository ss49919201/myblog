export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export interface LogContext {
  requestId?: string;
  component?: string;
  userId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private currentLevel: LogLevel;
  private context: LogContext;

  constructor(level: LogLevel = 'INFO', context: LogContext = {}) {
    this.currentLevel = level;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error,
    };
  }

  private output(logEntry: LogEntry): void {
    const { level, message, timestamp, context, error } = logEntry;
    
    const logMessage = `[${timestamp}] [${level}] ${context?.component ? `[${context.component}] ` : ''}${message}`;
    
    if (error) {
      console.error(logMessage, {
        context,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      });
    } else {
      const logFn = level === 'ERROR' ? console.error : 
                   level === 'WARN' ? console.warn : 
                   level === 'DEBUG' ? console.debug : console.log;
      
      logFn(logMessage, context);
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog('ERROR')) {
      this.output(this.formatLog('ERROR', message, context, error));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('WARN')) {
      this.output(this.formatLog('WARN', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('INFO')) {
      this.output(this.formatLog('INFO', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('DEBUG')) {
      this.output(this.formatLog('DEBUG', message, context));
    }
  }

  child(context: LogContext): Logger {
    return new Logger(this.currentLevel, { ...this.context, ...context });
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }
}

function getLogLevel(): LogLevel {
  if (typeof process !== 'undefined' && process.env) {
    const envLevel = process.env.LOG_LEVEL as LogLevel;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      return envLevel;
    }
  }
  
  return process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
}

export const logger = new Logger(getLogLevel());

export function createLogger(context?: LogContext): Logger {
  return logger.child(context || {});
}