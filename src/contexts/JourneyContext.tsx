/**
 * JourneyContext - Unified Progress & Journal State
 * 
 * Merges mood history, journal entries, and progress tracking
 * into a single timeline-based context.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodType } from '../../theme/tokens';

// =============================================================================
// TYPES
// =============================================================================

export type TimelineEntryType = 'mood' | 'session' | 'journal' | 'milestone';

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  timestamp: number;
  
  // Mood entry
  mood?: MoodType;
  moodNote?: string;
  
  // Session entry
  sessionType?: string;
  sessionName?: string;
  sessionDuration?: number;
  preSessionMood?: MoodType;
  postSessionMood?: MoodType;
  
  // Journal entry
  journalContent?: string;
  journalPrompt?: string;
  
  // Milestone entry
  milestoneType?: 'streak' | 'sessions' | 'first';
  milestoneValue?: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalMinutes: number;
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown';
  mostUsedTool: string | null;
  daysActive: number;
  streakDays: number;
}

interface JourneyState {
  // Timeline
  entries: TimelineEntry[];
  isLoading: boolean;
  
  // Stats
  weeklyStats: WeeklyStats;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  
  // Journal
  journalEntries: TimelineEntry[];
  
  // Filters
  activeFilter: TimelineEntryType | 'all';
}

interface JourneyContextType extends JourneyState {
  // Entry actions
  addMoodEntry: (mood: MoodType, note?: string) => Promise<void>;
  addSessionEntry: (session: {
    type: string;
    name: string;
    duration: number;
    preMood?: MoodType;
    postMood?: MoodType;
  }) => Promise<void>;
  addJournalEntry: (content: string, prompt?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  
  // Filters
  setFilter: (filter: TimelineEntryType | 'all') => void;
  
  // Refresh
  refresh: () => Promise<void>;
  
  // Computed
  filteredEntries: TimelineEntry[];
  todayEntries: TimelineEntry[];
  recentMoods: Array<{ mood: MoodType; timestamp: number }>;
}

const JourneyContext = createContext<JourneyContextType | null>(null);

const STORAGE_KEY = '@restorae/journey_data';

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateWeeklyStats(entries: TimelineEntry[]): WeeklyStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weekEntries = entries.filter(e => e.timestamp >= weekAgo.getTime());
  
  const sessions = weekEntries.filter(e => e.type === 'session');
  const moods = weekEntries.filter(e => e.type === 'mood');
  
  // Calculate mood trend
  let moodTrend: WeeklyStats['moodTrend'] = 'unknown';
  if (moods.length >= 3) {
    const moodValues: Record<MoodType, number> = {
      good: 4,
      calm: 3,
      anxious: 2,
      low: 1,
    };
    
    const recentMoods = moods.slice(0, Math.ceil(moods.length / 2));
    const olderMoods = moods.slice(Math.ceil(moods.length / 2));
    
    const recentAvg = recentMoods.reduce((sum, m) => sum + (moodValues[m.mood!] || 0), 0) / recentMoods.length;
    const olderAvg = olderMoods.reduce((sum, m) => sum + (moodValues[m.mood!] || 0), 0) / olderMoods.length;
    
    if (recentAvg > olderAvg + 0.3) moodTrend = 'improving';
    else if (recentAvg < olderAvg - 0.3) moodTrend = 'declining';
    else moodTrend = 'stable';
  }
  
  // Find most used tool
  const toolCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.sessionType) {
      toolCounts[s.sessionType] = (toolCounts[s.sessionType] || 0) + 1;
    }
  });
  const mostUsedTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Calculate days active
  const activeDays = new Set(
    weekEntries.map(e => new Date(e.timestamp).toDateString())
  ).size;
  
  return {
    startDate: weekAgo.toISOString(),
    endDate: now.toISOString(),
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + (s.sessionDuration || 0) / 60, 0),
    moodTrend,
    mostUsedTool,
    daysActive: activeDays,
    streakDays: 0, // Will be calculated from global state
  };
}

function calculateStreak(entries: TimelineEntry[]): { current: number; longest: number } {
  const sessionDates = [...new Set(
    entries
      .filter(e => e.type === 'session')
      .map(e => new Date(e.timestamp).toDateString())
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (sessionDates.length === 0) return { current: 0, longest: 0 };
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  // Check if streak is active (session today or yesterday)
  const hasRecentSession = sessionDates[0] === today || sessionDates[0] === yesterday;
  
  for (let i = 0; i < sessionDates.length - 1; i++) {
    const current = new Date(sessionDates[i]);
    const next = new Date(sessionDates[i + 1]);
    const diffDays = Math.floor((current.getTime() - next.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      if (i === 0 && hasRecentSession) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  // Final check
  if (hasRecentSession && currentStreak === 0) {
    currentStreak = tempStreak;
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

// =============================================================================
// PROVIDER
// =============================================================================

const initialState: JourneyState = {
  entries: [],
  isLoading: true,
  weeklyStats: {
    startDate: '',
    endDate: '',
    totalSessions: 0,
    totalMinutes: 0,
    moodTrend: 'unknown',
    mostUsedTool: null,
    daysActive: 0,
    streakDays: 0,
  },
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  journalEntries: [],
  activeFilter: 'all',
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(initialState);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const entries: TimelineEntry[] = parsed.entries || [];
        
        const weeklyStats = calculateWeeklyStats(entries);
        const { current: currentStreak, longest: longestStreak } = calculateStreak(entries);
        
        const sessions = entries.filter(e => e.type === 'session');
        
        setState({
          entries,
          isLoading: false,
          weeklyStats: { ...weeklyStats, streakDays: currentStreak },
          totalSessions: sessions.length,
          totalMinutes: sessions.reduce((sum, s) => sum + (s.sessionDuration || 0) / 60, 0),
          currentStreak,
          longestStreak,
          journalEntries: entries.filter(e => e.type === 'journal'),
          activeFilter: 'all',
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load journey data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveData = async (entries: TimelineEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ entries }));
    } catch (error) {
      console.error('Failed to save journey data:', error);
    }
  };

  const addMoodEntry = useCallback(async (mood: MoodType, note?: string) => {
    const entry: TimelineEntry = {
      id: generateId(),
      type: 'mood',
      timestamp: Date.now(),
      mood,
      moodNote: note,
    };

    setState(prev => {
      const newEntries = [entry, ...prev.entries];
      saveData(newEntries);
      
      const weeklyStats = calculateWeeklyStats(newEntries);
      
      return {
        ...prev,
        entries: newEntries,
        weeklyStats,
      };
    });
  }, []);

  const addSessionEntry = useCallback(async (session: {
    type: string;
    name: string;
    duration: number;
    preMood?: MoodType;
    postMood?: MoodType;
  }) => {
    const entry: TimelineEntry = {
      id: generateId(),
      type: 'session',
      timestamp: Date.now(),
      sessionType: session.type,
      sessionName: session.name,
      sessionDuration: session.duration,
      preSessionMood: session.preMood,
      postSessionMood: session.postMood,
    };

    setState(prev => {
      const newEntries = [entry, ...prev.entries];
      saveData(newEntries);
      
      const weeklyStats = calculateWeeklyStats(newEntries);
      const { current: currentStreak, longest: longestStreak } = calculateStreak(newEntries);
      const sessions = newEntries.filter(e => e.type === 'session');
      
      return {
        ...prev,
        entries: newEntries,
        weeklyStats: { ...weeklyStats, streakDays: currentStreak },
        totalSessions: sessions.length,
        totalMinutes: sessions.reduce((sum, s) => sum + (s.sessionDuration || 0) / 60, 0),
        currentStreak,
        longestStreak,
      };
    });
  }, []);

  const addJournalEntry = useCallback(async (content: string, prompt?: string) => {
    const entry: TimelineEntry = {
      id: generateId(),
      type: 'journal',
      timestamp: Date.now(),
      journalContent: content,
      journalPrompt: prompt,
    };

    setState(prev => {
      const newEntries = [entry, ...prev.entries];
      saveData(newEntries);
      
      return {
        ...prev,
        entries: newEntries,
        journalEntries: [entry, ...prev.journalEntries],
      };
    });
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setState(prev => {
      const newEntries = prev.entries.filter(e => e.id !== id);
      saveData(newEntries);
      
      const weeklyStats = calculateWeeklyStats(newEntries);
      const { current: currentStreak, longest: longestStreak } = calculateStreak(newEntries);
      const sessions = newEntries.filter(e => e.type === 'session');
      
      return {
        ...prev,
        entries: newEntries,
        journalEntries: newEntries.filter(e => e.type === 'journal'),
        weeklyStats: { ...weeklyStats, streakDays: currentStreak },
        totalSessions: sessions.length,
        totalMinutes: sessions.reduce((sum, s) => sum + (s.sessionDuration || 0) / 60, 0),
        currentStreak,
        longestStreak,
      };
    });
  }, []);

  const setFilter = useCallback((filter: TimelineEntryType | 'all') => {
    setState(prev => ({ ...prev, activeFilter: filter }));
  }, []);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await loadData();
  }, []);

  // Computed values
  const filteredEntries = state.activeFilter === 'all'
    ? state.entries
    : state.entries.filter(e => e.type === state.activeFilter);

  const today = new Date().toDateString();
  const todayEntries = state.entries.filter(
    e => new Date(e.timestamp).toDateString() === today
  );

  const recentMoods = state.entries
    .filter(e => e.type === 'mood' && e.mood)
    .slice(0, 7)
    .map(e => ({ mood: e.mood!, timestamp: e.timestamp }));

  const contextValue: JourneyContextType = {
    ...state,
    addMoodEntry,
    addSessionEntry,
    addJournalEntry,
    deleteEntry,
    setFilter,
    refresh,
    filteredEntries,
    todayEntries,
    recentMoods,
  };

  return (
    <JourneyContext.Provider value={contextValue}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
}
