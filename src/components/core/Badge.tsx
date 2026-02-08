/**
 * Badge Component - Core
 * 
 * Small badge for counts, status, and labels.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { spacing, radius, withAlpha } from '../../theme/tokens';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label?: string;
  count?: number;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  colors: Record<string, string>;
}

export function Badge({
  label,
  count,
  variant = 'default',
  size = 'md',
  colors,
}: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: withAlpha(colors.success, 0.15),
          text: colors.success,
        };
      case 'warning':
        return {
          bg: withAlpha(colors.warning, 0.15),
          text: colors.warning,
        };
      case 'error':
        return {
          bg: withAlpha(colors.error, 0.15),
          text: colors.error,
        };
      case 'info':
        return {
          bg: withAlpha(colors.actionPrimary, 0.15),
          text: colors.actionPrimary,
        };
      default:
        return {
          bg: colors.surface,
          text: colors.textPrimary,
        };
    }
  };

  const { bg, text } = getColors();
  const isSmall = size === 'sm';
  const displayText = count !== undefined ? (count > 99 ? '99+' : count.toString()) : label;

  // Count-only badge (dot style when count is shown)
  if (count !== undefined && !label) {
    return (
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: colors.error,
            minWidth: isSmall ? 16 : 20,
            height: isSmall ? 16 : 20,
            paddingHorizontal: isSmall ? 4 : 6,
          },
        ]}
      >
        <Text
          variant={isSmall ? 'labelSmall' : 'labelMedium'}
          style={{ color: colors.textInverse, fontSize: isSmall ? 10 : 11 }}
        >
          {displayText}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? spacing.sm : spacing.sm + 2,
        },
      ]}
    >
      <Text
        variant={isSmall ? 'labelSmall' : 'labelMedium'}
        style={{ color: text }}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  countBadge: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
