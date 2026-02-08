/**
 * SoftGlow - Premium Completion Animation
 *
 * Replaces confetti/particle effects with an elegant
 * expanding radial glow — like sunlight through clouds.
 *
 * Variants:
 * - completion: Gentle expanding glow (1.5s)
 * - acknowledgment: Quick subtle pulse (0.5s)
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { withAlpha } from '../../theme';

interface SoftGlowProps {
  /** Whether the glow is active */
  active: boolean;
  /** Glow variant */
  variant?: 'completion' | 'acknowledgment';
  /** Size of the glow circle */
  size?: number;
}

export function SoftGlow({ active, variant = 'completion', size = 200 }: SoftGlowProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!active) return;

    if (reduceMotion) {
      opacity.value = 0.15;
      scale.value = 1;
      // Hold briefly then fade
      opacity.value = withDelay(800, withTiming(0, { duration: 400 }));
      return;
    }

    if (variant === 'completion') {
      // Gentle expand and fade — like light blooming
      scale.value = withTiming(1.8, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withSequence(
        withTiming(0.25, { duration: 400, easing: Easing.out(Easing.ease) }),
        withDelay(600, withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })),
      );
    } else {
      // Quick subtle pulse
      scale.value = withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 200 }),
      );
      opacity.value = withSequence(
        withTiming(0.2, { duration: 200 }),
        withDelay(100, withTiming(0, { duration: 200 })),
      );
    }
  }, [active, variant, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowColor = withAlpha(colors.success, 0.4);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.glow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: glowColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  glow: {
    position: 'absolute',
  },
});
