/**
 * YouScreen - Profile & Settings
 * 
 * Simplified profile with essential settings only.
 * 
 * Features:
 * - Simple profile display
 * - Quick access to themes
 * - Notification preferences
 * - Account actions
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useAmbient } from '../../contexts/AmbientContext';
import { useJourney } from '../../contexts/JourneyContext';

import { Text } from '../../components/core/Text';
import { Card } from '../../components/core/Card';
import { Avatar } from '../../components/core/Avatar';

import { spacing, radius, withAlpha, layout } from '../../theme/tokens';

// =============================================================================
// TYPES
// =============================================================================

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  colors: any;
}

// =============================================================================
// SETTING ITEM COMPONENT
// =============================================================================

function SettingItem({ icon, title, subtitle, onPress, trailing, colors }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      disabled={!onPress && !trailing}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: withAlpha(colors.actionPrimary, 0.1) },
        ]}
      >
        <Ionicons name={icon as any} size={18} color={colors.actionPrimary} />
      </View>
      <View style={styles.settingContent}>
        <Text variant="bodyLarge" style={{ color: colors.textPrimary }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" style={{ color: colors.textTertiary }}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing || (
        onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        )
      )}
    </Pressable>
  );
}

// =============================================================================
// STATS ROW COMPONENT
// =============================================================================

interface StatsRowProps {
  weeklyStats: {
    sessionsCompleted: number;
    totalMinutes: number;
    currentStreak: number;
    moodEntries: number;
  };
  colors: any;
}

function StatsRow({ weeklyStats, colors }: StatsRowProps) {
  const stats = [
    { value: weeklyStats.currentStreak, label: 'Day Streak', icon: 'flame' },
    { value: weeklyStats.sessionsCompleted, label: 'Sessions', icon: 'play-circle' },
    { value: weeklyStats.totalMinutes, label: 'Minutes', icon: 'time' },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={styles.statItem}>
          <Ionicons
            name={stat.icon as any}
            size={16}
            color={colors.accentPrimary}
          />
          <Text
            variant="headlineSmall"
            style={{ color: colors.textPrimary, marginTop: 4 }}
          >
            {stat.value}
          </Text>
          <Text variant="labelSmall" style={{ color: colors.textTertiary }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// YOU SCREEN
// =============================================================================

export function YouScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { userName } = useAmbient();
  const { weeklyStats } = useJourney();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const handleThemePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Cycle through: system -> light -> dark -> system
    if (mode === 'system') {
      setMode('light');
    } else if (mode === 'light') {
      setMode('dark');
    } else {
      setMode('system');
    }
  }, [mode, setMode]);

  const handleExportData = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export') },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Delete'),
        },
      ]
    );
  }, []);

  const themeLabel = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Text variant="headlineLarge" style={{ color: colors.textPrimary }}>
              Profile
            </Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={styles.section}
          >
            <Card variant="elevated" padding="lg" colors={colors}>
              <View style={styles.profileRow}>
                <Avatar
                  name={userName}
                  size="lg"
                  colors={colors}
                />
                <View style={styles.profileInfo}>
                  <Text variant="titleLarge" style={{ color: colors.textPrimary }}>
                    {userName}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: colors.textSecondary, marginTop: 2 }}
                  >
                    On your wellness journey
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <StatsRow weeklyStats={weeklyStats} colors={colors} />
            </Card>
          </Animated.View>

          {/* Preferences */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              style={{
                color: colors.textTertiary,
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              PREFERENCES
            </Text>
            <Card variant="default" padding="none" colors={colors}>
              <SettingItem
                icon="color-palette-outline"
                title="Appearance"
                subtitle={themeLabel}
                onPress={handleThemePress}
                colors={colors}
              />
              <SettingItem
                icon="notifications-outline"
                title="Notifications"
                colors={colors}
                trailing={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{
                      false: colors.border,
                      true: withAlpha(colors.actionPrimary, 0.5),
                    }}
                    thumbColor={
                      notificationsEnabled ? colors.actionPrimary : colors.textTertiary
                    }
                  />
                }
              />
              <SettingItem
                icon="alarm-outline"
                title="Daily Reminders"
                subtitle="10:00 AM"
                colors={colors}
                trailing={
                  <Switch
                    value={remindersEnabled}
                    onValueChange={setRemindersEnabled}
                    trackColor={{
                      false: colors.border,
                      true: withAlpha(colors.actionPrimary, 0.5),
                    }}
                    thumbColor={
                      remindersEnabled ? colors.actionPrimary : colors.textTertiary
                    }
                  />
                }
              />
            </Card>
          </Animated.View>

          {/* Data & Privacy */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              style={{
                color: colors.textTertiary,
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              DATA & PRIVACY
            </Text>
            <Card variant="default" padding="none" colors={colors}>
              <SettingItem
                icon="download-outline"
                title="Export Your Data"
                onPress={handleExportData}
                colors={colors}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                onPress={() => {}}
                colors={colors}
              />
              <SettingItem
                icon="document-text-outline"
                title="Terms of Service"
                onPress={() => {}}
                colors={colors}
              />
            </Card>
          </Animated.View>

          {/* Support */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              style={{
                color: colors.textTertiary,
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              SUPPORT
            </Text>
            <Card variant="default" padding="none" colors={colors}>
              <SettingItem
                icon="help-circle-outline"
                title="Help Center"
                onPress={() => {}}
                colors={colors}
              />
              <SettingItem
                icon="chatbubble-outline"
                title="Contact Us"
                onPress={() => {}}
                colors={colors}
              />
              <SettingItem
                icon="star-outline"
                title="Rate Restorae"
                onPress={() => {}}
                colors={colors}
              />
            </Card>
          </Animated.View>

          {/* Account Actions */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              style={{
                color: colors.textTertiary,
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              ACCOUNT
            </Text>
            <Card variant="default" padding="none" colors={colors}>
              <SettingItem
                icon="log-out-outline"
                title="Sign Out"
                onPress={() => {}}
                colors={colors}
              />
              <Pressable
                onPress={handleDeleteAccount}
                style={[styles.settingItem, styles.dangerItem]}
              >
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: withAlpha(colors.actionDestructive, 0.1) },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.actionDestructive}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text
                    variant="bodyLarge"
                    style={{ color: colors.actionDestructive }}
                  >
                    Delete Account
                  </Text>
                </View>
              </Pressable>
            </Card>
          </Animated.View>

          {/* App Info */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(300)}
            style={styles.appInfo}
          >
            <Text variant="bodySmall" style={{ color: colors.textTertiary }}>
              Restorae v1.0.0
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.textTertiary, marginTop: 2 }}
            >
              Made with ❤️ for your wellbeing
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});

export default YouScreen;
