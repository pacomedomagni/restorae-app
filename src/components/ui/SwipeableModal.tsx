/**
 * SwipeableModal
 * 
 * A bottom sheet-style modal with swipe-to-dismiss gesture support.
 * Enhances UX by allowing natural gesture-based dismissal.
 */
import React, { useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, withAlpha } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.5 };

interface SwipeableModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  /** Whether swipe to dismiss is enabled (default: true) */
  swipeEnabled?: boolean;
  /** Show drag indicator handle at top (default: true) */
  showHandle?: boolean;
  /** Modal height as percentage of screen (default: 0.5) */
  heightRatio?: number;
}

export function SwipeableModal({
  visible,
  onDismiss,
  children,
  swipeEnabled = true,
  showHandle = true,
  heightRatio = 0.5,
}: SwipeableModalProps) {
  const { colors, reduceMotion } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue(0);

  const modalHeight = SCREEN_HEIGHT * heightRatio;

  useEffect(() => {
    if (visible) {
      translateY.value = reduceMotion
        ? 0
        : withSpring(0, SPRING_CONFIG);
    } else {
      translateY.value = reduceMotion
        ? modalHeight
        : withTiming(modalHeight, { duration: 200 });
    }
  }, [visible, translateY, modalHeight, reduceMotion]);

  const handleDismiss = () => {
    onDismiss();
  };

  const panGesture = Gesture.Pan()
    .enabled(swipeEnabled)
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow downward dragging (positive translationY)
      translateY.value = Math.max(0, context.value + event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = reduceMotion
          ? modalHeight
          : withTiming(modalHeight, { duration: 200 });
        runOnJS(handleDismiss)();
      } else {
        translateY.value = reduceMotion
          ? 0
          : withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, modalHeight],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                height: modalHeight,
                backgroundColor: colors.canvasElevated,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
              },
              animatedSheetStyle,
            ]}
          >
            {/* Drag Handle */}
            {showHandle && (
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: withAlpha(colors.ink, 0.2) },
                  ]}
                />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {children}
            </View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
});
