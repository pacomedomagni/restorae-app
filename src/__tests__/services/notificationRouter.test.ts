/**
 * Tests for NotificationRouter service
 *
 * Verifies that notification taps route to the correct screens
 * based on the notification data.type field.
 */

// ---------------------------------------------------------------------------
// Mocks (jest.mock calls are hoisted, so no variable references in factories)
// ---------------------------------------------------------------------------

jest.mock('../../services/navigationRef', () => ({
  navigate: jest.fn(),
  isNavigationReady: jest.fn(() => true),
}));

jest.mock('../../services/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Imports (AFTER mocks are declared)
// ---------------------------------------------------------------------------

import { setupNotificationResponseHandler } from '../../services/notificationRouter';
import { navigate, isNavigationReady } from '../../services/navigationRef';
import * as Notifications from 'expo-notifications';

// Typed references to the mocked functions
const mockNavigate = navigate as jest.MockedFunction<typeof navigate>;
const mockIsNavigationReady = isNavigationReady as jest.MockedFunction<typeof isNavigationReady>;
const mockAddListener = Notifications.addNotificationResponseReceivedListener as jest.MockedFunction<
  typeof Notifications.addNotificationResponseReceivedListener
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a fake notification response object that mirrors Expo's structure:
 * response.notification.request.content.data
 */
function buildResponse(data: Record<string, unknown>) {
  return {
    notification: {
      request: {
        content: {
          data,
        },
      },
    },
  };
}

/**
 * Call setupNotificationResponseHandler and return the captured listener
 * callback so we can invoke it directly with test data.
 */
function setupAndGetListener() {
  setupNotificationResponseHandler();
  expect(mockAddListener).toHaveBeenCalled();

  // The listener callback is the first argument of the most recent call
  const listener =
    mockAddListener.mock.calls[mockAddListener.mock.calls.length - 1][0];
  return listener as (response: ReturnType<typeof buildResponse>) => void;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsNavigationReady.mockReturnValue(true);
  });

  // -----------------------------------------------------------------------
  // setupNotificationResponseHandler
  // -----------------------------------------------------------------------

  describe('setupNotificationResponseHandler', () => {
    it('returns a cleanup function', () => {
      const cleanup = setupNotificationResponseHandler();
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function calls subscription.remove()', () => {
      const mockRemove = jest.fn();
      mockAddListener.mockReturnValueOnce({ remove: mockRemove } as any);

      const cleanup = setupNotificationResponseHandler()!;
      cleanup();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('registers a listener via addNotificationResponseReceivedListener', () => {
      setupNotificationResponseHandler();
      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(typeof mockAddListener.mock.calls[0][0]).toBe('function');
    });
  });

  // -----------------------------------------------------------------------
  // handleNotificationResponse (tested through the captured listener)
  // -----------------------------------------------------------------------

  describe('notification routing', () => {
    it('navigates to Main for "morning" type', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'morning' }));
      expect(mockNavigate).toHaveBeenCalledWith('Main');
    });

    it('navigates to BreathingSelect for "midday" type', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'midday' }));
      expect(mockNavigate).toHaveBeenCalledWith('BreathingSelect');
    });

    it('navigates to JournalEntry with prompt for "evening" type', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'evening' }));
      expect(mockNavigate).toHaveBeenCalledWith('JournalEntry', {
        prompt: 'What went well today? What would you like to release?',
      });
    });

    it('navigates to Main for "mood_check" type', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'mood_check' }));
      expect(mockNavigate).toHaveBeenCalledWith('Main');
    });

    it('navigates to custom screen when type is "custom" and data.screen is set', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'custom', screen: 'Settings' }));
      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });

    it('navigates to Main when type is "custom" but no screen provided', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'custom' }));
      expect(mockNavigate).toHaveBeenCalledWith('Main');
    });

    it('navigates to screen for unknown type when data.screen exists (default case)', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'unknown_type', screen: 'Support' }));
      expect(mockNavigate).toHaveBeenCalledWith('Support');
    });

    it('navigates to Main for unknown type without data.screen (default fallback)', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'some_random_type' }));
      expect(mockNavigate).toHaveBeenCalledWith('Main');
    });
  });

  // -----------------------------------------------------------------------
  // Navigation readiness guard
  // -----------------------------------------------------------------------

  describe('navigation readiness', () => {
    it('does NOT navigate when navigation is not ready', () => {
      mockIsNavigationReady.mockReturnValue(false);
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'morning' }));
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates when navigation becomes ready', () => {
      mockIsNavigationReady.mockReturnValue(true);
      const listener = setupAndGetListener();
      listener(buildResponse({ type: 'morning' }));
      expect(mockNavigate).toHaveBeenCalledWith('Main');
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('does nothing when response has no data', () => {
      const listener = setupAndGetListener();
      listener({ notification: { request: { content: {} } } } as any);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does nothing when response is empty', () => {
      const listener = setupAndGetListener();
      listener({} as any);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to Main when data has no type field (default case, no screen)', () => {
      const listener = setupAndGetListener();
      listener(buildResponse({}));
      expect(mockNavigate).toHaveBeenCalledWith('Main');
    });
  });
});
