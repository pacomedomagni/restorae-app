/**
 * PremiumButton Component
 * Elevated button design with depth, glow, and fluid animations
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
  interpolateColor,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PremiumButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'primary' | 'warm' | 'calm';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  tone = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onPress,
  children,
  style,
}: PremiumButtonProps) {
  const { colors, isDark } = useTheme();
  const { impactLight, impactMedium } = useHaptics();
  
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Tone colors
  const getToneColors = () => {
    switch (tone) {
      case 'warm':
        return {
          primary: colors.accentWarm,
          secondary: '#D4956A',
          glow: withAlpha(colors.accentWarm, 0.5),
        };
      case 'calm':
        return {
          primary: colors.accentCalm,
          secondary: '#5C8A77',
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

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    pressed.value = withTiming(1, { duration: 100 });
    if (variant === 'glow' || variant === 'primary') {
      glowIntensity.value = withTiming(1, { duration: 150 });
    }
  }, [scale, pressed, glowIntensity, variant]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
    pressed.value = withTiming(0, { duration: 200 });
    glowIntensity.value = withTiming(0, { duration: 300 });
  }, [scale, pressed, glowIntensity]);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    if (variant === 'primary' || variant === 'glow') {
      await impactMedium();
    } else {
      await impactLight();
    }
    onPress?.();
  }, [disabled, loading, variant, impactMedium, impactLight, onPress]);

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

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
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

  // Render based on variant
  const renderButton = () => {
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

    const content = loading ? (
      <ActivityIndicator
        color={variant === 'primary' || variant === 'glow' ? colors.inkInverse : toneColors.primary}
        size="small"
      />
    ) : (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        {typeof children === 'string' ? (
          <Text
            variant={sizeConfig.fontSize}
            color={variant === 'primary' || variant === 'glow' ? 'inkInverse' : 'accent'}
            style={
              variant === 'secondary' || variant === 'ghost'
                ? { color: disabled ? colors.inkFaint : toneColors.primary }
                : undefined
            }
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    );

    switch (variant) {
      case 'primary':
      case 'glow':
        return (
          <View style={baseStyle}>
            {/* Glow effect */}
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
            
            {/* Top highlight */}
            <LinearGradient
              colors={[
                withAlpha('#FFFFFF', disabled ? 0.05 : 0.2),
                'transparent',
              ]}
              style={[styles.topHighlight, { borderRadius: borderRadius.full }]}
              pointerEvents="none"
            />
            
            {/* Inner shadow */}
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
            
            {content}
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
            {content}
          </View>
        );

      case 'ghost':
        return (
          <View style={[baseStyle, { backgroundColor: 'transparent' }]}>
            {content}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatedPressable
      style={[containerStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {renderButton()}
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
