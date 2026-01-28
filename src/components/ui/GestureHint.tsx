/**
 * GestureHint Component
 * 
 * Visual hints for gestures like swipe, long-press, tap.
 * Automatically dismisses after first interaction or timeout.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, withAlpha } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'long-press' | 'tap' | 'pinch';

interface GestureHintProps {
  /** Type of gesture to illustrate */
  gesture: GestureType;
  /** Optional label text */
  label?: string;
  /** Auto-hide after duration (ms), 0 to disable */
  autoDismissAfter?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Custom style */
  style?: any;
  /** Size of the hint */
  size?: 'sm' | 'md' | 'lg';
}

interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down';
  size: number;
  color: string;
}

// =============================================================================
// SWIPE INDICATOR
// =============================================================================

function SwipeIndicator({ direction, size, color }: SwipeIndicatorProps) {
  const { reduceMotion } = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    if (reduceMotion) return;

    const distance = size * 0.6;
    const duration = 800;

    const animate = () => {
      switch (direction) {
        case 'left':
          translateX.value = withRepeat(
            withSequence(
              withTiming(0, { duration: 0 }),
              withDelay(200, withTiming(-distance, { duration, easing: Easing.out(Easing.ease) })),
              withTiming(0, { duration: 0 })
            ),
            -1,
            false
          );
          break;
        case 'right':
          translateX.value = withRepeat(
            withSequence(
              withTiming(0, { duration: 0 }),
              withDelay(200, withTiming(distance, { duration, easing: Easing.out(Easing.ease) })),
              withTiming(0, { duration: 0 })
            ),
            -1,
            false
          );
          break;
        case 'up':
          translateY.value = withRepeat(
            withSequence(
              withTiming(0, { duration: 0 }),
              withDelay(200, withTiming(-distance, { duration, easing: Easing.out(Easing.ease) })),
              withTiming(0, { duration: 0 })
            ),
            -1,
            false
          );
          break;
        case 'down':
          translateY.value = withRepeat(
            withSequence(
              withTiming(0, { duration: 0 }),
              withDelay(200, withTiming(distance, { duration, easing: Easing.out(Easing.ease) })),
              withTiming(0, { duration: 0 })
            ),
            -1,
            false
          );
          break;
      }

      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 0 }),
          withDelay(200, withTiming(0.2, { duration })),
          withTiming(0.8, { duration: 200 })
        ),
        -1,
        false
      );
    };

    animate();

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [direction, size, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const getArrow = () => {
    switch (direction) {
      case 'left': return '←';
      case 'right': return '→';
      case 'up': return '↑';
      case 'down': return '↓';
    }
  };

  return (
    <View style={[styles.swipeContainer, { width: size, height: size }]}>
      {/* Hand icon */}
      <Animated.View style={[styles.handContainer, animatedStyle]}>
        <Text style={[styles.handIcon, { fontSize: size * 0.5, color }]}>👆</Text>
      </Animated.View>
      {/* Arrow indicator */}
      <Text style={[styles.arrowIcon, { fontSize: size * 0.3, color }]}>{getArrow()}</Text>
    </View>
  );
}

// =============================================================================
// LONG PRESS INDICATOR
// =============================================================================

function LongPressIndicator({ size, color }: { size: number; color: string }) {
  const { reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    // Hand press animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.9, { duration: 300, easing: Easing.out(Easing.ease) }),
        withDelay(800, withTiming(1, { duration: 200 }))
      ),
      -1,
      false
    );

    // Ring expansion
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(300, withTiming(1.5, { duration: 800, easing: Easing.out(Easing.ease) })),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(300, withTiming(0.6, { duration: 100 })),
        withTiming(0, { duration: 700 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
    };
  }, [reduceMotion]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[styles.longPressContainer, { width: size, height: size }]}>
      {/* Expanding ring */}
      <Animated.View
        style={[
          styles.longPressRing,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            borderColor: color,
          },
          ringStyle,
        ]}
      />
      {/* Hand */}
      <Animated.View style={handStyle}>
        <Text style={[styles.handIcon, { fontSize: size * 0.5, color }]}>👆</Text>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// TAP INDICATOR
// =============================================================================

function TapIndicator({ size, color }: { size: number; color: string }) {
  const { reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.85, { duration: 100, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );

    rippleScale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1.5, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 450 })
      ),
      -1,
      false
    );

    rippleOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(0.5, { duration: 50 }),
        withTiming(0, { duration: 350 }),
        withTiming(0, { duration: 450 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(rippleScale);
      cancelAnimation(rippleOpacity);
    };
  }, [reduceMotion]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <View style={[styles.tapContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.tapRipple,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            backgroundColor: color,
          },
          rippleStyle,
        ]}
      />
      <Animated.View style={handStyle}>
        <Text style={[styles.handIcon, { fontSize: size * 0.5, color }]}>👆</Text>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GestureHint({
  gesture,
  label,
  autoDismissAfter = 5000,
  onDismiss,
  style,
  size = 'md',
}: GestureHintProps) {
  const { colors, reduceMotion } = useTheme();
  const [visible, setVisible] = useState(true);

  const sizeMap = { sm: 48, md: 64, lg: 80 };
  const iconSize = sizeMap[size];

  useEffect(() => {
    if (autoDismissAfter > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismissAfter);
      return () => clearTimeout(timer);
    }
  }, [autoDismissAfter, onDismiss]);

  if (!visible) return null;

  const renderGesture = () => {
    const color = colors.accentPrimary;
    
    switch (gesture) {
      case 'swipe-left':
        return <SwipeIndicator direction="left" size={iconSize} color={color} />;
      case 'swipe-right':
        return <SwipeIndicator direction="right" size={iconSize} color={color} />;
      case 'swipe-up':
        return <SwipeIndicator direction="up" size={iconSize} color={color} />;
      case 'swipe-down':
        return <SwipeIndicator direction="down" size={iconSize} color={color} />;
      case 'long-press':
        return <LongPressIndicator size={iconSize} color={color} />;
      case 'tap':
        return <TapIndicator size={iconSize} color={color} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={[styles.container, style]}
    >
      <View style={[
        styles.hintBox,
        { backgroundColor: withAlpha(colors.canvas, 0.9) },
      ]}>
        {renderGesture()}
        {label && (
          <Text variant="labelMedium" color="inkMuted" align="center" style={styles.label}>
            {label}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: 16,
    gap: spacing[2],
  },
  swipeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handIcon: {
    textAlign: 'center',
  },
  arrowIcon: {
    position: 'absolute',
    bottom: 0,
    textAlign: 'center',
    opacity: 0.6,
  },
  longPressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  longPressRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  tapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapRipple: {
    position: 'absolute',
  },
  label: {
    marginTop: spacing[1],
  },
});

export default GestureHint;
