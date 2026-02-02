/**
 * JournalEntriesScreen - All Journal Entries
 * 
 * Displays full list of journal entries with swipe-to-delete.
 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useJournal, JournalEntry } from '../contexts/JournalContext';
import { useHaptics } from '../hooks/useHaptics';
import { 
  Text, 
  Button, 
  GlassCard, 
  AmbientBackground, 
  ScreenHeader,
  PremiumEmptyState,
  SkeletonJournalEntry,
} from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
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

// =============================================================================
// SWIPEABLE ENTRY CARD
// =============================================================================
interface SwipeableEntryProps {
  entry: JournalEntry;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}

function SwipeableEntryCard({ entry, index, onPress, onDelete }: SwipeableEntryProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactMedium, notificationError } = useHaptics();
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);
  
  const DELETE_THRESHOLD = -80;
  const SNAP_POINT = -70;

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {
          translateX.value = withSpring(0);
        }},
        { text: 'Delete', style: 'destructive', onPress: () => {
          isDeleting.value = true;
          onDelete();
        }},
      ]
    );
  }, [onDelete, translateX, isDeleting]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow swipe left (negative values)
      translateX.value = Math.min(0, Math.max(-120, event.translationX));
      
      // Haptic feedback when crossing delete threshold
      if (translateX.value < DELETE_THRESHOLD && event.translationX < translateX.value) {
        runOnJS(impactMedium)();
      }
    })
    .onEnd((event) => {
      if (translateX.value < DELETE_THRESHOLD) {
        // Trigger delete confirmation
        translateX.value = withSpring(SNAP_POINT);
        runOnJS(notificationError)();
        runOnJS(confirmDelete)();
      } else if (translateX.value < -20) {
        // Snap to reveal delete button
        translateX.value = withSpring(SNAP_POINT);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedDeleteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -40, -70], [0, 0.5, 1]),
    transform: [{ scale: interpolate(translateX.value, [-40, -70], [0.8, 1]) }],
  }));

  return (
    <Animated.View 
      entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 60).duration(400)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={styles.swipeableContainer}
    >
      {/* Delete background */}
      <Animated.View style={[styles.deleteAction, animatedDeleteStyle]}>
        <View style={[styles.deleteButton, { backgroundColor: colors.error || '#FF4444' }]}>
          <Text variant="labelMedium" color="inkInverse">Delete</Text>
        </View>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedCardStyle}>
          <Pressable 
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${entry.title || 'Untitled Entry'}. ${formatDate(new Date(entry.createdAt))}`}
            accessibilityHint="Opens this journal entry. Swipe left to delete."
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
      </GestureDetector>
    </Animated.View>
  );
}

export function JournalEntriesScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { entries, isLoading, deleteEntry } = useJournal();

  const hasEntries = entries.length > 0;

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    try {
      await deleteEntry(entryId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete entry. Please try again.');
    }
  }, [deleteEntry]);

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
              <PremiumEmptyState
                variant="journal"
                title="Your story starts here"
                subtitle="Capture your thoughts, reflections, and moments of gratitude in your private journal."
                actionLabel="Write your first entry"
                onAction={() => navigation.navigate('JournalEntry', { mode: 'new' })}
              />
            </Animated.View>
          )}

          {/* Entries List with swipe-to-delete */}
          {!isLoading && hasEntries && (
            <>
              {entries.map((entry, index) => (
                <SwipeableEntryCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onPress={() => navigation.navigate('JournalEntry', { mode: 'view', entryId: entry.id })}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
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
  // Swipeable entry styles
  swipeableContainer: {
    position: 'relative',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing[2],
  },
  deleteButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
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
