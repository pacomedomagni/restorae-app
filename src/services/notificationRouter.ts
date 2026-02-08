/**
 * Notification Router
 *
 * Handles deep linking when users tap on a notification.
 * Uses the shared navigationRef to navigate to the appropriate screen.
 */
import { navigate, isNavigationReady } from './navigationRef';
import logger from './logger';

// Dynamic import for expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Package not installed
}

/**
 * Extract screen/tab info from notification data and navigate accordingly.
 */
function handleNotificationResponse(response: any) {
  try {
    const data = response?.notification?.request?.content?.data;
    if (!data) return;

    if (!isNavigationReady()) {
      logger.warn('[NotificationRouter] Navigation not ready, skipping deep link');
      return;
    }

    const { screen, tab, type } = data;

    switch (type) {
      case 'morning':
        // Navigate to Sanctuary tab (default morning action)
        navigate('Main' as any);
        break;

      case 'midday':
        // Navigate to breathing selection
        navigate('BreathingSelect' as any);
        break;

      case 'evening':
        // Navigate to journal with an evening prompt
        navigate('JournalEntry' as any, {
          prompt: 'What went well today? What would you like to release?',
        });
        break;

      case 'mood_check':
        // Navigate to Sanctuary for mood check-in
        navigate('Main' as any);
        break;

      case 'custom':
      default:
        // Custom reminders and fallback → Sanctuary
        if (screen) {
          navigate(screen as any, data.params);
        } else {
          navigate('Main' as any);
        }
        break;
    }

    logger.debug('[NotificationRouter] Navigated for notification type:', type);
  } catch (error) {
    logger.error('[NotificationRouter] Failed to handle notification response:', error);
  }
}

/**
 * Register the notification response listener.
 * Call this once after the navigator has mounted.
 * Returns a cleanup function.
 */
export function setupNotificationResponseHandler(): (() => void) | undefined {
  if (!Notifications) return undefined;

  const subscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );

  logger.debug('[NotificationRouter] Response handler registered');

  return () => subscription.remove();
}
