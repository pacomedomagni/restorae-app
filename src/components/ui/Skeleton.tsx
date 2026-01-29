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

export function SkeletonMoodRow() {
  return (
    <View style={styles.moodRow}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonMoodOrb key={i} />
      ))}
    </View>
  );
}

interface SkeletonStatCardProps {
  style?: ViewStyle;
}

export function SkeletonStatCard({ style }: SkeletonStatCardProps) {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
        style,
      ]}
    >
      <Skeleton width={32} height={32} radius="md" />
      <Skeleton width="60%" height={24} style={styles.mt2} />
      <Skeleton width="40%" height={12} style={styles.mt2} />
    </View>
  );
}

interface SkeletonRitualCardProps {
  style?: ViewStyle;
}

export function SkeletonRitualCard({ style }: SkeletonRitualCardProps) {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.ritualCard,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
        style,
      ]}
    >
      <Skeleton width={48} height={48} radius="lg" />
      <View style={styles.ritualContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={styles.mt2} />
      </View>
      <Skeleton width={24} height={24} radius="full" />
    </View>
  );
}

// =============================================================================
// ADDITIONAL SKELETONS FOR COMPREHENSIVE COVERAGE
// =============================================================================

/**
 * Skeleton for mood history entries
 */
export function SkeletonMoodEntry() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.moodEntry,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <View style={styles.moodEntryLeft}>
        <Skeleton width={40} height={40} radius="full" />
        <View style={styles.moodEntryText}>
          <Skeleton width={80} height={14} />
          <Skeleton width={60} height={12} style={styles.mt1} />
        </View>
      </View>
      <Skeleton width={50} height={20} radius="md" />
    </View>
  );
}

/**
 * Skeleton for tool/exercise cards
 */
export function SkeletonToolCard() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.toolCard,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <Skeleton width={44} height={44} radius="lg" />
      <View style={styles.toolContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} style={styles.mt1} />
      </View>
      <Skeleton width={16} height={16} radius="sm" />
    </View>
  );
}

/**
 * Skeleton for progress activity rings
 */
export function SkeletonActivityRings() {
  return (
    <View style={styles.activityRingsContainer}>
      <Skeleton width={160} height={160} radius="full" />
      <View style={styles.ringsLegend}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.legendRow}>
            <Skeleton width={12} height={12} radius="full" />
            <Skeleton width={80} height={12} style={styles.ml2} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton for weekly activity grid
 */
export function SkeletonWeeklyActivity() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.weeklyContainer,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <Skeleton width={120} height={16} style={styles.mb3} />
      <View style={styles.weekDays}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={styles.weekDay}>
            <Skeleton width={32} height={32} radius="md" />
            <Skeleton width={20} height={10} radius="sm" style={styles.mt1} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton for achievement cards
 */
export function SkeletonAchievement() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.achievementCard,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <Skeleton width={56} height={56} radius="full" />
      <Skeleton width={70} height={12} radius="sm" style={styles.mt2} />
    </View>
  );
}

/**
 * Skeleton for story cards
 */
export function SkeletonStoryCard() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.storyCard,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <Skeleton width="100%" height={120} radius="lg" />
      <View style={styles.storyContent}>
        <Skeleton width="80%" height={16} style={styles.mt2} />
        <Skeleton width="60%" height={12} style={styles.mt1} />
        <View style={styles.storyMeta}>
          <Skeleton width={60} height={10} radius="sm" />
          <Skeleton width={40} height={10} radius="sm" />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for subscription/premium cards
 */
export function SkeletonPremiumCard() {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.premiumCard,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.5) },
      ]}
    >
      <View style={styles.premiumHeader}>
        <Skeleton width={40} height={40} radius="full" />
        <View style={styles.premiumTitle}>
          <Skeleton width={100} height={18} />
          <Skeleton width={140} height={12} style={styles.mt1} />
        </View>
      </View>
      <View style={styles.premiumFeatures}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.premiumFeature}>
            <Skeleton width={20} height={20} radius="full" />
            <Skeleton width="80%" height={14} style={styles.ml2} />
          </View>
        ))}
      </View>
      <Skeleton width="100%" height={48} radius="lg" style={styles.mt3} />
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
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[4],
  },
  statCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  ritualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  ritualContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  // New skeleton styles
  moodEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  moodEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEntryText: {
    marginLeft: spacing[3],
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  toolContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  activityRingsContainer: {
    alignItems: 'center',
    padding: spacing[4],
  },
  ringsLegend: {
    marginTop: spacing[4],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  weeklyContainer: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
  },
  achievementCard: {
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    width: 90,
  },
  storyCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 200,
  },
  storyContent: {
    padding: spacing[3],
  },
  storyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  premiumCard: {
    padding: spacing[5],
    borderRadius: borderRadius.xl,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    marginLeft: spacing[3],
  },
  premiumFeatures: {
    marginTop: spacing[4],
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  // Spacing utilities
  mb2: {
    marginBottom: spacing[2],
  },
  mb3: {
    marginBottom: spacing[3],
  },
  mt1: {
    marginTop: spacing[1],
  },
  mt2: {
    marginTop: spacing[2],
  },
  mt3: {
    marginTop: spacing[3],
  },
  ml2: {
    marginLeft: spacing[2],
  },
});

// =============================================================================
// SMOOTH CONTENT TRANSITION
// =============================================================================

interface ContentTransitionProps {
  /** Whether content is loading */
  isLoading: boolean;
  /** Skeleton component to show while loading */
  skeleton: React.ReactNode;
  /** Actual content to show when loaded */
  children: React.ReactNode;
  /** Minimum loading time to prevent flash (ms) */
  minLoadTime?: number;
}

/**
 * SmoothContentTransition
 * 
 * Wraps content with smooth fade transitions between loading and loaded states.
 * Prevents jarring skeleton-to-content jumps.
 */
export function SmoothContentTransition({
  isLoading,
  skeleton,
  children,
  minLoadTime = 300,
}: ContentTransitionProps) {
  const { reduceMotion } = useTheme();
  const opacity = useSharedValue(isLoading ? 0 : 1);
  const [showSkeleton, setShowSkeleton] = React.useState(isLoading);
  const loadStartTime = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      loadStartTime.current = Date.now();
      setShowSkeleton(true);
      opacity.value = 0;
    } else {
      const elapsed = loadStartTime.current ? Date.now() - loadStartTime.current : minLoadTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);

      // Wait for minimum load time before transitioning
      setTimeout(() => {
        opacity.value = withTiming(1, { 
          duration: reduceMotion ? 0 : 300,
          easing: Easing.out(Easing.ease),
        });
        
        // Hide skeleton after fade completes
        setTimeout(() => {
          setShowSkeleton(false);
        }, reduceMotion ? 0 : 300);
      }, remainingTime);
    }
  }, [isLoading, reduceMotion, minLoadTime]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (showSkeleton && isLoading) {
    return <>{skeleton}</>;
  }

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
