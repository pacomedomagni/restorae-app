/**
 * FloatingOrb - Decorative floating orb animation
 *
 * A gentle floating/pulsing orb used as background decoration.
 * Used in OnboardingScreen for ambient visual atmosphere.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { withAlpha } from '../../theme';

interface FloatingOrbProps {
  size?: number;
  color?: string;
  delay?: number;
  style?: any;
}

export function FloatingOrb({ size = 120, color, delay = 0, style }: FloatingOrbProps) {
  const { colors, reduceMotion } = useTheme();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  const orbColor = color || colors.accentPrimary;

  useEffect(() => {
    if (reduceMotion) return;

    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 3500 }),
        withTiming(0.2, { duration: 3500 }),
      ),
      -1,
      true,
    );
  }, [reduceMotion, translateY, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(orbColor, 0.15),
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export default FloatingOrb;
