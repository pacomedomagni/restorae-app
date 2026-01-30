/**
 * Production Logger
 * 
 * Simple console-based logging for development and production.
 */

const isDev = __DEV__;

/**
 * Log levels
 */
type LogLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Internal log function
 */
function log(level: LogLevel, message: string, data?: Record<string, any>) {
  const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
  if (data) {
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);
  } else {
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`);
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
   */
  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    console.error(`[ERROR] ${message}`, error, data);
  },
};

export default logger;
