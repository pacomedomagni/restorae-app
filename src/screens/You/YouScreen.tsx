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
import { View, StyleSheet, ScrollView, Pressable, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAmbient } from '../../contexts/AmbientContext';
import { useJourney } from '../../contexts/JourneyContext';
import { useAuth } from '../../contexts/AuthContext';

import { Avatar } from '../../components/core/Avatar';
import { Text, GlassCard, AlertModal } from '../../components/ui';
import { SkeletonText } from '../../components/ui/Skeleton';

import { spacing, radius, withAlpha, layout } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}

// =============================================================================
// SETTING ITEM COMPONENT
// =============================================================================

function SettingItem({ icon, title, subtitle, onPress, trailing }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      disabled={!onPress && !trailing}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
        ]}
      >
        <Ionicons name={icon as any} size={18} color={colors.accentPrimary} />
      </View>
      <View style={styles.settingContent}>
        <Text variant="bodyLarge" color="ink">
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" color="inkFaint">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing || (
        onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.inkFaint}
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
}

function StatsRow({ weeklyStats }: StatsRowProps) {
  const { colors } = useTheme();
  const stats = [
    { value: weeklyStats.currentStreak, label: 'Days Active', icon: 'calendar-outline' },
    { value: weeklyStats.sessionsCompleted, label: 'Sessions', icon: 'play-circle' },
    { value: weeklyStats.totalMinutes, label: 'Minutes', icon: 'time' },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statItem}>
          <Ionicons
            name={stat.icon as any}
            size={16}
            color={colors.accentPrimary}
          />
          <Text
            variant="headlineSmall"
            color="ink"
            style={{ marginTop: 4 }}
          >
            {stat.value}
          </Text>
          <Text variant="labelSmall" color="inkFaint">
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
  const { weeklyStats, isLoading: journeyLoading } = useJourney();
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'confirm' | 'warning';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ visible: false, type: 'confirm', title: '', message: '', onConfirm: () => {} });

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
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Export Data',
      message: 'Your data will be exported as a JSON file.',
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        // TODO: Implement export
      },
    });
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Delete Account',
      message: 'This action cannot be undone. All your data will be permanently deleted.',
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        // TODO: Implement account deletion
      },
    });
  }, []);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      onConfirm: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        await logout();
      },
    });
  }, [logout]);

  const handlePrivacy = useCallback(() => {
    navigation.navigate('Privacy');
  }, [navigation]);

  const handleSupport = useCallback(() => {
    navigation.navigate('Support');
  }, [navigation]);

  const handleTerms = useCallback(() => {
    Linking.openURL('https://restorae.app/terms');
  }, []);

  const handleRate = useCallback(() => {
    Linking.openURL('https://apps.apple.com/app/restorae');
  }, []);

  const themeLabel = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Text variant="headlineLarge" color="ink">
              Profile
            </Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={styles.section}
          >
            <GlassCard variant="elevated" padding="lg">
              <View style={styles.profileRow}>
                <Avatar
                  name={userName}
                  size="lg"
                  colors={colors}
                />
                <View style={styles.profileInfo}>
                  <Text variant="headlineMedium" color="ink">
                    {userName}
                  </Text>
                  <Text
                    variant="bodySmall"
                    color="inkMuted"
                    style={{ marginTop: 2 }}
                  >
                    Wellness member
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {journeyLoading ? (
                <SkeletonText lines={1} />
              ) : (
                <StatsRow weeklyStats={weeklyStats} />
              )}
            </GlassCard>
          </Animated.View>

          {/* Preferences */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              color="inkFaint"
              style={{
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              PREFERENCES
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="color-palette-outline"
                title="Appearance"
                subtitle={themeLabel}
                onPress={handleThemePress}
              />
              <SettingItem
                icon="notifications-outline"
                title="Notifications"
                trailing={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{
                      false: colors.border,
                      true: withAlpha(colors.accentPrimary, 0.5),
                    }}
                    thumbColor={
                      notificationsEnabled ? colors.accentPrimary : colors.inkFaint
                    }
                  />
                }
              />
              <SettingItem
                icon="alarm-outline"
                title="Daily Reminders"
                subtitle="10:00 AM"
                trailing={
                  <Switch
                    value={remindersEnabled}
                    onValueChange={setRemindersEnabled}
                    trackColor={{
                      false: colors.border,
                      true: withAlpha(colors.accentPrimary, 0.5),
                    }}
                    thumbColor={
                      remindersEnabled ? colors.accentPrimary : colors.inkFaint
                    }
                  />
                }
              />
            </GlassCard>
          </Animated.View>

          {/* Data & Privacy */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              color="inkFaint"
              style={{
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              DATA & PRIVACY
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="download-outline"
                title="Export Your Data"
                onPress={handleExportData}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                onPress={handlePrivacy}
              />
              <SettingItem
                icon="document-text-outline"
                title="Terms of Service"
                onPress={handleTerms}
              />
            </GlassCard>
          </Animated.View>

          {/* Support */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              color="inkFaint"
              style={{
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              SUPPORT
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="help-circle-outline"
                title="Help Center"
                onPress={handleSupport}
              />
              <SettingItem
                icon="chatbubble-outline"
                title="Contact Us"
                onPress={handleSupport}
              />
              <SettingItem
                icon="star-outline"
                title="Rate Restorae"
                onPress={handleRate}
              />
            </GlassCard>
          </Animated.View>

          {/* Account Actions */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(300)}
            style={styles.section}
          >
            <Text
              variant="labelSmall"
              color="inkFaint"
              style={{
                marginBottom: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              ACCOUNT
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="log-out-outline"
                title="Sign Out"
                onPress={handleSignOut}
              />
              <Pressable
                onPress={handleDeleteAccount}
                style={[styles.settingItem, styles.dangerItem]}
              >
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: withAlpha(colors.accentDanger, 0.1) },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.accentDanger}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text
                    variant="bodyLarge"
                    style={{ color: colors.accentDanger }}
                  >
                    Delete Account
                  </Text>
                </View>
              </Pressable>
            </GlassCard>
          </Animated.View>

          {/* App Info */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(300)}
            style={styles.appInfo}
          >
            <Text variant="bodySmall" color="inkFaint">
              Restorae v1.0.0
            </Text>
            <Text
              variant="bodySmall"
              color="inkFaint"
              style={{ marginTop: 2 }}
            >
              Your sanctuary for calm
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
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
