/**
 * LibraryScreen - Content Discovery
 * 
 * Search-first, browse-second design for finding content.
 * 
 * Features:
 * - Search bar prominent at top
 * - Horizontal category rows
 * - Recently accessed section
 * - Favorites quick access
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';

import { Text } from '../../components/core/Text';
import { Card } from '../../components/core/Card';
import { EmptyState } from '../../components/core/EmptyState';
import { ContentCard } from '../../components/domain/ContentCard';

import { spacing, radius, withAlpha, layout } from '../../theme/tokens';
import { RootStackParamList } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ContentType = 'breathing' | 'meditation' | 'story' | 'soundscape' | 'tool';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration: string;
  isFavorite?: boolean;
  progress?: number;
  category: string;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  items: ContentItem[];
}

// =============================================================================
// MOCK DATA (Replace with real data from context/API)
// =============================================================================

const CATEGORIES: Category[] = [
  {
    id: 'breathing',
    title: 'Breathing',
    icon: 'leaf-outline',
    items: [
      {
        id: 'calm-breath',
        title: 'Calming Breaths',
        description: '4-7-8 breathing for relaxation',
        type: 'breathing',
        duration: '4 min',
        category: 'breathing',
      },
      {
        id: 'box-breathing',
        title: 'Box Breathing',
        description: 'Equal counts for balance',
        type: 'breathing',
        duration: '5 min',
        category: 'breathing',
      },
      {
        id: 'energizing-breath',
        title: 'Energizing Breath',
        description: 'Wake up your body and mind',
        type: 'breathing',
        duration: '3 min',
        category: 'breathing',
      },
      {
        id: 'sleep-breath',
        title: 'Sleep Preparation',
        description: 'Slow breathing for rest',
        type: 'breathing',
        duration: '6 min',
        category: 'breathing',
      },
    ],
  },
  {
    id: 'meditation',
    title: 'Meditation',
    icon: 'heart-outline',
    items: [
      {
        id: 'body-scan',
        title: 'Body Scan',
        description: 'Progressive relaxation',
        type: 'meditation',
        duration: '10 min',
        category: 'meditation',
      },
      {
        id: 'loving-kindness',
        title: 'Loving Kindness',
        description: 'Cultivate compassion',
        type: 'meditation',
        duration: '12 min',
        category: 'meditation',
      },
      {
        id: 'morning-intention',
        title: 'Morning Intention',
        description: 'Start your day mindfully',
        type: 'meditation',
        duration: '5 min',
        category: 'meditation',
      },
    ],
  },
  {
    id: 'stories',
    title: 'Sleep Stories',
    icon: 'moon-outline',
    items: [
      {
        id: 'forest-journey',
        title: 'Forest Journey',
        description: 'A peaceful walk through ancient woods',
        type: 'story',
        duration: '20 min',
        category: 'stories',
      },
      {
        id: 'ocean-drift',
        title: 'Ocean Drift',
        description: 'Float on gentle waves',
        type: 'story',
        duration: '25 min',
        category: 'stories',
      },
    ],
  },
  {
    id: 'soundscapes',
    title: 'Soundscapes',
    icon: 'musical-notes-outline',
    items: [
      {
        id: 'rain-sounds',
        title: 'Gentle Rain',
        description: 'Soft rainfall for focus',
        type: 'soundscape',
        duration: '∞',
        category: 'soundscapes',
      },
      {
        id: 'forest-ambient',
        title: 'Forest Ambience',
        description: 'Birds and rustling leaves',
        type: 'soundscape',
        duration: '∞',
        category: 'soundscapes',
      },
      {
        id: 'white-noise',
        title: 'White Noise',
        description: 'Pure focus enhancement',
        type: 'soundscape',
        duration: '∞',
        category: 'soundscapes',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Quick Tools',
    icon: 'flash-outline',
    items: [
      {
        id: 'one-minute-calm',
        title: 'One Minute Calm',
        description: 'Quick reset anywhere',
        type: 'tool',
        duration: '1 min',
        category: 'tools',
      },
      {
        id: 'grounding-54321',
        title: '5-4-3-2-1 Grounding',
        description: 'Sensory awareness exercise',
        type: 'tool',
        duration: '3 min',
        category: 'tools',
      },
    ],
  },
];

// =============================================================================
// SEARCH BAR COMPONENT
// =============================================================================

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  colors: any;
}

function SearchBar({ value, onChangeText, colors }: SearchBarProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: withAlpha(colors.surfaceElevated, 0.8) },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.textTertiary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search breathing, stories, tools..."
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textTertiary}
            />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// CATEGORY ROW COMPONENT
// =============================================================================

interface CategoryRowProps {
  category: Category;
  colors: any;
  isDark: boolean;
  onItemPress: (item: ContentItem) => void;
  index: number;
}

function CategoryRow({ category, colors, isDark, onItemPress, index }: CategoryRowProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(300)}
      style={styles.categoryContainer}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Ionicons
            name={category.icon as any}
            size={18}
            color={colors.actionPrimary}
          />
          <Text
            variant="titleMedium"
            style={{ color: colors.textPrimary, marginLeft: spacing.sm }}
          >
            {category.title}
          </Text>
        </View>
        <Pressable hitSlop={8}>
          <Text variant="labelMedium" style={{ color: colors.actionPrimary }}>
            See all
          </Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={category.items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item, index: itemIndex }) => (
          <Animated.View
            entering={FadeInRight.delay(itemIndex * 30).duration(200)}
          >
            <ContentCard
              item={item}
              colors={colors}
              isDark={isDark}
              onPress={() => onItemPress(item)}
              size="md"
            />
          </Animated.View>
        )}
      />
    </Animated.View>
  );
}

// =============================================================================
// SEARCH RESULTS COMPONENT
// =============================================================================

interface SearchResultsProps {
  results: ContentItem[];
  colors: any;
  isDark: boolean;
  onItemPress: (item: ContentItem) => void;
}

function SearchResults({ results, colors, isDark, onItemPress }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="No results found"
        description="Try a different search term or browse categories below."
        colors={colors}
      />
    );
  }

  return (
    <View style={styles.searchResults}>
      <Text
        variant="labelSmall"
        style={{ color: colors.textTertiary, marginBottom: spacing.md }}
      >
        {results.length} RESULT{results.length !== 1 ? 'S' : ''}
      </Text>
      {results.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(index * 30).duration(200)}
          layout={Layout}
        >
          <ContentCard
            item={item}
            colors={colors}
            isDark={isDark}
            onPress={() => onItemPress(item)}
            size="lg"
            showDescription
          />
        </Animated.View>
      ))}
    </View>
  );
}

// =============================================================================
// LIBRARY SCREEN
// =============================================================================

export function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const allItems = CATEGORIES.flatMap((cat) => cat.items);

    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleItemPress = useCallback(
    async (item: ContentItem) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      navigation.navigate('Session', {
        type: item.type,
        id: item.id,
      } as any);
    },
    [navigation]
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Text variant="headlineLarge" style={{ color: colors.textPrimary }}>
              Library
            </Text>
          </Animated.View>

          {/* Search */}
          <View style={styles.searchSection}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              colors={colors}
            />
          </View>

          {/* Content */}
          {isSearching ? (
            <SearchResults
              results={searchResults}
              colors={colors}
              isDark={isDark}
              onItemPress={handleItemPress}
            />
          ) : (
            <>
              {/* Recently Accessed (placeholder) */}
              <Animated.View
                entering={FadeInDown.delay(50).duration(300)}
                style={styles.quickAccessSection}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: colors.textTertiary, marginBottom: spacing.sm }}
                >
                  QUICK ACCESS
                </Text>
                <View style={styles.quickAccessRow}>
                  {['One Minute Calm', 'Box Breathing', 'Body Scan'].map(
                    (title, index) => (
                      <Pressable
                        key={title}
                        style={[
                          styles.quickAccessChip,
                          { backgroundColor: withAlpha(colors.actionPrimary, 0.1) },
                        ]}
                        onPress={() => {
                          const item = CATEGORIES.flatMap((c) => c.items).find(
                            (i) => i.title === title
                          );
                          if (item) handleItemPress(item);
                        }}
                      >
                        <Text
                          variant="labelMedium"
                          style={{ color: colors.actionPrimary }}
                        >
                          {title}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </Animated.View>

              {/* Categories */}
              {CATEGORIES.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  colors={colors}
                  isDark={isDark}
                  onItemPress={handleItemPress}
                  index={index}
                />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  searchSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Regular',
    paddingVertical: spacing.xs,
  },
  quickAccessSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
  },
  quickAccessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAccessChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  categoryContainer: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.md,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryList: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing.md,
  },
  searchResults: {
    paddingHorizontal: layout.screenPadding,
  },
});

export default LibraryScreen;
