/**
 * Badge Component
 * Small badge for counts, status, and labels
 * 
 * Features:
 * - Multiple variants (default, success, warning, error, info)
 * - Count and label modes
 * - Two sizes
 * - Uses ThemeContext (no manual color passing)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label?: string;
  count?: number;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({
  label,
  count,
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: withAlpha(colors.accentCalm, 0.15),
          text: colors.accentCalm,
        };
      case 'warning':
        return {
          bg: withAlpha(colors.accentWarm, 0.15),
          text: colors.accentWarm,
        };
      case 'error':
        return {
          bg: withAlpha(colors.accentWarm, 0.2),
          text: colors.accentWarm,
        };
      case 'info':
        return {
          bg: withAlpha(colors.accentPrimary, 0.15),
          text: colors.accentPrimary,
        };
      default:
        return {
          bg: withAlpha(colors.ink, 0.08),
          text: colors.ink,
        };
    }
  };

  const { bg, text } = getColors();
  const isSmall = size === 'sm';
  const displayText = count !== undefined ? (count > 99 ? '99+' : count.toString()) : label;

  // Count-only badge (notification style)
  if (count !== undefined && !label) {
    return (
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: colors.accentWarm,
            minWidth: isSmall ? 16 : 20,
            height: isSmall ? 16 : 20,
            paddingHorizontal: isSmall ? 4 : 6,
          },
        ]}
      >
        <Text
          variant={isSmall ? 'labelSmall' : 'labelMedium'}
          style={{ color: colors.inkInverse, fontSize: isSmall ? 10 : 11 }}
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
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  countBadge: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
