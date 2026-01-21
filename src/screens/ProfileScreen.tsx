/**
 * ProfileScreen
 * 
 * User profile with stats, settings access,
 * and account management.
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
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  Skeleton,
  SkeletonCard,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

// =============================================================================
// TYPES & DATA
// =============================================================================
interface StatData {
  label: string;
  value: string;
  sublabel: string;
  color: 'primary' | 'warm' | 'calm';
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  icon: 'home' | 'journal-tab' | 'profile';
  route: keyof RootStackParamList;
}

const SETTINGS: SettingItem[] = [
  {
    id: 'mood-history',
    label: 'Mood History',
    description: 'View your emotional trends',
    icon: 'home',
    route: 'MoodHistory',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    description: 'Manage your premium plan',
    icon: 'home',
    route: 'Subscription',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Appearance, sounds & reminders',
    icon: 'home',
    route: 'Preferences',
  },
  {
    id: 'app-lock',
    label: 'App Lock',
    description: 'PIN & biometric security',
    icon: 'journal-tab',
    route: 'AppLockSetup',
  },
  {
    id: 'data',
    label: 'Data & Storage',
    description: 'Export & delete your data',
    icon: 'journal-tab',
    route: 'DataSettings',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Privacy policy',
    icon: 'journal-tab',
    route: 'Privacy',
  },
  {
    id: 'support',
    label: 'Support',
    description: 'Help, feedback & about',
    icon: 'profile',
    route: 'Support',
  },
];

// =============================================================================
// CIRCULAR PROGRESS
// =============================================================================
interface CircularProgressProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  color: string;
  children?: React.ReactNode;
}

function CircularProgress({
  progress,
  size,
  strokeWidth,
  color,
  children,
}: CircularProgressProps) {
  const { colors, reduceMotion } = useTheme();
  const animatedProgress = useSharedValue(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.value = progress;
    } else {
      animatedProgress.value = withDelay(
        500,
        withTiming(progress, { duration: 1500, easing: Easing.out(Easing.ease) })
      );
    }
  }, [progress, reduceMotion, animatedProgress]);

  // For SVG animation we need a static strokeDashoffset since react-native-svg 
  // doesn't support animated props well with reanimated v4. Use the progress value directly.
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background circle */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={withAlpha(colors.ink, 0.08)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================
interface StatCardProps {
  stat: StatData;
  index: number;
}

function StatCard({ stat, index }: StatCardProps) {
  const { colors, reduceMotion } = useTheme();
  
  const colorMap = {
    primary: colors.accentPrimary,
    warm: colors.accentWarm,
    calm: colors.accentCalm,
  };
  const color = colorMap[stat.color];

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.delay(300 + index * 100)
              .duration(400)
              .easing(Easing.out(Easing.ease))
      }
      style={styles.statCard}
    >
      <GlassCard variant="elevated" padding="md">
        <View style={styles.statContent}>
          <Text variant="displaySmall" style={{ color }}>
            {stat.value}
          </Text>
          <Text variant="labelMedium" color="ink" style={styles.statLabel}>
            {stat.label}
          </Text>
          <Text variant="labelSmall" color="inkFaint">
            {stat.sublabel}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

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
          : FadeInDown.delay(600 + index * 80)
              .duration(400)
              .easing(Easing.out(Easing.ease))
      }
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard variant="subtle" padding="md">
            <View style={styles.settingContent}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
                ]}
              >
                <Icon name={setting.icon} size={22} color={colors.accentPrimary} />
              </View>
              <View style={styles.settingText}>
                <Text variant="headlineSmall" color="ink">
                  {setting.label}
                </Text>
                <Text variant="bodySmall" color="inkMuted">
                  {setting.description}
                </Text>
              </View>
              <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
                →
              </Text>
            </View>
          </GlassCard>
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

  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Load user data
      const name = await AsyncStorage.getItem('@restorae/user_name');
      if (name) setUserName(name);
      
      // Simulate loading stats from storage/API
      await new Promise(resolve => setTimeout(resolve, 600));
      setStats([
        { label: 'Sessions', value: '47', sublabel: 'this month', color: 'primary' },
        { label: 'Streak', value: '12', sublabel: 'days', color: 'warm' },
        { label: 'Minutes', value: '234', sublabel: 'total time', color: 'calm' },
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const weeklyProgress = 0.68; // 68% of weekly goal

  return (
    <View style={styles.container}>
      <AmbientBackground variant="evening" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View
          style={styles.scrollContent}
        >
          {/* Header */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(600)}
            style={styles.header}
          >
            <Text variant="labelSmall" color="inkFaint" style={styles.eyebrow}>
              YOUR SPACE
            </Text>
            <Text variant="displayMedium" color="ink">
              Profile
            </Text>
            {userName && (
              <Text variant="bodyLarge" color="inkMuted" style={styles.subtitle}>
                Welcome back, {userName}
              </Text>
            )}
          </Animated.View>

          {/* Weekly Progress Card */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.ease))
            }
          >
            <GlassCard variant="hero" padding="lg" glow="primary">
              <View style={styles.progressContent}>
                <View style={styles.progressInfo}>
                  <Text variant="labelSmall" color="inkFaint">
                    WEEKLY GOAL
                  </Text>
                  <Text variant="headlineLarge" color="ink" style={styles.progressTitle}>
                    Your rhythm
                  </Text>
                  <Text variant="bodyMedium" color="inkMuted" style={styles.progressDescription}>
                    {Math.round(weeklyProgress * 100)}% of your wellness goal completed
                  </Text>
                  <View style={styles.progressMeta}>
                    <View
                      style={[
                        styles.progressMetaPill,
                        { backgroundColor: withAlpha(colors.accentPrimary, 0.12) },
                      ]}
                    >
                      <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
                        5 of 7 days
                      </Text>
                    </View>
                  </View>
                </View>
                
                <CircularProgress
                  progress={weeklyProgress}
                  size={100}
                  strokeWidth={8}
                  color={colors.accentPrimary}
                >
                  <Text variant="headlineMedium" style={{ color: colors.accentPrimary }}>
                    {Math.round(weeklyProgress * 100)}%
                  </Text>
                </CircularProgress>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsSection}>
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(200).duration(400)}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                THIS WEEK
              </Text>
            </Animated.View>
            
            <View style={styles.statsGrid}>
              {isLoading ? (
                <>
                  <View style={styles.statCard}>
                    <SkeletonCard />
                  </View>
                  <View style={styles.statCard}>
                    <SkeletonCard />
                  </View>
                  <View style={styles.statCard}>
                    <SkeletonCard />
                  </View>
                </>
              ) : (
                stats.map((stat, index) => (
                  <StatCard key={stat.label} stat={stat} index={index} />
                ))
              )}
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(250).duration(300)}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                SETTINGS
              </Text>
            </Animated.View>

            <View style={styles.settingsList}>
              {SETTINGS.map((setting, index) => (
                <SettingRow
                  key={setting.id}
                  setting={setting}
                  index={index}
                  onPress={() => navigation.navigate(setting.route as any)}
                />
              ))}
            </View>
          </View>

          {/* App Info */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(400).duration(300)}
            style={styles.appInfo}
          >
            <View style={styles.logoMini}>
              <Icon name="logo" size={32} />
            </View>
            <Text variant="labelSmall" color="inkFaint">
              Restorae v1.0.0
            </Text>
            <Text variant="bodySmall" color="inkFaint" style={styles.tagline}>
              Your sanctuary for calm
            </Text>
          </Animated.View>
        </View>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  eyebrow: {
    marginBottom: spacing[1],
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: spacing[2],
  },
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  progressTitle: {
    marginTop: spacing[1],
  },
  progressDescription: {
    marginTop: spacing[2],
  },
  progressMeta: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
  progressMetaPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statsSection: {
    marginTop: spacing[8],
  },
  sectionLabel: {
    letterSpacing: 2,
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
  },
  statLabel: {
    marginTop: spacing[1],
  },
  settingsSection: {
    marginTop: spacing[8],
  },
  settingsList: {
    gap: spacing[3],
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  settingText: {
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing[10],
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
