/**
 * Skeleton Component
 * Animated loading placeholder for content
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius, spacing, withAlpha } from '../../theme';

interface SkeletonProps {
  /** Width of the skeleton */
  width?: number | `${number}%`;
  /** Height of the skeleton */
  height?: number;
  /** Border radius variant */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Additional style */
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  radius = 'md',
  style,
}: SkeletonProps) {
  const { colors, reduceMotion } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) return;
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const radiusValue = radius === 'full' ? height / 2 : borderRadius[radius];

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radiusValue,
          backgroundColor: withAlpha(colors.ink, 0.08),
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// =============================================================================
// SKELETON PRESETS
// =============================================================================

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
        style,
      ]}
    >
      <Skeleton width={48} height={48} radius="full" />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={18} style={styles.mb2} />
        <Skeleton width="90%" height={14} />
      </View>
    </View>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={16}
          style={index < lines - 1 ? styles.mb2 : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonMoodOrb() {
  return (
    <View style={styles.moodOrbContainer}>
      <Skeleton width={80} height={80} radius="full" />
      <Skeleton width={60} height={14} radius="md" style={styles.mt2} />
    </View>
  );
}

export function SkeletonJournalEntry() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.journalEntry,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <View style={styles.journalHeader}>
        <Skeleton width={80} height={12} radius="sm" />
        <Skeleton width={24} height={24} radius="full" />
      </View>
      <Skeleton width="100%" height={16} style={styles.mb2} />
      <Skeleton width="85%" height={16} style={styles.mb2} />
      <Skeleton width="40%" height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  textContainer: {
    width: '100%',
  },
  moodOrbContainer: {
    alignItems: 'center',
  },
  journalEntry: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  mb2: {
    marginBottom: spacing[2],
  },
  mt2: {
    marginTop: spacing[2],
  },
});
