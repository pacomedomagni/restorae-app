/**
 * ProgressRing Component - Core
 * 
 * Circular progress indicator for sessions and completion.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { withAlpha } from '../../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-1
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  colors: {
    actionPrimary: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
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
  colors,
}: ProgressRingProps) {
  const dimension = sizes[size];
  const stroke = strokeWidth || Math.max(4, dimension / 12);
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useDerivedValue(() => {
    return withTiming(Math.min(Math.max(progress, 0), 1), { duration: 500 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
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
          stroke={colors.actionPrimary}
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
              style={{ color: colors.textPrimary }}
            >
              {label}
            </Text>
          ) : (
            <Text
              variant={size === 'sm' ? 'labelMedium' : size === 'md' ? 'headlineSmall' : 'headlineLarge'}
              style={{ color: colors.textPrimary }}
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
