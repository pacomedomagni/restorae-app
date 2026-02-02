/**
 * Icon Component - Core
 * 
 * Unified icon wrapper for consistent sizing and styling.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color: string;
  style?: object;
}

const sizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({ name, size = 'md', color, style }: IconProps) {
  return (
    <Ionicons
      name={name}
      size={sizes[size]}
      color={color}
      style={style}
    />
  );
}

// Common icon presets
export const icons = {
  // Navigation
  back: 'chevron-back' as IconName,
  forward: 'chevron-forward' as IconName,
  close: 'close' as IconName,
  menu: 'menu' as IconName,

  // Actions
  add: 'add' as IconName,
  edit: 'pencil' as IconName,
  delete: 'trash-outline' as IconName,
  share: 'share-outline' as IconName,
  search: 'search' as IconName,

  // Tabs
  home: 'home' as IconName,
  homeOutline: 'home-outline' as IconName,
  journey: 'analytics' as IconName,
  journeyOutline: 'analytics-outline' as IconName,
  library: 'grid' as IconName,
  libraryOutline: 'grid-outline' as IconName,
  profile: 'person' as IconName,
  profileOutline: 'person-outline' as IconName,

  // Features
  breathe: 'leaf' as IconName,
  ground: 'earth' as IconName,
  focus: 'eye' as IconName,
  journal: 'book' as IconName,
  sleep: 'moon' as IconName,
  sos: 'alert-circle' as IconName,

  // Mood
  moodCalm: 'water' as IconName,
  moodGood: 'sunny' as IconName,
  moodAnxious: 'cloud' as IconName,
  moodLow: 'rainy' as IconName,

  // Status
  check: 'checkmark-circle' as IconName,
  warning: 'warning' as IconName,
  error: 'alert-circle' as IconName,
  info: 'information-circle' as IconName,

  // Settings
  settings: 'settings-outline' as IconName,
  appearance: 'color-palette-outline' as IconName,
  sound: 'volume-high-outline' as IconName,
  notifications: 'notifications-outline' as IconName,
  lock: 'lock-closed-outline' as IconName,
  privacy: 'shield-outline' as IconName,
  help: 'help-circle-outline' as IconName,
};
