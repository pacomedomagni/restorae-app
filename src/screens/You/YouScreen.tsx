/**
 * YouScreen - Profile & Settings
 *
 * Minimal, warm. Profile card + essential settings only.
 * Stats live in Journey, not here.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAmbient } from '../../contexts/AmbientContext';
import { useAuth } from '../../contexts/AuthContext';

import { Avatar } from '../../components/core/Avatar';
import { Text, GlassCard, ScreenHeader, AlertModal } from '../../components/ui';

import { spacing, borderRadius, withAlpha, layout } from '../../theme';
import type { RootStackParamList } from '../../types';

// =============================================================================
// SETTING ITEM
// =============================================================================

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, danger }: SettingItemProps) {
  const { colors } = useTheme();
  const iconColor = danger ? colors.accentDanger : colors.accentPrimary;
  const iconBg = withAlpha(iconColor, 0.1);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, { borderBottomColor: colors.borderMuted }]}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text
          variant="bodyMedium"
          style={danger ? { color: colors.accentDanger } : undefined}
          color={danger ? undefined : 'ink'}
        >
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" color="inkFaint">
            {subtitle}
          </Text>
        )}
      </View>
      {onPress && !danger && (
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      )}
    </Pressable>
  );
}

// =============================================================================
// YOU SCREEN
// =============================================================================

export function YouScreen() {
  const { colors, mode, setMode } = useTheme();
  const { userName } = useAmbient();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'confirm' | 'warning';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ visible: false, type: 'confirm', title: '', message: '', onConfirm: () => {} });

  const themeLabel = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';

  const handleAppearance = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Appearance');
  }, [navigation]);

  const handleNotifications = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Reminders');
  }, [navigation]);

  const handleExportData = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Export data',
      message: 'Your data will be exported as a JSON file.',
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  }, []);

  const handlePrivacy = useCallback(() => {
    navigation.navigate('Privacy');
  }, [navigation]);

  const handleSupport = useCallback(() => {
    navigation.navigate('Support');
  }, [navigation]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await logout();
      },
    });
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Delete account',
      message: 'This cannot be undone. All your data will be permanently deleted.',
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  }, []);

  const handleEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EditProfile');
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader variant="hero" title="You" />

          {/* Profile Card — tappable, navigates to EditProfile */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
            <GlassCard variant="elevated" padding="lg" onPress={handleEditProfile}>
              <View style={styles.profileRow}>
                <Avatar name={userName} size="lg" colors={colors} />
                <View style={styles.profileInfo}>
                  <Text variant="headlineMedium" color="ink">
                    {userName}
                  </Text>
                  <Text variant="bodySmall" color="inkMuted" style={{ marginTop: 2 }}>
                    Wellness member
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Preferences */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              Preferences
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="color-palette-outline"
                title="Appearance"
                subtitle={themeLabel}
                onPress={handleAppearance}
              />
              <SettingItem
                icon="notifications-outline"
                title="Notifications"
                onPress={handleNotifications}
              />
            </GlassCard>
          </Animated.View>

          {/* Data & Privacy */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              Data & privacy
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="download-outline"
                title="Export data"
                onPress={handleExportData}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy & terms"
                onPress={handlePrivacy}
              />
            </GlassCard>
          </Animated.View>

          {/* Support */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              Support
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="help-circle-outline"
                title="Help center"
                onPress={handleSupport}
              />
            </GlassCard>
          </Animated.View>

          {/* Account */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              Account
            </Text>
            <GlassCard variant="default" padding="none">
              <SettingItem
                icon="log-out-outline"
                title="Sign out"
                onPress={handleSignOut}
              />
              <SettingItem
                icon="trash-outline"
                title="Delete account"
                onPress={handleDeleteAccount}
                danger
              />
            </GlassCard>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(350).duration(300)} style={styles.footer}>
            <Text variant="bodySmall" color="inkFaint" align="center">
              Restorae v1.0.0
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
        onCancel={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionLabel: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing[4],
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  settingContent: {
    flex: 1,
  },
  footer: {
    paddingVertical: spacing[8],
  },
});

export default YouScreen;
