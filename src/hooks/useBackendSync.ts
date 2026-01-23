/**
 * Backend Sync Hook
 * 
 * Provides utilities for syncing local data with the backend API
 * Supports offline-first approach with background synchronization
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import logger from '../services/logger';

interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = '@restorae/sync_queue';
const MAX_RETRIES = 3;

export function useBackendSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const syncQueueRef = useRef<SyncQueue[]>([]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        // Network restored - process sync queue
        processSyncQueue();
      }
    });

    // Load pending sync items
    loadSyncQueue();

    return () => unsubscribe();
  }, []);

  const loadSyncQueue = async () => {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueData) {
        syncQueueRef.current = JSON.parse(queueData);
      }
    } catch (error) {
      logger.error('Failed to load sync queue:', error);
    }
  };

  const saveSyncQueue = async () => {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueueRef.current));
    } catch (error) {
      logger.error('Failed to save sync queue:', error);
    }
  };

  const addToSyncQueue = useCallback(async (item: Omit<SyncQueue, 'timestamp' | 'retries'>) => {
    const queueItem: SyncQueue = {
      ...item,
      timestamp: Date.now(),
      retries: 0,
    };
    syncQueueRef.current.push(queueItem);
    await saveSyncQueue();

    // Try to sync immediately if online
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline]);

  const processSyncQueue = useCallback(async () => {
    if (isSyncing || syncQueueRef.current.length === 0) return;

    setIsSyncing(true);
    const queue = [...syncQueueRef.current];
    const completed: string[] = [];
    const failed: SyncQueue[] = [];

    for (const item of queue) {
      try {
        switch (item.action) {
          case 'create':
            await api['client'].post(item.endpoint, item.data);
            break;
          case 'update':
            await api['client'].patch(item.endpoint, item.data);
            break;
          case 'delete':
            await api['client'].delete(item.endpoint);
            break;
        }
        completed.push(item.id);
      } catch (error) {
        if (item.retries < MAX_RETRIES) {
          failed.push({ ...item, retries: item.retries + 1 });
        }
        // After max retries, item is dropped
      }
    }

    // Update queue with remaining items
    syncQueueRef.current = failed;
    await saveSyncQueue();
    setIsSyncing(false);
  }, [isSyncing]);

  return {
    isSyncing,
    isOnline,
    addToSyncQueue,
    processSyncQueue,
    pendingCount: syncQueueRef.current.length,
  };
}

/**
 * Mood Sync Hook
 * Specific hook for syncing mood entries with backend
 */
export function useMoodSync() {
  const { addToSyncQueue, isOnline } = useBackendSync();

  const syncMoodEntry = useCallback(async (
    action: 'create' | 'update' | 'delete',
    entry: { id: string; mood?: string; note?: string; context?: string }
  ) => {
    if (!isOnline) {
      await addToSyncQueue({
        id: `mood_${entry.id}_${action}`,
        action,
        endpoint: action === 'create' ? '/mood' : `/mood/${entry.id}`,
        data: action !== 'delete' ? entry : undefined,
      });
      return;
    }

    try {
      switch (action) {
        case 'create':
          return await api.createMoodEntry({
            mood: entry.mood!,
            context: entry.context!,
            note: entry.note,
          });
        case 'update':
          // Backend update if supported
          break;
        case 'delete':
          // Backend delete if supported
          break;
      }
    } catch (error) {
      // Queue for later sync
      await addToSyncQueue({
        id: `mood_${entry.id}_${action}`,
        action,
        endpoint: action === 'create' ? '/mood' : `/mood/${entry.id}`,
        data: action !== 'delete' ? entry : undefined,
      });
    }
  }, [addToSyncQueue, isOnline]);

  const fetchMoodHistory = useCallback(async (params?: { startDate?: string; endDate?: string }) => {
    if (!isOnline) {
      return null; // Use local data
    }

    try {
      return await api.getMoodEntries(params);
    } catch (error) {
      return null;
    }
  }, [isOnline]);

  const fetchMoodStats = useCallback(async (period: 'week' | 'month' | 'year' = 'week') => {
    if (!isOnline) {
      return null;
    }

    try {
      return await api.getMoodStats(period);
    } catch (error) {
      return null;
    }
  }, [isOnline]);

  return {
    syncMoodEntry,
    fetchMoodHistory,
    fetchMoodStats,
    isOnline,
  };
}

