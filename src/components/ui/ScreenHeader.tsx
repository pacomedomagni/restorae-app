import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { spacing } from '../../theme';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  compact?: boolean;
  style?: ViewStyle;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  compact = false,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      {eyebrow ? (
        <Text variant="labelSmall" color="inkFaint" align={align} style={styles.eyebrow}>
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="displayMedium" color="ink" align={align}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyLarge" color="inkMuted" align={align} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
  },
  compact: {
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  eyebrow: {
    marginBottom: spacing[2],
  },
  subtitle: {
    marginTop: spacing[2],
  },
});
