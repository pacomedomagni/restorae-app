/**
 * MilestoneToast Component
 * 
 * Beautiful, non-intrusive milestone celebration toast.
 * Shows during sessions at key progress points.
 * 
 * Features:
 * - Gentle slide-in animation
 * - Auto-dismiss
 * - Session-themed variants
 * - Accessible
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Text } from './Text';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, withAlpha } from '../../theme';
import type { Milestone } from '../../hooks/useSessionMilestones';

// =============================================================================
// TYPES
// =============================================================================

interface MilestoneToastProps {
  milestone: Milestone | null;
  visible: boolean;
  onDismiss?: () => void;
  position?: 'top' | 'center' | 'bottom';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MilestoneToast({ 
  milestone, 
  visible, 
  onDismiss,
  position = 'top' 
}: MilestoneToastProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  
  const translateY = useSharedValue(position === 'top' ? -100 : position === 'bottom' ? 100 : 0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible && milestone) {
      // Animate in
      if (reduceMotion) {
        translateY.value = 0;
        opacity.value = 1;
        scale.value = 1;
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }
    } else {
      // Animate out
      if (reduceMotion) {
        opacity.value = 0;
      } else {
        opacity.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(
          position === 'top' ? -50 : position === 'bottom' ? 50 : 0,
          { duration: 150 }
        );
        scale.value = withTiming(0.95, { duration: 150 });
      }
    }
  }, [visible, milestone, position, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!milestone) return null;

  const positionStyle = position === 'top' 
    ? styles.positionTop 
    : position === 'bottom' 
    ? styles.positionBottom 
    : styles.positionCenter;

  return (
    <Animated.View 
      style={[styles.container, positionStyle, animatedStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable onPress={onDismiss}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.toast,
            { 
              backgroundColor: withAlpha(colors.canvasElevated, isDark ? 0.7 : 0.85),
              borderColor: withAlpha(colors.border, 0.3),
            }
          ]}
        >
          <Text style={styles.emoji}>{milestone.emoji}</Text>
          <View style={styles.textContainer}>
            <Text variant="labelLarge" color="ink" style={styles.message}>
              {milestone.message}
            </Text>
            {milestone.subMessage && (
              <Text variant="bodySmall" color="inkMuted" style={styles.subMessage}>
                {milestone.subMessage}
              </Text>
            )}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: spacing[6],
  },
  positionTop: {
    top: 60,
  },
  positionCenter: {
    top: '40%',
  },
  positionBottom: {
    bottom: 120,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontWeight: '600',
  },
  subMessage: {
    marginTop: 2,
    opacity: 0.8,
  },
});

export default MilestoneToast;
