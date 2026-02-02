/**
 * Card Component - Core
 * 
 * Unified card with variants: default, elevated, interactive.
 * Replaces GlassCard with simpler, more maintainable implementation.
 */
import React, { useCallback } from 'react';
import { StyleSheet, Pressable, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spacing, radius, shadowLight, shadowDark } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  colors: {
    surface: string;
    surfaceElevated: string;
    border: string;
  };
  isDark?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const paddingValues = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  disabled = false,
  style,
  colors,
  isDark = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: CardProps) {
  const scale = useSharedValue(1);
  const shadows = isDark ? shadowDark : shadowLight;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  }, [onPress, disabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [disabled, onPress]);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'interactive':
        return {
          backgroundColor: colors.surface,
          ...shadows.sm,
        };
      default:
        return {
          backgroundColor: colors.surface,
        };
    }
  };

  const containerStyle: ViewStyle = {
    ...getVariantStyles(),
    padding: paddingValues[padding],
    borderRadius: radius.lg,
    overflow: 'hidden',
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[animatedStyle, containerStyle, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[containerStyle, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
