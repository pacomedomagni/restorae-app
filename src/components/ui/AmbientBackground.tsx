/**
 * Ambient Background
 * Clean, solid background that lets glassmorphic cards shine
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface AmbientBackgroundProps {
  /** Variant is kept for API compatibility but background is now solid */
  variant?: 'morning' | 'evening' | 'calm' | 'focus' | 'energize';
  intensity?: 'subtle' | 'normal' | 'vivid';
  animated?: boolean;
}

export function AmbientBackground({
  variant = 'calm',
  intensity = 'normal',
  animated = true,
}: AmbientBackgroundProps) {
  const { isDark } = useTheme();

  // Simple solid background - lets glass cards be the star
  const backgroundColor = isDark ? '#0F0F0F' : '#F5F5F5';

  return (
    <View 
      style={[styles.container, { backgroundColor }]} 
      pointerEvents="none" 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
