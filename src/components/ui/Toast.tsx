/**
 * Toast Component
 * 
 * Premium toast notifications with:
 * - Multiple variants (success, error, warning, info)
 * - Retry action support for failed operations
 * - Smooth animations with haptic feedback
 * - Accessibility support
 * - Auto-dismiss with progress indicator
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'offline';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastProps {
  /** Toast message */
  message: string;
  /** Visual variant */
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration?: number;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Action button (e.g., Retry) */
  action?: ToastAction;
  /** Called when toast is dismissed */
  onDismiss?: () => void;
  /** Whether toast is visible */
  visible: boolean;
  /** Icon override */
  icon?: keyof typeof Ionicons.glyphMap;
}

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: keyof typeof Ionicons.glyphMap;
  haptic: 'success' | 'error' | 'warning' | 'light';
}> = {
  success: { icon: 'checkmark-circle', haptic: 'success' },
  error: { icon: 'alert-circle', haptic: 'error' },
  warning: { icon: 'warning', haptic: 'warning' },
  info: { icon: 'information-circle', haptic: 'light' },
  offline: { icon: 'cloud-offline', haptic: 'warning' },
};

export function Toast({
  message,
  variant = 'info',
  duration = 4000,
  dismissible = true,
  action,
  onDismiss,
  visible,
  icon,
}: ToastProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, notificationSuccess, notificationError } = useHaptics();
  const insets = useSafeAreaInsets();
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);
  const progress = useSharedValue(1);
  const scale = useSharedValue(1);

  const config = VARIANT_CONFIG[variant];
  const displayIcon = icon || config.icon;

  // Get variant colors
  const getVariantColors = useCallback(() => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.success,
          text: '#FFFFFF',
          icon: '#FFFFFF',
        };
      case 'error':
        return {
          bg: colors.statusError,
          text: '#FFFFFF',
          icon: '#FFFFFF',
        };
      case 'warning':
        return {
          bg: colors.accentWarm,
          text: '#1A1A1A',
          icon: '#1A1A1A',
        };
      case 'offline':
        return {
          bg: colors.statusError,
          text: '#FFFFFF',
          icon: '#FFFFFF',
        };
      case 'info':
      default:
        return {
          bg: colors.canvasElevated,
          text: colors.ink,
          icon: colors.accentPrimary,
        };
    }
  }, [colors, variant]);

  const variantColors = getVariantColors();

  // Haptic feedback on show
  useEffect(() => {
    if (visible) {
      switch (config.haptic) {
        case 'success':
          notificationSuccess();
          break;
        case 'error':
          notificationError();
          break;
        default:
          impactLight();
      }

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(message);

      // Start progress animation for auto-dismiss
      if (duration > 0) {
        progress.value = 1;
        progress.value = withTiming(0, { duration });
      }
    }
  }, [visible, message, duration, config.haptic]);

  // Auto-dismiss timer
  useEffect(() => {
    if (visible && duration > 0) {
      dismissTimer.current = setTimeout(() => {
        onDismiss?.();
      }, duration);

      return () => {
        if (dismissTimer.current) {
          clearTimeout(dismissTimer.current);
        }
      };
    }
  }, [visible, duration, onDismiss]);

  const handleDismiss = async () => {
    await impactLight();
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }
    onDismiss?.();
  };

  const handleAction = async () => {
    await impactLight();
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }
    action?.onPress();
    onDismiss?.();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={reduceMotion ? FadeIn : SlideInUp.springify().damping(15)}
      exiting={reduceMotion ? FadeOut : SlideOutUp.springify().damping(15)}
      style={[
        styles.container,
        { top: insets.top + spacing[2] },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Pressable
        onPressIn={dismissible ? handlePressIn : undefined}
        onPressOut={dismissible ? handlePressOut : undefined}
        onPress={dismissible ? handleDismiss : undefined}
      >
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: variantColors.bg,
              shadowColor: colors.shadow,
            },
            animatedStyle,
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={displayIcon}
              size={22}
              color={variantColors.icon}
            />
          </View>

          {/* Message */}
          <View style={styles.content}>
            <Text
              variant="bodyMedium"
              style={{ color: variantColors.text, flex: 1 }}
              numberOfLines={2}
            >
              {message}
            </Text>
          </View>

          {/* Action Button */}
          {action && (
            <Pressable
              onPress={handleAction}
              style={[
                styles.actionButton,
                { backgroundColor: withAlpha(variantColors.text, 0.15) },
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text
                variant="labelMedium"
                style={{ color: variantColors.text }}
              >
                {action.label}
              </Text>
            </Pressable>
          )}

          {/* Dismiss Button */}
          {dismissible && !action && (
            <Pressable
              onPress={handleDismiss}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
            >
              <Ionicons
                name="close"
                size={18}
                color={withAlpha(variantColors.text, 0.7)}
              />
            </Pressable>
          )}

          {/* Progress indicator for auto-dismiss */}
          {duration > 0 && (
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: withAlpha(variantColors.text, 0.3),
                },
                progressStyle,
              ]}
            />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  actionButton: {
    marginLeft: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
  },
  dismissButton: {
    marginLeft: spacing[2],
    padding: spacing[1],
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderBottomLeftRadius: borderRadius.lg,
  },
});

export default Toast;
