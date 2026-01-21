/**
 * EmptyState Component
 * Beautiful empty state for lists and content areas
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
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
}

export function EmptyState({
  icon = 'journal',
  title,
  description,
  action,
  variant = 'card',
}: EmptyStateProps) {
  const { colors, reduceMotion } = useTheme();

  const content = (
    <>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.delay(100).duration(400)}
        style={[
          styles.iconContainer,
          { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
        ]}
      >
        <LuxeIcon name={icon} size={32} color={colors.accentPrimary} />
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

      {action && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.delay(250).duration(400)}
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
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  description: {
    maxWidth: 280,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: spacing[5],
  },
});
