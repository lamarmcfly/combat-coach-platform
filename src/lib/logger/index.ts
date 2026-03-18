/**
 * Structured logging service
 *
 * Provides consistent, structured logging across the application.
 * Replace console.log/error statements with this logger for better
 * observability and production debugging.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  meta?: LogMeta;
  error?: {
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'info' in production, 'debug' in development
const currentLevel = (process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')) as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatEntry(entry: LogEntry): string {
  // In production, output structured JSON for log aggregation
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  // In development, output human-readable format
  const { timestamp, level, context, message, meta, error } = entry;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  const errorStr = error ? ` | Error: ${error.message}` : '';
  return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] [${context}] ${message}${metaStr}${errorStr}`;
}

function createEntry(
  level: LogLevel,
  context: string,
  message: string,
  meta?: LogMeta,
  error?: unknown
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
  };

  if (meta && Object.keys(meta).length > 0) {
    entry.meta = meta;
  }

  if (error) {
    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    } else {
      entry.error = {
        message: String(error),
      };
    }
  }

  return entry;
}

export interface Logger {
  debug: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  error: (message: string, error?: unknown, meta?: LogMeta) => void;
}

/**
 * Create a logger instance for a specific context
 * @param context - The context/module name for log categorization
 */
export function createLogger(context: string): Logger {
  return {
    debug: (message: string, meta?: LogMeta) => {
      if (shouldLog('debug')) {
        const entry = createEntry('debug', context, message, meta);
        console.debug(formatEntry(entry));
      }
    },

    info: (message: string, meta?: LogMeta) => {
      if (shouldLog('info')) {
        const entry = createEntry('info', context, message, meta);
        console.log(formatEntry(entry));
      }
    },

    warn: (message: string, meta?: LogMeta) => {
      if (shouldLog('warn')) {
        const entry = createEntry('warn', context, message, meta);
        console.warn(formatEntry(entry));
      }
    },

    error: (message: string, error?: unknown, meta?: LogMeta) => {
      if (shouldLog('error')) {
        const entry = createEntry('error', context, message, meta, error);
        console.error(formatEntry(entry));
      }
    },
  };
}

// Default application logger
export const logger = createLogger('app');

// Pre-configured loggers for common contexts
export const apiLogger = createLogger('api');
export const authLogger = createLogger('auth');
export const stripeLogger = createLogger('stripe');
export const emailLogger = createLogger('email');
