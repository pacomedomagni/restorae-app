/**
 * ProgressRing Component
 * Circular progress indicator for sessions and completion
 * 
 * Features:
 * - Animated progress
 * - Multiple sizes
 * - Optional label
 * - Uses ThemeContext (no manual color passing)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { withAlpha } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** Progress value 0-1 */
  progress: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  /** Color tone */
  tone?: 'primary' | 'calm' | 'warm';
}

const sizes = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 200,
};

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth,
  showLabel = true,
  label,
  tone = 'primary',
}: ProgressRingProps) {
  const { colors, reduceMotion } = useTheme();
  const dimension = sizes[size];
  const stroke = strokeWidth || Math.max(4, dimension / 12);
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const getToneColor = () => {
    switch (tone) {
      case 'calm':
        return colors.accentCalm;
      case 'warm':
        return colors.accentWarm;
      default:
        return colors.accentPrimary;
    }
  };

  const progressColor = getToneColor();

  const animatedProgress = useDerivedValue(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    return reduceMotion 
      ? clampedProgress 
      : withTiming(clampedProgress, { duration: 500 });
  }, [progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const percentage = Math.round(progress * 100);

  return (
    <View 
      style={[styles.container, { width: dimension, height: dimension }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      accessibilityLabel={label || `${percentage}% complete`}
    >
      <Svg width={dimension} height={dimension}>
        {/* Background Circle */}
        <Circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={withAlpha(colors.border, 0.3)}
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
        />
      </Svg>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          {label ? (
            <Text
              variant={size === 'sm' ? 'labelSmall' : size === 'md' ? 'labelMedium' : 'headlineSmall'}
              color="ink"
            >
              {label}
            </Text>
          ) : (
            <Text
              variant={size === 'sm' ? 'labelSmall' : size === 'md' ? 'headlineSmall' : 'headlineMedium'}
              color="ink"
            >
              {percentage}%
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
