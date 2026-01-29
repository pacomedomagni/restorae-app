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
// STREAK BANNER
// =============================================================================

export function StreakBanner({ onPress }: StreakBannerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [isAtRisk, setIsAtRisk] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    gamification.initialize().then(() => {
      setStreak(gamification.getStreak());
      setLevel(gamification.getLevel());
      setIsAtRisk(gamification.isStreakAtRisk());
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
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

  if (!streak || !level) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${streak.currentStreak} day streak, Level ${level.level} ${level.title}`}
      >
        <Animated.View style={animatedStyle}>
          <View
            style={[
              styles.container,
              { backgroundColor: withAlpha(colors.canvasElevated, 0.6) },
            ]}
          >
            {/* Left side - Streak */}
            <StreakBadge days={streak.currentStreak} isAtRisk={isAtRisk} />

            {/* Right side - Level & XP */}
            <View style={styles.rightSection}>
              <View style={styles.levelRow}>
                <LevelBadge level={level} />
                <Text variant="labelMedium" color="ink" style={styles.levelTitle}>
                  {level.title}
                </Text>
              </View>
              <XPProgressBar level={level} />
            </View>

            {/* Chevron indicator */}
            <Text style={styles.chevron}>›</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
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
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  levelBadge: {},
  levelBadgeInner: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  levelShimmer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
  },
  levelTitle: {},
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  xpBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpText: {},
  chevron: {
    fontSize: 20,
    color: '#666',
    marginLeft: spacing[1],
  },
});

export default StreakBanner;
