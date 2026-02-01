/**
 * MoodOrb Component
 * A beautiful, interactive mood selection orb with organic animations
 * 
 * Features:
 * - Gradient-filled orb with glow effect
 * - Ripple animation on selection
 * - Subtle idle breathing animation
 * - Haptic feedback
 * - Icon patterns for colorblind accessibility
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle, Path } from 'react-native-svg';
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
import { spacing, withAlpha, getResponsiveOrbSize } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export type MoodType = 'energized' | 'calm' | 'good' | 'anxious' | 'low' | 'tough';

// Mood icons/patterns for colorblind accessibility
const MOOD_ICONS: Record<MoodType, string> = {
  energized: '⚡',
  calm: '🌊',
  good: '☀️',
  anxious: '💨',
  low: '🌧️',
  tough: '🔥',
};

interface MoodOrbProps {
  mood: MoodType;
  label: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onPress?: () => void;
  delay?: number;
  /** Show icon overlay for accessibility */
  showIcon?: boolean;
}

// Helper to generate secondary and glow colors from primary
const generateMoodPalette = (primary: string) => {
  // Darken for secondary
  const secondary = primary.replace(/^#/, '');
  const r = Math.max(0, parseInt(secondary.slice(0, 2), 16) - 30);
  const g = Math.max(0, parseInt(secondary.slice(2, 4), 16) - 30);
  const b = Math.max(0, parseInt(secondary.slice(4, 6), 16) - 30);
  
  // Lighten for glow
  const rGlow = Math.min(255, parseInt(secondary.slice(0, 2), 16) + 40);
  const gGlow = Math.min(255, parseInt(secondary.slice(2, 4), 16) + 40);
  const bGlow = Math.min(255, parseInt(secondary.slice(4, 6), 16) + 40);
  
  return {
    primary,
    secondary: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
    glow: `#${rGlow.toString(16).padStart(2, '0')}${gGlow.toString(16).padStart(2, '0')}${bGlow.toString(16).padStart(2, '0')}`,
  };
};

export function MoodOrb({
  mood,
  label,
  sublabel,
  size = 'md',
  selected = false,
  onPress,
  delay = 0,
  showIcon = true,
}: MoodOrbProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();

  // Use theme colors instead of hardcoded values
  const getMoodColorFromTheme = (moodType: MoodType) => {
    const themeColor = {
      energized: colors.moodEnergized,
      calm: colors.moodCalm,
      good: colors.moodGood,
      anxious: colors.moodAnxious,
      low: colors.moodLow,
      tough: colors.moodTough,
    }[moodType];
    
    return generateMoodPalette(themeColor);
  };

  const moodColor = getMoodColorFromTheme(mood);
  
  // Animation values
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const breathe = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const ripple = useSharedValue(0);
  const selectedValue = useSharedValue(selected ? 1 : 0);

  // Responsive orb sizing
  const responsiveOrbSizes = getResponsiveOrbSize();
  const orbSize = size === 'sm' ? responsiveOrbSizes.sm : size === 'lg' ? responsiveOrbSizes.lg : responsiveOrbSizes.md;
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
    pressScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
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
        accessibilityRole="button"
        accessibilityLabel={`${label} mood${sublabel ? `, ${sublabel}` : ''}`}
        accessibilityState={{ selected }}
        accessibilityHint={`Select ${label} as your current mood`}
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
          
          {/* Mood icon for accessibility */}
          {showIcon && (
            <View style={styles.iconOverlay}>
              <Text style={[styles.moodIcon, { fontSize: orbSize * 0.35 }]}>
                {MOOD_ICONS[mood]}
              </Text>
            </View>
          )}
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
  iconOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIcon: {
    textAlign: 'center',
  },
  labelContainer: {
    marginTop: spacing[2],
    alignItems: 'center',
  },
  label: {
    marginBottom: 1,
  },
});
