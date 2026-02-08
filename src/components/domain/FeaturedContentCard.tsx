/**
 * FeaturedContentCard - Full-width featured content card for Practice screen
 * Shows a prominent content item with title, description, and duration
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../ui/Text';
import { GlassCard } from '../ui/GlassCard';
import { spacing, withAlpha, borderRadius } from '../../theme';

interface FeaturedContentCardProps {
  title: string;
  description: string;
  duration: string;
  category?: string;
  onPress: () => void;
}

export function FeaturedContentCard({
  title,
  description,
  duration,
  category,
  onPress,
}: FeaturedContentCardProps) {
  const { colors } = useTheme();

  return (
    <GlassCard variant="elevated" padding="lg" onPress={onPress}>
      <Text variant="headlineMedium" color="ink">
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        color="inkMuted"
        style={styles.description}
        numberOfLines={2}
      >
        {description}
      </Text>
      <View style={styles.meta}>
        <View
          style={[
            styles.badge,
            { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={13}
            color={colors.accentPrimary}
          />
          <Text variant="labelSmall" color="accent">
            {duration}
          </Text>
        </View>
        {category && (
          <Text variant="labelSmall" color="inkFaint">
            {category}
          </Text>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  description: {
    marginTop: spacing[1],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
});
