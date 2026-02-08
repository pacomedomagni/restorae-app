/**
 * useNotifications Hook
 *
 * Handles local notification scheduling for reminders.
 * Gracefully degrades if expo-notifications is not installed.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  pickRandomMessage,
  MORNING_MESSAGES,
  MIDDAY_MESSAGES,
  EVENING_MESSAGES,
  MOOD_CHECK_MESSAGES,
} from '../data/notificationMessages';
import logger from '../services/logger';

// Dynamic import for expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Package not installed
}

// =============================================================================
// TYPES
// =============================================================================
export interface ReminderSettings {
  morningEnabled: boolean;
  morningTime: string; // HH:mm format
  eveningEnabled: boolean;
  eveningTime: string; // HH:mm format
  moodCheckEnabled: boolean;
  moodCheckTimes: string[]; // Array of HH:mm
  customReminders: CustomReminder[];
}

export interface CustomReminder {
  id: string;
  title: string;
  body: string;
  time: string; // HH:mm format
  days: number[]; // 0-6, Sunday = 0
  enabled: boolean;
}

interface NotificationState {
  hasPermission: boolean;
  settings: ReminderSettings;
  isLoading: boolean;
}

interface UseNotificationsReturn extends NotificationState {
  requestPermission: () => Promise<boolean>;
  updateSettings: (settings: Partial<ReminderSettings>) => Promise<void>;
  scheduleAllReminders: (overrideSettings?: ReminderSettings) => Promise<void>;
  cancelAllReminders: () => Promise<void>;
  addCustomReminder: (reminder: Omit<CustomReminder, 'id'>) => Promise<void>;
  removeCustomReminder: (id: string) => Promise<void>;
  toggleCustomReminder: (id: string, enabled: boolean) => Promise<void>;
  rescheduleAll: () => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/notification_settings';

const DEFAULT_SETTINGS: ReminderSettings = {
  morningEnabled: false,
  morningTime: '08:00',
  eveningEnabled: false,
  eveningTime: '21:00',
  moodCheckEnabled: false,
  moodCheckTimes: ['12:00', '18:00'],
  customReminders: [],
};

// =============================================================================
// NOTIFICATION CONFIGURATION
// =============================================================================
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// =============================================================================
// HOOK
// =============================================================================
export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    hasPermission: false,
    settings: DEFAULT_SETTINGS,
    isLoading: true,
  });

  // Use refs to always have fresh values for scheduling (fixes stale closure)
  const settingsRef = useRef(state.settings);
  settingsRef.current = state.settings;

  const hasPermissionRef = useRef(state.hasPermission);
  hasPermissionRef.current = state.hasPermission;

  // Load settings and check permission on mount
  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      let hasPermission = false;
      if (Notifications) {
        const permissionStatus = await Notifications.getPermissionsAsync();
        hasPermission = permissionStatus.status === 'granted';
      }

      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      const settings = savedSettings
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }
        : DEFAULT_SETTINGS;

      setState({
        hasPermission,
        settings,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to load notification state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveSettings = async (settings: ReminderSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      logger.error('Failed to save notification settings:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Notifications) {
      logger.warn('expo-notifications not installed');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        setState(prev => ({ ...prev, hasPermission: true }));
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      setState(prev => ({ ...prev, hasPermission: granted }));
      return granted;
    } catch (error) {
      logger.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  const scheduleNotification = async (
    identifier: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
    weekday?: number, // 1-7, Sunday = 1
    data?: Record<string, any>
  ): Promise<string | null> => {
    if (!Notifications) return null;

    const trigger: any = weekday
      ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute }
      : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute };

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        data,
      },
      trigger,
    });

    return id;
  };

  /**
   * Schedule all reminders. Cancels existing first, then schedules enabled ones.
   * Accepts optional overrideSettings to avoid stale closure issues.
   */
  const scheduleAllReminders = useCallback(async (overrideSettings?: ReminderSettings) => {
    if (!Notifications) return;

    if (!hasPermissionRef.current) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const settings = overrideSettings ?? settingsRef.current;

    // Morning ritual reminder
    if (settings.morningEnabled) {
      const [hour, minute] = settings.morningTime.split(':').map(Number);
      const msg = pickRandomMessage(MORNING_MESSAGES);
      await scheduleNotification(
        'morning_ritual',
        msg.title,
        msg.body,
        hour,
        minute,
        undefined,
        { type: 'morning', screen: 'Main', tab: 'SanctuaryTab' },
      );
    }

    // Evening ritual reminder
    if (settings.eveningEnabled) {
      const [hour, minute] = settings.eveningTime.split(':').map(Number);
      const msg = pickRandomMessage(EVENING_MESSAGES);
      await scheduleNotification(
        'evening_ritual',
        msg.title,
        msg.body,
        hour,
        minute,
        undefined,
        { type: 'evening', screen: 'JournalEntry' },
      );
    }

    // Mood check reminders
    if (settings.moodCheckEnabled) {
      for (let i = 0; i < settings.moodCheckTimes.length; i++) {
        const [hour, minute] = settings.moodCheckTimes[i].split(':').map(Number);
        const pool = i === 0 ? MIDDAY_MESSAGES : MOOD_CHECK_MESSAGES;
        const msg = pickRandomMessage(pool);
        await scheduleNotification(
          `mood_check_${i}`,
          msg.title,
          msg.body,
          hour,
          minute,
          undefined,
          { type: i === 0 ? 'midday' : 'mood_check', screen: 'Main', tab: 'SanctuaryTab' },
        );
      }
    }

    // Custom reminders
    for (const reminder of settings.customReminders) {
      if (!reminder.enabled) continue;

      const [hour, minute] = reminder.time.split(':').map(Number);

      if (reminder.days.length === 0 || reminder.days.length === 7) {
        // Daily reminder
        await scheduleNotification(
          `custom_${reminder.id}`,
          reminder.title,
          reminder.body,
          hour,
          minute,
          undefined,
          { type: 'custom', reminderId: reminder.id },
        );
      } else {
        // Specific days
        for (const day of reminder.days) {
          await scheduleNotification(
            `custom_${reminder.id}_${day}`,
            reminder.title,
            reminder.body,
            hour,
            minute,
            day + 1, // expo-notifications uses 1-7, our days are 0-6
            { type: 'custom', reminderId: reminder.id },
          );
        }
      }
    }

    logger.debug('[Notifications] All reminders scheduled');
  }, [requestPermission]);

  const cancelAllReminders = useCallback(async () => {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    logger.debug('[Notifications] All reminders cancelled');
  }, []);

  /**
   * Update settings and reschedule. Passes new settings directly to avoid stale closure.
   */
  const updateSettings = useCallback(async (updates: Partial<ReminderSettings>) => {
    const newSettings = { ...settingsRef.current, ...updates };
    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    // Pass newSettings directly to avoid reading stale state
    await scheduleAllReminders(newSettings);
  }, [scheduleAllReminders]);

  const addCustomReminder = useCallback(async (reminder: Omit<CustomReminder, 'id'>) => {
    const newReminder: CustomReminder = {
      ...reminder,
      id: `reminder_${Date.now()}`,
    };

    const newSettings = {
      ...settingsRef.current,
      customReminders: [...settingsRef.current.customReminders, newReminder],
    };

    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders(newSettings);
  }, [scheduleAllReminders]);

  const removeCustomReminder = useCallback(async (id: string) => {
    const newSettings = {
      ...settingsRef.current,
      customReminders: settingsRef.current.customReminders.filter(r => r.id !== id),
    };

    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders(newSettings);
  }, [scheduleAllReminders]);

  const toggleCustomReminder = useCallback(async (id: string, enabled: boolean) => {
    const newSettings = {
      ...settingsRef.current,
      customReminders: settingsRef.current.customReminders.map(r =>
        r.id === id ? { ...r, enabled } : r
      ),
    };

    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders(newSettings);
  }, [scheduleAllReminders]);

  /**
   * Reschedule all reminders with fresh random messages.
   * Call on app foreground to rotate notification content.
   */
  const rescheduleAll = useCallback(async () => {
    if (!hasPermissionRef.current) return;
    await scheduleAllReminders();
  }, [scheduleAllReminders]);

  return {
    ...state,
    requestPermission,
    updateSettings,
    scheduleAllReminders,
    cancelAllReminders,
    addCustomReminder,
    removeCustomReminder,
    toggleCustomReminder,
    rescheduleAll,
  };
}
