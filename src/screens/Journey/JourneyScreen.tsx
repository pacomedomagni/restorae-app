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
import { useJourney, TimelineEntry } from '../../contexts/JourneyContext';

import { Text } from '../../components/core/Text';
import { Button } from '../../components/core/Button';
import { Card } from '../../components/core/Card';
import { Input } from '../../components/core/Input';
import { ProgressRing } from '../../components/core/ProgressRing';
import { EmptyState } from '../../components/core/EmptyState';
import { TimelineEntry } from '../../components/domain/TimelineEntry';

import { spacing, radius, withAlpha, layout, moodLabels, MoodType } from '../../theme/tokens';

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
  colors: any;
}

function WeeklyStats({ weeklyStats, colors }: WeeklyStatsProps) {
  const weeklyGoal = 7; // sessions per week
  const progress = Math.min(weeklyStats.sessionsCompleted / weeklyGoal, 1);

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Card variant="elevated" padding="lg" colors={colors}>
        <View style={styles.statsHeader}>
          <Text variant="headlineSmall" style={{ color: colors.textPrimary }}>
            This Week
          </Text>
          {weeklyStats.currentStreak > 0 && (
            <View
              style={[
                styles.streakBadge,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
              ]}
            >
              <Ionicons name="flame" size={14} color={colors.accentPrimary} />
              <Text
                variant="labelSmall"
                style={{ color: colors.accentPrimary, marginLeft: 4 }}
              >
                {weeklyStats.currentStreak} day streak
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
              <Text variant="headlineSmall" style={{ color: colors.textPrimary }}>
                {weeklyStats.sessionsCompleted}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.textTertiary }}>
                of {weeklyGoal}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: colors.textPrimary }}>
                {weeklyStats.totalMinutes}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.textTertiary }}>
                minutes
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: colors.textPrimary }}>
                {weeklyStats.moodEntries}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.textTertiary }}>
                check-ins
              </Text>
            </View>

            {weeklyStats.dominantMood && (
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: colors.textPrimary }}>
                  {moodLabels[weeklyStats.dominantMood].slice(0, 1).toUpperCase()}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.textTertiary }}>
                  top mood
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

// =============================================================================
// QUICK JOURNAL COMPONENT
// =============================================================================

interface QuickJournalProps {
  colors: any;
  onSave: (content: string) => void;
}

function QuickJournal({ colors, onSave }: QuickJournalProps) {
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
          { backgroundColor: withAlpha(colors.surfaceElevated, 0.8) },
        ]}
      >
        <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
          What's on your mind?
        </Text>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <Card variant="default" padding="md" colors={colors}>
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
            colors={colors}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onPress={handleSave}
            disabled={!content.trim()}
            colors={colors}
          >
            Save
          </Button>
        </View>
      </Card>
    </Animated.View>
  );
}

// =============================================================================
// JOURNEY SCREEN
// =============================================================================

export function JourneyScreen() {
  const { colors, isDark } = useTheme();
  const { timeline, weeklyStats, addJournalEntry } = useJourney();

  const [filter, setFilter] = useState<TimeFilter>('week');

  const filteredTimeline = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return timeline.filter((entry) => {
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
  }, [timeline, filter]);

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
    ({ item, index }: { item: TimelineEntry; index: number }) => (
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
          <Text variant="headlineLarge" style={{ color: colors.textPrimary }}>
            Your Journey
          </Text>
        </Animated.View>

        {/* Weekly Stats */}
        <View style={styles.section}>
          <WeeklyStats weeklyStats={weeklyStats} colors={colors} />
        </View>

        {/* Quick Journal */}
        <View style={styles.section}>
          <QuickJournal colors={colors} onSave={handleAddJournal} />
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
                      ? colors.actionPrimary
                      : withAlpha(colors.surfaceElevated, 0.5),
                },
              ]}
            >
              <Text
                variant="labelMedium"
                style={{
                  color: filter === f.key ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timeline Header */}
        <Text
          variant="labelSmall"
          style={{
            color: colors.textTertiary,
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
    () => (
      <EmptyState
        icon="time-outline"
        title="Your journey begins"
        description="Check in with your mood from the Sanctuary to start building your timeline."
        colors={colors}
      />
    ),
    [colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={filteredTimeline}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
