/**
 * GlassCard Component
 * Premium glassmorphism card with blur, glow, and depth
 * 
 * This is a truly premium component with:
 * - Real blur backdrop (iOS native, Android fallback)
 * - Subtle inner glow and border luminance
 * - Depth through layered shadows
 * - Animated hover/press states with spring physics
 */
import React, { useCallback, ReactNode } from 'react';
import { StyleSheet, Pressable, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, withAlpha } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'hero' | 'subtle' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: 'none' | 'warm' | 'calm' | 'primary' | 'cool';
  style?: ViewStyle;
  disabled?: boolean;
}

export function GlassCard({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  glow = 'none',
  style,
  disabled = false,
}: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const { impactLight } = useHaptics();

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [0.5, 0.8]),
  }));

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.985, { damping: 20, stiffness: 400 });
      pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
    }
  }, [onPress, disabled, scale, pressed]);

  const handlePressOut = useCallback(() => {
    if (onPress && !disabled) {
      scale.value = withSpring(1, { damping: 15, stiffness: 350 });
      pressed.value = withSpring(0, { damping: 15, stiffness: 350 });
    }
  }, [onPress, disabled, scale, pressed]);

  const handlePress = useCallback(async () => {
    if (!onPress || disabled) return;
    await impactLight();
    onPress();
  }, [onPress, disabled, impactLight]);

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return spacing[3];
      case 'lg': return spacing[6];
      case 'xl': return spacing[8];
      default: return spacing[5];
    }
  };

  const getBlurIntensity = () => {
    // Proper glassmorphism blur values
    if (isDark) {
      switch (variant) {
        case 'hero': return 50;
        case 'elevated': return 40;
        case 'interactive': return 35;
        case 'subtle': return 25;
        default: return 35;
      }
    }
    switch (variant) {
      case 'hero': return 60;
      case 'elevated': return 50;
      case 'interactive': return 45;
      case 'subtle': return 30;
      default: return 45;
    }
  };

  const getGlowColor = () => {
    switch (glow) {
      case 'warm': return colors.accentWarm;
      case 'calm': return colors.accentCalm;
      case 'cool': return colors.accentPrimary;
      case 'primary': return colors.accentPrimary;
      default: return 'transparent';
    }
  };

  const getShadowStyle = (): ViewStyle => {
    // Premium shadows with better depth perception
    const baseShadow = {
      shadowColor: isDark ? '#000' : '#2D3748',
      elevation: variant === 'hero' ? 16 : variant === 'elevated' ? 10 : 6,
    };

    switch (variant) {
      case 'hero':
        return {
          ...baseShadow,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 40,
        };
      case 'elevated':
        return {
          ...baseShadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 24,
        };
      case 'subtle':
        return {
          ...baseShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 12,
        };
      default:
        return {
          ...baseShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 20,
        };
    }
  };

  const containerStyle: ViewStyle = {
    borderRadius: variant === 'hero' ? borderRadius['2xl'] : borderRadius.xl,
    overflow: 'hidden',
    ...getShadowStyle(),
  };

  const glowColor = getGlowColor();
  const showGlow = glow !== 'none';

  const content = (
    <View style={[containerStyle, style]}>
      {/* Outer glow effect */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowOuter,
            animatedGlowStyle,
            {
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isDark ? 0.4 : 0.25,
              shadowRadius: 24,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Glass background with blur */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={getBlurIntensity()}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        // Android fallback - semi-transparent solid
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark 
                ? 'rgba(30, 25, 21, 0.92)'
                : 'rgba(255, 255, 255, 0.92)',
            },
          ]}
        />
      )}

      {/* Subtle tint overlay for depth */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(255, 255, 255, 0.6)',
          },
        ]}
      />

      {/* Top highlight border - more subtle on solid cards */}
      <LinearGradient
        colors={[
          withAlpha(colors.inkInverse, isDark ? 0.15 : 0.6),
          withAlpha(colors.inkInverse, isDark ? 0.05 : 0.1),
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topHighlight}
        pointerEvents="none"
      />

      {/* Inner border with gradient */}
      <View
        style={[
          styles.innerBorder,
          {
            borderColor: withAlpha(
              isDark ? colors.inkInverse : colors.ink,
              isDark ? 0.08 : 0.06
            ),
            borderRadius: variant === 'hero' ? borderRadius['2xl'] : borderRadius.xl,
          },
        ]}
        pointerEvents="none"
      />

      {/* Subtle inner shadow at top */}
      <LinearGradient
        colors={[
          withAlpha(colors.ink, isDark ? 0.08 : 0.03),
          'transparent',
        ]}
        style={styles.innerShadow}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={{ padding: getPadding() }}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={animatedContainerStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={animatedContainerStyle}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius['2xl'],
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
});
