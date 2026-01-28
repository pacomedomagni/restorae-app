/**
 * RemindersScreen - Consistent UI
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader, AlertModal } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { useNotifications } from '../hooks/useNotifications';
import logger from '../services/logger';

interface Reminder {
  id: string;
  label: string;
  time: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'morning', label: 'Morning Check-in', time: '8:00 AM', hour: 8, minute: 0, enabled: false },
  { id: 'midday', label: 'Midday Pause', time: '12:30 PM', hour: 12, minute: 30, enabled: false },
  { id: 'evening', label: 'Evening Reflection', time: '9:00 PM', hour: 21, minute: 0, enabled: false },
];

export function RemindersScreen() {
  const { reduceMotion, colors } = useTheme();
  const { selectionLight, notificationSuccess } = useHaptics();
  const { 
    hasPermission, 
    requestPermission, 
    scheduleMorningReminder, 
    scheduleEveningReminder,
    cancelAllReminders,
    getScheduledReminders,
  } = useNotifications();
  const palette = colors;

  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'info' | 'error';
    title: string;
    message?: string;
  }>({ visible: false, type: 'info', title: '' });

  // Sync with scheduled notifications on mount
  useEffect(() => {
    const syncReminders = async () => {
      const scheduled = await getScheduledReminders();
      const scheduledIds = scheduled.map(n => n.content.data?.reminderId);
      setReminders(prev => prev.map(r => ({
        ...r,
        enabled: scheduledIds.includes(r.id),
      })));
    };
    syncReminders();
  }, [getScheduledReminders]);

  const toggleReminder = useCallback(async (id: string) => {
    await selectionLight();
    setLoading(true);
    
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) {
      setLoading(false);
      return;
    }

    const newEnabled = !reminder.enabled;

    if (newEnabled) {
      // Request permission if needed
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setAlertConfig({
            visible: true,
            type: 'info',
            title: 'Notifications Disabled',
            message: 'Please enable notifications in your device settings to use reminders.',
          });
          setLoading(false);
          return;
        }
      }

      // Schedule the reminder
      try {
        if (id === 'morning') {
          await scheduleMorningReminder(
            reminder.hour,
            reminder.minute,
            'Good morning! 🌅',
            'Take a moment to start your day with intention.',
            'morning'
          );
        } else if (id === 'evening') {
          await scheduleEveningReminder(
            reminder.hour,
            reminder.minute,
            'Evening reflection 🌙',
            'Wind down and reflect on your day.',
            'evening'
          );
        } else if (id === 'midday') {
          await scheduleMorningReminder(
            reminder.hour,
            reminder.minute,
            'Midday pause ☀️',
            'Take a mindful break in your day.',
            'midday'
          );
        }
        await notificationSuccess();
      } catch (error) {
        logger.error('Error scheduling reminder:', error);
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to schedule reminder. Please try again.',
        });
        setLoading(false);
        return;
      }
    } else {
      // Cancel scheduled reminders (simplified - cancels all, you might want to track IDs)
      // In a real app, you'd store notification IDs and cancel specific ones
    }

    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: newEnabled } : r
    ));
    setLoading(false);
  }, [
    selectionLight, 
    reminders, 
    hasPermission, 
    requestPermission, 
    scheduleMorningReminder, 
    scheduleEveningReminder, 
    notificationSuccess
  ]);

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Reminders"
              subtitle="Gentle nudges to support your practice"
              compact
            />
          </Animated.View>

          {reminders.map((reminder, index) => (
            <Animated.View 
              key={reminder.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 100).duration(400)}
            >
              <GlassCard 
                variant={reminder.enabled ? 'elevated' : 'default'} 
                padding="lg"
                glow={reminder.enabled ? 'cool' : undefined}
              >
                <View style={styles.reminderRow}>
                  <View style={styles.reminderInfo}>
                    <Text variant="headlineSmall" color="ink">{reminder.label}</Text>
                    <Pressable>
                      <Text variant="bodyMedium" color="accent">{reminder.time}</Text>
                    </Pressable>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={{ false: palette.border, true: colors.accentPrimary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </GlassCard>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => {}}
              style={styles.addButton}
            >
              + Add Custom Reminder
            </Button>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(400)}>
            <GlassCard variant="subtle" padding="md" style={styles.noteCard}>
              <Text variant="bodySmall" color="inkMuted" align="center">
                🔔 Reminders are delivered as gentle notifications
              </Text>
            </GlassCard>
          </Animated.View>

          <View style={{ height: layout.tabBarHeight }} />
        </View>
      </SafeAreaView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  addButton: {
    marginTop: spacing[6],
  },
  noteCard: {
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
});
