/**
 * JourneyScreen - Progress & Reflection
 * 
 * A unified timeline of your wellness journey - moods, sessions, and journal entries.
 * 
 * Features:
 * - Unified timeline (not separate tabs)
 * - Weekly stats at top
 * - Journal inline (not modal)
 * - Streak celebration
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useJourney, TimelineEntry as TimelineEntryData } from '../../contexts/JourneyContext';

import { Text, Button, GlassCard, AsyncErrorWrapper } from '../../components/ui';
import { Input } from '../../components/core/Input';
import { SkeletonCard, SkeletonText } from '../../components/ui/Skeleton';
import { ProgressRing } from '../../components/core/ProgressRing';
import { EmptyState } from '../../components/core/EmptyState';
import { TimelineEntry } from '../../components/domain/TimelineEntry';

import { spacing, radius, withAlpha, layout, moodLabels, MoodType } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface WeekDay {
  day: string;
  date: number;
  hasMood: boolean;
  mood?: MoodType;
  isToday: boolean;
}

// =============================================================================
// WEEKLY STATS COMPONENT
// =============================================================================

interface WeeklyStatsProps {
  weeklyStats: {
    sessionsCompleted: number;
    totalMinutes: number;
    currentStreak: number;
    moodEntries: number;
    dominantMood: MoodType | null;
  };
}

function WeeklyStats({ weeklyStats }: WeeklyStatsProps) {
  const { colors } = useTheme();
  const weeklyGoal = 7; // sessions per week
  const progress = Math.min(weeklyStats.sessionsCompleted / weeklyGoal, 1);

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <GlassCard variant="elevated" padding="lg">
        <View style={styles.statsHeader}>
          <Text variant="headlineSmall" color="ink">
            This Week
          </Text>
          {weeklyStats.currentStreak > 0 && (
            <View
              style={[
                styles.streakBadge,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
              ]}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.accentPrimary} />
              <Text
                variant="labelSmall"
                color="accent"
                style={{ marginLeft: 4 }}
              >
                {weeklyStats.currentStreak} days active
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.ringContainer}>
            <ProgressRing
              progress={progress}
              size={80}
              strokeWidth={8}
              colors={colors}
            />
            <View style={styles.ringLabel}>
              <Text variant="headlineSmall" color="ink">
                {weeklyStats.sessionsCompleted}
              </Text>
              <Text variant="labelSmall" color="inkFaint">
                of {weeklyGoal}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" color="ink">
                {weeklyStats.totalMinutes}
              </Text>
              <Text variant="labelSmall" color="inkFaint">
                minutes
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="headlineMedium" color="ink">
                {weeklyStats.moodEntries}
              </Text>
              <Text variant="labelSmall" color="inkFaint">
                check-ins
              </Text>
            </View>

            {weeklyStats.dominantMood && (
              <View style={styles.statItem}>
                <Text variant="headlineMedium" color="ink">
                  {moodLabels[weeklyStats.dominantMood].slice(0, 1).toUpperCase()}
                </Text>
                <Text variant="labelSmall" color="inkFaint">
                  top mood
                </Text>
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// QUICK JOURNAL COMPONENT
// =============================================================================

interface QuickJournalProps {
  onSave: (content: string) => void;
}

function QuickJournal({ onSave }: QuickJournalProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = useCallback(async () => {
    if (!content.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(content.trim());
    setContent('');
    setIsExpanded(false);
  }, [content, onSave]);

  if (!isExpanded) {
    return (
      <Pressable
        onPress={() => setIsExpanded(true)}
        style={[
          styles.quickJournalCollapsed,
          { backgroundColor: withAlpha(colors.canvasElevated, 0.8) },
        ]}
      >
        <Ionicons name="create-outline" size={20} color={colors.inkMuted} />
        <Text variant="bodyMedium" color="inkMuted" style={{ marginLeft: spacing.sm }}>
          What's on your mind?
        </Text>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <GlassCard variant="default" padding="md">
        <Input
          placeholder="Write your thoughts..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
          maxLength={500}
          showCharCount
          autoFocus
          colors={colors}
        />
        <View style={styles.journalActions}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setIsExpanded(false);
              setContent('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onPress={handleSave}
            disabled={!content.trim()}
          >
            Save
          </Button>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// JOURNEY SCREEN
// =============================================================================

export function JourneyScreen() {
  const { colors, isDark } = useTheme();
  const { entries, weeklyStats, addJournalEntry, isLoading, isError, refresh } = useJourney();

  const [filter, setFilter] = useState<TimeFilter>('week');

  const filteredTimeline = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return entries.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      switch (filter) {
        case 'today':
          return entryDate >= startOfToday;
        case 'week':
          return entryDate >= startOfWeek;
        case 'month':
          return entryDate >= startOfMonth;
        default:
          return true;
      }
    });
  }, [entries, filter]);

  const handleAddJournal = useCallback(
    async (content: string) => {
      await addJournalEntry(content);
    },
    [addJournalEntry]
  );

  const filters: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All' },
  ];

  const renderItem = useCallback(
    ({ item, index }: { item: TimelineEntryData; index: number }) => (
      <Animated.View
        entering={FadeInUp.delay(index * 50).duration(300)}
        layout={Layout}
      >
        <TimelineEntry entry={item} colors={colors} />
      </Animated.View>
    ),
    [colors]
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContent}>
        {/* Title */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.titleRow}>
          <Text variant="headlineLarge" color="ink">
            Your Journey
          </Text>
        </Animated.View>

        {/* Weekly Stats */}
        <View style={styles.section}>
          <WeeklyStats weeklyStats={weeklyStats} />
        </View>

        {/* Quick Journal */}
        <View style={styles.section}>
          <QuickJournal onSave={handleAddJournal} />
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    filter === f.key
                      ? colors.accentPrimary
                      : withAlpha(colors.canvasElevated, 0.5),
                },
              ]}
            >
              <Text
                variant="labelMedium"
                color={filter === f.key ? 'inkInverse' : 'inkMuted'}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timeline Header */}
        <Text
          variant="labelSmall"
          color="inkFaint"
          style={{
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
          }}
        >
          TIMELINE
        </Text>
      </View>
    ),
    [weeklyStats, colors, filter, filters, handleAddJournal]
  );

  const renderEmpty = useCallback(
    () =>
      isLoading ? (
        <View style={{ gap: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <EmptyState
          icon="time-outline"
          title="Your first moment of calm awaits"
          description="Check in with your mood from the Sanctuary to begin building your timeline."
          colors={colors}
        />
      ),
    [colors, isLoading]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AsyncErrorWrapper
          isError={isError}
          onRetry={refresh}
          errorTitle="Couldn't load your journey"
          errorDescription="We had trouble loading your data. Let's try again."
        >
          <FlatList
            data={filteredTimeline}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </AsyncErrorWrapper>
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
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  headerContent: {
    marginBottom: spacing.md,
  },
  titleRow: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  quickJournalCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  journalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  filterButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
});

export default JourneyScreen;
