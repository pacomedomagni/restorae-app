/**
 * StreakBanner Component
 * 
 * Premium streak display for the home screen header.
 * Shows current streak with celebratory animations.
 * 
 * Features:
 * - Fire animation for active streaks
 * - Level badge display
 * - Streak freeze indicator
 * - At-risk warning
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from './Text';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { gamification, StreakData, UserLevel } from '../../services/gamification';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { RootStackParamList } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface StreakBannerProps {
  onPress?: () => void;
}

// =============================================================================
// STREAK BADGE COMPONENT
// =============================================================================

function StreakBadge({ days, isAtRisk }: { days: number; isAtRisk: boolean }) {
  const { colors, reduceMotion } = useTheme();
  const fireScale = useSharedValue(1);
  const fireRotate = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion && days > 0) {
      // Flame animation
      fireScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      fireRotate.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [days]);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fireScale.value },
      { rotate: `${fireRotate.value}deg` },
    ],
  }));

  if (days === 0) {
    return (
      <View style={[styles.streakBadge, { backgroundColor: withAlpha(colors.canvasElevated, 0.5) }]}>
        <Text style={styles.streakEmoji}>💫</Text>
        <Text variant="labelMedium" color="inkMuted">
          Start streak
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.streakBadge,
        {
          backgroundColor: isAtRisk
            ? withAlpha('#F59E0B', 0.2)
            : withAlpha(colors.accentWarm, 0.15),
        },
      ]}
    >
      <Animated.View style={fireStyle}>
        <Text style={styles.streakEmoji}>{isAtRisk ? '⚠️' : '🔥'}</Text>
      </Animated.View>
      <Text
        variant="headlineSmall"
        style={{ color: isAtRisk ? '#F59E0B' : colors.accentWarm }}
      >
        {days}
      </Text>
      <Text variant="labelSmall" color="inkMuted">
        day{days !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// =============================================================================
// LEVEL BADGE COMPONENT
// =============================================================================

function LevelBadge({ level }: { level: UserLevel }) {
  const { colors, reduceMotion } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      shimmer.value = withRepeat(
        withSequence(
          withDelay(2000, withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.4, 0]),
  }));

  // Level color based on tier
  const getLevelColor = () => {
    if (level.level <= 3) return colors.accentCalm;
    if (level.level <= 6) return colors.accentPrimary;
    if (level.level <= 10) return colors.accentWarm;
    return '#FFD700'; // Gold for highest levels
  };

  return (
    <View style={styles.levelBadge}>
      {/* Background with shimmer */}
      <View
        style={[
          styles.levelBadgeInner,
          { backgroundColor: withAlpha(getLevelColor(), 0.15) },
        ]}
      >
        <Animated.View
          style={[
            styles.levelShimmer,
            shimmerStyle,
            { backgroundColor: getLevelColor() },
          ]}
        />
        <Text variant="labelSmall" style={{ color: getLevelColor() }}>
          Lv. {level.level}
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// XP PROGRESS BAR
// =============================================================================

function XPProgressBar({ level }: { level: UserLevel }) {
  const { colors, reduceMotion } = useTheme();
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      progressAnim.value = withDelay(
        500,
        withSpring(level.progress, { damping: 15, stiffness: 80 })
      );
    } else {
      progressAnim.value = level.progress;
    }
  }, [level.progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  return (
    <View style={styles.xpContainer}>
      <View style={[styles.xpBar, { backgroundColor: withAlpha(colors.canvasElevated, 0.5) }]}>
        <Animated.View style={[styles.xpProgress, progressStyle]}>
          <LinearGradient
            colors={[colors.accentPrimary, colors.accentWarm]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text variant="labelSmall" color="inkFaint" style={styles.xpText}>
        {level.currentXP}/{level.xpForNext} XP
      </Text>
    </View>
  );
}

// =============================================================================
// STREAK BANNER (Simplified - streak only, no level/XP)
// =============================================================================

export function StreakBanner({ onPress }: StreakBannerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isAtRisk, setIsAtRisk] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    gamification.initialize().then(() => {
      setStreak(gamification.getStreak());
      setIsAtRisk(gamification.isStreakAtRisk());
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    if (onPress) {
      onPress();
    } else {
      // Navigate to progress dashboard
      navigation.navigate('Progress' as any);
    }
  };

  if (!streak) return null;
  
  // Don't show banner if no streak started yet
  if (streak.currentStreak === 0) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${streak.currentStreak} day streak`}
      >
        <Animated.View style={animatedStyle}>
          <View
            style={[
              styles.container,
              { backgroundColor: withAlpha(colors.canvasElevated, 0.6) },
            ]}
          >
            {/* Streak Badge */}
            <StreakBadge days={streak.currentStreak} isAtRisk={isAtRisk} />

            {/* Simple encouragement text */}
            <View style={styles.rightSection}>
              <Text variant="bodyMedium" color="ink">
                {getStreakMessage(streak.currentStreak, isAtRisk)}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Simple encouragement messages
function getStreakMessage(days: number, isAtRisk: boolean): string {
  if (isAtRisk) return "Don't lose your streak!";
  if (days >= 30) return "Incredible consistency!";
  if (days >= 14) return "Two weeks strong!";
  if (days >= 7) return "One week of wellness!";
  if (days >= 3) return "Keep it going!";
  return "You're building a habit!";
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  streakEmoji: {
    fontSize: 20,
  },
  rightSection: {
    flex: 1,
  },
  levelBadge: {
    justifyContent: 'center',
  },
  levelBadgeInner: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelShimmer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  xpContainer: {
    marginTop: spacing[1],
  },
  xpBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpText: {
    marginTop: spacing[1],
  },
});

export default StreakBanner;
