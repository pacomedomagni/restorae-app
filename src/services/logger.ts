/**
 * Production Logger
 * 
 * Replaces console.log/error/warn with Sentry-integrated logging.
 * In development: logs to console
 * In production: sends to Sentry as breadcrumbs/errors
 */
import * as Sentry from '@sentry/react-native';

const isDev = __DEV__;

/**
 * Log levels
 */
type LogLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Internal log function
 */
function log(level: LogLevel, message: string, data?: Record<string, any>) {
  if (isDev) {
    // In development, use console
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
    if (data) {
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);
    } else {
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`);
    }
  } else {
    // In production, add as Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: 'app',
      message,
      level: level as Sentry.SeverityLevel,
      data,
    });
  }
}

/**
 * Logger object with methods for each level
 */
export const logger = {
  /**
   * Debug level - only shows in development
   */
  debug(message: string, data?: Record<string, any>) {
    if (isDev) {
      log('debug', message, data);
    }
  },

  /**
   * Info level - general information
   */
  info(message: string, data?: Record<string, any>) {
    log('info', message, data);
  },

  /**
   * Warning level - potential issues
   */
  warn(message: string, data?: Record<string, any>) {
    log('warning', message, data);
  },

  /**
   * Error level - errors that should be tracked
   * Automatically captures to Sentry in production
   */
  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, data);
    } else {
      // Add breadcrumb
      Sentry.addBreadcrumb({
        category: 'error',
        message,
        level: 'error',
        data: { ...data, errorMessage: error instanceof Error ? error.message : String(error) },
      });
      
      // Capture error to Sentry if it's an Error object
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message, ...data },
        });
      } else if (error) {
        Sentry.captureMessage(`${message}: ${String(error)}`, {
          level: 'error',
          extra: data,
        });
      }
    }
  },
};

export default logger;
