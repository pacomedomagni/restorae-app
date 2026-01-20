/**
 * Button Component
 * Premium buttons following RESTORAE_SPEC.md
 * 
 * Features:
 * - Subtle scale animation on press (0.97)
 * - Haptic feedback
 * - Proper shadows
 * - Rounded corners (12px)
 */
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, layout, withAlpha } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  haptic?: 'light' | 'medium' | 'none';
  tone?: 'primary' | 'warm' | 'calm';
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  haptic = 'light',
  tone = 'primary',
  onPress,
  children,
  style,
}: ButtonProps) {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);
  const { impactLight, impactMedium } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    if (haptic === 'medium') {
      await impactMedium();
    } else if (haptic === 'light') {
      await impactLight();
    }
    onPress?.();
  }, [disabled, loading, onPress, impactLight, impactMedium, haptic]);

  const toneColor =
    tone === 'warm' ? colors.accentWarm : tone === 'calm' ? colors.accentCalm : colors.accentPrimary;
  const toneHoverColor =
    tone === 'primary' ? colors.accentPrimaryHover : withAlpha(toneColor, 0.85);
  const toneHoverBase = tone === 'primary' ? colors.accentPrimaryHover : toneColor;

  // Styles based on variant
  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceHover;
    switch (variant) {
      case 'primary':
        return isPressed ? toneHoverColor : toneColor;
      case 'secondary':
        return withAlpha(colors.canvasElevated, 0.9);
      case 'ghost':
        return 'transparent';
    }
  };

  const getBorderColor = () => {
    if (variant === 'primary') {
      return withAlpha(toneHoverBase, 0.4);
    }
    if (variant === 'secondary') {
      return disabled ? colors.borderMuted : colors.border;
    }
    return 'transparent';
  };

  const getTextColor = (): 'inkInverse' | 'accent' | 'inkMuted' => {
    if (disabled) return 'inkMuted';
    switch (variant) {
      case 'primary':
        return 'inkInverse';
      case 'secondary':
      case 'ghost':
        return 'accent';
    }
  };

  // Size styles
  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing[2], paddingHorizontal: spacing[4] };
      case 'lg':
        return { paddingVertical: spacing[4], paddingHorizontal: spacing[8] };
      default:
        return { paddingVertical: spacing[3], paddingHorizontal: spacing[6] };
    }
  };

  const buttonStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: variant === 'ghost' ? 0 : 1,
    borderRadius: borderRadius.full,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...getSizeStyle(),
    ...(variant === 'primary' && !disabled ? shadows.sm : {}),
    ...(fullWidth ? { width: '100%' } : {}),
  };

  return (
    <AnimatedPressable
      style={[buttonStyle, animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.inkInverse : colors.accentPrimary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          {typeof children === 'string' ? (
            <Text
              variant="labelLarge"
              color={getTextColor()}
              style={
                !disabled && variant !== 'primary' ? { color: toneColor } : undefined
              }
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});
