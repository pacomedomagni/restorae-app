/**
 * PremiumEmptyState Component
 * 
 * Beautiful, actionable empty states with contextual CTAs.
 * Transforms empty screens from boring to engaging.
 * 
 * Features:
 * - Animated illustrations
 * - Contextual messages
 * - Primary and secondary actions
 * - Premium feel
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { Button } from './Button';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, withAlpha } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export type EmptyStateVariant = 
  | 'journal'
  | 'favorites'
  | 'history'
  | 'search'
  | 'offline'
  | 'error'
  | 'coming-soon'
  | 'generic';

interface PremiumEmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  message?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  /** Custom illustration override */
  customIllustration?: React.ReactNode;
}

// =============================================================================
// VARIANT CONFIG
// =============================================================================

interface VariantConfig {
  emoji: string;
  defaultTitle: string;
  defaultMessage: string;
  gradient: readonly [string, string];
}

const VARIANT_CONFIG: Record<EmptyStateVariant, VariantConfig> = {
  journal: {
    emoji: '📝',
    defaultTitle: 'Your journal awaits',
    defaultMessage: 'Start writing to capture your thoughts and track your journey',
    gradient: ['#A78BFA', '#8B5CF6'] as const,
  },
  favorites: {
    emoji: '⭐',
    defaultTitle: 'No favorites yet',
    defaultMessage: 'Pin your go-to tools for quick access from the home screen',
    gradient: ['#F59E0B', '#D97706'] as const,
  },
  history: {
    emoji: '📊',
    defaultTitle: 'No activity yet',
    defaultMessage: 'Complete sessions to see your progress and insights here',
    gradient: ['#10B981', '#059669'] as const,
  },
  search: {
    emoji: '🔍',
    defaultTitle: 'No results found',
    defaultMessage: 'Try a different search term or browse all content',
    gradient: ['#6366F1', '#4F46E5'] as const,
  },
  offline: {
    emoji: '📡',
    defaultTitle: 'You\'re offline',
    defaultMessage: 'Some features need an internet connection. Check back when you\'re connected.',
    gradient: ['#64748B', '#475569'] as const,
  },
  error: {
    emoji: '😔',
    defaultTitle: 'Something went wrong',
    defaultMessage: 'We couldn\'t load this content. Please try again.',
    gradient: ['#EF4444', '#DC2626'] as const,
  },
  'coming-soon': {
    emoji: '🚀',
    defaultTitle: 'Coming soon',
    defaultMessage: 'We\'re working on something special. Stay tuned!',
    gradient: ['#8B5CF6', '#7C3AED'] as const,
  },
  generic: {
    emoji: '✨',
    defaultTitle: 'Nothing here yet',
    defaultMessage: 'This space is waiting for you to fill it',
    gradient: ['#6FA08B', '#5C8A77'] as const,
  },
};

// =============================================================================
// ANIMATED ILLUSTRATION
// =============================================================================

function AnimatedIllustration({ emoji, gradient }: { emoji: string; gradient: readonly [string, string] }) {
  const { reduceMotion } = useTheme();
  
  const float = useSharedValue(0);
  const scale = useSharedValue(0);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    // Scale in
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });

    if (!reduceMotion) {
      // Floating animation
      float.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Glow pulse
      glow.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={styles.illustrationContainer}>
      {/* Glow effect */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={[gradient[0], 'transparent']}
          style={styles.glow}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
      
      {/* Main emoji container */}
      <Animated.View style={[styles.emojiContainer, containerStyle]}>
        <LinearGradient
          colors={gradient}
          style={styles.emojiBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PremiumEmptyState({
  variant,
  title,
  message,
  primaryAction,
  secondaryAction,
  customIllustration,
}: PremiumEmptyStateProps) {
  const { colors, reduceMotion } = useTheme();
  const config = VARIANT_CONFIG[variant];

  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <View style={styles.container}>
      {/* Illustration */}
      {customIllustration || (
        <AnimatedIllustration emoji={config.emoji} gradient={config.gradient} />
      )}

      {/* Text Content */}
      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}
        style={styles.textContainer}
      >
        <Text variant="headlineMedium" color="ink" align="center" style={styles.title}>
          {displayTitle}
        </Text>
        <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.message}>
          {displayMessage}
        </Text>
      </Animated.View>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(400)}
          style={styles.actionsContainer}
        >
          {primaryAction && (
            <Button
              variant="primary"
              size="md"
              onPress={primaryAction.onPress}
              style={styles.primaryButton}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Pressable onPress={secondaryAction.onPress} style={styles.secondaryButton}>
              <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
                {secondaryAction.label}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  glowContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  emojiContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  emojiBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 280,
  },
  title: {
    marginBottom: spacing[2],
  },
  message: {
    lineHeight: 22,
    opacity: 0.85,
  },
  actionsContainer: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  primaryButton: {
    minWidth: 160,
  },
  secondaryButton: {
    marginTop: spacing[4],
    paddingVertical: spacing[2],
  },
});

export default PremiumEmptyState;
