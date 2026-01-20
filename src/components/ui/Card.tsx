/**
 * Card Component
 * Elevated surfaces following RESTORAE_SPEC.md
 * 
 * Features:
 * - Soft shadows (8% opacity, 8px blur)
 * - 16px border radius
 * - 24px internal padding
 * - Subtle press animation
 * - Optional gradient shine
 */
import React, { useCallback, ReactNode } from 'react';
import { StyleSheet, Pressable, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, layout, withAlpha } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  elevation?: 'soft' | 'lift' | 'hero';
  shine?: boolean;
  style?: ViewStyle;
}

export function Card({
  children,
  onPress,
  padding = 'md',
  elevated = true,
  elevation = 'soft',
  shine = false,
  style,
}: CardProps) {
  const { colors, shadows, gradients } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  }, [onPress]);

  const handlePress = useCallback(async () => {
    if (!onPress) return;
    await impactLight();
    onPress();
  }, [onPress, impactLight]);

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing[3];
      case 'lg':
        return spacing[8];
      default:
        return layout.cardPadding;
    }
  };

  const outerStyle: ViewStyle = {
    borderRadius: borderRadius.xl,
    ...(elevated
      ? elevation === 'hero'
        ? shadows.lg
        : elevation === 'lift'
          ? shadows.md
          : shadows.sm
      : {}),
  };

  const innerStyle: ViewStyle = {
    backgroundColor: colors.canvasElevated,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: getPadding(),
    overflow: 'hidden',
  };

  const content = (
    <>
      <View style={innerStyle}>
        {elevated ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.innerHighlight,
              { borderColor: withAlpha(colors.inkInverse, 0.12) },
            ]}
          />
        ) : null}
        {shine ? (
          <LinearGradient
            colors={gradients.cardShine}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.shine]}
            pointerEvents="none"
          />
        ) : null}
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={[outerStyle, animatedStyle, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[outerStyle, animatedStyle, style]}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shine: {
    opacity: 0.35,
  },
  innerHighlight: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
  },
});
