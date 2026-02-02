/**
 * FavoriteButton Component
 * 
 * Animated heart/star button to add/remove favorites.
 * Shows satisfying feedback when toggled.
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useFavorites, FavoriteItem } from '../../hooks/useFavorites';
import { useSmartHaptics } from '../../hooks/useSmartHaptics';
import { spacing, withAlpha } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface FavoriteButtonProps {
  item: Omit<FavoriteItem, 'addedAt' | 'usageCount'>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'heart' | 'star' | 'pin';
  showBackground?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FavoriteButton({
  item,
  size = 'md',
  variant = 'heart',
  showBackground = false,
  onToggle,
}: FavoriteButtonProps) {
  const { colors, reduceMotion } = useTheme();
  const { isFavorite, toggleFavorite, canAddMore } = useFavorites();
  const { success, tap } = useSmartHaptics();

  const isActive = isFavorite(item.id);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const sizeMap = {
    sm: { button: 32, icon: 16 },
    md: { button: 40, icon: 20 },
    lg: { button: 48, icon: 24 },
  };

  const iconMap = {
    heart: { active: '❤️', inactive: '🤍' },
    star: { active: '⭐', inactive: '☆' },
    pin: { active: '📌', inactive: '📍' },
  };

  const dimensions = sizeMap[size];
  const icons = iconMap[variant];

  const handlePress = async () => {
    // Check if we can add more (only matters when trying to add)
    if (!isActive && !canAddMore) {
      await tap();
      // Could show a toast here saying "Max favorites reached"
      return;
    }

    // Animate
    if (!reduceMotion) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      
      if (!isActive) {
        rotate.value = withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
      }
    }

    // Toggle and provide haptic
    const result = await toggleFavorite(item);
    if (result.success) {
      if (!isActive) {
        await success();
      } else {
        await tap();
      }
      onToggle?.(!isActive);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.button,
        {
          width: dimensions.button,
          height: dimensions.button,
          borderRadius: dimensions.button / 2,
        },
        showBackground && {
          backgroundColor: withAlpha(isActive ? colors.accentWarm : colors.ink, 0.08),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isActive ? 'Remove from favorites' : 'Add to favorites'}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.Text style={[{ fontSize: dimensions.icon }, animatedStyle]}>
        {isActive ? icons.active : icons.inactive}
      </Animated.Text>
    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FavoriteButton;
