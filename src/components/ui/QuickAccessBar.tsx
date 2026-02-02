/**
 * QuickAccessBar Component
 * 
 * Premium quick access bar for favorite/pinned tools.
 * Features:
 * - Up to 4 pinned tools
 * - Smooth animations
 * - Usage tracking
 * - Easy management
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInRight,
  Layout,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from './Text';
import { GlassCard } from './GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useFavorites, FavoriteItem } from '../../hooks/useFavorites';
import { useSmartHaptics } from '../../hooks/useSmartHaptics';
import { LuxeIcon } from '../LuxeIcon';
import type { LuxeIconName } from '../LuxeIcon';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { RootStackParamList } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface QuickAccessBarProps {
  /** Called when a quick action is pressed */
  onActionPress?: (item: FavoriteItem) => void;
}

// =============================================================================
// QUICK ACCESS ITEM
// =============================================================================

interface QuickAccessItemProps {
  item: FavoriteItem;
  index: number;
  onPress: () => void;
}

function QuickAccessItem({ item, index, onPress }: QuickAccessItemProps) {
  const { colors, reduceMotion } = useTheme();
  const { tap } = useSmartHaptics();
  const scale = useSharedValue(1);

  const iconMap: Record<string, LuxeIconName> = {
    breathing: 'breathe',
    grounding: 'ground',
    reset: 'reset',
    focus: 'focus',
    journal: 'journal',
    stories: 'stories',
    sos: 'sos',
  };

  const toneColors: Record<string, string> = {
    breathing: colors.accentPrimary,
    grounding: colors.accentWarm,
    reset: colors.accentCalm,
    focus: colors.accentPrimary,
    journal: '#A78BFA',
    stories: colors.accentCalm,
    sos: colors.accentWarm,
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await tap();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = iconMap[item.type] || 'focus';
  const toneColor = toneColors[item.type] || colors.accentPrimary;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInRight.delay(index * 50).duration(300)}
      layout={Layout.springify()}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Quick access: ${item.name}`}
      >
        <Animated.View style={[styles.itemContainer, animatedStyle]}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: withAlpha(toneColor, 0.12) },
            ]}
          >
            <LuxeIcon name={iconName} size={20} color={toneColor} />
          </View>
          <Text 
            variant="labelSmall" 
            color="inkMuted" 
            numberOfLines={1}
            style={styles.itemLabel}
          >
            {item.name}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyQuickAccess() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tap } = useSmartHaptics();

  const handlePress = async () => {
    await tap();
    // Navigate to main tabs which has Tools
    navigation.navigate('Main');
  };

  return (
    <Pressable onPress={handlePress} style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { borderColor: withAlpha(colors.ink, 0.1) }]}>
        <Text style={{ fontSize: 16 }}>+</Text>
      </View>
      <Text variant="labelSmall" color="inkFaint" style={styles.emptyText}>
        Pin your favorites
      </Text>
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function QuickAccessBar({ onActionPress }: QuickAccessBarProps) {
  const { colors, reduceMotion } = useTheme();
  const { favorites, isLoading, recordUsage } = useFavorites();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleItemPress = async (item: FavoriteItem) => {
    // Record usage for smart suggestions
    await recordUsage(item.id);
    
    // Callback if provided
    if (onActionPress) {
      onActionPress(item);
      return;
    }

    // Default navigation - use any for dynamic routing
    (navigation as any).navigate(item.route, item.routeParams);
  };

  // Don't show if loading or no favorites
  if (isLoading) {
    return null;
  }

  if (favorites.length === 0) {
    return (
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(400)}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
            QUICK ACCESS
          </Text>
        </View>
        <EmptyQuickAccess />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
          QUICK ACCESS
        </Text>
      </View>
      <View style={styles.itemsRow}>
        {favorites.map((item, index) => (
          <QuickAccessItem
            key={item.id}
            item={item}
            index={index}
            onPress={() => handleItemPress(item)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  header: {
    marginBottom: spacing[3],
  },
  sectionLabel: {
    letterSpacing: 1.5,
  },
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing[3],
  },
  itemContainer: {
    alignItems: 'center',
    minWidth: 64,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  itemLabel: {
    maxWidth: 64,
    textAlign: 'center',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  emptyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  emptyText: {
    opacity: 0.7,
  },
});

export default QuickAccessBar;
