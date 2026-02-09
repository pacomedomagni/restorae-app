/**
 * RemindersScreen
 *
 * Unified with useNotifications hook state.
 * Default reminders (morning, evening, mood check) + custom reminders.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Switch, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader, AlertModal } from '../components/ui';
import { Modal } from '../components/core';
import { spacing, borderRadius, withAlpha, layout, ColorTokens } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { useNotifications } from '../hooks/useNotifications';

// =============================================================================
// DAY SELECTOR
// =============================================================================

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function DaySelector({
  selectedDays,
  onToggle,
  colors,
}: {
  selectedDays: number[];
  onToggle: (day: number) => void;
  colors: ColorTokens;
}) {
  return (
    <View style={styles.dayRow}>
      {DAY_LABELS.map((label, index) => {
        const isSelected = selectedDays.includes(index);
        return (
          <Pressable
            key={index}
            onPress={() => onToggle(index)}
            style={[
              styles.dayCircle,
              {
                backgroundColor: isSelected
                  ? colors.accentPrimary
                  : withAlpha(colors.border, 0.3),
              },
            ]}
          >
            <Text
              variant="labelSmall"
              style={{
                color: isSelected ? colors.inkInverse : colors.inkMuted,
                fontWeight: isSelected ? '700' : '400',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function dateToTimeString(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// =============================================================================
// SCREEN
// =============================================================================

export function RemindersScreen() {
  const { reduceMotion, colors } = useTheme();
  const { selectionLight, notificationSuccess } = useHaptics();
  const {
    hasPermission,
    settings,
    requestPermission,
    updateSettings,
    addCustomReminder,
    removeCustomReminder,
    toggleCustomReminder,
  } = useNotifications();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTime, setNewTime] = useState(new Date());
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'info' | 'error';
    title: string;
    message?: string;
  }>({ visible: false, type: 'info', title: '' });

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (hasPermission) return true;
    const granted = await requestPermission();
    if (!granted) {
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Notifications disabled',
        message: 'Please enable notifications in your device settings to use reminders.',
      });
    }
    return granted;
  }, [hasPermission, requestPermission]);

  // Default reminder toggles
  const handleToggleMorning = useCallback(async () => {
    await selectionLight();
    if (!settings.morningEnabled) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    await updateSettings({ morningEnabled: !settings.morningEnabled });
    if (!settings.morningEnabled) await notificationSuccess();
  }, [settings.morningEnabled, selectionLight, ensurePermission, updateSettings, notificationSuccess]);

  const handleToggleEvening = useCallback(async () => {
    await selectionLight();
    if (!settings.eveningEnabled) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    await updateSettings({ eveningEnabled: !settings.eveningEnabled });
    if (!settings.eveningEnabled) await notificationSuccess();
  }, [settings.eveningEnabled, selectionLight, ensurePermission, updateSettings, notificationSuccess]);

  const handleToggleMoodCheck = useCallback(async () => {
    await selectionLight();
    if (!settings.moodCheckEnabled) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    await updateSettings({ moodCheckEnabled: !settings.moodCheckEnabled });
    if (!settings.moodCheckEnabled) await notificationSuccess();
  }, [settings.moodCheckEnabled, selectionLight, ensurePermission, updateSettings, notificationSuccess]);

  // Custom reminder form
  const handleOpenAddModal = useCallback(async () => {
    await selectionLight();
    setNewTitle('');
    setNewBody('');
    setNewTime(new Date());
    setNewDays([0, 1, 2, 3, 4, 5, 6]);
    setShowAddModal(true);
  }, [selectionLight]);

  const handleSaveCustom = useCallback(async () => {
    if (!newTitle.trim()) return;
    const ok = await ensurePermission();
    if (!ok) return;

    await addCustomReminder({
      title: newTitle.trim(),
      body: newBody.trim() || 'Time for your reminder',
      time: dateToTimeString(newTime),
      days: newDays,
      enabled: true,
    });

    await notificationSuccess();
    setShowAddModal(false);
  }, [newTitle, newBody, newTime, newDays, ensurePermission, addCustomReminder, notificationSuccess]);

  const handleToggleDay = useCallback((day: number) => {
    setNewDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort(),
    );
  }, []);

  const handleToggleCustom = useCallback(async (id: string, enabled: boolean) => {
    await selectionLight();
    if (enabled) {
      const ok = await ensurePermission();
      if (!ok) return;
    }
    await toggleCustomReminder(id, enabled);
  }, [selectionLight, ensurePermission, toggleCustomReminder]);

  const handleDeleteCustom = useCallback(async () => {
    if (!deleteTarget) return;
    await removeCustomReminder(deleteTarget);
    setDeleteTarget(null);
  }, [deleteTarget, removeCustomReminder]);

  // Map colors for core Modal component
  const modalColors = {
    surface: colors.canvas,
    surfaceElevated: colors.canvasElevated,
    textPrimary: colors.ink,
    textSecondary: colors.inkMuted,
    overlay: withAlpha(colors.ink, 0.5),
    actionPrimary: colors.accentPrimary,
    actionSecondary: colors.canvasElevated,
    actionDestructive: colors.statusError,
    textInverse: colors.inkInverse,
    border: colors.border,
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Reminders"
              subtitle="Gentle nudges to support your practice"
              compact
            />
          </Animated.View>

          {/* Morning Reminder */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
            <GlassCard
              variant={settings.morningEnabled ? 'elevated' : 'default'}
              padding="lg"
              glow={settings.morningEnabled ? 'cool' : undefined}
            >
              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <Text variant="headlineSmall" color="ink">Morning check-in</Text>
                  <Text variant="bodyMedium" color="accent">
                    {formatTime(settings.morningTime)}
                  </Text>
                </View>
                <Switch
                  value={settings.morningEnabled}
                  onValueChange={handleToggleMorning}
                  trackColor={{ false: colors.border, true: colors.accentPrimary }}
                  thumbColor={colors.inkInverse}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Evening Reminder */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard
              variant={settings.eveningEnabled ? 'elevated' : 'default'}
              padding="lg"
              glow={settings.eveningEnabled ? 'cool' : undefined}
            >
              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <Text variant="headlineSmall" color="ink">Evening reflection</Text>
                  <Text variant="bodyMedium" color="accent">
                    {formatTime(settings.eveningTime)}
                  </Text>
                </View>
                <Switch
                  value={settings.eveningEnabled}
                  onValueChange={handleToggleEvening}
                  trackColor={{ false: colors.border, true: colors.accentPrimary }}
                  thumbColor={colors.inkInverse}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Mood Check Reminder */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <GlassCard
              variant={settings.moodCheckEnabled ? 'elevated' : 'default'}
              padding="lg"
              glow={settings.moodCheckEnabled ? 'cool' : undefined}
            >
              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <Text variant="headlineSmall" color="ink">Mood check</Text>
                  <Text variant="bodyMedium" color="accent">
                    {settings.moodCheckTimes.map(formatTime).join(' & ')}
                  </Text>
                </View>
                <Switch
                  value={settings.moodCheckEnabled}
                  onValueChange={handleToggleMoodCheck}
                  trackColor={{ false: colors.border, true: colors.accentPrimary }}
                  thumbColor={colors.inkInverse}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Custom Reminders */}
          {settings.customReminders.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.delay(350).duration(400)}
              style={styles.customSection}
            >
              <Text variant="labelMedium" color="inkMuted" style={styles.customLabel}>
                Custom reminders
              </Text>
              {settings.customReminders.map((reminder) => (
                <Pressable
                  key={reminder.id}
                  onLongPress={() => {
                    selectionLight();
                    setDeleteTarget(reminder.id);
                  }}
                >
                  <GlassCard
                    variant={reminder.enabled ? 'elevated' : 'subtle'}
                    padding="md"
                    style={styles.customCard}
                  >
                    <View style={styles.reminderRow}>
                      <View style={styles.reminderInfo}>
                        <Text variant="labelLarge" color="ink">{reminder.title}</Text>
                        <Text variant="bodySmall" color="inkMuted">
                          {formatTime(reminder.time)}
                          {reminder.days.length < 7 && reminder.days.length > 0
                            ? ` · ${reminder.days.map(d => DAY_LABELS[d]).join(' ')}`
                            : ' · Every day'}
                        </Text>
                      </View>
                      <Switch
                        value={reminder.enabled}
                        onValueChange={(val) => handleToggleCustom(reminder.id, val)}
                        trackColor={{ false: colors.border, true: colors.accentPrimary }}
                        thumbColor={colors.inkInverse}
                      />
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Add Custom Button */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={handleOpenAddModal}
              style={styles.addButton}
            >
              + Add custom reminder
            </Button>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(400)}>
            <GlassCard variant="subtle" padding="md" style={styles.noteCard}>
              <Text variant="bodySmall" color="inkMuted" align="center">
                Reminders are delivered as gentle notifications.{'\n'}
                Long-press a custom reminder to delete it.
              </Text>
            </GlassCard>
          </Animated.View>

          <View style={{ height: layout.tabBarHeight }} />
        </ScrollView>
      </SafeAreaView>

      {/* Add Custom Reminder Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New reminder"
        colors={modalColors}
        actions={[
          {
            label: 'Save',
            onPress: handleSaveCustom,
            variant: 'primary',
          },
        ]}
      >
        <View style={styles.formGroup}>
          <Text variant="labelSmall" style={{ color: colors.inkMuted, marginBottom: spacing[1] }}>
            Title
          </Text>
          <TextInput
            value={newTitle}
            onChangeText={(t) => setNewTitle(t.slice(0, 40))}
            placeholder="e.g. Afternoon stretch"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.formInput,
              {
                color: colors.ink,
                backgroundColor: withAlpha(colors.canvas, 0.6),
                borderColor: newTitle.trim() ? colors.accentPrimary : colors.border,
              },
            ]}
            autoCapitalize="sentences"
            maxLength={40}
          />
        </View>

        <View style={styles.formGroup}>
          <Text variant="labelSmall" style={{ color: colors.inkMuted, marginBottom: spacing[1] }}>
            Message (optional)
          </Text>
          <TextInput
            value={newBody}
            onChangeText={setNewBody}
            placeholder="A short note for yourself"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.formInput,
              {
                color: colors.ink,
                backgroundColor: withAlpha(colors.canvas, 0.6),
                borderColor: colors.border,
              },
            ]}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.formGroup}>
          <Text variant="labelSmall" style={{ color: colors.inkMuted, marginBottom: spacing[1] }}>
            Time
          </Text>
          <DateTimePicker
            value={newTime}
            mode="time"
            display="spinner"
            onChange={(_, date) => date && setNewTime(date)}
            style={styles.timePicker}
            textColor={colors.ink}
          />
        </View>

        <View style={styles.formGroup}>
          <Text variant="labelSmall" style={{ color: colors.inkMuted, marginBottom: spacing[2] }}>
            Days
          </Text>
          <DaySelector
            selectedDays={newDays}
            onToggle={handleToggleDay}
            colors={colors}
          />
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <AlertModal
        visible={!!deleteTarget}
        type="info"
        title="Delete reminder?"
        message="This custom reminder will be removed."
        onConfirm={handleDeleteCustom}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Permission Alert */}
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

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[6],
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  customSection: {
    marginTop: spacing[4],
  },
  customLabel: {
    marginBottom: spacing[2],
    letterSpacing: 0.5,
  },
  customCard: {
    marginBottom: spacing[2],
  },
  addButton: {
    marginTop: spacing[6],
  },
  noteCard: {
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  formGroup: {
    marginBottom: spacing[4],
  },
  formInput: {
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    fontSize: 16,
    borderWidth: 1.5,
  },
  timePicker: {
    height: 120,
    marginTop: -spacing[2],
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
