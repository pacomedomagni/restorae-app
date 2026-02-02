/**
 * Avatar Component - Core
 * 
 * User avatar with initials fallback.
 */
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from './Text';
import { withAlpha } from '../../theme/tokens';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  imageUrl?: string;
  colors: {
    actionPrimary: string;
    textInverse: string;
  };
}

const sizes = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const fontVariants = {
  sm: 'labelSmall' as const,
  md: 'labelMedium' as const,
  lg: 'headlineSmall' as const,
  xl: 'headlineMedium' as const,
};

export function Avatar({ size = 'md', name, imageUrl, colors }: AvatarProps) {
  const dimension = sizes[size];

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
        ]}
        accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: withAlpha(colors.actionPrimary, 0.15),
        },
      ]}
      accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
    >
      <Text
        variant={fontVariants[size]}
        style={{ color: colors.actionPrimary }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: '#E0E0E0',
  },
});
