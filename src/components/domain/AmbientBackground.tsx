/**
 * AmbientBackground Component - Domain
 * 
 * Living, breathing background with subtle gradients.
 * Simplified from the original version.
 */
import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { gradientsLight, gradientsDark, withAlpha } from '../../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type BackgroundVariant = 'calm' | 'morning' | 'evening';

interface AmbientBackgroundProps {
  variant?: BackgroundVariant;
  intensity?: 'subtle' | 'normal' | 'vivid';
  isDark?: boolean;
  animated?: boolean;
}

export function AmbientBackground({
  variant = 'calm',
  intensity = 'normal',
  isDark = false,
  animated = true,
}: AmbientBackgroundProps) {
  const gradients = isDark ? gradientsDark : gradientsLight;
  const colors = gradients[variant];

  const opacity = useSharedValue(1);
  const orbScale = useSharedValue(1);
  const orbX = useSharedValue(0);
  const orbY = useSharedValue(0);

  // Subtle breathing animation for the orb
  React.useEffect(() => {
    if (!animated) return;

    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbX.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(15, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [animated]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbX.value },
      { translateY: orbY.value },
      { scale: orbScale.value },
    ],
  }));

  const getOrbColor = () => {
    switch (variant) {
      case 'morning':
        return withAlpha(isDark ? '#E0B27A' : '#C8924A', isDark ? 0.15 : 0.1);
      case 'evening':
        return withAlpha('#8B7355', isDark ? 0.15 : 0.08);
      default:
        return withAlpha(isDark ? '#6FA08B' : '#1F4D3A', isDark ? 0.12 : 0.06);
    }
  };

  const getIntensityOpacity = () => {
    switch (intensity) {
      case 'subtle':
        return 0.5;
      case 'vivid':
        return 1;
      default:
        return 0.8;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base gradient */}
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradient, { opacity: getIntensityOpacity() }]}
      />

      {/* Animated ambient orb */}
      {animated && (
        <Animated.View
          style={[
            styles.orb,
            {
              backgroundColor: getOrbColor(),
            },
            orbStyle,
          ]}
        />
      )}

      {/* Subtle vignette overlay */}
      <LinearGradient
        colors={[
          'transparent',
          withAlpha('#000000', isDark ? 0.15 : 0.03),
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.vignette}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    right: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});
