/**
 * JourneyScreen - Reflection & Timeline
 *
 * A gentle reflection space. Stats as subtle pills, not dashboards.
 * Unified timeline of moods, sessions, and journal entries.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useJourney, TimelineEntry as TimelineEntryData } from '../../contexts/JourneyContext';

import { Text, Button, GlassCard, ScreenHeader, AsyncErrorWrapper } from '../../components/ui';
import { Input } from '../../components/core/Input';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/core/EmptyState';
import { TimelineEntry } from '../../components/domain/TimelineEntry';
import { StatPill } from '../../components/domain/StatPill';

import { spacing, borderRadius, withAlpha, layout, MoodType } from '../../theme';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

// =============================================================================
// QUICK JOURNAL
// =============================================================================

function QuickJournal({ onSave }: { onSave: (content: string) => void }) {
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
          styles.journalCollapsed,
          { backgroundColor: withAlpha(colors.canvasElevated, 0.7) },
        ]}
      >
        <Ionicons name="create-outline" size={18} color={colors.inkMuted} />
        <Text variant="bodyMedium" color="inkMuted" style={styles.journalPrompt}>
          What's on your mind?
        </Text>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <GlassCard variant="subtle" padding="md">
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
            onPress={() => { setIsExpanded(false); setContent(''); }}
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
  const { colors } = useTheme();
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
        case 'today': return entryDate >= startOfToday;
        case 'week': return entryDate >= startOfWeek;
        case 'month': return entryDate >= startOfMonth;
        default: return true;
      }
    });
  }, [entries, filter]);

  const handleAddJournal = useCallback(
    async (content: string) => { await addJournalEntry(content); },
    [addJournalEntry],
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
    [colors],
  );

  const renderHeader = useCallback(() => (
    <View style={styles.headerContent}>
      <ScreenHeader variant="hero" title="Your Journey" />

      {/* Gentle Stats — simple pills, not a dashboard */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.statsRow}>
        <StatPill
          icon="play-circle-outline"
          label={`${weeklyStats.totalSessions} sessions`}
        />
        <StatPill
          icon="time-outline"
          label={`${weeklyStats.totalMinutes} min`}
        />
        {weeklyStats.streakDays > 0 && (
          <StatPill
            icon="calendar-outline"
            label={`${weeklyStats.streakDays} days active`}
          />
        )}
      </Animated.View>

      {/* Quick Journal */}
      <View style={styles.section}>
        <QuickJournal onSave={handleAddJournal} />
      </View>

      {/* Filter Chips — soft styling */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f.key
                    ? withAlpha(colors.accentPrimary, 0.12)
                    : 'transparent',
              },
            ]}
          >
            <Text
              variant="labelMedium"
              style={{
                color: filter === f.key ? colors.accentPrimary : colors.inkFaint,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Section label — sentence case */}
      <Text
        variant="labelSmall"
        color="inkFaint"
        style={styles.timelineLabel}
      >
        {filter === 'today' ? 'Today' : filter === 'week' ? 'This week' : filter === 'month' ? 'This month' : 'All entries'}
      </Text>
    </View>
  ), [weeklyStats, colors, filter, filters, handleAddJournal]);

  const renderEmpty = useCallback(() =>
    isLoading ? (
      <View style={{ gap: spacing[3] }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    ) : (
      <EmptyState
        icon="time-outline"
        title="Your journey starts here"
        description="Check in with your mood from the Sanctuary to begin building your timeline."
        colors={colors}
      />
    ),
    [colors, isLoading],
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  headerContent: {
    marginBottom: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  section: {
    marginBottom: spacing[4],
  },
  journalCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
  },
  journalPrompt: {
    marginLeft: spacing[2],
  },
  journalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterChip: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
  },
  timelineLabel: {
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
});

export default JourneyScreen;
