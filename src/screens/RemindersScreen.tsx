/**
 * RemindersScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

const DEFAULT_REMINDERS = [
  { id: 'morning', label: 'Morning Check-in', time: '8:00 AM', enabled: true },
  { id: 'midday', label: 'Midday Pause', time: '12:30 PM', enabled: false },
  { id: 'evening', label: 'Evening Reflection', time: '9:00 PM', enabled: true },
];

export function RemindersScreen() {
  const { reduceMotion, colors } = useTheme();
  const { selectionLight } = useHaptics();
  const palette = colors;

  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);

  const toggleReminder = async (id: string) => {
    await selectionLight();
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

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