/**
 * Journal Sync Hook
 * Specific hook for syncing journal entries with backend
 */
export function useJournalSync() {
  const { addToSyncQueue, isOnline } = useBackendSync();

  const syncJournalEntry = useCallback(async (
    action: 'create' | 'update' | 'delete',
    entry: {
      id: string;
      content?: string;
      promptId?: string;
      mood?: string;
      tags?: string[];
      isPrivate?: boolean;
    }
  ) => {
    if (!isOnline) {
      await addToSyncQueue({
        id: `journal_${entry.id}_${action}`,
        action,
        endpoint: action === 'create' ? '/journal' : `/journal/${entry.id}`,
        data: action !== 'delete' ? entry : undefined,
      });
      return null;
    }

    try {
      switch (action) {
        case 'create':
          return await api.createJournalEntry({
            content: entry.content!,
            promptId: entry.promptId,
            mood: entry.mood,
            tags: entry.tags,
            isPrivate: entry.isPrivate,
          });
        case 'update':
          return await api.updateJournalEntry(entry.id, {
            content: entry.content,
            mood: entry.mood,
            tags: entry.tags,
            isPrivate: entry.isPrivate,
          });
        case 'delete':
          await api.deleteJournalEntry(entry.id);
          return null;
      }
    } catch (error) {
      await addToSyncQueue({
        id: `journal_${entry.id}_${action}`,
        action,
        endpoint: action === 'create' ? '/journal' : `/journal/${entry.id}`,
        data: action !== 'delete' ? entry : undefined,
      });
      return null;
    }
  }, [addToSyncQueue, isOnline]);

  const fetchJournalEntries = useCallback(async (params?: { limit?: number; search?: string }) => {
    if (!isOnline) {
      return null;
    }

    try {
      return await api.getJournalEntries(params);
    } catch (error) {
      return null;
    }
  }, [isOnline]);

  return {
    syncJournalEntry,
    fetchJournalEntries,
    isOnline,
  };
}

/**
 * Subscription Sync Hook
 */
export function useSubscriptionSync() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const validatePurchase = useCallback(async (receipt: string, productId: string) => {
    try {
      return await api.validatePurchase(receipt, productId);
    } catch (error) {
      logger.error('Failed to validate purchase:', error);
      throw error;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      return await api.restorePurchases();
    } catch (error) {
      logger.error('Failed to restore purchases:', error);
      throw error;
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!isOnline) return null;
    
    try {
      return await api.getSubscription();
    } catch (error) {
      return null;
    }
  }, [isOnline]);

  return {
    validatePurchase,
    restorePurchases,
    fetchSubscription,
    isOnline,
  };
}

/**
 * Content Sync Hook
 */
export function useContentSync() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const fetchContent = useCallback(async (type?: string) => {
    if (!isOnline) return null;
    
    try {
      return await api.getContent({ type });
    } catch (error) {
      return null;
    }
  }, [isOnline]);

  const fetchBreathingExercises = useCallback(async () => {
    return fetchContent('BREATHING');
  }, [fetchContent]);

  const fetchGroundingExercises = useCallback(async () => {
    return fetchContent('GROUNDING');
  }, [fetchContent]);

  const fetchRituals = useCallback(async (timeOfDay: 'MORNING' | 'EVENING') => {
    return fetchContent(`${timeOfDay}_RITUAL`);
  }, [fetchContent]);

  const fetchAmbientSounds = useCallback(async () => {
    if (!isOnline) return null;
    
    try {
      return await api.getAmbientSounds();
    } catch (error) {
      return null;
    }
  }, [isOnline]);

  return {
    fetchContent,
    fetchBreathingExercises,
    fetchGroundingExercises,
    fetchRituals,
    fetchAmbientSounds,
    isOnline,
  };
}

export default {
  useBackendSync,
  useMoodSync,
  useJournalSync,
  useSubscriptionSync,
  useContentSync,
};
