/**
 * MoodContext
 * 
 * Manages mood tracking history, streaks, and analytics
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================
export interface MoodEntry {
  id: string;
  mood: MoodType;
  note?: string;
  timestamp: string; // ISO string
  context?: 'morning' | 'midday' | 'evening' | 'manual';
}

export interface MoodStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  weeklyEntries: number;
  monthlyEntries: number;
  moodDistribution: Record<MoodType, number>;
  averageMoodsPerDay: number;
  lastSevenDays: MoodEntry[];
  mostCommonMood: MoodType | null;
  moodTrend: 'improving' | 'stable' | 'declining' | 'insufficient';
}

export interface WeeklyGoal {
  targetDays: number;
  completedDays: number;
  currentWeekStart: string;
}

interface MoodState {
  entries: MoodEntry[];
  isLoading: boolean;
  stats: MoodStats;
  weeklyGoal: WeeklyGoal;
}

interface MoodContextType extends MoodState {
  addMoodEntry: (mood: MoodType, note?: string, context?: MoodEntry['context']) => Promise<MoodEntry>;
  updateMoodEntry: (id: string, updates: Partial<MoodEntry>) => Promise<void>;
  deleteMoodEntry: (id: string) => Promise<void>;
  clearAllEntries: () => Promise<void>;
  getEntriesForDate: (date: Date) => MoodEntry[];
  getEntriesForRange: (start: Date, end: Date) => MoodEntry[];
  setWeeklyGoalTarget: (days: number) => Promise<void>;
  refreshStats: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/mood_entries';
const GOAL_KEY = '@restorae/weekly_goal';

const DEFAULT_STATS: MoodStats = {
  totalEntries: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyEntries: 0,
  monthlyEntries: 0,
  moodDistribution: {
    energized: 0,
    calm: 0,
    good: 0,
    anxious: 0,
    low: 0,
    tough: 0,
  },
  averageMoodsPerDay: 0,
  lastSevenDays: [],
  mostCommonMood: null,
  moodTrend: 'insufficient',
};

const DEFAULT_GOAL: WeeklyGoal = {
  targetDays: 7,
  completedDays: 0,
  currentWeekStart: getWeekStart(new Date()).toISOString(),
};

// =============================================================================
// HELPERS
// =============================================================================
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getDaysBetween(d1: Date, d2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
}

function calculateStreak(entries: MoodEntry[]): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 };

  // Sort by date descending
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Get unique days with entries
  const uniqueDays = new Set<string>();
  sorted.forEach(e => {
    const d = new Date(e.timestamp);
    uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  const daysArray = Array.from(uniqueDays).sort().reverse();
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  // Check if there's an entry today or yesterday
  if (daysArray[0] === todayKey || daysArray[0] === yesterdayKey) {
    currentStreak = 1;
    for (let i = 1; i < daysArray.length; i++) {
      const prevDate = new Date(daysArray[i - 1].replace(/-/g, '/'));
      const currDate = new Date(daysArray[i].replace(/-/g, '/'));
      const diff = getDaysBetween(prevDate, currDate);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = currentStreak;
  let tempStreak = 1;

  for (let i = 1; i < daysArray.length; i++) {
    const prevDate = new Date(daysArray[i - 1].replace(/-/g, '/'));
    const currDate = new Date(daysArray[i].replace(/-/g, '/'));
    const diff = getDaysBetween(prevDate, currDate);
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

function calculateMoodTrend(entries: MoodEntry[]): MoodStats['moodTrend'] {
  if (entries.length < 5) return 'insufficient';

  const moodScores: Record<MoodType, number> = {
    energized: 4,
    good: 4,
    calm: 3,
    anxious: 2,
    low: 1,
    tough: 1,
  };

  // Get last 14 days
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const recentEntries = entries.filter(e => new Date(e.timestamp) >= twoWeeksAgo);
  if (recentEntries.length < 4) return 'insufficient';

  // Split into two halves
  const midpoint = Math.floor(recentEntries.length / 2);
  const firstHalf = recentEntries.slice(midpoint);
  const secondHalf = recentEntries.slice(0, midpoint);

  const avgFirst = firstHalf.reduce((sum, e) => sum + moodScores[e.mood], 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, e) => sum + moodScores[e.mood], 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

// =============================================================================
// CONTEXT
// =============================================================================
const MoodContext = createContext<MoodContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function MoodProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>(DEFAULT_GOAL);

  // Load entries on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, goalData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(GOAL_KEY),
      ]);

      if (entriesData) {
        setEntries(JSON.parse(entriesData));
      }

      if (goalData) {
        const goal = JSON.parse(goalData) as WeeklyGoal;
        // Check if we need to reset for new week
        const currentWeekStart = getWeekStart(new Date()).toISOString();
        if (goal.currentWeekStart !== currentWeekStart) {
          const newGoal = { ...goal, completedDays: 0, currentWeekStart };
          setWeeklyGoal(newGoal);
          await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
        } else {
          setWeeklyGoal(goal);
        }
      }
    } catch (error) {
      console.error('Failed to load mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (newEntries: MoodEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save mood entries:', error);
    }
  };

  // Calculate stats
  const stats = useMemo((): MoodStats => {
    if (entries.length === 0) return DEFAULT_STATS;

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const weeklyEntries = entries.filter(e => new Date(e.timestamp) >= weekAgo);
    const monthlyEntries = entries.filter(e => new Date(e.timestamp) >= monthAgo);
    const lastSevenDays = weeklyEntries.slice(0, 20); // Last entries from 7 days

    // Mood distribution
    const moodDistribution: Record<MoodType, number> = {
      energized: 0,
      calm: 0,
      good: 0,
      anxious: 0,
      low: 0,
      tough: 0,
    };
    entries.forEach(e => {
      moodDistribution[e.mood]++;
    });

    // Most common mood
    let mostCommonMood: MoodType | null = null;
    let maxCount = 0;
    (Object.keys(moodDistribution) as MoodType[]).forEach(mood => {
      if (moodDistribution[mood] > maxCount) {
        maxCount = moodDistribution[mood];
        mostCommonMood = mood;
      }
    });

    // Average per day (last 30 days)
    const uniqueDays = new Set<string>();
    monthlyEntries.forEach(e => {
      const d = new Date(e.timestamp);
      uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    const averageMoodsPerDay = uniqueDays.size > 0 
      ? monthlyEntries.length / uniqueDays.size 
      : 0;

    const { current: currentStreak, longest: longestStreak } = calculateStreak(entries);
    const moodTrend = calculateMoodTrend(entries);

    return {
      totalEntries: entries.length,
      currentStreak,
      longestStreak,
      weeklyEntries: weeklyEntries.length,
      monthlyEntries: monthlyEntries.length,
      moodDistribution,
      averageMoodsPerDay: Math.round(averageMoodsPerDay * 10) / 10,
      lastSevenDays,
      mostCommonMood,
      moodTrend,
    };
  }, [entries]);

  // Update weekly goal completion
  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    const uniqueDaysThisWeek = new Set<string>();
    
    entries.forEach(e => {
      const entryDate = new Date(e.timestamp);
      if (entryDate >= weekStart) {
        uniqueDaysThisWeek.add(`${entryDate.getFullYear()}-${entryDate.getMonth()}-${entryDate.getDate()}`);
      }
    });

    const completedDays = uniqueDaysThisWeek.size;
    if (completedDays !== weeklyGoal.completedDays) {
      const newGoal = { ...weeklyGoal, completedDays };
      setWeeklyGoal(newGoal);
      AsyncStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
    }
  }, [entries, weeklyGoal.completedDays]);

  const addMoodEntry = useCallback(async (
    mood: MoodType,
    note?: string,
    context: MoodEntry['context'] = 'manual'
  ): Promise<MoodEntry> => {
    const entry: MoodEntry = {
      id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mood,
      note,
      timestamp: new Date().toISOString(),
      context,
    };

    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    await saveEntries(newEntries);
    return entry;
  }, [entries]);

  const updateMoodEntry = useCallback(async (id: string, updates: Partial<MoodEntry>) => {
    const newEntries = entries.map(e =>
      e.id === id ? { ...e, ...updates } : e
    );
    setEntries(newEntries);
    await saveEntries(newEntries);
  }, [entries]);

  const deleteMoodEntry = useCallback(async (id: string) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    await saveEntries(newEntries);
  }, [entries]);

  const clearAllEntries = useCallback(async () => {
    setEntries([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const getEntriesForDate = useCallback((date: Date): MoodEntry[] => {
    return entries.filter(e => isSameDay(new Date(e.timestamp), date));
  }, [entries]);

  const getEntriesForRange = useCallback((start: Date, end: Date): MoodEntry[] => {
    return entries.filter(e => {
      const entryDate = new Date(e.timestamp);
      return entryDate >= start && entryDate <= end;
    });
  }, [entries]);

  const setWeeklyGoalTarget = useCallback(async (days: number) => {
    const newGoal = { ...weeklyGoal, targetDays: Math.min(7, Math.max(1, days)) };
    setWeeklyGoal(newGoal);
    await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
  }, [weeklyGoal]);

  const refreshStats = useCallback(() => {
    // Force re-calculation by triggering state update
    setEntries(prev => [...prev]);
  }, []);

  const value = useMemo(() => ({
    entries,
    isLoading,
    stats,
    weeklyGoal,
    addMoodEntry,
    updateMoodEntry,
    deleteMoodEntry,
    clearAllEntries,
    getEntriesForDate,
    getEntriesForRange,
    setWeeklyGoalTarget,
    refreshStats,
  }), [
    entries,
    isLoading,
    stats,
    weeklyGoal,
    addMoodEntry,
    updateMoodEntry,
    deleteMoodEntry,
    clearAllEntries,
    getEntriesForDate,
    getEntriesForRange,
    setWeeklyGoalTarget,
    refreshStats,
  ]);

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}

export default MoodContext;
