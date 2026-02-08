/**
 * GestureHint - Animated gesture indicator
 *
 * Shows an animated hand/arrow hint for gestures like swipe, drag, etc.
 * Used by StoryPlayerScreen to hint at scrubbing the progress bar.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'long-press' | 'pinch';

interface GestureHintProps {
  gesture: GestureType;
  label: string;
  onDismiss: () => void;
}

const GESTURE_ICONS: Record<GestureType, string> = {
  'swipe-left': 'arrow-back',
  'swipe-right': 'arrow-forward',
  'swipe-up': 'arrow-up',
  'swipe-down': 'arrow-down',
  tap: 'finger-print',
  'long-press': 'hand-left',
  pinch: 'expand',
};

export function GestureHint({ gesture, label, onDismiss }: GestureHintProps) {
  const { colors, reduceMotion } = useTheme();
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    if (gesture === 'swipe-left' || gesture === 'swipe-right') {
      const direction = gesture === 'swipe-left' ? -1 : 1;
      translateX.value = withRepeat(
        withSequence(
          withTiming(12 * direction, { duration: 600 }),
          withTiming(0, { duration: 600 }),
        ),
        -1,
        false,
      );
    }
  }, [gesture, reduceMotion, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconName = GESTURE_ICONS[gesture] || 'hand-left';

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={styles.container}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View
          style={[styles.hint, { backgroundColor: colors.ink }]}
        >
          <Animated.View style={animatedStyle}>
            <Ionicons name={iconName as any} size={24} color={colors.inkInverse} />
          </Animated.View>
          <Text variant="bodySmall" style={{ color: colors.inkInverse, marginTop: spacing[2], textAlign: 'center' }}>
            {label}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: withAlpha(colors.inkInverse, 0.5), marginTop: spacing[1] }}
          >
            Tap to dismiss
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  hint: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderRadius: borderRadius.lg,
  },
});

export default GestureHint;
