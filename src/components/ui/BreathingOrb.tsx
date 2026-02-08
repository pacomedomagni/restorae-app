/**
 * BreathingOrb - Animated orb for breathing exercises
 *
 * Expands/contracts based on breathing phase with smooth animations.
 * Shows phase label and countdown timer inside the orb.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { withAlpha } from '../../theme';

type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

interface BreathingOrbProps {
  phase: BreathingPhase;
  phaseLabel: string;
  countdown: number;
}

const ORB_SIZE = 200;
const EXPANDED_SCALE = 1.3;
const CONTRACTED_SCALE = 0.8;

export function BreathingOrb({ phase, phaseLabel, countdown }: BreathingOrbProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 0.6;
      return;
    }

    switch (phase) {
      case 'inhale':
        scale.value = withTiming(EXPANDED_SCALE, {
          duration: countdown * 1000,
          easing: Easing.inOut(Easing.ease),
        });
        opacity.value = withTiming(0.9, { duration: countdown * 1000 });
        break;
      case 'hold':
        // Maintain current scale with a gentle pulse
        scale.value = withSpring(scale.value, { damping: 20, stiffness: 100 });
        break;
      case 'exhale':
        scale.value = withTiming(CONTRACTED_SCALE, {
          duration: countdown * 1000,
          easing: Easing.inOut(Easing.ease),
        });
        opacity.value = withTiming(0.5, { duration: countdown * 1000 });
        break;
      case 'complete':
        scale.value = withSpring(1, { damping: 12, stiffness: 80 });
        opacity.value = withTiming(0.8, { duration: 400 });
        break;
      case 'idle':
      default:
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
        opacity.value = withTiming(0.6, { duration: 300 });
        break;
    }
  }, [phase, countdown, reduceMotion, scale, opacity]);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowColor = phase === 'complete' ? colors.accentWarm : colors.accentPrimary;

  return (
    <View style={styles.container}>
      {/* Glow layer */}
      <Animated.View
        style={[
          styles.glow,
          orbAnimatedStyle,
          { backgroundColor: withAlpha(glowColor, 0.1) },
        ]}
      />
      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          orbAnimatedStyle,
          {
            backgroundColor: withAlpha(glowColor, 0.15),
            borderColor: withAlpha(glowColor, 0.3),
          },
        ]}
      >
        <Text
          variant="displaySmall"
          style={{ color: colors.ink, textAlign: 'center' }}
        >
          {phase !== 'idle' && phase !== 'complete' && countdown > 0
            ? countdown.toString()
            : ''}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE * 1.5,
    height: ORB_SIZE * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: ORB_SIZE * 1.4,
    height: ORB_SIZE * 1.4,
    borderRadius: ORB_SIZE * 0.7,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BreathingOrb;
