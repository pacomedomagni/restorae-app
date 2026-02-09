/**
 * MoodContext
 * 
 * Manages mood tracking history, streaks, and analytics.
 * Features offline-first architecture with automatic sync to backend.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { isAxiosError } from 'axios';
import { syncQueue, SyncOperation } from '../services/syncQueue';
import { MoodType } from '../types';
import logger from '../services/logger';

// =============================================================================
// TYPES
// =============================================================================
export interface MoodEntry {
  id: string;
  serverId?: string;
  mood: MoodType;
  note?: string;
  timestamp: string;
  context?: 'morning' | 'midday' | 'evening' | 'manual';
  isSynced?: boolean;
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
  isSyncing: boolean;
  stats: MoodStats;
  weeklyGoal: WeeklyGoal;
  lastSyncedAt: string | null;
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
  syncWithServer: () => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/mood_entries';
const GOAL_KEY = '@restorae/weekly_goal';
const LAST_SYNC_KEY = '@restorae/mood_last_sync';

const DEFAULT_STATS: MoodStats = {
  totalEntries: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyEntries: 0,
  monthlyEntries: 0,
  moodDistribution: {
    energized: 0, calm: 0, good: 0, anxious: 0, low: 0, tough: 0,
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
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getDaysBetween(d1: Date, d2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
}

function calculateStreak(entries: MoodEntry[]): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 };
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const uniqueDays = new Set<string>();
  sorted.forEach(e => {
    const d = new Date(e.timestamp);
    uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  const daysArray = Array.from(uniqueDays).sort().reverse();
  let currentStreak = 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
  if (daysArray[0] === todayKey || daysArray[0] === yesterdayKey) {
    currentStreak = 1;
    for (let i = 1; i < daysArray.length; i++) {
      const prevDate = new Date(daysArray[i - 1].replace(/-/g, '/'));
      const currDate = new Date(daysArray[i].replace(/-/g, '/'));
      if (getDaysBetween(prevDate, currDate) === 1) currentStreak++;
      else break;
    }
  }
  let longestStreak = currentStreak;
  let tempStreak = 1;
  for (let i = 1; i < daysArray.length; i++) {
    const prevDate = new Date(daysArray[i - 1].replace(/-/g, '/'));
    const currDate = new Date(daysArray[i].replace(/-/g, '/'));
    if (getDaysBetween(prevDate, currDate) === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else tempStreak = 1;
  }
  return { current: currentStreak, longest: longestStreak };
}

function calculateMoodTrend(entries: MoodEntry[]): MoodStats['moodTrend'] {
  if (entries.length < 5) return 'insufficient';
  const moodScores: Record<MoodType, number> = { energized: 4, good: 4, calm: 3, anxious: 2, low: 1, tough: 1 };
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentEntries = entries.filter(e => new Date(e.timestamp) >= twoWeeksAgo);
  if (recentEntries.length < 4) return 'insufficient';
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

function mapContextToAPI(context?: MoodEntry['context']): string {
  const mapping: Record<string, string> = { morning: 'MORNING', midday: 'MIDDAY', evening: 'EVENING', manual: 'MANUAL' };
  return mapping[context || 'manual'] || 'MANUAL';
}

function mapContextFromAPI(context: string): MoodEntry['context'] {
  const mapping: Record<string, MoodEntry['context']> = { MORNING: 'morning', MIDDAY: 'midday', EVENING: 'evening', MANUAL: 'manual' };
  return mapping[context] || 'manual';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>(DEFAULT_GOAL);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncInProgress = useRef(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const processMoodOps = async (op: SyncOperation): Promise<{ success: boolean; serverId?: string }> => {
      if (op.entity !== 'mood') return { success: true };
      const d = op.data as { mood?: string; context?: string; note?: string; localId?: string; serverId?: string };
      try {
        switch (op.type) {
          case 'create':
            const res = await api.createMoodEntry({ mood: d.mood!.toUpperCase(), context: mapContextToAPI(d.context as 'morning' | 'midday' | 'evening' | 'manual' | undefined), note: d.note });
            setEntries(prev => prev.map(e => e.id === d.localId ? { ...e, serverId: res.id, isSynced: true } : e));
            return { success: true, serverId: res.id };
          case 'update':
            if (d.serverId) await api.updateMoodEntry(d.serverId, { mood: d.mood?.toUpperCase(), note: d.note });
            return { success: true };
          case 'delete':
            if (d.serverId) await api.deleteMoodEntry(d.serverId);
            return { success: true };
          default: return { success: true };
        }
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) return { success: true };
        return { success: false };
      }
    };
    syncQueue.processQueue(processMoodOps);
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable && !syncInProgress.current) syncWithServer();
    });
    return () => unsub();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, goalData, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(GOAL_KEY), AsyncStorage.getItem(LAST_SYNC_KEY),
      ]);
      if (entriesData) setEntries(JSON.parse(entriesData));
      if (goalData) {
        const goal = JSON.parse(goalData) as WeeklyGoal;
        const currentWeekStart = getWeekStart(new Date()).toISOString();
        if (goal.currentWeekStart !== currentWeekStart) {
          const newGoal = { ...goal, completedDays: 0, currentWeekStart };
          setWeeklyGoal(newGoal);
          await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
        } else setWeeklyGoal(goal);
      }
      if (lastSync) setLastSyncedAt(lastSync);
      syncWithServer();
    } catch (error) { logger.error('Failed to load mood data:', error); }
    finally { setIsLoading(false); }
  };

  const saveEntries = async (newEntries: MoodEntry[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries)); }
    catch (error) { logger.error('Failed to save mood entries:', error); }
  };

  const syncWithServer = useCallback(async () => {
    if (syncInProgress.current || isSyncing) return;
    
    // Check if user is authenticated before syncing
    const hasToken = await api.hasValidToken();
    if (!hasToken) return;
    
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) return;
    syncInProgress.current = true;
    setIsSyncing(true);
    try {
      const serverEntries = await api.getMoodEntries({ limit: 500 });
      // Ensure we have an array
      const entries = Array.isArray(serverEntries) ? serverEntries : [];
      const localData = await AsyncStorage.getItem(STORAGE_KEY);
      const localEntries: MoodEntry[] = localData ? JSON.parse(localData) : [];
      const localByServerId = new Map(localEntries.filter(e => e.serverId).map(e => [e.serverId, e]));
      const mergedEntries: MoodEntry[] = [];
      entries.forEach((se: { id: string; mood: string; note?: string; timestamp?: string; createdAt?: string; context: string }) => {
        const le = localByServerId.get(se.id);
        mergedEntries.push({
          id: le?.id || `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serverId: se.id, mood: se.mood.toLowerCase() as MoodType, note: se.note,
          timestamp: se.timestamp || se.createdAt || new Date().toISOString(), context: mapContextFromAPI(se.context), isSynced: true,
        });
      });
      localEntries.forEach(le => { if (!le.serverId && !le.isSynced) mergedEntries.push(le); });
      mergedEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEntries(mergedEntries);
      await saveEntries(mergedEntries);
      try {
        const goalRes = await api.getWeeklyGoal();
        if (goalRes) {
          const serverGoal: WeeklyGoal = { targetDays: goalRes.targetDays || 7, completedDays: goalRes.completedDays || 0, currentWeekStart: goalRes.weekStart || getWeekStart(new Date()).toISOString() };
          setWeeklyGoal(serverGoal);
          await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(serverGoal));
        }
      } catch (goalError) {
        logger.warn('Failed to sync weekly goal:', goalError as Record<string, any>);
      }
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
    } catch (error) { logger.error('Failed to sync mood data:', error); }
    finally { setIsSyncing(false); syncInProgress.current = false; }
  }, [isSyncing]);

  const stats = useMemo((): MoodStats => {
    if (entries.length === 0) return DEFAULT_STATS;
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const weeklyEntries = entries.filter(e => new Date(e.timestamp) >= weekAgo);
    const monthlyEntries = entries.filter(e => new Date(e.timestamp) >= monthAgo);
    const lastSevenDays = weeklyEntries.slice(0, 20);
    const moodDistribution: Record<MoodType, number> = { energized: 0, calm: 0, good: 0, anxious: 0, low: 0, tough: 0 };
    entries.forEach(e => { moodDistribution[e.mood]++; });
    let mostCommonMood: MoodType | null = null;
    let maxCount = 0;
    (Object.keys(moodDistribution) as MoodType[]).forEach(mood => { if (moodDistribution[mood] > maxCount) { maxCount = moodDistribution[mood]; mostCommonMood = mood; } });
    const uniqueDays = new Set<string>();
    monthlyEntries.forEach(e => { const d = new Date(e.timestamp); uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`); });
    const averageMoodsPerDay = uniqueDays.size > 0 ? monthlyEntries.length / uniqueDays.size : 0;
    const { current: currentStreak, longest: longestStreak } = calculateStreak(entries);
    const moodTrend = calculateMoodTrend(entries);
    return { totalEntries: entries.length, currentStreak, longestStreak, weeklyEntries: weeklyEntries.length, monthlyEntries: monthlyEntries.length, moodDistribution, averageMoodsPerDay: Math.round(averageMoodsPerDay * 10) / 10, lastSevenDays, mostCommonMood, moodTrend };
  }, [entries]);

  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    const uniqueDaysThisWeek = new Set<string>();
    entries.forEach(e => { const entryDate = new Date(e.timestamp); if (entryDate >= weekStart) uniqueDaysThisWeek.add(`${entryDate.getFullYear()}-${entryDate.getMonth()}-${entryDate.getDate()}`); });
    const completedDays = uniqueDaysThisWeek.size;
    if (completedDays !== weeklyGoal.completedDays) {
      const newGoal = { ...weeklyGoal, completedDays };
      setWeeklyGoal(newGoal);
      AsyncStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
    }
  }, [entries, weeklyGoal.completedDays]);

  const addMoodEntry = useCallback(async (mood: MoodType, note?: string, context: MoodEntry['context'] = 'manual'): Promise<MoodEntry> => {
    const localId = `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry: MoodEntry = { id: localId, mood, note, timestamp: new Date().toISOString(), context, isSynced: false };
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    await saveEntries(newEntries);
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      try {
        const response = await api.createMoodEntry({ mood: mood.toUpperCase(), context: mapContextToAPI(context), note });
        const syncedEntry = { ...entry, serverId: response.id, isSynced: true };
        const updatedEntries = newEntries.map(e => e.id === localId ? syncedEntry : e);
        setEntries(updatedEntries);
        await saveEntries(updatedEntries);
        return syncedEntry;
      } catch (error) {
        await syncQueue.addToQueue({ type: 'create', entity: 'mood', data: { localId, mood, note, context } });
      }
    } else await syncQueue.addToQueue({ type: 'create', entity: 'mood', data: { localId, mood, note, context } });
    return entry;
  }, [entries]);

  const updateMoodEntry = useCallback(async (id: string, updates: Partial<MoodEntry>) => {
    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    const existingEntry = entries[entryIndex];
    const updatedEntry = { ...existingEntry, ...updates, isSynced: false };
    const newEntries = [...entries];
    newEntries[entryIndex] = updatedEntry;
    setEntries(newEntries);
    await saveEntries(newEntries);
    if (existingEntry.serverId) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        try {
          await api.updateMoodEntry(existingEntry.serverId, { mood: updates.mood?.toUpperCase(), note: updates.note });
          newEntries[entryIndex] = { ...updatedEntry, isSynced: true };
          setEntries([...newEntries]);
          await saveEntries(newEntries);
        } catch (error) { await syncQueue.addToQueue({ type: 'update', entity: 'mood', data: { serverId: existingEntry.serverId, ...updates } }); }
      } else await syncQueue.addToQueue({ type: 'update', entity: 'mood', data: { serverId: existingEntry.serverId, ...updates } });
    }
  }, [entries]);

  const deleteMoodEntry = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    await saveEntries(newEntries);
    if (entry.serverId) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        try { await api.deleteMoodEntry(entry.serverId); }
        catch (error) { await syncQueue.addToQueue({ type: 'delete', entity: 'mood', data: { serverId: entry.serverId } }); }
      } else await syncQueue.addToQueue({ type: 'delete', entity: 'mood', data: { serverId: entry.serverId } });
    }
  }, [entries]);

  const clearAllEntries = useCallback(async () => { setEntries([]); await AsyncStorage.removeItem(STORAGE_KEY); }, []);
  const getEntriesForDate = useCallback((date: Date): MoodEntry[] => entries.filter(e => isSameDay(new Date(e.timestamp), date)), [entries]);
  const getEntriesForRange = useCallback((start: Date, end: Date): MoodEntry[] => entries.filter(e => { const d = new Date(e.timestamp); return d >= start && d <= end; }), [entries]);
  const setWeeklyGoalTarget = useCallback(async (days: number) => {
    const newGoal = { ...weeklyGoal, targetDays: Math.min(7, Math.max(1, days)) };
    setWeeklyGoal(newGoal);
    await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(newGoal));
    try { await api.setWeeklyGoalTarget(days); } catch (error) { logger.error('Failed to sync weekly goal:', error); }
  }, [weeklyGoal]);
  const refreshStats = useCallback(() => { setEntries(prev => [...prev]); }, []);

  const value = useMemo(() => ({
    entries, isLoading, isSyncing, stats, weeklyGoal, lastSyncedAt,
    addMoodEntry, updateMoodEntry, deleteMoodEntry, clearAllEntries, getEntriesForDate, getEntriesForRange, setWeeklyGoalTarget, refreshStats, syncWithServer,
  }), [entries, isLoading, isSyncing, stats, weeklyGoal, lastSyncedAt, addMoodEntry, updateMoodEntry, deleteMoodEntry, clearAllEntries, getEntriesForDate, getEntriesForRange, setWeeklyGoalTarget, refreshStats, syncWithServer]);

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) throw new Error('useMood must be used within a MoodProvider');
  return context;
}

export default MoodContext;
