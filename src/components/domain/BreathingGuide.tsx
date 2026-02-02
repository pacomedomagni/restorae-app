/**
 * BreathingGuide Component - Domain
 * 
 * Visual breathing guide with expanding/contracting circle.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Text } from '../core/Text';
import { spacing, withAlpha } from '../../theme/tokens';

interface BreathingPattern {
  inhale: number;
  hold1?: number;
  exhale: number;
  hold2?: number;
  name: string;
}

interface BreathingGuideProps {
  pattern: BreathingPattern;
  isActive: boolean;
  size?: number;
  colors: {
    actionPrimary: string;
    textPrimary: string;
    textSecondary: string;
    surface: string;
  };
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export function BreathingGuide({
  pattern,
  isActive,
  size = 200,
  colors,
}: BreathingGuideProps) {
  const scale = useSharedValue(0.4);
  const phase = useSharedValue<BreathPhase>('inhale');
  const phaseText = useSharedValue('Breathe in');

  useEffect(() => {
    if (!isActive) {
      cancelAnimation(scale);
      scale.value = withTiming(0.4, { duration: 300 });
      return;
    }

    const { inhale, hold1 = 0, exhale, hold2 = 0 } = pattern;
    const totalCycle = (inhale + hold1 + exhale + hold2) * 1000;

    // Create breathing animation sequence
    const breathCycle = () => {
      scale.value = withSequence(
        // Inhale - expand
        withTiming(1, {
          duration: inhale * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        // Hold (if any) - stay expanded
        ...(hold1 > 0
          ? [withTiming(1, { duration: hold1 * 1000 })]
          : []),
        // Exhale - contract
        withTiming(0.4, {
          duration: exhale * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        // Hold (if any) - stay contracted
        ...(hold2 > 0
          ? [withTiming(0.4, { duration: hold2 * 1000 })]
          : [])
      );
    };

    // Start initial cycle
    breathCycle();

    // Set up repeating cycle
    const interval = setInterval(breathCycle, totalCycle);

    return () => {
      clearInterval(interval);
      cancelAnimation(scale);
    };
  }, [isActive, pattern]);

  // Track phase for text display
  useEffect(() => {
    if (!isActive) return;

    const { inhale, hold1 = 0, exhale, hold2 = 0 } = pattern;

    const updatePhase = () => {
      phaseText.value = 'Breathe in';
      
      // Inhale
      setTimeout(() => {
        if (hold1 > 0) {
          phaseText.value = 'Hold';
        }
      }, inhale * 1000);

      // Hold 1
      setTimeout(() => {
        phaseText.value = 'Breathe out';
      }, (inhale + hold1) * 1000);

      // Exhale
      setTimeout(() => {
        if (hold2 > 0) {
          phaseText.value = 'Hold';
        }
      }, (inhale + hold1 + exhale) * 1000);
    };

    updatePhase();
    const totalCycle = (inhale + hold1 + exhale + hold2) * 1000;
    const interval = setInterval(updatePhase, totalCycle);

    return () => clearInterval(interval);
  }, [isActive, pattern]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.3 + scale.value * 0.4,
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow circle */}
      <Animated.View
        style={[
          styles.outerCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: withAlpha(colors.actionPrimary, 0.2),
          },
          animatedCircleStyle,
        ]}
      />

      {/* Main circle */}
      <Animated.View
        style={[
          styles.mainCircle,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            backgroundColor: colors.actionPrimary,
          },
          animatedInnerStyle,
        ]}
      >
        <PhaseText
          pattern={pattern}
          isActive={isActive}
          colors={colors}
        />
      </Animated.View>
    </View>
  );
}

// Separate component for phase text to handle state properly
function PhaseText({
  pattern,
  isActive,
  colors,
}: {
  pattern: BreathingPattern;
  isActive: boolean;
  colors: { textPrimary: string; surface: string };
}) {
  const [text, setText] = React.useState('Breathe in');

  useEffect(() => {
    if (!isActive) {
      setText('Ready');
      return;
    }

    const { inhale, hold1 = 0, exhale, hold2 = 0 } = pattern;
    const totalCycle = (inhale + hold1 + exhale + hold2) * 1000;

    const runCycle = () => {
      setText('Breathe in');

      const timers: NodeJS.Timeout[] = [];

      if (hold1 > 0) {
        timers.push(
          setTimeout(() => setText('Hold'), inhale * 1000)
        );
      }

      timers.push(
        setTimeout(() => setText('Breathe out'), (inhale + hold1) * 1000)
      );

      if (hold2 > 0) {
        timers.push(
          setTimeout(() => setText('Hold'), (inhale + hold1 + exhale) * 1000)
        );
      }

      return timers;
    };

    let timers = runCycle();
    const interval = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = runCycle();
    }, totalCycle);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [isActive, pattern]);

  return (
    <Text
      variant="headlineSmall"
      align="center"
      style={{ color: colors.surface }}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    position: 'absolute',
  },
  mainCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
});

// Pre-defined breathing patterns
export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  calm: {
    name: 'Calm Breath',
    inhale: 4,
    exhale: 6,
  },
  box: {
    name: 'Box Breathing',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  },
  relaxing: {
    name: '4-7-8 Relaxing',
    inhale: 4,
    hold1: 7,
    exhale: 8,
  },
  energizing: {
    name: 'Energizing Breath',
    inhale: 4,
    exhale: 2,
  },
  sleep: {
    name: 'Sleep Breath',
    inhale: 4,
    hold1: 7,
    exhale: 8,
  },
};
