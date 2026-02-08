/**
 * StatPill - Gentle stat display for Journey screen
 * Replaces the dense dashboard-style stats grid
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../ui/Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

interface StatPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

export function StatPill({ icon, label }: StatPillProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: withAlpha(colors.canvasElevated, 0.6) },
      ]}
    >
      <Ionicons name={icon} size={14} color={colors.inkFaint} />
      <Text variant="labelMedium" color="inkMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
});
