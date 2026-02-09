/**
 * Ambient Background
 * Premium living background with subtle gradients and optional animation
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AmbientBackgroundProps {
  /** Background variant determines the gradient colors */
  variant?: 'morning' | 'evening' | 'calm' | 'focus' | 'energize';
  /** Intensity controls gradient opacity */
  intensity?: 'subtle' | 'normal' | 'vivid';
  /** Enable subtle breathing animation */
  animated?: boolean;
}

export function AmbientBackground({
  variant = 'calm',
  intensity = 'normal',
  animated = true,
}: AmbientBackgroundProps) {
  const { colors, gradients, isDark, reduceMotion } = useTheme();

  // Breathing animation for living background
  const breatheScale = useSharedValue(1);
  const breatheOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (!animated || reduceMotion) return;

    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    breatheOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [animated, reduceMotion, breatheScale, breatheOpacity]);

  // Get gradient colors based on variant
  // Note: `gradients` from useTheme is already resolved for light/dark mode
  const getGradientColors = (): readonly [string, string] => {
    // Fallback colors in case gradients aren't loaded yet
    const fallbackLight: readonly [string, string] = ['#F2EAE1', '#F7F1EA'];
    const fallbackDark: readonly [string, string] = ['#1B1915', '#171310'];
    const fallback = isDark ? fallbackDark : fallbackLight;
    
    if (!gradients) return fallback;
    
    switch (variant) {
      case 'morning':
        return gradients.morning || fallback;
      case 'evening':
        return gradients.evening || fallback;
      case 'focus':
        return gradients.calm || fallback;
      case 'energize':
        return gradients.morning || fallback;
      case 'calm':
      default:
        return gradients.calm || fallback;
    }
  };

  // Get intensity multiplier
  const getIntensityOpacity = (): number => {
    switch (intensity) {
      case 'subtle':
        return 0.6;
      case 'vivid':
        return 1;
      case 'normal':
      default:
        return 0.85;
    }
  };

  const gradientColors = getGradientColors();
  const baseOpacity = getIntensityOpacity();

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: breatheOpacity.value,
  }));

  // Accent color for the subtle orb glow
  const getOrbColor = (): string => {
    switch (variant) {
      case 'morning':
      case 'energize':
        return colors.accentWarm;
      case 'evening':
        return colors.accentCalm;
      case 'focus':
        return colors.accentPrimary;
      case 'calm':
      default:
        return colors.accentCalm;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base gradient layer */}
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1]]}
        style={[styles.gradient, { opacity: baseOpacity }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Subtle animated orb for living feel */}
      {animated && !reduceMotion && (
        <Animated.View style={[styles.orbContainer, animatedOrbStyle]}>
          <LinearGradient
            colors={[
              `${getOrbColor()}15`,
              'transparent',
            ]}
            style={styles.orb}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Bottom fade for depth */}
      <LinearGradient
        colors={gradients?.overlayFade || ['transparent', withAlpha(isDark ? '#000000' : '#2B2018', isDark ? 0.35 : 0.06)]}
        style={styles.bottomFade}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orbContainer: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.2,
    left: -SCREEN_HEIGHT * 0.3,
    width: SCREEN_HEIGHT * 0.8,
    height: SCREEN_HEIGHT * 0.8,
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_HEIGHT * 0.4,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
});
