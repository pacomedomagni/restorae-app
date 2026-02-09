/**
 * PremiumButton - Styled action button with glow variant
 *
 * A rich button component used for primary actions across session screens.
 * Supports glow, solid, and outline variants with size options.
 */
import React from 'react';
import { Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha, textStyles } from '../../theme';

type TextVariant = keyof typeof textStyles;

type ButtonVariant = 'glow' | 'solid' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface PremiumButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const SIZE_CONFIG: Record<ButtonSize, { height: number; paddingHorizontal: number; textVariant: TextVariant }> = {
  sm: { height: 36, paddingHorizontal: spacing[3], textVariant: 'labelMedium' },
  md: { height: 44, paddingHorizontal: spacing[4], textVariant: 'labelLarge' },
  lg: { height: 52, paddingHorizontal: spacing[6], textVariant: 'labelLarge' },
  xl: { height: 56, paddingHorizontal: spacing[8], textVariant: 'headlineSmall' },
};

export function PremiumButton({
  children,
  onPress,
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
}: PremiumButtonProps) {
  const { colors } = useTheme();
  const pressScale = useSharedValue(1);
  const config = SIZE_CONFIG[size];

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = async () => {
    if (disabled || !onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'glow':
        return {
          backgroundColor: colors.accentPrimary,
          shadowColor: colors.accentPrimary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        };
      case 'solid':
        return {
          backgroundColor: colors.accentPrimary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.accentPrimary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return { backgroundColor: colors.accentPrimary };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.inkFaint;
    switch (variant) {
      case 'glow':
      case 'solid':
        return colors.inkInverse;
      case 'outline':
      case 'ghost':
        return colors.accentPrimary;
      default:
        return colors.inkInverse;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        style={[
          styles.button,
          {
            height: config.height,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: borderRadius.lg,
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && styles.fullWidth,
          getVariantStyle(),
          style,
        ]}
      >
        {typeof children === 'string' ? (
          <Text
            variant={config.textVariant}
            style={{ color: getTextColor(), textAlign: 'center' }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
});

export default PremiumButton;
