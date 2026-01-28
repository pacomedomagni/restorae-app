/**
 * CoachMark Component
 * 
 * A premium tooltip overlay that highlights features for first-time users.
 * Features:
 * - Animated entrance/exit
 * - Spotlight effect on target area
 * - Customizable positioning
 * - Touch to dismiss
 */
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { GlassCard } from './GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { CoachMark as CoachMarkType, COACH_MARKS, CoachMarkId } from '../../contexts/CoachMarkContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface CoachMarkProps {
  /** The coach mark to display */
  coachMark: CoachMarkType;
  /** Callback when dismissed */
  onDismiss: () => void;
  /** Optional target coordinates for spotlight */
  targetArea?: { x: number; y: number; width: number; height: number };
  /** Step indicator (e.g., "1 of 3") */
  stepIndicator?: string;
}

interface CoachMarkOverlayProps {
  /** Coach mark ID to show */
  markId: CoachMarkId;
  /** Whether to show the overlay */
  visible: boolean;
  /** Callback when dismissed */
  onDismiss: () => void;
  /** Optional target coordinates */
  targetArea?: { x: number; y: number; width: number; height: number };
}

// =============================================================================
// PULSING RING ANIMATION
// =============================================================================

function PulsingRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1, { duration: 0 }),
      withDelay(
        300,
        withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) })
      )
    );
    opacity.value = withSequence(
      withTiming(0.6, { duration: 0 }),
      withDelay(
        300,
        withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) })
      )
    );

    const interval = setInterval(() => {
      scale.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) })
      );
      opacity.value = withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        { borderColor: color },
        animatedStyle,
      ]}
    />
  );
}

// =============================================================================
// COACH MARK COMPONENT
// =============================================================================

export function CoachMarkTooltip({ coachMark, onDismiss, targetArea, stepIndicator }: CoachMarkProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const insets = useSafeAreaInsets();
  
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    } else {
      scale.value = 1;
      translateY.value = 0;
    }
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handleDismiss = async () => {
    await impactLight();
    onDismiss();
  };

  // Calculate tooltip position based on target area
  const getTooltipPosition = () => {
    const position = coachMark.position || 'center';
    const padding = spacing[4];
    
    switch (position) {
      case 'top':
        return {
          top: insets.top + padding,
          left: padding,
          right: padding,
        };
      case 'bottom':
        return {
          bottom: insets.bottom + padding + 80, // Above tab bar
          left: padding,
          right: padding,
        };
      case 'center':
      default:
        return {
          top: SCREEN_HEIGHT / 2 - 80,
          left: padding,
          right: padding,
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tip"
      >
        {/* Semi-transparent backdrop */}
        <Animated.View 
          entering={reduceMotion ? undefined : FadeIn.duration(200)}
          exiting={reduceMotion ? undefined : FadeOut.duration(200)}
          style={[styles.backdrop, { backgroundColor: withAlpha('#000', 0.6) }]}
        />

        {/* Spotlight on target area (if provided) */}
        {targetArea && (
          <View
            style={[
              styles.spotlight,
              {
                left: targetArea.x - 10,
                top: targetArea.y - 10,
                width: targetArea.width + 20,
                height: targetArea.height + 20,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <PulsingRing color={colors.accentPrimary} />
          </View>
        )}

        {/* Tooltip Card */}
        <Animated.View
          entering={reduceMotion ? undefined : SlideInDown.springify().damping(15)}
          exiting={reduceMotion ? undefined : SlideOutDown.duration(200)}
          style={[
            styles.tooltipContainer,
            tooltipPosition,
            cardStyle,
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassCard variant="elevated" padding="lg" glow="primary">
              <View style={styles.content}>
                {/* Icon */}
                {coachMark.icon && (
                  <Animated.View 
                    entering={reduceMotion ? undefined : FadeIn.delay(100).duration(300)}
                    style={styles.iconContainer}
                  >
                    <Text style={styles.icon}>{coachMark.icon}</Text>
                  </Animated.View>
                )}

                {/* Title */}
                <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(150).duration(300)}>
                  <Text variant="headlineSmall" color="ink" align="center" style={styles.title}>
                    {coachMark.title}
                  </Text>
                </Animated.View>

                {/* Message */}
                <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(200).duration(300)}>
                  <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.message}>
                    {coachMark.message}
                  </Text>
                </Animated.View>

                {/* Step indicator */}
                {stepIndicator && (
                  <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(250).duration(300)}>
                    <Text variant="labelSmall" color="inkFaint" align="center" style={styles.step}>
                      {stepIndicator}
                    </Text>
                  </Animated.View>
                )}

                {/* Dismiss hint */}
                <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(300).duration(300)}>
                  <Text variant="labelSmall" color="inkFaint" align="center" style={styles.dismissHint}>
                    Tap anywhere to continue
                  </Text>
                </Animated.View>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// =============================================================================
// COACH MARK OVERLAY (Convenience wrapper)
// =============================================================================

export function CoachMarkOverlay({ markId, visible, onDismiss, targetArea }: CoachMarkOverlayProps) {
  if (!visible) return null;

  const markData = COACH_MARKS[markId];
  if (!markData) return null;

  const coachMark: CoachMarkType = {
    id: markId,
    ...markData,
  };

  return (
    <CoachMarkTooltip
      coachMark={coachMark}
      onDismiss={onDismiss}
      targetArea={targetArea}
    />
  );
}

// =============================================================================
// INLINE COACH MARK (Non-modal version)
// =============================================================================

interface InlineCoachMarkProps {
  title: string;
  message: string;
  icon?: string;
  onDismiss: () => void;
  style?: any;
}

export function InlineCoachMark({ title, message, icon, onDismiss, style }: InlineCoachMarkProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();

  const handleDismiss = async () => {
    await impactLight();
    onDismiss();
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={[styles.inlineContainer, style]}
    >
      <GlassCard variant="subtle" padding="md">
        <View style={styles.inlineContent}>
          <View style={styles.inlineLeft}>
            {icon && <Text style={styles.inlineIcon}>{icon}</Text>}
            <View style={styles.inlineText}>
              <Text variant="labelLarge" color="ink">{title}</Text>
              <Text variant="bodySmall" color="inkMuted">{message}</Text>
            </View>
          </View>
          <Pressable 
            onPress={handleDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
              Got it
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderRadius: 12,
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    gap: spacing[2],
  },
  iconContainer: {
    marginBottom: spacing[1],
  },
  icon: {
    fontSize: 40,
  },
  title: {
    marginBottom: spacing[1],
  },
  message: {
    maxWidth: 280,
  },
  step: {
    marginTop: spacing[2],
  },
  dismissHint: {
    marginTop: spacing[3],
    opacity: 0.6,
  },
  inlineContainer: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  inlineIcon: {
    fontSize: 24,
  },
  inlineText: {
    flex: 1,
    gap: spacing[1],
  },
});

export default CoachMarkTooltip;
