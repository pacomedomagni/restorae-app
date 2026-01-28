/**
 * Premium Microinteractions
 * 
 * Ultra-premium interaction animations that exceed industry standards.
 * Includes:
 * - Premium Pull-to-Refresh with breathing animation
 * - Ripple effect for buttons and cards
 * - Shimmer loading effect
 * - Premium page transitions
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { withAlpha } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// RIPPLE EFFECT
// =============================================================================

interface RippleProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  rippleColor?: string;
  style?: any;
  contentContainerStyle?: any;
}

export function Ripple({
  children,
  onPress,
  onLongPress,
  disabled = false,
  rippleColor,
  style,
  contentContainerStyle,
}: RippleProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);
  const containerScale = useSharedValue(1);

  const color = rippleColor || colors.accentPrimary;

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rippleX.value },
      { translateY: rippleY.value },
      { scale: rippleScale.value },
    ],
    opacity: rippleOpacity.value,
    backgroundColor: withAlpha(color, 0.2),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    if (disabled) return;

    const { locationX, locationY } = event.nativeEvent;
    rippleX.value = locationX;
    rippleY.value = locationY;

    if (!reduceMotion) {
      rippleScale.value = 0;
      rippleOpacity.value = 1;
      rippleScale.value = withTiming(3, { duration: 400, easing: Easing.out(Easing.ease) });
      containerScale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (disabled) return;

    if (!reduceMotion) {
      rippleOpacity.value = withTiming(0, { duration: 200 });
      containerScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePress = async () => {
    if (disabled) return;
    await impactLight();
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={[styles.rippleContainer, containerStyle, contentContainerStyle]}>
        {children}
        <Animated.View style={[styles.ripple, rippleStyle]} pointerEvents="none" />
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// SHIMMER LOADING EFFECT
// =============================================================================

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function Shimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const { colors, reduceMotion } = useTheme();
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (!reduceMotion) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerPosition.value,
          [-1, 1],
          [-SCREEN_WIDTH, SCREEN_WIDTH],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.shimmerContainer,
        {
          width,
          height,
          borderRadius,
          backgroundColor: withAlpha(colors.canvasElevated, 0.5),
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerGradient, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            withAlpha(colors.ink, 0.05),
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// =============================================================================
// PREMIUM PULL-TO-REFRESH INDICATOR
// =============================================================================

interface BreathingRefreshIndicatorProps {
  refreshing: boolean;
  progress: number; // 0 to 1 during pull
}

export function BreathingRefreshIndicator({ refreshing, progress }: BreathingRefreshIndicatorProps) {
  const { colors, reduceMotion } = useTheme();
  const breatheScale = useSharedValue(1);
  const breatheOpacity = useSharedValue(0.6);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (refreshing && !reduceMotion) {
      // Breathing animation while refreshing
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      breatheOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(breatheScale);
      cancelAnimation(breatheOpacity);
      cancelAnimation(rotation);
      breatheScale.value = withSpring(1);
      breatheOpacity.value = withTiming(0.6);
    }
  }, [refreshing]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: refreshing ? breatheScale.value : interpolate(progress, [0, 1], [0.5, 1]) },
    ],
    opacity: refreshing ? 1 : progress,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: breatheOpacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value * 1.3 }],
    opacity: interpolate(breatheScale.value, [1, 1.2], [0.3, 0]),
  }));

  return (
    <Animated.View style={[styles.refreshContainer, containerStyle]}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.refreshPulse,
          pulseStyle,
          { borderColor: colors.accentPrimary },
        ]}
      />
      
      {/* Inner breathing orb */}
      <Animated.View
        style={[
          styles.refreshOrb,
          innerStyle,
          { backgroundColor: colors.accentPrimary },
        ]}
      >
        {/* Gradient overlay */}
        <LinearGradient
          colors={[withAlpha('#fff', 0.3), 'transparent']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

// =============================================================================
// PRESS SCALE WRAPPER
// =============================================================================

interface PressScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scale?: number;
  style?: any;
}

export function PressScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  scale = 0.96,
  style,
}: PressScaleProps) {
  const { reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const animatedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !reduceMotion) {
      animatedScale.value = withSpring(scale, { damping: 20, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !reduceMotion) {
      animatedScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePress = async () => {
    if (disabled) return;
    await impactLight();
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// FLOATING LABEL INPUT ANIMATION
// =============================================================================

interface FloatingLabelProps {
  label: string;
  focused: boolean;
  hasValue: boolean;
  color?: string;
}

export function FloatingLabel({ label, focused, hasValue, color }: FloatingLabelProps) {
  const { colors, reduceMotion } = useTheme();
  const translateY = useSharedValue(hasValue || focused ? -24 : 0);
  const scale = useSharedValue(hasValue || focused ? 0.85 : 1);
  const labelColor = color || colors.accentPrimary;

  useEffect(() => {
    const shouldFloat = focused || hasValue;
    if (reduceMotion) {
      translateY.value = shouldFloat ? -24 : 0;
      scale.value = shouldFloat ? 0.85 : 1;
    } else {
      translateY.value = withSpring(shouldFloat ? -24 : 0, { damping: 15, stiffness: 200 });
      scale.value = withSpring(shouldFloat ? 0.85 : 1, { damping: 15, stiffness: 200 });
    }
  }, [focused, hasValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    color: focused ? labelColor : colors.inkMuted,
  }));

  return (
    <Animated.Text style={[styles.floatingLabel, animatedStyle]}>
      {label}
    </Animated.Text>
  );
}

// =============================================================================
// STAGGER ANIMATION WRAPPER
// =============================================================================

interface StaggerChildProps {
  children: React.ReactNode;
  index: number;
  baseDelay?: number;
  staggerDelay?: number;
  style?: any;
}

export function StaggerChild({
  children,
  index,
  baseDelay = 100,
  staggerDelay = 50,
  style,
}: StaggerChildProps) {
  const { reduceMotion } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = baseDelay + index * staggerDelay;
    
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
    } else {
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 150 }));
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// GLOW PULSE
// =============================================================================

interface GlowPulseProps {
  color?: string;
  size?: number;
  intensity?: 'subtle' | 'normal' | 'strong';
  style?: any;
}

export function GlowPulse({ color, size = 100, intensity = 'normal', style }: GlowPulseProps) {
  const { colors, reduceMotion } = useTheme();
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const glowColor = color || colors.accentPrimary;

  const intensityMap = {
    subtle: { scaleMax: 1.1, opacityMax: 0.2 },
    normal: { scaleMax: 1.3, opacityMax: 0.4 },
    strong: { scaleMax: 1.5, opacityMax: 0.6 },
  };

  const { scaleMax, opacityMax } = intensityMap[intensity];

  useEffect(() => {
    if (!reduceMotion) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(scaleMax, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(opacityMax, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.glowPulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: glowColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  rippleContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginLeft: -50,
    marginTop: -50,
  },
  shimmerContainer: {
    overflow: 'hidden',
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
  refreshContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  refreshOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: 16,
    fontSize: 16,
  },
  glowPulse: {
    position: 'absolute',
  },
});
