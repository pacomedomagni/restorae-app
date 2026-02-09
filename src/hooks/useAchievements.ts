/**
 * Achievements Hook
 * 
 * Provides access to achievements, user progress, XP, and leveling
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import logger from '../services/logger';

// Types
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 
  | 'consistency' 
  | 'session' 
  | 'mindfulness' 
  | 'exploration' 
  | 'mastery' 
  | 'special';

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  category: AchievementCategory;
  tier: AchievementTier;
  xpReward: number;
  order: number;
  isActive: boolean;
  isSecret: boolean;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  xp: number;
  level: number;
  totalXpEarned: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  lastActiveDate?: string;
  achievements: {
    unlocked: number;
    total: number;
    percentage: number;
  };
  nextLevelXp: number;
  xpToNextLevel: number;
}

export interface TrackSessionResult {
  progress: UserProgress;
  newlyUnlocked: string[];
}

const CACHE_KEY = '@restorae/achievements_cache';
const PROGRESS_CACHE_KEY = '@restorae/user_progress_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Load achievements
  const loadAchievements = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { achievements: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAchievements(cachedData);
            setLoading(false);
            refreshInBackground();
            return cachedData;
          }
        }
      }

      const data = await api.getAchievements();
      setAchievements(data);

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        achievements: data,
        timestamp: Date.now(),
      }));

      return data;
    } catch (err: unknown) {
      logger.error('Failed to load achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
      
      // Try cache on error
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { achievements: cachedData } = JSON.parse(cached);
        setAchievements(cachedData);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Background refresh
  const refreshInBackground = useCallback(async () => {
    try {
      const data = await api.getAchievements();
      setAchievements(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        achievements: data,
        timestamp: Date.now(),
      }));
    } catch (err) {
      logger.debug('Background achievements refresh failed:', err as Record<string, any>);
    }
  }, []);

  // Load user progress
  const loadProgress = useCallback(async () => {
    try {
      // Check cache
      const cached = await AsyncStorage.getItem(PROGRESS_CACHE_KEY);
      if (cached) {
        const { progress: cachedProgress, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION / 2) { // Shorter cache for progress
          setProgress(cachedProgress);
          return cachedProgress;
        }
      }

      const data = await api.getUserProgress();
      setProgress(data);

      await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify({
        progress: data,
        timestamp: Date.now(),
      }));

      return data;
    } catch (err: unknown) {
      logger.error('Failed to load user progress:', err);
      return null;
    }
  }, []);

  // Track session completion
  const trackSession = useCallback(async (durationMinutes: number, sessionType: string): Promise<TrackSessionResult | null> => {
    try {
      const result = await api.trackSessionComplete(durationMinutes, sessionType);
      
      setProgress(result.progress);

      // Update cache
      await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify({
        progress: result.progress,
        timestamp: Date.now(),
      }));

      // Check for newly unlocked achievements
      if (result.newlyUnlocked?.length > 0) {
        const unlockedAchievements = achievements.filter(
          a => result.newlyUnlocked.includes(a.slug)
        );
        setNewlyUnlocked(unlockedAchievements);
        
        // Refresh achievements to update unlock status
        loadAchievements(true);
      }

      return result;
    } catch (err: unknown) {
      logger.error('Failed to track session:', err);
      return null;
    }
  }, [achievements, loadAchievements]);

  // Update streak (call daily)
  const updateStreak = useCallback(async () => {
    try {
      const result = await api.updateStreak();
      
      setProgress(result.progress);

      // Check for streak achievements
      if (result.newlyUnlocked?.length > 0) {
        const unlockedAchievements = achievements.filter(
          a => result.newlyUnlocked.includes(a.slug)
        );
        setNewlyUnlocked(prev => [...prev, ...unlockedAchievements]);
        loadAchievements(true);
      }

      return result;
    } catch (err: unknown) {
      logger.error('Failed to update streak:', err);
      return null;
    }
  }, [achievements, loadAchievements]);

  // Manually unlock achievement
  const unlock = useCallback(async (slug: string) => {
    try {
      const result = await api.unlockAchievement(slug);
      
      if (!result.alreadyUnlocked) {
        setNewlyUnlocked(prev => [...prev, result.achievement]);
        loadAchievements(true);
        loadProgress();
      }

      return result;
    } catch (err: unknown) {
      logger.error('Failed to unlock achievement:', err);
      throw err;
    }
  }, [loadAchievements, loadProgress]);

  // Clear newly unlocked (after showing notification)
  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  // Get achievements by category
  const getByCategory = useCallback((category: AchievementCategory) => {
    return achievements.filter(a => a.category === category);
  }, [achievements]);

  // Get unlocked achievements
  const getUnlocked = useCallback(() => {
    return achievements.filter(a => a.unlocked);
  }, [achievements]);

  // Get locked achievements (visible only, not secret)
  const getLocked = useCallback(() => {
    return achievements.filter(a => !a.unlocked && !a.isSecret);
  }, [achievements]);

  // Calculate level progress percentage
  const getLevelProgress = useCallback(() => {
    if (!progress) return 0;
    const currentLevelXp = progress.xp;
    const xpForCurrentLevel = progress.nextLevelXp;
    return Math.min(100, (currentLevelXp / xpForCurrentLevel) * 100);
  }, [progress]);

  // Initial load
  useEffect(() => {
    loadAchievements();
    loadProgress();
  }, []);

  return {
    achievements,
    progress,
    loading,
    error,
    newlyUnlocked,
    refresh: () => {
      loadAchievements(true);
      loadProgress();
    },
    trackSession,
    updateStreak,
    unlock,
    clearNewlyUnlocked,
    getByCategory,
    getUnlocked,
    getLocked,
    getLevelProgress,
  };
}

export default useAchievements;
