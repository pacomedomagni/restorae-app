/**
 * MoodOrb Component
 * A beautiful, interactive mood selection orb with organic animations
 * 
 * Features:
 * - Gradient-filled orb with glow effect
 * - Ripple animation on selection
 * - Subtle idle breathing animation
 * - Haptic feedback
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, withAlpha } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export type MoodType = 'energized' | 'calm' | 'good' | 'anxious' | 'low' | 'tough';

interface MoodOrbProps {
  mood: MoodType;
  label: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onPress?: () => void;
  delay?: number;
}

const MOOD_COLORS: Record<MoodType, { primary: string; secondary: string; glow: string }> = {
  energized: {
    primary: '#E8B347',
    secondary: '#D4956A',
    glow: '#F5D799',
  },
  calm: {
    primary: '#7BA39F',
    secondary: '#5C8A77',
    glow: '#A8C5B8',
  },
  good: {
    primary: '#6FA08B',
    secondary: '#4F7F6A',
    glow: '#8FC4A8',
  },
  anxious: {
    primary: '#A58AB7',
    secondary: '#8B7BA8',
    glow: '#C4B0D4',
  },
  low: {
    primary: '#9A8C80',
    secondary: '#7A6E63',
    glow: '#B8ADA0',
  },
  tough: {
    primary: '#C97C72',
    secondary: '#A86058',
    glow: '#E0A59C',
  },
};

export function MoodOrb({
  mood,
  label,
  sublabel,
  size = 'md',
  selected = false,
  onPress,
  delay = 0,
}: MoodOrbProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();

  const moodColor = MOOD_COLORS[mood];
  
  // Animation values
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const breathe = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const ripple = useSharedValue(0);
  const selectedValue = useSharedValue(selected ? 1 : 0);

  const orbSize = size === 'sm' ? 72 : size === 'lg' ? 120 : 96;
  const glowSize = orbSize * 1.6;

  // Entry animation
  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });
  }, [reduceMotion, scale, delay]);

  // Idle breathing animation
  useEffect(() => {
    if (reduceMotion) return;
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [reduceMotion, breathe]);

  // Selection animation
  useEffect(() => {
    selectedValue.value = withSpring(selected ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
    glowOpacity.value = withTiming(selected ? 1 : 0, { duration: 300 });
  }, [selected, selectedValue, glowOpacity]);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    glowOpacity.value = withTiming(0.7, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    if (!selected) {
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  };

  const handlePress = async () => {
    await impactMedium();
    
    // Ripple effect
    if (!reduceMotion) {
      ripple.value = 0;
      ripple.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    }
    
    onPress?.();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value },
    ],
    opacity: scale.value,
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathe.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 1], [0, isDark ? 0.6 : 0.4]),
    transform: [
      { scale: interpolate(selectedValue.value, [0, 1], [0.9, 1.1]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: selectedValue.value,
    transform: [
      { scale: interpolate(selectedValue.value, [0, 1], [0.8, 1]) },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ripple.value, [0, 0.5, 1], [0.5, 0.3, 0]),
    transform: [
      { scale: interpolate(ripple.value, [0, 1], [1, 2]) },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <AnimatedPressable
        style={[styles.container, containerStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {/* Glow layer */}
        <AnimatedView style={[styles.glow, { width: glowSize, height: glowSize }, glowStyle]}>
          <Svg width={glowSize} height={glowSize} viewBox={`0 0 ${glowSize} ${glowSize}`}>
            <Defs>
              <RadialGradient id={`glow-${mood}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={moodColor.glow} stopOpacity={0.8} />
                <Stop offset="50%" stopColor={moodColor.primary} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={moodColor.primary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <SvgCircle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill={`url(#glow-${mood})`} />
          </Svg>
        </AnimatedView>

        {/* Ripple effect */}
        <AnimatedView style={[styles.ripple, { width: orbSize, height: orbSize }, rippleStyle]}>
          <View
            style={[
              styles.rippleCircle,
              {
                width: orbSize,
                height: orbSize,
                borderRadius: orbSize / 2,
                borderColor: moodColor.primary,
              },
            ]}
          />
        </AnimatedView>

        {/* Selection ring */}
        <AnimatedView style={[styles.selectionRing, { width: orbSize + 12, height: orbSize + 12 }, ringStyle]}>
          <View
            style={[
              styles.ring,
              {
                width: orbSize + 12,
                height: orbSize + 12,
                borderRadius: (orbSize + 12) / 2,
                borderColor: moodColor.primary,
              },
            ]}
          />
        </AnimatedView>

        {/* Main orb */}
        <AnimatedView style={[styles.orb, { width: orbSize, height: orbSize }, orbStyle]}>
          <Svg width={orbSize} height={orbSize} viewBox={`0 0 ${orbSize} ${orbSize}`}>
            <Defs>
              <RadialGradient id={`orb-${mood}`} cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor={moodColor.glow} />
                <Stop offset="40%" stopColor={moodColor.primary} />
                <Stop offset="100%" stopColor={moodColor.secondary} />
              </RadialGradient>
            </Defs>
            <SvgCircle
              cx={orbSize / 2}
              cy={orbSize / 2}
              r={orbSize / 2 - 2}
              fill={`url(#orb-${mood})`}
            />
            {/* Highlight */}
            <SvgCircle
              cx={orbSize * 0.35}
              cy={orbSize * 0.35}
              r={orbSize * 0.12}
              fill={withAlpha('#FFFFFF', 0.4)}
            />
          </Svg>
        </AnimatedView>
      </AnimatedPressable>

      {/* Label */}
      <View style={styles.labelContainer}>
        <Text
          variant="labelLarge"
          color={selected ? 'ink' : 'inkMuted'}
          align="center"
          style={styles.label}
        >
          {label}
        </Text>
        {sublabel && (
          <Text variant="bodySmall" color="inkFaint" align="center">
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleCircle: {
    borderWidth: 2,
  },
  selectionRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 2.5,
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginTop: spacing[3],
    alignItems: 'center',
  },
  label: {
    marginBottom: 2,
  },
});
