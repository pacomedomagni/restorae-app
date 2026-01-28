/**
 * JournalScreen
 * 
 * Journaling hub with writing prompts, recent entries,
 * and mood tracking integration.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import { useJournal, JournalEntry as JournalEntryType } from '../contexts/JournalContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  Button,
  ScreenHeader,
  TabSafeScrollView,
  SkeletonJournalEntry,
  EmptyState,
} from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList, MoodType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROMPT_CARD_WIDTH = SCREEN_WIDTH - layout.screenPaddingHorizontal * 2 - spacing[8];

// =============================================================================
// TYPES & DATA
// =============================================================================

interface JournalPrompt {
  id: string;
  text: string;
  category: 'gratitude' | 'reflection' | 'growth' | 'release';
}

const PROMPTS: JournalPrompt[] = [
  { id: '1', text: 'What small moment brought you joy today?', category: 'gratitude' },
  { id: '2', text: 'What would you tell your younger self?', category: 'reflection' },
  { id: '3', text: 'What are you ready to let go of?', category: 'release' },
  { id: '4', text: 'What is one thing you\'re proud of this week?', category: 'growth' },
  { id: '5', text: 'Describe your ideal peaceful moment.', category: 'reflection' },
];

// Helper to format date for display
const formatEntryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Helper to get word count from content
const getWordCount = (content: string): number => {
  return content.trim().split(/\s+/).filter(Boolean).length;
};

// Helper to get preview from content
const getPreview = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

// =============================================================================
// PROMPT CARD (Horizontal Scroll)
// =============================================================================
interface PromptCardProps {
  prompt: JournalPrompt;
  index: number;
  onPress: () => void;
}

function PromptCard({ prompt, index, onPress }: PromptCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const categoryColors = {
    gratitude: colors.accentWarm,
    reflection: colors.accentPrimary,
    growth: colors.accentCalm,
    release: colors.accentCalm,
  };

  const color = categoryColors[prompt.category];

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.delay(150 + index * 50)
              .duration(300)
              .easing(Easing.out(Easing.ease))
      }
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={[styles.promptCard, animatedStyle]}>
          <GlassCard variant="elevated" padding="lg" glow={prompt.category === 'gratitude' ? 'warm' : 'primary'}>
            <View
              style={[
                styles.promptCategoryBadge,
                { backgroundColor: withAlpha(color, 0.15) },
              ]}
            >
              <Text variant="labelSmall" style={{ color, textTransform: 'capitalize' }}>
                {prompt.category}
              </Text>
            </View>
            <Text variant="headlineMedium" color="ink" style={styles.promptText}>
              {prompt.text}
            </Text>
            <View style={styles.promptFooter}>
              <Text variant="labelSmall" style={{ color }}>
                Tap to write →
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// ENTRY CARD
// =============================================================================
interface EntryCardProps {
  entry: JournalEntryType;
  index: number;
  onPress: () => void;
}

function EntryCard({ entry, index, onPress }: EntryCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const moodColors: Record<MoodType, string> = {
    energized: colors.moodEnergized,
    calm: colors.moodCalm,
    good: colors.moodGood,
    anxious: colors.moodAnxious,
    low: colors.moodLow,
    tough: colors.moodTough,
  };

  const moodColor = entry.mood ? moodColors[entry.mood] : colors.inkFaint;

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.delay(500 + index * 80)
              .duration(400)
              .easing(Easing.out(Easing.ease))
      }
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Journal entry from ${formatEntryDate(entry.createdAt)}${entry.mood ? `, feeling ${entry.mood}` : ''}. ${getWordCount(entry.content)} words. ${getPreview(entry.content, 50)}`}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard variant="subtle" padding="md">
            <View style={styles.entryHeader}>
              <View style={styles.entryMeta}>
                {entry.mood && (
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: moodColor },
                    ]}
                  />
                )}
                <Text variant="labelSmall" color="inkMuted">
                  {formatEntryDate(entry.createdAt)}
                </Text>
              </View>
              <Text variant="labelSmall" color="inkFaint">
                {getWordCount(entry.content)} words
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              color="ink"
              numberOfLines={2}
              style={styles.entryPreview}
            >
              {getPreview(entry.content)}
            </Text>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// JOURNAL SCREEN
// =============================================================================
export function JournalScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium, impactLight } = useHaptics();
  const { entries, isLoading, syncWithServer } = useJournal();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get recent entries (limit to 3 for the main screen)
  const recentEntries = entries.slice(0, 3);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await impactLight();
    try {
      await syncWithServer();
    } catch (error) {
      // Silently handle sync errors
    }
    setIsRefreshing(false);
  };

  const handleNewEntry = async () => {
    await impactMedium();
    navigation.navigate('JournalEntry', { mode: 'new' });
  };

  const handlePromptPress = async (prompt: JournalPrompt) => {
    navigation.navigate('JournalEntry', { mode: 'prompt', prompt: prompt.text });
  };

  const handleEntryPress = (entry: JournalEntryType) => {
    navigation.navigate('JournalEntry', { 
      mode: 'view', 
      entryId: entry.id 
    });
  };

  const handleViewAll = () => {
    navigation.navigate('JournalEntries');
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="morning" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {/* Header */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(600)}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View>
                <Text variant="labelSmall" color="inkFaint" style={styles.eyebrow}>
                  PRIVATE REFLECTION
                </Text>
                <Text variant="displayMedium" color="ink">
                  Journal
                </Text>
                <Text variant="bodyLarge" color="inkMuted" style={styles.subtitle}>
                  Your thoughts, unjudged
                </Text>
              </View>
              <Pressable 
                onPress={() => navigation.navigate('JournalSearch')}
                style={[styles.searchButton, { backgroundColor: withAlpha(colors.accentPrimary, 0.12) }]}
                accessibilityRole="button"
                accessibilityLabel="Search journal entries"
              >
                <Text style={{ fontSize: 18 }}>🔍</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* New Entry CTA */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.ease))
            }
          >
            <GlassCard variant="hero" padding="lg" glow="warm">
              <View style={styles.newEntryContent}>
                <View style={styles.newEntryHeader}>
                  <View
                    style={[
                      styles.newEntryIcon,
                      { backgroundColor: withAlpha(colors.accentWarm, 0.15) },
                    ]}
                  >
                    <LuxeIcon name="journal" size={28} color={colors.accentWarm} />
                  </View>
                  <View style={styles.newEntryText}>
                    <Text variant="headlineLarge" color="ink">
                      Start writing
                    </Text>
                    <Text variant="bodyMedium" color="inkMuted">
                      Let your thoughts flow freely
                    </Text>
                  </View>
                </View>
                <Button
                  variant="glow"
                  size="lg"
                  tone="warm"
                  fullWidth
                  onPress={handleNewEntry}
                  style={styles.newEntryButton}
                >
                  New Entry
                </Button>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Prompts Section */}
          <View style={styles.section}>
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(200).duration(400)}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                WRITING PROMPTS
              </Text>
            </Animated.View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promptsContainer}
              decelerationRate="fast"
              snapToInterval={PROMPT_CARD_WIDTH + spacing[4]}
            >
              {PROMPTS.map((prompt, index) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  index={index}
                  onPress={() => handlePromptPress(prompt)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Recent Entries */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Animated.View
                entering={reduceMotion ? undefined : FadeIn.delay(200).duration(300)}
              >
                <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                  RECENT ENTRIES
                </Text>
              </Animated.View>
              
              <Pressable onPress={handleViewAll}>
                <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
                  View All
                </Text>
              </Pressable>
            </View>

            <View style={styles.entriesList}>
              {isLoading ? (
                // Loading skeletons
                <>
                  <SkeletonJournalEntry />
                  <SkeletonJournalEntry />
                  <SkeletonJournalEntry />
                </>
              ) : recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    index={index}
                    onPress={() => handleEntryPress(entry)}
                  />
                ))
              ) : (
                <EmptyState
                  icon="journal"
                  title="No entries yet"
                  description="Start your first journal entry to begin your reflection journey"
                  action={
                    <Button
                      variant="primary"
                      size="md"
                      tone="warm"
                      onPress={handleNewEntry}
                    >
                      Write First Entry
                    </Button>
                  }
                />
              )}
            </View>
          </View>
        </TabSafeScrollView>
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
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    marginBottom: spacing[1],
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: spacing[2],
  },
  newEntryContent: {},
  newEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  newEntryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  newEntryText: {},
  newEntryButton: {
    marginTop: spacing[2],
  },
  section: {
    marginTop: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    letterSpacing: 2,
    marginBottom: spacing[4],
  },
  promptsContainer: {
    paddingRight: layout.screenPaddingHorizontal,
  },
  promptCard: {
    width: PROMPT_CARD_WIDTH,
    marginRight: spacing[4],
  },
  promptCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[3],
  },
  promptText: {
    marginBottom: spacing[4],
  },
  promptFooter: {},
  entriesList: {
    gap: spacing[3],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryPreview: {
    lineHeight: 22,
  },
  emptyState: {
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: spacing[2],
    maxWidth: 260,
  },
});

export default JournalScreen;
