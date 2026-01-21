/**
 * Button Component
 * Unified premium buttons following RESTORAE_SPEC.md
 * 
 * Features:
 * - Multiple variants: primary, secondary, ghost, glow
 * - Subtle scale animation on press (0.97)
 * - Haptic feedback
 * - Premium glow effect for CTAs
 * - Proper shadows and depth
 * - Accessibility support with proper roles and labels
 * - 44px minimum touch target (WCAG 2.5.5)
 */
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, layout, withAlpha } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface ButtonProps {
  /** Button visual style - 'glow' adds premium glow effect for CTAs */
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  haptic?: 'light' | 'medium' | 'none';
  /** Color tone for the button */
  tone?: 'primary' | 'warm' | 'calm';
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
  /** Test ID for testing */
  testID?: string;
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
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { colors, shadows, isDark } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const { impactLight, impactMedium } = useHaptics();

  // Tone colors for different themes
  const getToneColors = () => {
    switch (tone) {
      case 'warm':
        return {
          primary: colors.accentWarm,
          secondary: withAlpha(colors.accentWarm, 0.85),
          glow: withAlpha(colors.accentWarm, 0.5),
        };
      case 'calm':
        return {
          primary: colors.accentCalm,
          secondary: withAlpha(colors.accentCalm, 0.85),
          glow: withAlpha(colors.accentCalm, 0.5),
        };
      default:
        return {
          primary: colors.accentPrimary,
          secondary: colors.accentPrimaryHover,
          glow: withAlpha(colors.accentPrimary, 0.5),
        };
    }
  };

  const toneColors = getToneColors();

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowIntensity.value, [0, 1], [0, 0.6]),
    transform: [
      { scale: interpolate(glowIntensity.value, [0, 1], [0.95, 1.05]) },
    ],
  }));

  const gradientStyle = useAnimatedStyle(() => {
    if (variant !== 'primary' && variant !== 'glow') return {};
    return {
      opacity: interpolate(pressed.value, [0, 1], [1, 0.9]),
    };
  });

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    pressed.value = withTiming(1, { duration: 100 });
    if (variant === 'glow') {
      glowIntensity.value = withTiming(1, { duration: 150 });
    }
  }, [scale, pressed, glowIntensity, variant]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    pressed.value = withTiming(0, { duration: 200 });
    glowIntensity.value = withTiming(0, { duration: 300 });
  }, [scale, pressed, glowIntensity]);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    // Stronger haptic for primary actions
    if (haptic === 'medium' || variant === 'glow' || variant === 'primary') {
      await impactMedium();
    } else if (haptic === 'light') {
      await impactLight();
    }
    onPress?.();
  }, [disabled, loading, onPress, impactLight, impactMedium, haptic, variant]);

  // Size configurations
  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return { py: spacing[2], px: spacing[4], minH: 40, fontSize: 'labelMedium' as const };
      case 'lg':
        return { py: spacing[4], px: spacing[8], minH: 56, fontSize: 'labelLarge' as const };
      case 'xl':
        return { py: spacing[5], px: spacing[10], minH: 64, fontSize: 'labelLarge' as const };
      default:
        return { py: spacing[3], px: spacing[6], minH: 48, fontSize: 'labelLarge' as const };
    }
  };

  const sizeConfig = getSizeConfig();

  const getTextColor = (): 'inkInverse' | 'accent' | 'inkMuted' => {
    if (disabled) return 'inkMuted';
    switch (variant) {
      case 'primary':
      case 'glow':
        return 'inkInverse';
      case 'secondary':
      case 'ghost':
        return 'accent';
    }
  };

  const baseStyle: ViewStyle = {
    paddingVertical: sizeConfig.py,
    paddingHorizontal: sizeConfig.px,
    minHeight: sizeConfig.minH,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...(fullWidth ? { width: '100%' } : {}),
  };

  // Derive accessibility label from children if not provided
  const derivedAccessibilityLabel = accessibilityLabel || 
    (typeof children === 'string' ? children : undefined);

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'glow' ? colors.inkInverse : toneColors.primary}
          size="small"
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        {typeof children === 'string' ? (
          <Text
            variant={sizeConfig.fontSize}
            color={getTextColor()}
            style={
              !disabled && (variant === 'secondary' || variant === 'ghost')
                ? { color: toneColors.primary }
                : undefined
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
    );
  };

  const renderButtonInner = () => {
    switch (variant) {
      case 'glow':
      case 'primary':
        return (
          <View style={baseStyle}>
            {/* Glow effect for glow variant */}
            {variant === 'glow' && (
              <Animated.View
                style={[
                  styles.glowEffect,
                  glowStyle,
                  {
                    backgroundColor: toneColors.glow,
                    borderRadius: borderRadius.full,
                  },
                ]}
              />
            )}
            
            {/* Gradient background */}
            <AnimatedLinearGradient
              colors={
                disabled
                  ? [colors.surfaceHover, colors.surfaceSubtle]
                  : [toneColors.primary, toneColors.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.full }, gradientStyle]}
            />
            
            {/* Top highlight for depth */}
            <LinearGradient
              colors={[
                withAlpha('#FFFFFF', disabled ? 0.05 : 0.2),
                'transparent',
              ]}
              style={[styles.topHighlight, { borderRadius: borderRadius.full }]}
              pointerEvents="none"
            />
            
            {/* Inner shadow for depth */}
            <View
              style={[
                styles.innerBorder,
                {
                  borderColor: withAlpha('#000000', 0.15),
                  borderRadius: borderRadius.full,
                },
              ]}
              pointerEvents="none"
            />
            
            {renderContent()}
          </View>
        );

      case 'secondary':
        return (
          <View
            style={[
              baseStyle,
              {
                backgroundColor: withAlpha(colors.canvasElevated, isDark ? 0.6 : 0.9),
                borderWidth: 1.5,
                borderColor: disabled
                  ? colors.borderMuted
                  : withAlpha(toneColors.primary, 0.3),
              },
            ]}
          >
            {renderContent()}
          </View>
        );

      case 'ghost':
      default:
        return (
          <View style={[baseStyle, { backgroundColor: 'transparent' }]}>
            {renderContent()}
          </View>
        );
    }
  };

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={derivedAccessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      testID={testID}
    >
      {renderButtonInner()}
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
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.15 }],
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopWidth: 0,
  },
});
