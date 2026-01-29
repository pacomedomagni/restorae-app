/**
 * Coach Marks Hook
 * 
 * Manages onboarding tooltips that guide users through the app.
 * Syncs with backend to persist across devices.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import logger from '../services/logger';

export interface CoachMark {
  id: string;
  key: string;
  screen: string;
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
  isActive: boolean;
}

const LOCAL_SEEN_KEY = '@restorae/seen_coach_marks';
const COACH_MARKS_CACHE_KEY = '@restorae/coach_marks_cache';

export function useCoachMarksSync() {
  const [coachMarks, setCoachMarks] = useState<CoachMark[]>([]);
  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef(false);

  // Load coach marks from API or cache
  const loadCoachMarks = useCallback(async () => {
    try {
      // Try cache first
      const cached = await AsyncStorage.getItem(COACH_MARKS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isValid = Date.now() - timestamp < 1000 * 60 * 60 * 24; // 24 hours
        if (isValid) {
          setCoachMarks(data);
        }
      }

      // Fetch fresh data
      const data = await api.getCoachMarks();
      setCoachMarks(data);

      // Cache
      await AsyncStorage.setItem(COACH_MARKS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (err) {
      logger.debug('Failed to load coach marks from API:', err);
    }
  }, []);

  // Load seen keys from local storage and sync with backend
  const loadSeenKeys = useCallback(async () => {
    try {
      // Load from local storage first (instant)
      const localSeen = await AsyncStorage.getItem(LOCAL_SEEN_KEY);
      if (localSeen) {
        setSeenKeys(new Set(JSON.parse(localSeen)));
      }

      // Then sync with backend
      try {
        const backendSeen = await api.getSeenCoachMarks();
        const mergedSet = new Set([
          ...(localSeen ? JSON.parse(localSeen) : []),
          ...backendSeen,
        ]);
        
        setSeenKeys(mergedSet);
        
        // Save merged list locally
        await AsyncStorage.setItem(LOCAL_SEEN_KEY, JSON.stringify([...mergedSet]));
        
        syncedRef.current = true;
      } catch (err) {
        // Backend sync failed - just use local data
        logger.debug('Failed to sync coach marks with backend:', err);
      }
    } catch (err) {
      logger.error('Failed to load seen coach marks:', err);
    }
  }, []);

  // Mark a coach mark as seen
  const markSeen = useCallback(async (key: string) => {
    // Update local state immediately
    setSeenKeys(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });

    // Save locally
    const currentKeys = await AsyncStorage.getItem(LOCAL_SEEN_KEY);
    const keys = currentKeys ? JSON.parse(currentKeys) : [];
    if (!keys.includes(key)) {
      keys.push(key);
      await AsyncStorage.setItem(LOCAL_SEEN_KEY, JSON.stringify(keys));
    }

    // Sync to backend (fire and forget)
    api.markCoachMarkSeen(key).catch(err => {
      logger.debug('Failed to sync coach mark to backend:', err);
    });
  }, []);

  // Check if a coach mark has been seen
  const hasSeen = useCallback((key: string) => {
    return seenKeys.has(key);
  }, [seenKeys]);

  // Get coach marks for a specific screen (unseen only)
  const getForScreen = useCallback((screen: string) => {
    return coachMarks
      .filter(cm => cm.screen === screen && !seenKeys.has(cm.key))
      .sort((a, b) => a.order - b.order);
  }, [coachMarks, seenKeys]);

  // Get the next coach mark to show for a screen
  const getNextForScreen = useCallback((screen: string) => {
    const marks = getForScreen(screen);
    return marks.length > 0 ? marks[0] : null;
  }, [getForScreen]);

  // Reset all coach marks (for re-onboarding)
  const resetAll = useCallback(async () => {
    setSeenKeys(new Set());
    await AsyncStorage.removeItem(LOCAL_SEEN_KEY);

    // Sync to backend
    try {
      await api.resetCoachMarks();
    } catch (err) {
      logger.debug('Failed to reset coach marks on backend:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadCoachMarks(),
        loadSeenKeys(),
      ]);
      setLoading(false);
    };

    init();
  }, []);

  return {
    coachMarks,
    seenKeys,
    loading,
    markSeen,
    hasSeen,
    getForScreen,
    getNextForScreen,
    resetAll,
  };
}

export default useCoachMarksSync;
