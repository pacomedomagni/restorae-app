/**
 * Modal Component
 * Premium modal with smooth animations and gesture support
 * 
 * Features:
 * - Slide-up animation with spring physics
 * - Swipe-to-dismiss gesture
 * - Keyboard avoiding behavior
 * - Accessibility support
 * - Uses ThemeContext (no manual color passing)
 */
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';
import { Button } from './Button';
import { spacing, borderRadius, withAlpha } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow';
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: ModalAction[];
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({
  visible,
  onClose,
  title,
  description,
  children,
  actions = [],
  dismissible = true,
  size = 'md',
}: ModalProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = reduceMotion 
        ? withTiming(0, { duration: 200 })
        : withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
    }
  }, [visible, reduceMotion]);

  const handleClose = async () => {
    if (!dismissible) return;
    await impactLight();
    onClose();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (dismissible && event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (dismissible && event.translationY > 100) {
        runOnJS(onClose)();
      } else {
        translateY.value = reduceMotion
          ? withTiming(0, { duration: 200 })
          : withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { maxHeight: SCREEN_HEIGHT * 0.4 };
      case 'lg':
        return { maxHeight: SCREEN_HEIGHT * 0.85 };
      case 'full':
        return { maxHeight: SCREEN_HEIGHT * 0.95 };
      default:
        return { maxHeight: SCREEN_HEIGHT * 0.6 };
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        >
          <View 
            style={[
              StyleSheet.absoluteFill, 
              { backgroundColor: withAlpha(colors.ink, 0.6) }
            ]} 
          />
        </Pressable>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.modal,
              getSizeStyles(),
              { backgroundColor: colors.canvasElevated },
              modalStyle,
            ]}
          >
            {/* Drag Handle */}
            {dismissible && (
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle, 
                    { backgroundColor: withAlpha(colors.ink, 0.2) }
                  ]}
                />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {title && (
                <Text variant="headlineMedium" color="ink" style={styles.title}>
                  {title}
                </Text>
              )}

              {description && (
                <Text variant="bodyMedium" color="inkMuted" style={styles.description}>
                  {description}
                </Text>
              )}

              {children}
            </View>

            {/* Actions */}
            {actions.length > 0 && (
              <View style={styles.actions}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'primary'}
                    onPress={action.onPress}
                    fullWidth
                    style={index > 0 ? styles.actionButton : undefined}
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});
