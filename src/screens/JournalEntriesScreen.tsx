/**
 * JournalEntriesScreen - All Journal Entries
 * 
 * Displays full list of journal entries with proper empty state handling.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import { 
  Text, 
  Button, 
  GlassCard, 
  AmbientBackground, 
  ScreenHeader,
  EmptyState,
  SkeletonJournalEntry,
} from '../components/ui';
import { spacing, layout } from '../theme';
import type { RootStackParamList } from '../types';

// Map mood types to emoji
const MOOD_EMOJI: Record<string, string> = {
  energized: '⚡',
  calm: '😌',
  good: '😊',
  anxious: '😰',
  low: '😔',
  tough: '💪',
};

// Format date for display
function formatDate(date: Date): string {
  const now = new Date();
  const entryDate = new Date(date);
  const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${entryDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${entryDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return entryDate.toLocaleDateString([], { weekday: 'long' });
  } else {
    return entryDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function JournalEntriesScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { entries, isLoading } = useJournal();

  const hasEntries = entries.length > 0;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Journal Entries"
              subtitle={hasEntries ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : undefined}
              compact
            />
          </Animated.View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <SkeletonJournalEntry />
              <SkeletonJournalEntry />
              <SkeletonJournalEntry />
            </View>
          )}

          {/* Empty State */}
          {!isLoading && !hasEntries && (
            <Animated.View 
              entering={reduceMotion ? undefined : FadeIn.duration(400)}
              style={styles.emptyContainer}
            >
              <EmptyState
                icon="journal"
                title="No entries yet"
                description="Start journaling to capture your thoughts, reflections, and moments of gratitude."
                action={
                  <Button 
                    onPress={() => navigation.navigate('JournalEntry', { mode: 'new' })}
                    variant="primary"
                    size="md"
                  >
                    Write your first entry
                  </Button>
                }
              />
            </Animated.View>
          )}

          {/* Entries List */}
          {!isLoading && hasEntries && (
            <>
              {entries.map((entry, index) => (
                <Animated.View 
                  key={entry.id} 
                  entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
                >
                  <Pressable 
                    onPress={() => navigation.navigate('JournalEntry', { mode: 'view', entryId: entry.id })}
                  >
                    <GlassCard variant="interactive" padding="lg">
                      <View style={styles.entryHeader}>
                        <Text variant="headlineSmall" color="ink" numberOfLines={1} style={styles.title}>
                          {entry.title || 'Untitled Entry'}
                        </Text>
                        {entry.mood && (
                          <Text style={styles.mood}>{MOOD_EMOJI[entry.mood] || '📝'}</Text>
                        )}
                      </View>
                      <Text variant="bodyMedium" color="inkMuted" numberOfLines={2} style={styles.preview}>
                        {entry.content || 'No content'}
                      </Text>
                      <Text variant="labelSmall" color="inkFaint" style={styles.date}>
                        {formatDate(new Date(entry.createdAt))}
                      </Text>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              ))}

              {/* New Entry Button at bottom */}
              <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => navigation.navigate('JournalEntry', { mode: 'new' })}
                  style={styles.newButton}
                >
                  + New Entry
                </Button>
              </Animated.View>
            </>
          )}

          <View style={{ height: layout.tabBarHeight }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
    gap: spacing[3],
  },
  loadingContainer: {
    gap: spacing[3],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing[8],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginRight: spacing[2],
  },
  mood: {
    fontSize: 24,
  },
  preview: {
    marginTop: spacing[2],
  },
  date: {
    marginTop: spacing[3],
  },
  newButton: {
    marginTop: spacing[3],
    marginBottom: spacing[6],
  },
});
