/**
 * RitualsContext
 * 
 * Manages custom rituals creation, storage, and scheduling
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// TYPES
// =============================================================================
export interface RitualStep {
  id: string;
  title: string;
  duration: number; // seconds
  description?: string;
}

export type TimeOfDay = 'morning' | 'midday' | 'evening' | 'anytime';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface CustomRitual {
  id: string;
  title: string;
  description: string;
  steps: RitualStep[];
  timeOfDay: TimeOfDay;
  days: DayOfWeek[];
  reminderEnabled: boolean;
  reminderTime?: string; // HH:mm format
  createdAt: string;
  updatedAt: string;
  completedCount: number;
  lastCompleted?: string;
  isArchived: boolean;
}

export interface RitualCompletion {
  id: string;
  ritualId: string;
  completedAt: string;
  duration: number; // actual time taken in seconds
  completedSteps: number;
  totalSteps: number;
  mood?: 'great' | 'good' | 'okay' | 'tired';
  notes?: string;
}

interface RitualsState {
  rituals: CustomRitual[];
  completions: RitualCompletion[];
  favoriteRitualIds: string[];
}

interface RitualsContextType extends RitualsState {
  // CRUD operations
  createRitual: (ritual: Omit<CustomRitual, 'id' | 'createdAt' | 'updatedAt' | 'completedCount' | 'isArchived'>) => Promise<CustomRitual>;
  updateRitual: (id: string, updates: Partial<CustomRitual>) => Promise<void>;
  deleteRitual: (id: string) => Promise<void>;
  archiveRitual: (id: string) => Promise<void>;
  unarchiveRitual: (id: string) => Promise<void>;
  
  // Completion tracking
  completeRitual: (completion: Omit<RitualCompletion, 'id' | 'completedAt'>) => Promise<void>;
  getRitualCompletions: (ritualId: string) => RitualCompletion[];
  
  // Favorites
  toggleFavorite: (ritualId: string) => Promise<void>;
  isFavorite: (ritualId: string) => boolean;
  
  // Queries
  getActiveRituals: () => CustomRitual[];
  getArchivedRituals: () => CustomRitual[];
  getRitualsForTime: (time: TimeOfDay) => CustomRitual[];
  getRitualsForDay: (day: DayOfWeek) => CustomRitual[];
  getTodayRituals: () => CustomRitual[];
  getRitualById: (id: string) => CustomRitual | undefined;
  
  // Stats
  getWeeklyCompletionRate: () => number;
  getStreak: () => number;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/custom_rituals';
const COMPLETIONS_KEY = '@restorae/ritual_completions';
const FAVORITES_KEY = '@restorae/favorite_rituals';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// =============================================================================
// CONTEXT
// =============================================================================
const RitualsContext = createContext<RitualsContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function RitualsProvider({ children }: { children: ReactNode }) {
  const [rituals, setRituals] = useState<CustomRitual[]>([]);
  const [completions, setCompletions] = useState<RitualCompletion[]>([]);
  const [favoriteRitualIds, setFavoriteRitualIds] = useState<string[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ritualsData, completionsData, favoritesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(COMPLETIONS_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
      ]);

      if (ritualsData) setRituals(JSON.parse(ritualsData));
      if (completionsData) setCompletions(JSON.parse(completionsData));
      if (favoritesData) setFavoriteRitualIds(JSON.parse(favoritesData));
    } catch (error) {
      console.error('Failed to load rituals data:', error);
    }
  };

  const saveRituals = async (newRituals: CustomRitual[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRituals));
    } catch (error) {
      console.error('Failed to save rituals:', error);
    }
  };

  const saveCompletions = async (newCompletions: RitualCompletion[]) => {
    try {
      await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(newCompletions));
    } catch (error) {
      console.error('Failed to save completions:', error);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================
  const createRitual = useCallback(async (
    ritual: Omit<CustomRitual, 'id' | 'createdAt' | 'updatedAt' | 'completedCount' | 'isArchived'>
  ): Promise<CustomRitual> => {
    const now = new Date().toISOString();
    const newRitual: CustomRitual = {
      ...ritual,
      id: `ritual_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      completedCount: 0,
      isArchived: false,
    };

    const newRituals = [...rituals, newRitual];
    setRituals(newRituals);
    await saveRituals(newRituals);
    return newRitual;
  }, [rituals]);

  const updateRitual = useCallback(async (id: string, updates: Partial<CustomRitual>) => {
    const newRituals = rituals.map(ritual =>
      ritual.id === id
        ? { ...ritual, ...updates, updatedAt: new Date().toISOString() }
        : ritual
    );
    setRituals(newRituals);
    await saveRituals(newRituals);
  }, [rituals]);

  const deleteRitual = useCallback(async (id: string) => {
    const newRituals = rituals.filter(r => r.id !== id);
    const newCompletions = completions.filter(c => c.ritualId !== id);
    const newFavorites = favoriteRitualIds.filter(fid => fid !== id);

    setRituals(newRituals);
    setCompletions(newCompletions);
    setFavoriteRitualIds(newFavorites);

    await Promise.all([
      saveRituals(newRituals),
      saveCompletions(newCompletions),
      saveFavorites(newFavorites),
    ]);
  }, [rituals, completions, favoriteRitualIds]);

  const archiveRitual = useCallback(async (id: string) => {
    await updateRitual(id, { isArchived: true });
  }, [updateRitual]);

  const unarchiveRitual = useCallback(async (id: string) => {
    await updateRitual(id, { isArchived: false });
  }, [updateRitual]);

  // ==========================================================================
  // COMPLETION TRACKING
  // ==========================================================================
  const completeRitual = useCallback(async (
    completion: Omit<RitualCompletion, 'id' | 'completedAt'>
  ) => {
    const now = new Date().toISOString();
    const newCompletion: RitualCompletion = {
      ...completion,
      id: `completion_${Date.now()}`,
      completedAt: now,
    };

    const newCompletions = [...completions, newCompletion];
    setCompletions(newCompletions);
    await saveCompletions(newCompletions);

    // Update ritual completed count
    const ritual = rituals.find(r => r.id === completion.ritualId);
    if (ritual) {
      await updateRitual(completion.ritualId, {
        completedCount: ritual.completedCount + 1,
        lastCompleted: now,
      });
    }
  }, [completions, rituals, updateRitual]);

  const getRitualCompletions = useCallback((ritualId: string): RitualCompletion[] => {
    return completions
      .filter(c => c.ritualId === ritualId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [completions]);

  // ==========================================================================
  // FAVORITES
  // ==========================================================================
  const toggleFavorite = useCallback(async (ritualId: string) => {
    const newFavorites = favoriteRitualIds.includes(ritualId)
      ? favoriteRitualIds.filter(id => id !== ritualId)
      : [...favoriteRitualIds, ritualId];
    
    setFavoriteRitualIds(newFavorites);
    await saveFavorites(newFavorites);
  }, [favoriteRitualIds]);

  const isFavorite = useCallback((ritualId: string): boolean => {
    return favoriteRitualIds.includes(ritualId);
  }, [favoriteRitualIds]);

  // ==========================================================================
  // QUERIES
  // ==========================================================================
  const getActiveRituals = useCallback((): CustomRitual[] => {
    return rituals.filter(r => !r.isArchived);
  }, [rituals]);

  const getArchivedRituals = useCallback((): CustomRitual[] => {
    return rituals.filter(r => r.isArchived);
  }, [rituals]);

  const getRitualsForTime = useCallback((time: TimeOfDay): CustomRitual[] => {
    return rituals.filter(r => !r.isArchived && (r.timeOfDay === time || r.timeOfDay === 'anytime'));
  }, [rituals]);

  const getRitualsForDay = useCallback((day: DayOfWeek): CustomRitual[] => {
    return rituals.filter(r => !r.isArchived && r.days.includes(day));
  }, [rituals]);

  const getTodayRituals = useCallback((): CustomRitual[] => {
    const today = DAY_MAP[new Date().getDay()];
    return getRitualsForDay(today);
  }, [getRitualsForDay]);

  const getRitualById = useCallback((id: string): CustomRitual | undefined => {
    return rituals.find(r => r.id === id);
  }, [rituals]);

  // ==========================================================================
  // STATS
  // ==========================================================================
  const getWeeklyCompletionRate = useCallback((): number => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekCompletions = completions.filter(
      c => new Date(c.completedAt) >= oneWeekAgo
    );

    // Calculate expected completions based on active rituals and their schedules
    const activeRituals = getActiveRituals();
    let expectedCompletions = 0;

    activeRituals.forEach(ritual => {
      // Each ritual scheduled for specific days
      expectedCompletions += ritual.days.length;
    });

    if (expectedCompletions === 0) return 0;
    return Math.min(100, Math.round((weekCompletions.length / expectedCompletions) * 100));
  }, [completions, getActiveRituals]);

  const getStreak = useCallback((): number => {
    if (completions.length === 0) return 0;

    const sortedCompletions = [...completions].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    
    // Check if completed today
    const hasCompletionOnDate = (date: Date): boolean => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      return sortedCompletions.some(c => {
        const completedDate = new Date(c.completedAt);
        return completedDate >= start && completedDate <= end;
      });
    };

    while (hasCompletionOnDate(checkDate)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }, [completions]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value = useMemo(() => ({
    rituals,
    completions,
    favoriteRitualIds,
    createRitual,
    updateRitual,
    deleteRitual,
    archiveRitual,
    unarchiveRitual,
    completeRitual,
    getRitualCompletions,
    toggleFavorite,
    isFavorite,
    getActiveRituals,
    getArchivedRituals,
    getRitualsForTime,
    getRitualsForDay,
    getTodayRituals,
    getRitualById,
    getWeeklyCompletionRate,
    getStreak,
  }), [
    rituals,
    completions,
    favoriteRitualIds,
    createRitual,
    updateRitual,
    deleteRitual,
    archiveRitual,
    unarchiveRitual,
    completeRitual,
    getRitualCompletions,
    toggleFavorite,
    isFavorite,
    getActiveRituals,
    getArchivedRituals,
    getRitualsForTime,
    getRitualsForDay,
    getTodayRituals,
    getRitualById,
    getWeeklyCompletionRate,
    getStreak,
  ]);

  return (
    <RitualsContext.Provider value={value}>
      {children}
    </RitualsContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useRituals() {
  const context = useContext(RitualsContext);
  if (!context) {
    throw new Error('useRituals must be used within a RitualsProvider');
  }
  return context;
}

export default RitualsContext;
