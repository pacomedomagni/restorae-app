/**
 * OptionalBadge
 * 
 * Small badge to indicate optional fields.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

interface OptionalBadgeProps {
  text?: string;
}

export function OptionalBadge({ text = 'Optional' }: OptionalBadgeProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: withAlpha(colors.inkFaint, 0.15) },
      ]}
    >
      <Text variant="labelSmall" color="inkFaint">
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
});
