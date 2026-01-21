/**
 * useNotifications Hook
 * 
 * Handles local notification scheduling for reminders
 * Gracefully degrades if expo-notifications is not installed
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamic import for expo-notifications
// Using any type since the package may not be installed
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
  scheduleAllReminders: () => Promise<void>;
  cancelAllReminders: () => Promise<void>;
  addCustomReminder: (reminder: Omit<CustomReminder, 'id'>) => Promise<void>;
  removeCustomReminder: (id: string) => Promise<void>;
  toggleCustomReminder: (id: string, enabled: boolean) => Promise<void>;
  scheduleMorningReminder: (hour: number, minute: number, title: string, body: string, reminderId: string) => Promise<string | null>;
  scheduleEveningReminder: (hour: number, minute: number, title: string, body: string, reminderId: string) => Promise<string | null>;
  getScheduledReminders: () => Promise<any[]>;
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

  // Load settings and check permission on mount
  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      // If Notifications not installed, skip permission check
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
      console.error('Failed to load notification state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveSettings = async (settings: ReminderSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Notifications) {
      console.warn('expo-notifications not installed');
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
      console.error('Failed to request notification permission:', error);
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

  const scheduleAllReminders = useCallback(async () => {
    if (!Notifications) return;

    if (!state.hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { settings } = state;

    // Morning ritual reminder
    if (settings.morningEnabled) {
      const [hour, minute] = settings.morningTime.split(':').map(Number);
      await scheduleNotification(
        'morning_ritual',
        '☀️ Good morning!',
        'Start your day with a calming ritual',
        hour,
        minute
      );
    }

    // Evening ritual reminder
    if (settings.eveningEnabled) {
      const [hour, minute] = settings.eveningTime.split(':').map(Number);
      await scheduleNotification(
        'evening_ritual',
        '🌙 Wind down time',
        'Take a moment to reflect and relax',
        hour,
        minute
      );
    }

    // Mood check reminders
    if (settings.moodCheckEnabled) {
      for (let i = 0; i < settings.moodCheckTimes.length; i++) {
        const [hour, minute] = settings.moodCheckTimes[i].split(':').map(Number);
        await scheduleNotification(
          `mood_check_${i}`,
          '💭 How are you feeling?',
          'Take a quick moment to check in with yourself',
          hour,
          minute
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
          minute
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
            day + 1 // expo-notifications uses 1-7, our days are 0-6
          );
        }
      }
    }

    console.log('[Notifications] All reminders scheduled');
  }, [state.hasPermission, state.settings, requestPermission]);

  const cancelAllReminders = useCallback(async () => {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All reminders cancelled');
  }, []);

  const updateSettings = useCallback(async (updates: Partial<ReminderSettings>) => {
    const newSettings = { ...state.settings, ...updates };
    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders();
  }, [state.settings, scheduleAllReminders]);

  const addCustomReminder = useCallback(async (reminder: Omit<CustomReminder, 'id'>) => {
    const newReminder: CustomReminder = {
      ...reminder,
      id: `reminder_${Date.now()}`,
    };
    
    const newSettings = {
      ...state.settings,
      customReminders: [...state.settings.customReminders, newReminder],
    };
    
    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders();
  }, [state.settings, scheduleAllReminders]);

  const removeCustomReminder = useCallback(async (id: string) => {
    const newSettings = {
      ...state.settings,
      customReminders: state.settings.customReminders.filter(r => r.id !== id),
    };
    
    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders();
  }, [state.settings, scheduleAllReminders]);

  const toggleCustomReminder = useCallback(async (id: string, enabled: boolean) => {
    const newSettings = {
      ...state.settings,
      customReminders: state.settings.customReminders.map(r =>
        r.id === id ? { ...r, enabled } : r
      ),
    };
    
    setState(prev => ({ ...prev, settings: newSettings }));
    await saveSettings(newSettings);
    await scheduleAllReminders();
  }, [state.settings, scheduleAllReminders]);

  // Schedule a single morning reminder
  const scheduleMorningReminder = useCallback(async (
    hour: number,
    minute: number,
    title: string,
    body: string,
    reminderId: string
  ): Promise<string | null> => {
    if (!Notifications) return null;
    
    if (!state.hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    return await scheduleNotification(
      `morning_${reminderId}`,
      title,
      body,
      hour,
      minute,
      undefined,
      { reminderId }
    );
  }, [state.hasPermission, requestPermission]);

  // Schedule a single evening reminder
  const scheduleEveningReminder = useCallback(async (
    hour: number,
    minute: number,
    title: string,
    body: string,
    reminderId: string
  ): Promise<string | null> => {
    if (!Notifications) return null;
    
    if (!state.hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    return await scheduleNotification(
      `evening_${reminderId}`,
      title,
      body,
      hour,
      minute,
      undefined,
      { reminderId }
    );
  }, [state.hasPermission, requestPermission]);

  // Get all scheduled reminders
  const getScheduledReminders = useCallback(async (): Promise<any[]> => {
    if (!Notifications) return [];
    
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }, []);

  return {
    ...state,
    requestPermission,
    updateSettings,
    scheduleAllReminders,
    cancelAllReminders,
    addCustomReminder,
    removeCustomReminder,
    toggleCustomReminder,
    scheduleMorningReminder,
    scheduleEveningReminder,
    getScheduledReminders,
  };
}
