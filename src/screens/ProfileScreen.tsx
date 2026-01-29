/**
 * ProfileScreen
 * 
 * Clean, focused profile with compact identity card
 * and organized settings.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import { useUISounds } from '../hooks/useUISounds';
import { useTheme } from '../contexts/ThemeContext';
import { useCoachMarks } from '../contexts/CoachMarkContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  TabSafeScrollView,
  CoachMarkOverlay,
  OfflineBanner,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { spacing, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

// =============================================================================
// TYPES & DATA
// =============================================================================
interface SettingItem {
  id: string;
  label: string;
  icon: 'profile' | 'history' | 'subscription' | 'settings' | 'lock' | 'data' | 'privacy' | 'support' | 'security';
  route: keyof RootStackParamList;
}

interface SettingCategory {
  id: string;
  label: string;
  items: SettingItem[];
}

const SETTINGS_GROUPED: SettingCategory[] = [
  {
    id: 'account-section',
    label: 'ACCOUNT',
    items: [
      { id: 'account', label: 'Account', icon: 'profile', route: 'EditProfile' },
      { id: 'subscription', label: 'Subscription', icon: 'subscription', route: 'Subscription' },
    ],
  },
  {
    id: 'wellness-section',
    label: 'WELLNESS',
    items: [
      { id: 'mood-history', label: 'Mood History', icon: 'history', route: 'MoodHistory' },
      { id: 'progress', label: 'Progress & Stats', icon: 'history', route: 'Progress' },
    ],
  },
  {
    id: 'preferences-section',
    label: 'PREFERENCES',
    items: [
      { id: 'preferences', label: 'Appearance & Sounds', icon: 'settings', route: 'Preferences' },
    ],
  },
  {
    id: 'privacy-section',
    label: 'PRIVACY & DATA',
    items: [
      { id: 'security', label: 'Security', icon: 'lock', route: 'SecuritySettings' },
      { id: 'data', label: 'Data & Storage', icon: 'data', route: 'DataSettings' },
      { id: 'privacy', label: 'Privacy Policy', icon: 'privacy', route: 'Privacy' },
      { id: 'support', label: 'Support', icon: 'support', route: 'Support' },
    ],
  },
];

// =============================================================================
// SETTING ROW
// =============================================================================
interface SettingRowProps {
  setting: SettingItem;
  index: number;
  onPress: () => void;
}

function SettingRow({ setting, index, onPress }: SettingRowProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.delay(200 + index * 50).duration(300)
      }
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={setting.label}
        accessibilityHint="Opens the selected screen"
      >
        <Animated.View style={animatedStyle}>
          <View style={[styles.settingRow, { borderBottomColor: withAlpha(colors.border, 0.3) }]}>
            <View
              style={[
                styles.settingIconSmall,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
              ]}
            >
              <Icon name={setting.icon} size={18} color={colors.accentPrimary} />
            </View>
            <Text variant="bodyLarge" color="ink" style={styles.settingLabel}>
              {setting.label}
            </Text>
            <Text variant="bodyMedium" color="inkFaint">
              →
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// PROFILE SCREEN
// =============================================================================
export function ProfileScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playTap, playTransition } = useUISounds();
  const { impactLight } = useHaptics();
  const { shouldShowCoachMark, markAsShown, COACH_MARKS } = useCoachMarks();

  const [userName, setUserName] = useState<string>('');
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [showProfileCoachMark, setShowProfileCoachMark] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    // Load user data
    const name = await AsyncStorage.getItem('@restorae/user_name');
    if (name) setUserName(name);
    
    // Load streak and progress (would come from context/API in real app)
    setStreakDays(12);
    setWeeklyProgress(0.68);
  };

  useEffect(() => {
    loadData();

    // Check for coach marks
    setTimeout(() => {
      if (shouldShowCoachMark('profile_customize')) {
        setShowProfileCoachMark(true);
      }
    }, 1000);
  }, [shouldShowCoachMark]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await impactLight();
    await loadData();
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsRefreshing(false);
  };

  const handleSettingPress = (route: keyof RootStackParamList) => {
    playTap();
    playTransition();
    navigation.navigate(route as any);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="evening" intensity="subtle" />

      {/* Offline indicator */}
      <OfflineBanner variant="floating" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {/* Header - Simple */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(600)}
            style={styles.header}
          >
            <Text variant="displaySmall" color="ink">
              Profile
            </Text>
          </Animated.View>

          {/* Identity Card - Compact */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(100).duration(400)
            }
          >
            <GlassCard variant="elevated" padding="md">
              <View style={styles.identityCard}>
                {/* User Info */}
                <View style={styles.identityLeft}>
                  <View style={[styles.avatarCircle, { backgroundColor: withAlpha(colors.accentPrimary, 0.15) }]}>
                    <Text style={{ fontSize: 24 }}>👤</Text>
                  </View>
                  <View style={styles.identityText}>
                    <Text variant="headlineSmall" color="ink">
                      {userName || 'Welcome'}
                    </Text>
                    <Text variant="labelSmall" color="inkMuted">
                      {streakDays > 0 ? `🔥 ${streakDays} day streak` : 'Start your streak today'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Inline Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarHeader}>
                  <Text variant="labelSmall" color="inkFaint">Weekly Goal</Text>
                  <Text variant="labelSmall" color="inkMuted">{Math.round(weeklyProgress * 100)}%</Text>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: withAlpha(colors.ink, 0.08) }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: colors.accentPrimary,
                        width: `${Math.round(weeklyProgress * 100)}%`,
                      }
                    ]} 
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Settings Sections - Grouped */}
          {SETTINGS_GROUPED.map((category, categoryIndex) => (
            <View key={category.id} style={styles.settingsSection}>
              <Animated.View
                entering={reduceMotion ? undefined : FadeIn.delay(250 + categoryIndex * 100).duration(300)}
              >
                <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                  {category.label}
                </Text>
              </Animated.View>

              <View style={styles.settingsList}>
                {category.items.map((setting, index) => (
                  <SettingRow
                    key={setting.id}
                    setting={setting}
                    index={index + categoryIndex * 3}
                    onPress={() => handleSettingPress(setting.route)}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* App Info */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(400).duration(300)}
            style={styles.appInfo}
          >
            <Logo size="small" style={styles.logoMini} />
            <Text variant="labelSmall" color="inkFaint">
              Restorae v1.0.0
            </Text>
            <Text variant="bodySmall" color="inkFaint" style={styles.tagline}>
            Your sanctuary for calm
          </Text>
        </Animated.View>
        </TabSafeScrollView>
      </SafeAreaView>

      {/* Coach Mark - Profile customization */}
      {showProfileCoachMark && (
        <CoachMarkOverlay
          markId="profile_customize"
          visible={showProfileCoachMark}
          onDismiss={() => {
            markAsShown('profile_customize');
            setShowProfileCoachMark(false);
          }}
        />
      )}
    </View>
  );
}// =============================================================================
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
  },
  header: {
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  // Identity card styles
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    marginLeft: spacing[3],
  },
  // Progress bar styles
  progressBarContainer: {
    marginTop: spacing[4],
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Section styles
  sectionLabel: {
    letterSpacing: 2,
    marginBottom: spacing[2],
  },
  settingsSection: {
    marginTop: spacing[6],
  },
  settingsList: {
    gap: spacing[1],
  },
  // Compact setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    marginLeft: spacing[3],
  },
  // App info
  appInfo: {
    alignItems: 'center',
    marginTop: spacing[8],
    paddingVertical: spacing[6],
  },
  logoMini: {
    marginBottom: spacing[3],
  },
  tagline: {
    marginTop: spacing[1],
  },
});

export default ProfileScreen;
