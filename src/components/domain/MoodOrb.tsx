/**
 * MoodOrb Component - Domain
 * 
 * Interactive mood selection orb with animations.
 * Now uses ThemeContext instead of colors prop.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/Text';
import { useTheme } from '../../contexts/ThemeContext';
import { MoodType, moodLabels, moodIcons, spacing } from '../../theme/tokens';

interface MoodOrbProps {
  mood: MoodType;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizes = {
  sm: 64,
  md: 80,
  lg: 120,
};

export function MoodOrb({
  mood,
  selected = false,
  onPress,
  size = 'md',
  showLabel = true,
}: MoodOrbProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const breathe = useSharedValue(1);
  const glow = useSharedValue(0);

  const dimension = sizes[size];

  const moodColor = {
    calm: colors.moodCalm,
    good: colors.moodGood,
    anxious: colors.moodAnxious,
    low: colors.moodLow,
  }[mood];

  // Breathing animation when selected
  useEffect(() => {
    if (selected && !reduceMotion) {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );
      glow.value = withTiming(1, { duration: 300 });
    } else {
      breathe.value = withTiming(1, { duration: 200 });
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [selected, reduceMotion]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * breathe.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.4,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${moodLabels[mood]} mood`}
        accessibilityState={{ selected }}
      >
        <View style={[styles.orbWrapper, { width: dimension, height: dimension }]}>
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glow,
              {
                width: dimension,
                height: dimension,
                borderRadius: dimension / 2,
                backgroundColor: moodColor,
              },
              animatedGlowStyle,
            ]}
          />

          {/* Main orb */}
          <Animated.View
            style={[
              styles.orb,
              {
                width: dimension,
                height: dimension,
                borderRadius: dimension / 2,
                backgroundColor: moodColor,
                borderWidth: selected ? 3 : 0,
                borderColor: colors.canvas,
              },
              animatedOrbStyle,
            ]}
          >
            <Text style={[styles.emoji, { fontSize: dimension * 0.35 }]}>
              {moodIcons[mood]}
            </Text>
          </Animated.View>
        </View>
      </Pressable>

      {showLabel && (
        <Text
          variant="labelMedium"
          align="center"
          style={[
            styles.label,
            {
              color: selected ? colors.ink : colors.inkMuted,
              fontWeight: selected ? '600' : '400',
            },
          ]}
        >
          {moodLabels[mood]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    textAlign: 'center',
  },
  label: {
    marginTop: spacing.sm,
  },
});
