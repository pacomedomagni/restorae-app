/**
 * Tests for useHaptics hook
 *
 * Verifies that haptic feedback functions call expo-haptics correctly
 * when haptics are enabled, and do nothing when disabled.
 */

import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks (jest.mock factories are hoisted -- no external variable references)
// ---------------------------------------------------------------------------

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Control the hapticsEnabled preference from tests via a shared object
// We use an object so the mock factory closure captures the reference, not a primitive.
const prefs = { hapticsEnabled: true };

jest.mock('../../contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    hapticsEnabled: prefs.hapticsEnabled,
    soundsEnabled: true,
    breathingTonesEnabled: true,
    breathingAmbientEnabled: true,
    setHapticsEnabled: jest.fn(),
    setSoundsEnabled: jest.fn(),
    setBreathingTonesEnabled: jest.fn(),
    setBreathingAmbientEnabled: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Imports (AFTER mocks)
// ---------------------------------------------------------------------------

import { useHaptics } from '../../hooks/useHaptics';
import * as Haptics from 'expo-haptics';

// Typed references to the mocked functions (accessed through the module)
const mockImpactAsync = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>;
const mockNotificationAsync = Haptics.notificationAsync as jest.MockedFunction<typeof Haptics.notificationAsync>;
const mockSelectionAsync = Haptics.selectionAsync as jest.MockedFunction<typeof Haptics.selectionAsync>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHaptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    prefs.hapticsEnabled = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // isEnabled state
  // -----------------------------------------------------------------------

  describe('isEnabled', () => {
    it('reflects hapticsEnabled = true from preferences', () => {
      prefs.hapticsEnabled = true;
      const { result } = renderHook(() => useHaptics());
      expect(result.current.isEnabled).toBe(true);
    });

    it('reflects hapticsEnabled = false from preferences', () => {
      prefs.hapticsEnabled = false;
      const { result } = renderHook(() => useHaptics());
      expect(result.current.isEnabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Basic haptics - enabled
  // -----------------------------------------------------------------------

  describe('when haptics are enabled', () => {
    beforeEach(() => {
      prefs.hapticsEnabled = true;
    });

    it('impactLight calls Haptics.impactAsync with Light style', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.impactLight();
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });

    it('impactMedium calls Haptics.impactAsync with Medium style', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.impactMedium();
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });

    it('impactHeavy calls Haptics.impactAsync with Heavy style', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.impactHeavy();
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });

    it('selectionLight calls Haptics.selectionAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.selectionLight();
      });
      expect(mockSelectionAsync).toHaveBeenCalled();
    });

    it('notificationSuccess calls Haptics.notificationAsync with Success type', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.notificationSuccess();
      });
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    });

    it('notificationError calls Haptics.notificationAsync with Error type', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.notificationError();
      });
      expect(mockNotificationAsync).toHaveBeenCalledWith('error');
    });

    it('gentle calls Haptics.selectionAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.gentle();
      });
      expect(mockSelectionAsync).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Basic haptics - disabled
  // -----------------------------------------------------------------------

  describe('when haptics are disabled', () => {
    beforeEach(() => {
      prefs.hapticsEnabled = false;
    });

    it('impactLight does NOT call Haptics.impactAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.impactLight();
      });
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });

    it('impactMedium does NOT call Haptics.impactAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.impactMedium();
      });
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });

    it('impactHeavy does NOT call Haptics.impactAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.impactHeavy();
      });
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });

    it('notificationSuccess does NOT call Haptics.notificationAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.notificationSuccess();
      });
      expect(mockNotificationAsync).not.toHaveBeenCalled();
    });

    it('notificationError does NOT call Haptics.notificationAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.notificationError();
      });
      expect(mockNotificationAsync).not.toHaveBeenCalled();
    });

    it('selectionLight does NOT call Haptics.selectionAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.selectionLight();
      });
      expect(mockSelectionAsync).not.toHaveBeenCalled();
    });

    it('celebration does NOT call any haptic methods', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.celebration();
      });
      expect(mockNotificationAsync).not.toHaveBeenCalled();
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });

    it('trigger does NOT call any haptic methods', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('light');
      });
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Unified trigger
  // -----------------------------------------------------------------------

  describe('trigger()', () => {
    beforeEach(() => {
      prefs.hapticsEnabled = true;
    });

    it('trigger("light") calls impactAsync with Light', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('light');
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });

    it('trigger("medium") calls impactAsync with Medium', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('medium');
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });

    it('trigger("heavy") calls impactAsync with Heavy', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('heavy');
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });

    it('trigger("selection") calls selectionAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('selection');
      });
      expect(mockSelectionAsync).toHaveBeenCalled();
    });

    it('trigger("success") calls notificationAsync with Success', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('success');
      });
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    });

    it('trigger("error") calls notificationAsync with Error', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('error');
      });
      expect(mockNotificationAsync).toHaveBeenCalledWith('error');
    });

    it('trigger("gentle") calls selectionAsync', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.trigger('gentle');
      });
      expect(mockSelectionAsync).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Celebration & milestone
  // -----------------------------------------------------------------------

  describe('celebration', () => {
    it('fires notificationAsync(Success) immediately when enabled', async () => {
      prefs.hapticsEnabled = true;
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.celebration();
      });
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    });

    it('schedules additional impact haptics via setTimeout', async () => {
      prefs.hapticsEnabled = true;
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.celebration();
      });

      // Advance timers to fire the two delayed impacts (150ms and 300ms)
      await act(async () => {
        jest.advanceTimersByTime(350);
      });

      // Should have the initial notification + 2 delayed impacts
      expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });
  });

  describe('milestone', () => {
    it('fires notificationAsync(Success) and a delayed light impact', async () => {
      prefs.hapticsEnabled = true;
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.milestone();
      });
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');

      await act(async () => {
        jest.advanceTimersByTime(250);
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });
  });

  // -----------------------------------------------------------------------
  // Breathing haptics
  // -----------------------------------------------------------------------

  describe('breathing haptics', () => {
    beforeEach(() => {
      prefs.hapticsEnabled = true;
    });

    it('breatheIn fires initial medium impact when enabled', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.breatheIn(4000);
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });

    it('breatheIn does nothing when disabled', async () => {
      prefs.hapticsEnabled = false;
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.breatheIn(4000);
      });
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });

    it('breatheOut fires initial heavy impact when enabled', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.breatheOut(4000);
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });

    it('breatheHold fires light impact when enabled', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.breatheHold();
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });

    it('breatheHold does nothing when disabled', async () => {
      prefs.hapticsEnabled = false;
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.breatheHold();
      });
      expect(mockImpactAsync).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Countdown
  // -----------------------------------------------------------------------

  describe('countdown', () => {
    beforeEach(() => {
      prefs.hapticsEnabled = true;
    });

    it('fires medium impact for count <= 3', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.countdown(3);
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });

    it('fires light impact for count > 3', async () => {
      const { result } = renderHook(() => useHaptics());
      await act(async () => {
        await result.current.countdown(5);
      });
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });
  });

  // -----------------------------------------------------------------------
  // stopHaptics
  // -----------------------------------------------------------------------

  describe('stopHaptics', () => {
    it('can be called without error', () => {
      const { result } = renderHook(() => useHaptics());
      expect(() => result.current.stopHaptics()).not.toThrow();
    });
  });
});
