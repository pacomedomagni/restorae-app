/**
 * AlertModal
 * 
 * A premium glass-morphism alert modal that replaces native Alert.alert
 * for a consistent visual experience across the app.
 * 
 * Supports:
 * - Success notifications (auto-dismissible)
 * - Error messages
 * - Confirmation dialogs (with 2 actions)
 * - Info/warning alerts
 */
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { LuxeIcon } from '../LuxeIcon';
import { spacing, withAlpha } from '../../theme';

type AlertType = 'success' | 'error' | 'info' | 'confirm' | 'warning';

interface AlertModalProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  /** Primary action button text (defaults based on type) */
  confirmText?: string;
  /** Secondary action button text (only for 'confirm' type) */
  cancelText?: string;
  /** Called when primary action is pressed or modal auto-dismisses */
  onConfirm?: () => void;
  /** Called when secondary action is pressed (for 'confirm' type) */
  onCancel?: () => void;
  /** Auto-dismiss after this many ms (only for success/info types) */
  autoDismissMs?: number;
}

// Animated icon for the alert type
function AlertIcon({ type }: { type: AlertType }) {
  const { colors } = useTheme();
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const iconConfig: Record<AlertType, { icon: string; color: string; bgColor: string }> = {
    success: {
      icon: '✓',
      color: colors.accentCalm,
      bgColor: withAlpha(colors.accentCalm, 0.15),
    },
    error: {
      icon: '!',
      color: colors.accentWarm,
      bgColor: withAlpha(colors.accentWarm, 0.15),
    },
    warning: {
      icon: '⚠',
      color: colors.moodAnxious,
      bgColor: withAlpha(colors.moodAnxious, 0.15),
    },
    info: {
      icon: 'ℹ',
      color: colors.accentPrimary,
      bgColor: withAlpha(colors.accentPrimary, 0.15),
    },
    confirm: {
      icon: '?',
      color: colors.accentPrimary,
      bgColor: withAlpha(colors.accentPrimary, 0.15),
    },
  };

  const config = iconConfig[type];

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        { backgroundColor: config.bgColor },
        animatedStyle,
      ]}
    >
      <Text style={[styles.iconText, { color: config.color }]}>
        {config.icon}
      </Text>
    </Animated.View>
  );
}

export function AlertModal({
  visible,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  autoDismissMs,
}: AlertModalProps) {
  const { colors, reduceMotion } = useTheme();
  const { notificationSuccess, notificationError } = useHaptics();

  // Default button text based on type
  const defaultConfirmText = type === 'confirm' ? 'Confirm' : 'OK';
  const resolvedConfirmText = confirmText || defaultConfirmText;
  const resolvedCancelText = cancelText || 'Cancel';

  // Determine if we should show cancel button
  const showCancel = type === 'confirm' && onCancel;

  // Haptic feedback on show
  useEffect(() => {
    if (visible) {
      if (type === 'success') {
        notificationSuccess();
      } else if (type === 'error') {
        notificationError();
      }
    }
  }, [visible, type]);

  // Auto-dismiss for success/info
  useEffect(() => {
    if (visible && autoDismissMs && (type === 'success' || type === 'info')) {
      const timer = setTimeout(() => {
        onConfirm?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissMs, type, onConfirm]);

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleBackdropPress = () => {
    // For non-confirm types, tapping backdrop dismisses
    if (type !== 'confirm') {
      onConfirm?.();
    }
  };

  // Determine button styles based on type
  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'error':
      case 'warning':
        return 'primary';
      case 'success':
        return 'glow';
      default:
        return 'primary';
    }
  };

  const getConfirmButtonTone = () => {
    switch (type) {
      case 'success':
        return 'calm';
      case 'error':
      case 'warning':
        return 'warm';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={type === 'confirm' ? handleCancel : handleConfirm}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
            exiting={reduceMotion ? undefined : FadeOut.duration(150)}
            style={[styles.backdropFill, { backgroundColor: colors.overlay }]}
          />
        </Pressable>

        <Animated.View
          entering={reduceMotion ? undefined : SlideInDown.springify().damping(20)}
          exiting={reduceMotion ? undefined : SlideOutDown.duration(200)}
          style={styles.modalContainer}
        >
          <GlassCard variant="elevated" padding="lg">
            <View style={styles.content}>
              <AlertIcon type={type} />
              
              <Text 
                variant="headlineMedium" 
                color="ink" 
                align="center"
                style={styles.title}
              >
                {title}
              </Text>
              
              {message && (
                <Text 
                  variant="bodyMedium" 
                  color="inkMuted" 
                  align="center"
                  style={styles.message}
                >
                  {message}
                </Text>
              )}

              <View style={styles.actions}>
                {showCancel && (
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onPress={handleCancel}
                    accessibilityLabel={resolvedCancelText}
                  >
                    {resolvedCancelText}
                  </Button>
                )}
                <Button
                  variant={getConfirmButtonVariant()}
                  tone={getConfirmButtonTone()}
                  size="lg"
                  fullWidth
                  onPress={handleConfirm}
                  accessibilityLabel={resolvedConfirmText}
                >
                  {resolvedConfirmText}
                </Button>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  modalContainer: {
    width: '85%',
    maxWidth: 340,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  iconText: {
    fontSize: 28,
    fontWeight: '600',
  },
  title: {
    marginBottom: spacing[2],
  },
  message: {
    marginBottom: spacing[6],
  },
  actions: {
    width: '100%',
    gap: spacing[2],
  },
});
