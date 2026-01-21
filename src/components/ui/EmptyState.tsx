/**
 * EmptyState Component
 * Beautiful empty state for lists and content areas with premium animations
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from './Text';
import { GlassCard } from './GlassCard';
import { LuxeIcon } from '../LuxeIcon';
import { spacing, withAlpha } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  /** Icon to display */
  icon?: 'journal' | 'breathe' | 'ground' | 'focus' | 'reset';
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: React.ReactNode;
  /** Visual variant */
  variant?: 'card' | 'inline';
  /** Optional encouraging message */
  encouragement?: string;
}

export function EmptyState({
  icon = 'journal',
  title,
  description,
  action,
  variant = 'card',
  encouragement,
}: EmptyStateProps) {
  const { colors, reduceMotion } = useTheme();
  
  // Subtle breathing animation for the icon
  const breathe = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (reduceMotion) return;
    
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [reduceMotion, breathe, glowOpacity]);

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const content = (
    <>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.delay(100).duration(400)}
        style={styles.iconWrapper}
      >
        {/* Glow behind icon */}
        <Animated.View
          style={[
            styles.iconGlow,
            { backgroundColor: colors.accentPrimary },
            glowStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: withAlpha(colors.accentPrimary, 0.12) },
            iconContainerStyle,
          ]}
        >
          <LuxeIcon name={icon} size={36} color={colors.accentPrimary} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(150).duration(400)}
      >
        <Text variant="headlineMedium" color="ink" align="center" style={styles.title}>
          {title}
        </Text>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}
      >
        <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.description}>
          {description}
        </Text>
      </Animated.View>

      {encouragement && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.delay(250).duration(400)}
        >
          <Text variant="bodySmall" color="inkFaint" align="center" style={styles.encouragement}>
            {encouragement}
          </Text>
        </Animated.View>
      )}

      {action && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.delay(300).duration(400)}
          style={styles.actionContainer}
        >
          {action}
        </Animated.View>
      )}
    </>
  );

  if (variant === 'inline') {
    return <View style={styles.inlineContainer}>{content}</View>;
  }

  return (
    <GlassCard variant="subtle" padding="xl">
      <View style={styles.cardContent}>{content}</View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  inlineContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    transform: [{ scale: 1.2 }],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing[2],
  },
  description: {
    maxWidth: 300,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  encouragement: {
    maxWidth: 280,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    marginTop: spacing[5],
  },
});
