/**
 * MoodHistoryScreen
 * 
 * View mood tracking history with trends and insights
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { useMood, MoodEntry } from '../contexts/MoodContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  ScreenHeader,
  MoodOrb,
} from '../components/ui';
import { spacing, layout, borderRadius, withAlpha } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { MoodType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// MOOD INFO
// =============================================================================
const MOOD_INFO: Record<MoodType, { label: string; color: string; icon: string }> = {
  energized: { label: 'Energized', color: '#FFB347', icon: '⚡' },
  calm: { label: 'Calm', color: '#7DD3C0', icon: '🌊' },
  good: { label: 'Good', color: '#98D8AA', icon: '😊' },
  anxious: { label: 'Anxious', color: '#E8A87C', icon: '😰' },
  low: { label: 'Low', color: '#9B8AA8', icon: '😔' },
  tough: { label: 'Tough', color: '#C38D9E', icon: '💪' },
};

// =============================================================================
// TREND INDICATOR
// =============================================================================
function TrendIndicator({ trend }: { trend: string }) {
  const { colors } = useTheme();
  
  const trendConfig = {
    improving: { icon: '📈', label: 'Improving', color: colors.accentCalm },
    stable: { icon: '➡️', label: 'Stable', color: colors.inkMuted },
    declining: { icon: '📉', label: 'Needs attention', color: colors.accentWarm },
    insufficient: { icon: '📊', label: 'Keep tracking', color: colors.inkFaint },
  };
  
  const config = trendConfig[trend as keyof typeof trendConfig] || trendConfig.insufficient;

  return (
    <View style={[styles.trendBadge, { backgroundColor: withAlpha(config.color, 0.15) }]}>
      <Text style={[styles.trendIcon, { color: config.color }]}>{config.icon}</Text>
      <Text variant="labelSmall" color="ink">
        {config.label}
      </Text>
    </View>
  );
}

// =============================================================================
// MOOD DISTRIBUTION BAR
// =============================================================================
function MoodDistributionBar({ distribution, total }: { distribution: Record<MoodType, number>; total: number }) {
  const { colors } = useTheme();
  
  if (total === 0) return null;

  const moods = Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.distributionContainer}>
      <View style={[styles.distributionBar, { backgroundColor: withAlpha(colors.ink, 0.1) }]}>
        {moods.map(([mood, count], index) => (
          <View
            key={mood}
            style={[
              styles.distributionSegment,
              {
                backgroundColor: MOOD_INFO[mood as MoodType].color,
                width: `${(count / total) * 100}%`,
                borderTopLeftRadius: index === 0 ? borderRadius.full : 0,
                borderBottomLeftRadius: index === 0 ? borderRadius.full : 0,
                borderTopRightRadius: index === moods.length - 1 ? borderRadius.full : 0,
                borderBottomRightRadius: index === moods.length - 1 ? borderRadius.full : 0,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.distributionLegend}>
        {moods.slice(0, 4).map(([mood, count]) => (
          <View key={mood} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MOOD_INFO[mood as MoodType].color }]} />
            <Text variant="labelSmall" color="inkMuted">
              {MOOD_INFO[mood as MoodType].label} ({Math.round((count / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// WEEK CALENDAR
// =============================================================================
function WeekCalendar({ entries }: { entries: MoodEntry[] }) {
  const { colors, reduceMotion } = useTheme();
  
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayEntries = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        return (
          entryDate.getFullYear() === date.getFullYear() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getDate() === date.getDate()
        );
      });

      // Get dominant mood of the day
      let dominantMood: MoodType | null = null;
      if (dayEntries.length > 0) {
        const moodCounts: Record<string, number> = {};
        dayEntries.forEach(e => {
          moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        });
        dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0] as MoodType;
      }

      result.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        dayNum: date.getDate(),
        isToday: i === 0,
        mood: dominantMood,
        entryCount: dayEntries.length,
      });
    }
    
    return result;
  }, [entries]);

  return (
    <View style={styles.weekContainer}>
      {days.map((day, index) => (
        <Animated.View
          key={day.date.toISOString()}
          entering={reduceMotion ? undefined : FadeInUp.delay(index * 50).duration(300)}
          style={styles.dayColumn}
        >
          <Text variant="labelSmall" color="inkFaint">
            {day.dayName}
          </Text>
          <View
            style={[
              styles.dayCircle,
              day.isToday && styles.todayCircle,
              day.mood && { backgroundColor: withAlpha(MOOD_INFO[day.mood].color, 0.3) },
              !day.mood && { backgroundColor: withAlpha(colors.ink, 0.05) },
            ]}
          >
            {day.mood ? (
              <Text style={styles.dayMoodIcon}>{MOOD_INFO[day.mood].icon}</Text>
            ) : (
              <Text variant="labelSmall" color={day.isToday ? 'accent' : 'inkFaint'}>
                {day.dayNum}
              </Text>
            )}
          </View>
          {day.entryCount > 1 && (
            <Text variant="labelSmall" color="inkFaint" style={styles.entryCount}>
              +{day.entryCount - 1}
            </Text>
          )}
        </Animated.View>
      ))}
    </View>
  );
}

// =============================================================================
// MOOD ENTRY CARD
// =============================================================================
function MoodEntryCard({ entry, index }: { entry: MoodEntry; index: number }) {
  const { colors, reduceMotion } = useTheme();
  const mood = MOOD_INFO[entry.mood];
  const date = new Date(entry.timestamp);

  return (
    <Animated.View
      entering={reduceMotion ? undefined : SlideInRight.delay(index * 50).duration(300)}
    >
      <GlassCard variant="subtle" padding="md" style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryMood}>
            <View style={[styles.entryMoodIcon, { backgroundColor: withAlpha(mood.color, 0.2) }]}>
              <Text style={styles.moodEmoji}>{mood.icon}</Text>
            </View>
            <View>
              <Text variant="labelMedium" color="ink">{mood.label}</Text>
              <Text variant="labelSmall" color="inkFaint">
                {date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          {entry.context && (
            <View style={[styles.contextBadge, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
              <Text variant="labelSmall" color="accent">
                {entry.context}
              </Text>
            </View>
          )}
        </View>
        {entry.note && (
          <Text variant="bodySmall" color="inkMuted" style={styles.entryNote}>
            "{entry.note}"
          </Text>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function MoodHistoryScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation();
  const { stats, entries, weeklyGoal } = useMood();
  const { impactLight } = useHaptics();

  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');

  const filteredEntries = useMemo(() => {
    const now = new Date();
    let cutoff: Date;

    switch (timeFilter) {
      case 'week':
        cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      default:
        return entries;
    }

    return entries.filter(e => new Date(e.timestamp) >= cutoff);
  }, [entries, timeFilter]);

  const weeklyProgress = weeklyGoal.targetDays > 0 
    ? weeklyGoal.completedDays / weeklyGoal.targetDays 
    : 0;

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(400)}>
            <ScreenHeader
              title="Mood History"
              subtitle="Track your emotional journey"
              showBack
              compact
            />
          </Animated.View>

          {/* Stats Overview */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
            <GlassCard variant="hero" padding="lg" glow="calm">
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" color="ink">{stats.currentStreak}</Text>
                  <Text variant="labelSmall" color="inkMuted">Day Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="displaySmall" color="ink">{stats.totalEntries}</Text>
                  <Text variant="labelSmall" color="inkMuted">Total Check-ins</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="displaySmall" color="ink">
                    {Math.round(weeklyProgress * 100)}%
                  </Text>
                  <Text variant="labelSmall" color="inkMuted">Weekly Goal</Text>
                </View>
              </View>
              
              <View style={styles.trendRow}>
                <Text variant="labelMedium" color="inkMuted">Your trend:</Text>
                <TrendIndicator trend={stats.moodTrend} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Week Overview */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              THIS WEEK
            </Text>
            <GlassCard variant="elevated" padding="lg">
              <WeekCalendar entries={entries} />
            </GlassCard>
          </Animated.View>

          {/* Mood Distribution */}
          {stats.totalEntries > 0 && (
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                MOOD DISTRIBUTION
              </Text>
              <GlassCard variant="subtle" padding="lg">
                <MoodDistributionBar 
                  distribution={stats.moodDistribution} 
                  total={stats.totalEntries} 
                />
              </GlassCard>
            </Animated.View>
          )}

          {/* Filter Tabs */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <View style={styles.filterRow}>
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                HISTORY
              </Text>
              <View style={styles.filterTabs}>
                {(['week', 'month', 'all'] as const).map(filter => (
                  <Pressable
                    key={filter}
                    onPress={async () => {
                      await impactLight();
                      setTimeFilter(filter);
                    }}
                    style={[
                      styles.filterTab,
                      timeFilter === filter && { backgroundColor: withAlpha(colors.accentPrimary, 0.15) },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      color={timeFilter === filter ? 'accent' : 'inkMuted'}
                    >
                      {filter === 'week' ? '7 Days' : filter === 'month' ? '30 Days' : 'All'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Entry List */}
          <View style={styles.entriesList}>
            {filteredEntries.length === 0 ? (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(400)}>
                <GlassCard variant="subtle" padding="xl">
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📝</Text>
                    <Text variant="headlineSmall" color="ink" align="center">
                      No entries yet
                    </Text>
                    <Text variant="bodyMedium" color="inkMuted" align="center">
                      Start tracking your mood to see your history here
                    </Text>
                  </View>
                </GlassCard>
              </Animated.View>
            ) : (
              filteredEntries.slice(0, 20).map((entry, index) => (
                <MoodEntryCard key={entry.id} entry={entry} index={index} />
              ))
            )}
          </View>

          <View style={{ height: layout.tabBarHeight + spacing[8] }} />
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
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    gap: spacing[2],
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  trendIcon: {
    fontSize: 14,
  },
  sectionLabel: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
    letterSpacing: 2,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing[2],
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 192, 0.5)',
  },
  dayMoodIcon: {
    fontSize: 18,
  },
  entryCount: {
    marginTop: -spacing[1],
  },
  distributionContainer: {
    gap: spacing[3],
  },
  distributionBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  distributionSegment: {
    height: '100%',
  },
  distributionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterTab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  entriesList: {
    gap: spacing[3],
  },
  entryCard: {
    gap: spacing[2],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  entryMoodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  contextBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  entryNote: {
    fontStyle: 'italic',
    marginTop: spacing[1],
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default MoodHistoryScreen;
