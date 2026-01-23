/**
 * RitualsContext
 * 
 * Manages custom rituals creation, storage, and scheduling
 * with offline-first API synchronization
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { SyncQueue } from '../services/syncQueue';

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
  serverId?: string; // Server-assigned ID for synced rituals
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
  isSynced: boolean;
  isFavorite: boolean;
}

export interface RitualCompletion {
  id: string;
  serverId?: string;
  ritualId: string;
  completedAt: string;
  duration: number; // actual time taken in seconds
  completedSteps: number;
  totalSteps: number;
  mood?: 'great' | 'good' | 'okay' | 'tired';
  notes?: string;
  isSynced: boolean;
}

interface RitualsState {
  rituals: CustomRitual[];
  completions: RitualCompletion[];
  favoriteRitualIds: string[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

interface RitualsContextType extends RitualsState {
  // CRUD operations
  createRitual: (ritual: Omit<CustomRitual, 'id' | 'createdAt' | 'updatedAt' | 'completedCount' | 'isArchived' | 'isSynced' | 'isFavorite'>) => Promise<CustomRitual>;
  updateRitual: (id: string, updates: Partial<CustomRitual>) => Promise<void>;
  deleteRitual: (id: string) => Promise<void>;
  archiveRitual: (id: string) => Promise<void>;
  unarchiveRitual: (id: string) => Promise<void>;
  
  // Completion tracking
  completeRitual: (completion: Omit<RitualCompletion, 'id' | 'completedAt' | 'isSynced'>) => Promise<void>;
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
  
  // Sync
  syncWithServer: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/custom_rituals';
const COMPLETIONS_KEY = '@restorae/ritual_completions';
const FAVORITES_KEY = '@restorae/favorite_rituals';
const LAST_SYNC_KEY = '@restorae/rituals_last_sync';

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
  const { isAuthenticated } = useAuth();
  const [rituals, setRituals] = useState<CustomRitual[]>([]);
  const [completions, setCompletions] = useState<RitualCompletion[]>([]);
  const [favoriteRitualIds, setFavoriteRitualIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  
  const syncQueueRef = useRef<SyncQueue>(new SyncQueue('rituals'));
  const isOnlineRef = useRef(true);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = state.isConnected ?? false;
      
      // If we just came online, sync pending changes
      if (wasOffline && isOnlineRef.current && isAuthenticated) {
        syncWithServer();
      }
    });
    
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Load local data on mount
  useEffect(() => {
    loadLocalData();
  }, []);

  // Sync when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      syncWithServer();
    }
  }, [isAuthenticated, isLoading]);

  const loadLocalData = async () => {
    try {
      setIsLoading(true);
      const [ritualsData, completionsData, favoritesData, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(COMPLETIONS_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(LAST_SYNC_KEY),
      ]);

      if (ritualsData) setRituals(JSON.parse(ritualsData));
      if (completionsData) setCompletions(JSON.parse(completionsData));
      if (favoritesData) setFavoriteRitualIds(JSON.parse(favoritesData));
      if (lastSync) setLastSyncedAt(lastSync);
    } catch (error) {
      console.error('Failed to load rituals data:', error);
    } finally {
      setIsLoading(false);
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
  // SYNC WITH SERVER
  // ==========================================================================
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Process any queued operations first
      await syncQueueRef.current.processQueue(async (operation) => {
        switch (operation.type) {
          case 'create_ritual':
            const created = await api.createRitual(operation.data);
            // Update local ritual with server ID
            setRituals(prev => {
              const updated = prev.map(r => 
                r.id === operation.data.localId 
                  ? { ...r, serverId: created.id, isSynced: true }
                  : r
              );
              saveRituals(updated);
              return updated;
            });
            break;
            
          case 'update_ritual':
            await api.updateRitual(operation.data.serverId, operation.data.updates);
            break;
            
          case 'delete_ritual':
            await api.deleteRitual(operation.data.serverId);
            break;
            
          case 'archive_ritual':
            await api.archiveRitual(operation.data.serverId);
            break;
            
          case 'unarchive_ritual':
            await api.unarchiveRitual(operation.data.serverId);
            break;
            
          case 'toggle_favorite':
            await api.toggleRitualFavorite(operation.data.serverId);
            break;
            
          case 'complete_ritual':
            const completion = await api.recordRitualCompletion(operation.data);
            // Update local completion with server ID
            setCompletions(prev => {
              const updated = prev.map(c =>
                c.id === operation.data.localId
                  ? { ...c, serverId: completion.id, isSynced: true }
                  : c
              );
              saveCompletions(updated);
              return updated;
            });
            break;
        }
      });
      
      // Fetch latest from server
      await refreshFromServer();
      
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
    } catch (error) {
      console.error('Rituals sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isSyncing]);

  const refreshFromServer = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const [serverRituals, serverCompletions, serverFavorites] = await Promise.all([
        api.getRituals(true),
        api.getRitualCompletions(),
        api.getFavoriteRituals(),
      ]);
      
      // Merge server rituals with local unsynced ones
      setRituals(prev => {
        const unsyncedLocal = prev.filter(r => !r.isSynced);
        const serverMapped: CustomRitual[] = serverRituals.map((r: any) => ({
          id: r.id,
          serverId: r.id,
          title: r.title || r.name,
          description: r.description || '',
          steps: r.steps || r.activities || [],
          timeOfDay: r.timeOfDay || 'anytime',
          days: r.days || [],
          reminderEnabled: r.reminderEnabled || false,
          reminderTime: r.reminderTime,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          completedCount: r.completedCount || 0,
          lastCompleted: r.lastCompleted,
          isArchived: r.isArchived || false,
          isSynced: true,
          isFavorite: r.isFavorite || false,
        }));
        
        const merged = [...serverMapped, ...unsyncedLocal];
        saveRituals(merged);
        return merged;
      });
      
      // Merge completions
      setCompletions(prev => {
        const unsyncedLocal = prev.filter(c => !c.isSynced);
        const serverMapped: RitualCompletion[] = serverCompletions.map((c: any) => ({
          id: c.id,
          serverId: c.id,
          ritualId: c.ritualId,
          completedAt: c.completedAt,
          duration: c.duration,
          completedSteps: c.completedSteps,
          totalSteps: c.totalSteps,
          mood: c.mood,
          notes: c.notes,
          isSynced: true,
        }));
        
        const merged = [...serverMapped, ...unsyncedLocal];
        saveCompletions(merged);
        return merged;
      });
      
      // Update favorites
      const favoriteIds = serverFavorites.map((r: any) => r.id);
      setFavoriteRitualIds(favoriteIds);
      saveFavorites(favoriteIds);
    } catch (error) {
      console.error('Failed to refresh rituals from server:', error);
    }
  }, [isAuthenticated]);

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================
  const createRitual = useCallback(async (
    ritual: Omit<CustomRitual, 'id' | 'createdAt' | 'updatedAt' | 'completedCount' | 'isArchived' | 'isSynced' | 'isFavorite'>
  ): Promise<CustomRitual> => {
    const now = new Date().toISOString();
    const localId = `ritual_${Date.now()}`;
    
    const newRitual: CustomRitual = {
      ...ritual,
      id: localId,
      createdAt: now,
      updatedAt: now,
      completedCount: 0,
      isArchived: false,
      isSynced: false,
      isFavorite: false,
    };

    // Save locally first (optimistic)
    const newRituals = [...rituals, newRitual];
    setRituals(newRituals);
    await saveRituals(newRituals);

    // Try to sync with server
    if (isOnlineRef.current && isAuthenticated) {
      try {
        const serverRitual = await api.createRitual({
          title: ritual.title,
          description: ritual.description,
          steps: ritual.steps,
          timeOfDay: ritual.timeOfDay,
          days: ritual.days,
          reminderEnabled: ritual.reminderEnabled,
          reminderTime: ritual.reminderTime,
        });
        
        // Update with server ID
        const syncedRitual = { ...newRitual, serverId: serverRitual.id, isSynced: true };
        const updatedRituals = newRituals.map(r => r.id === localId ? syncedRitual : r);
        setRituals(updatedRituals);
        await saveRituals(updatedRituals);
        return syncedRitual;
      } catch (error) {
        console.error('Failed to create ritual on server:', error);
        // Queue for later sync
        await syncQueueRef.current.addToQueue({
          type: 'create_ritual',
          data: { localId, ...ritual },
        });
      }
    } else {
      // Queue for later sync
      await syncQueueRef.current.addToQueue({
        type: 'create_ritual',
        data: { localId, ...ritual },
      });
    }

    return newRitual;
  }, [rituals, isAuthenticated]);

  const updateRitual = useCallback(async (id: string, updates: Partial<CustomRitual>) => {
    const ritual = rituals.find(r => r.id === id);
    if (!ritual) return;
    
    const now = new Date().toISOString();
    const updatedRitual = { ...ritual, ...updates, updatedAt: now };
    
    // Update locally first
    const newRituals = rituals.map(r => r.id === id ? updatedRitual : r);
    setRituals(newRituals);
    await saveRituals(newRituals);

    // Try to sync with server
    if (ritual.serverId && isOnlineRef.current && isAuthenticated) {
      try {
        await api.updateRitual(ritual.serverId, updates);
      } catch (error) {
        console.error('Failed to update ritual on server:', error);
        await syncQueueRef.current.addToQueue({
          type: 'update_ritual',
          data: { serverId: ritual.serverId, updates },
        });
      }
    } else if (ritual.serverId) {
      await syncQueueRef.current.addToQueue({
        type: 'update_ritual',
        data: { serverId: ritual.serverId, updates },
      });
    }
  }, [rituals, isAuthenticated]);

  const deleteRitual = useCallback(async (id: string) => {
    const ritual = rituals.find(r => r.id === id);
    if (!ritual) return;
    
    // Delete locally first
    const newRituals = rituals.filter(r => r.id !== id);
    const newCompletions = completions.filter(c => c.ritualId !== id);
    const newFavorites = favoriteRitualIds.filter(fid => fid !== id && fid !== ritual.serverId);

    setRituals(newRituals);
    setCompletions(newCompletions);
    setFavoriteRitualIds(newFavorites);

    await Promise.all([
      saveRituals(newRituals),
      saveCompletions(newCompletions),
      saveFavorites(newFavorites),
    ]);

    // Try to sync with server
    if (ritual.serverId && isOnlineRef.current && isAuthenticated) {
      try {
        await api.deleteRitual(ritual.serverId);
      } catch (error) {
        console.error('Failed to delete ritual on server:', error);
        await syncQueueRef.current.addToQueue({
          type: 'delete_ritual',
          data: { serverId: ritual.serverId },
        });
      }
    } else if (ritual.serverId) {
      await syncQueueRef.current.addToQueue({
        type: 'delete_ritual',
        data: { serverId: ritual.serverId },
      });
    }
  }, [rituals, completions, favoriteRitualIds, isAuthenticated]);

  const archiveRitual = useCallback(async (id: string) => {
    const ritual = rituals.find(r => r.id === id);
    if (!ritual) return;
    
    await updateRitual(id, { isArchived: true });
    
    // Sync archive action
    if (ritual.serverId && isOnlineRef.current && isAuthenticated) {
      try {
        await api.archiveRitual(ritual.serverId);
      } catch (error) {
        console.error('Failed to archive ritual on server:', error);
        await syncQueueRef.current.addToQueue({
          type: 'archive_ritual',
          data: { serverId: ritual.serverId },
        });
      }
    } else if (ritual.serverId) {
      await syncQueueRef.current.addToQueue({
        type: 'archive_ritual',
        data: { serverId: ritual.serverId },
      });
    }
  }, [rituals, updateRitual, isAuthenticated]);

  const unarchiveRitual = useCallback(async (id: string) => {
    const ritual = rituals.find(r => r.id === id);
    if (!ritual) return;
    
    await updateRitual(id, { isArchived: false });
    
    // Sync unarchive action
    if (ritual.serverId && isOnlineRef.current && isAuthenticated) {
      try {
        await api.unarchiveRitual(ritual.serverId);
      } catch (error) {
        console.error('Failed to unarchive ritual on server:', error);
        await syncQueueRef.current.addToQueue({
          type: 'unarchive_ritual',
          data: { serverId: ritual.serverId },
        });
      }
    } else if (ritual.serverId) {
      await syncQueueRef.current.addToQueue({
        type: 'unarchive_ritual',
        data: { serverId: ritual.serverId },
      });
    }
  }, [rituals, updateRitual, isAuthenticated]);

  // ==========================================================================
  // COMPLETION TRACKING
  // ==========================================================================
  const completeRitual = useCallback(async (
    completion: Omit<RitualCompletion, 'id' | 'completedAt' | 'isSynced'>
  ) => {
    const now = new Date().toISOString();
    const localId = `completion_${Date.now()}`;
    
    const newCompletion: RitualCompletion = {
      ...completion,
      id: localId,
      completedAt: now,
      isSynced: false,
    };

    // Save locally first
    const newCompletions = [...completions, newCompletion];
    setCompletions(newCompletions);
    await saveCompletions(newCompletions);

    // Update ritual completed count
    const ritual = rituals.find(r => r.id === completion.ritualId || r.serverId === completion.ritualId);
    if (ritual) {
      await updateRitual(ritual.id, {
        completedCount: ritual.completedCount + 1,
        lastCompleted: now,
      });
    }

    // Try to sync with server
    const serverRitualId = ritual?.serverId || completion.ritualId;
    if (serverRitualId && isOnlineRef.current && isAuthenticated) {
      try {
        const serverCompletion = await api.recordRitualCompletion({
          ritualId: serverRitualId,
          duration: completion.duration,
          completedSteps: completion.completedSteps,
          totalSteps: completion.totalSteps,
          mood: completion.mood,
          notes: completion.notes,
        });
        
        // Update with server ID
        const updatedCompletions = newCompletions.map(c => 
          c.id === localId 
            ? { ...c, serverId: serverCompletion.id, isSynced: true }
            : c
        );
        setCompletions(updatedCompletions);
        await saveCompletions(updatedCompletions);
      } catch (error) {
        console.error('Failed to record completion on server:', error);
        await syncQueueRef.current.addToQueue({
          type: 'complete_ritual',
          data: {
            localId,
            ritualId: serverRitualId,
            duration: completion.duration,
            completedSteps: completion.completedSteps,
            totalSteps: completion.totalSteps,
            mood: completion.mood,
            notes: completion.notes,
          },
        });
      }
    } else if (serverRitualId) {
      await syncQueueRef.current.addToQueue({
        type: 'complete_ritual',
        data: {
          localId,
          ritualId: serverRitualId,
          duration: completion.duration,
          completedSteps: completion.completedSteps,
          totalSteps: completion.totalSteps,
          mood: completion.mood,
          notes: completion.notes,
        },
      });
    }
  }, [completions, rituals, updateRitual, isAuthenticated]);

  const getRitualCompletions = useCallback((ritualId: string): RitualCompletion[] => {
    const ritual = rituals.find(r => r.id === ritualId);
    return completions
      .filter(c => c.ritualId === ritualId || c.ritualId === ritual?.serverId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [completions, rituals]);

  // ==========================================================================
  // FAVORITES
  // ==========================================================================
  const toggleFavorite = useCallback(async (ritualId: string) => {
    const ritual = rituals.find(r => r.id === ritualId);
    if (!ritual) return;
    
    const currentlyFavorite = favoriteRitualIds.includes(ritualId) || 
                              (ritual.serverId && favoriteRitualIds.includes(ritual.serverId));
    
    const newFavorites = currentlyFavorite
      ? favoriteRitualIds.filter(id => id !== ritualId && id !== ritual.serverId)
      : [...favoriteRitualIds, ritual.serverId || ritualId];
    
    setFavoriteRitualIds(newFavorites);
    await saveFavorites(newFavorites);
    
    // Update ritual's isFavorite property
    await updateRitual(ritualId, { isFavorite: !currentlyFavorite });

    // Sync with server
    if (ritual.serverId && isOnlineRef.current && isAuthenticated) {
      try {
        await api.toggleRitualFavorite(ritual.serverId);
      } catch (error) {
        console.error('Failed to toggle favorite on server:', error);
        await syncQueueRef.current.addToQueue({
          type: 'toggle_favorite',
          data: { serverId: ritual.serverId },
        });
      }
    } else if (ritual.serverId) {
      await syncQueueRef.current.addToQueue({
        type: 'toggle_favorite',
        data: { serverId: ritual.serverId },
      });
    }
  }, [favoriteRitualIds, rituals, updateRitual, isAuthenticated]);

  const isFavorite = useCallback((ritualId: string): boolean => {
    const ritual = rituals.find(r => r.id === ritualId);
    return favoriteRitualIds.includes(ritualId) || 
           (ritual?.serverId ? favoriteRitualIds.includes(ritual.serverId) : false) ||
           ritual?.isFavorite || false;
  }, [favoriteRitualIds, rituals]);

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
    return rituals.find(r => r.id === id || r.serverId === id);
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
    isLoading,
    isSyncing,
    lastSyncedAt,
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
    syncWithServer,
    refreshFromServer,
  }), [
    rituals,
    completions,
    favoriteRitualIds,
    isLoading,
    isSyncing,
    lastSyncedAt,
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
    syncWithServer,
    refreshFromServer,
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
