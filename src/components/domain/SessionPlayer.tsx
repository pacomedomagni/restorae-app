/**
 * SessionPlayer Component - Domain
 * 
 * Unified session playback UI for all content types.
 * Now uses ThemeContext instead of colors prop.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Text, ProgressRing } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, withAlpha } from '../../theme/tokens';

interface SessionPlayerProps {
  title: string;
  subtitle?: string;
  progress: number; // 0-1
  timeRemaining: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  children?: React.ReactNode; // For custom content (breathing guide, etc.)
}

export function SessionPlayer({
  title,
  subtitle,
  progress,
  timeRemaining,
  isPaused,
  onPause,
  onResume,
  onEnd,
  children,
}: SessionPlayerProps) {
  const { colors } = useTheme();
  const pauseScale = useSharedValue(1);
  const endScale = useSharedValue(1);

  const pauseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
  }));

  const endAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: endScale.value }],
  }));

  const handlePausePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const handleEndPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnd();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" color="ink" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" color="inkMuted" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
        <Text variant="headlineSmall" color="inkMuted">
          {timeRemaining}
        </Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {children || (
          <ProgressRing
            progress={progress}
            size="xl"
            label={`${Math.round(progress * 100)}%`}
          />
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: withAlpha(colors.border, 0.3) },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accentPrimary,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* End Button */}
        <Pressable
          onPressIn={() => {
            endScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            endScale.value = withSpring(1, { damping: 12, stiffness: 300 });
          }}
          onPress={handleEndPress}
          accessibilityRole="button"
          accessibilityLabel="End session"
        >
          <Animated.View
            style={[
              styles.secondaryButton,
              { backgroundColor: withAlpha(colors.statusError, 0.1) },
              endAnimatedStyle,
            ]}
          >
            <Ionicons name="stop" size={20} color={colors.statusError} />
            <Text
              variant="labelMedium"
              style={{ color: colors.statusError, marginLeft: spacing.xs }}
            >
              End
            </Text>
          </Animated.View>
        </Pressable>

        {/* Pause/Resume Button */}
        <Pressable
          onPressIn={() => {
            pauseScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            pauseScale.value = withSpring(1, { damping: 12, stiffness: 300 });
          }}
          onPress={handlePausePress}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume session' : 'Pause session'}
        >
          <Animated.View
            style={[
              styles.primaryButton,
              { backgroundColor: colors.accentPrimary },
              pauseAnimatedStyle,
            ]}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={28}
              color={colors.inkInverse}
            />
          </Animated.View>
        </Pressable>

        {/* Spacer to balance layout */}
        <View style={styles.secondaryButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingVertical: spacing.lg,
  },
  progressBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  primaryButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 80,
  },
});
