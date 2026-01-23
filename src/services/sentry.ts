/**
 * Sentry Error Tracking Configuration
 * 
 * Initializes Sentry for crash reporting and error monitoring
 */
import * as Sentry from '@sentry/react-native';

// Sentry DSN - Replace with your actual DSN from sentry.io
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'YOUR_SENTRY_DSN';

/**
 * Initialize Sentry error tracking
 * Call this in App.tsx before rendering
 */
export function initializeSentry(): void {
  if (__DEV__) {
    // Console is intentional here - sentry.ts is lower-level than logger
    console.log('[Sentry] Disabled in development mode');
    return;
  }

  if (SENTRY_DSN === 'YOUR_SENTRY_DSN') {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance monitoring
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    
    // Session replay (optional)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Release tracking
    release: `restorae@${require('../../package.json').version}`,
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out certain errors if needed
      const error = hint.originalException;
      
      // Don't send network timeout errors
      if (error instanceof Error && error.message.includes('Network request failed')) {
        return null;
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
  });
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (__DEV__) {
    // Console is intentional here - sentry.ts is lower-level than logger
    console.error('[Sentry] Captured exception:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message for logging
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (__DEV__) {
    console.log(`[${level}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Set custom tags
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Wrap component with Sentry error boundary
 */
export const SentryErrorBoundary = Sentry.wrap;

/**
 * Create a Sentry-wrapped navigation container
 */
export const createSentryNavigationIntegration = Sentry.reactNavigationIntegration;

export default {
  init: initializeSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  setTag,
};
