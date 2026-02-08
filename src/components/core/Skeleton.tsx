/**
 * Skeleton Component - Core
 * 
 * Loading placeholder with shimmer animation.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, withAlpha } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  colors: {
    border: string;
    surface: string;
  };
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  variant = 'rect',
  colors,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-SCREEN_WIDTH, SCREEN_WIDTH]
        ),
      },
    ],
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          width: width,
          height: height,
          borderRadius: radius.sm,
        };
      case 'circle':
        return {
          width: height,
          height: height,
          borderRadius: height / 2,
        };
      case 'card':
        return {
          width: width,
          height: height || 100,
          borderRadius: radius.lg,
        };
      default:
        return {
          width: width,
          height: height,
          borderRadius: borderRadius ?? radius.sm,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        variantStyles,
        { backgroundColor: withAlpha(colors.border, 0.3) },
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            withAlpha(colors.surface, 0.5),
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Preset skeleton components
export function SkeletonText({ lines = 1, colors }: { lines?: number; colors: SkeletonProps['colors'] }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
          colors={colors}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({ colors }: { colors: SkeletonProps['colors'] }) {
  return (
    <View style={styles.cardContainer}>
      <Skeleton variant="card" height={120} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
  },
  gradient: {
    flex: 1,
    width: SCREEN_WIDTH * 0.5,
  },
  textContainer: {
    gap: 8,
  },
  cardContainer: {
    width: '100%',
  },
});
