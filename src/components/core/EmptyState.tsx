/**
 * EmptyState Component - Core
 * 
 * Placeholder for empty content areas.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { spacing, withAlpha } from '../../theme/tokens';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: {
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    actionPrimary: string;
    actionSecondary: string;
    actionDestructive: string;
    textInverse: string;
    border: string;
  };
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  colors,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: withAlpha(colors.actionPrimary, 0.1) },
        ]}
      >
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : icon ? (
          <Ionicons
            name={icon}
            size={32}
            color={colors.actionPrimary}
          />
        ) : null}
      </View>

      <Text
        variant="headlineSmall"
        align="center"
        style={[styles.title, { color: colors.textPrimary }]}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="bodyMedium"
          align="center"
          style={[styles.description, { color: colors.textSecondary }]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          variant="secondary"
          onPress={onAction}
          colors={colors}
          style={styles.action}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  action: {
    marginTop: spacing.sm,
  },
});
