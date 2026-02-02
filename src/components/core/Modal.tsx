/**
 * Modal Component - Core
 * 
 * Unified modal with smooth animations.
 * Replaces SwipeableModal, AlertModal, etc.
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
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { Button } from './Button';
import { spacing, radius, withAlpha } from '../../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: ModalAction[];
  dismissible?: boolean;
  colors: {
    surface: string;
    surfaceElevated: string;
    textPrimary: string;
    textSecondary: string;
    overlay: string;
    actionPrimary: string;
    actionSecondary: string;
    actionDestructive: string;
    textInverse: string;
    border: string;
  };
}

export function Modal({
  visible,
  onClose,
  title,
  description,
  children,
  actions = [],
  dismissible = true,
  colors,
}: ModalProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
    }
  }, [visible]);

  const handleClose = async () => {
    if (!dismissible) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
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
              { backgroundColor: colors.surfaceElevated },
              modalStyle,
            ]}
          >
            {/* Drag Handle */}
            {dismissible && (
              <View style={styles.handleContainer}>
                <View
                  style={[styles.handle, { backgroundColor: colors.border }]}
                />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {title && (
                <Text
                  variant="headlineMedium"
                  style={[styles.title, { color: colors.textPrimary }]}
                >
                  {title}
                </Text>
              )}

              {description && (
                <Text
                  variant="bodyMedium"
                  style={[styles.description, { color: colors.textSecondary }]}
                >
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
                    colors={colors}
                    style={index > 0 ? styles.actionSpacing : undefined}
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
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
    maxHeight: SCREEN_HEIGHT * 0.9,
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
    marginBottom: spacing.sm,
  },
  description: {
    marginBottom: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  actionSpacing: {
    marginTop: spacing.sm,
  },
});
