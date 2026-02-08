/**
 * SuccessToast Component
 * 
 * Premium success feedback toast with optional undo action.
 * Used for confirmations, saves, and completed actions.
 * 
 * Features:
 * - Slide-in animation from bottom
 * - Optional undo button
 * - Auto-dismiss with countdown
 * - Accessible
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { spacing, borderRadius, withAlpha } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface SuccessToastProps {
  visible: boolean;
  message: string;
  icon?: string;
  undoLabel?: string;
  onUndo?: () => void;
  onDismiss?: () => void;
  duration?: number; // Auto-dismiss duration in ms
  variant?: 'success' | 'info' | 'warning';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SuccessToast({
  visible,
  message,
  icon = '✓',
  undoLabel,
  onUndo,
  onDismiss,
  duration = 4000,
  variant = 'success',
}: SuccessToastProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  const { impactLight: tap } = useHaptics();
  const insets = useSafeAreaInsets();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);

  // Get variant colors
  const variantColors = {
    success: colors.accentPrimary,
    info: colors.accentCalm,
    warning: colors.accentWarm,
  };
  const accentColor = variantColors[variant];

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      if (reduceMotion) {
        translateY.value = 0;
        opacity.value = 1;
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 200 });
      }

      // Progress bar animation
      progress.value = 0;
      progress.value = withTiming(1, { duration });

      // Auto-dismiss
      timeoutRef.current = setTimeout(() => {
        onDismiss?.();
      }, duration);
    } else {
      // Animate out
      if (reduceMotion) {
        translateY.value = 100;
        opacity.value = 0;
      } else {
        translateY.value = withTiming(100, { duration: 200 });
        opacity.value = withTiming(0, { duration: 150 });
      }
      progress.value = 0;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, reduceMotion]);

  const handleUndo = async () => {
    await tap();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onUndo?.();
    onDismiss?.();
  };

  const handleDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onDismiss?.();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [100, 0])}%`,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 90 },
        containerStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable onPress={handleDismiss}>
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.toast,
            {
              backgroundColor: withAlpha(colors.canvasElevated, isDark ? 0.75 : 0.9),
              borderColor: withAlpha(colors.border, 0.3),
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: withAlpha(accentColor, 0.15) }]}>
            <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
          </View>

          {/* Message */}
          <Text variant="labelMedium" color="ink" style={styles.message} numberOfLines={2}>
            {message}
          </Text>

          {/* Undo Button */}
          {undoLabel && onUndo && (
            <Pressable
              onPress={handleUndo}
              style={[styles.undoButton, { backgroundColor: withAlpha(accentColor, 0.12) }]}
            >
              <Text variant="labelSmall" style={{ color: accentColor }}>
                {undoLabel}
              </Text>
            </Pressable>
          )}

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: withAlpha(accentColor, 0.3) },
                progressStyle,
              ]}
            />
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
    left: spacing[4],
    right: spacing[4],
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  icon: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    marginLeft: spacing[3],
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressBar: {
    height: '100%',
  },
});

export default SuccessToast;
