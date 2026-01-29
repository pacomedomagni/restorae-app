/**
 * Stories Hook
 * 
 * Provides access to bedtime stories from the backend API
 * with caching and offline support
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import logger from '../services/logger';

// Types
export interface BedtimeStory {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  narrator?: string;
  duration: number;
  audioUrl?: string;
  artworkUrl?: string;
  mood?: 'calm' | 'dreamy' | 'cozy' | 'magical';
  isPremium: boolean;
  order: number;
  playCount?: number;
  categories: StoryCategory[];
  favorited?: boolean;
}

export interface StoryCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  storyCount?: number;
}

const CACHE_KEY = '@restorae/stories_cache';
const CATEGORIES_CACHE_KEY = '@restorae/story_categories_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface StoriesCache {
  stories: BedtimeStory[];
  timestamp: number;
}

export function useStories() {
  const [stories, setStories] = useState<BedtimeStory[]>([]);
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stories from cache or API
  const loadStories = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { stories: cachedStories, timestamp }: StoriesCache = JSON.parse(cached);
          const isValid = Date.now() - timestamp < CACHE_DURATION;
          
          if (isValid && cachedStories.length > 0) {
            setStories(cachedStories);
            setLoading(false);
            // Refresh in background
            refreshStoriesInBackground();
            return cachedStories;
          }
        }
      }

      // Fetch from API
      const data = await api.getStories();
      setStories(data);

      // Cache the result
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        stories: data,
        timestamp: Date.now(),
      }));

      return data;
    } catch (err: any) {
      logger.error('Failed to load stories:', err);
      setError(err.message || 'Failed to load stories');
      
      // Try to use cached data on error
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { stories: cachedStories }: StoriesCache = JSON.parse(cached);
        setStories(cachedStories);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Background refresh
  const refreshStoriesInBackground = useCallback(async () => {
    try {
      const data = await api.getStories();
      setStories(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        stories: data,
        timestamp: Date.now(),
      }));
    } catch (err) {
      // Silent fail for background refresh
      logger.debug('Background stories refresh failed:', err as Record<string, any>);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      // Check cache
      const cached = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cached) {
        const { categories: cachedCategories, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setCategories(cachedCategories);
          return cachedCategories;
        }
      }

      const data = await api.getStoryCategories();
      setCategories(data);

      await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({
        categories: data,
        timestamp: Date.now(),
      }));

      return data;
    } catch (err: any) {
      logger.error('Failed to load story categories:', err);
      return [];
    }
  }, []);

  // Get stories by category
  const getByCategory = useCallback(async (categorySlug: string) => {
    try {
      return await api.getStoriesByCategory(categorySlug);
    } catch (err: any) {
      logger.error('Failed to get stories by category:', err);
      // Fallback to filtering from cached stories
      return stories.filter(s => 
        s.categories?.some(c => c.slug === categorySlug)
      );
    }
  }, [stories]);

  // Get stories by mood
  const getByMood = useCallback(async (mood: string) => {
    try {
      return await api.getStoriesByMood(mood);
    } catch (err: any) {
      logger.error('Failed to get stories by mood:', err);
      return stories.filter(s => s.mood === mood);
    }
  }, [stories]);

  // Track story play
  const trackPlay = useCallback(async (storyId: string) => {
    try {
      await api.trackStoryPlay(storyId);
    } catch (err) {
      logger.debug('Failed to track story play:', err as Record<string, any>);
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (storyId: string) => {
    try {
      const result = await api.toggleStoryFavorite(storyId);
      
      // Update local state
      setStories(prev => prev.map(s => 
        s.id === storyId ? { ...s, favorited: result.favorited } : s
      ));

      return result.favorited;
    } catch (err: any) {
      logger.error('Failed to toggle favorite:', err);
      throw err;
    }
  }, []);

  // Get free stories only
  const getFreeStories = useCallback(() => {
    return stories.filter(s => !s.isPremium);
  }, [stories]);

  // Get premium stories only
  const getPremiumStories = useCallback(() => {
    return stories.filter(s => s.isPremium);
  }, [stories]);

  // Initial load
  useEffect(() => {
    loadStories();
    loadCategories();
  }, []);

  return {
    stories,
    categories,
    loading,
    error,
    refresh: () => loadStories(true),
    getByCategory,
    getByMood,
    trackPlay,
    toggleFavorite,
    getFreeStories,
    getPremiumStories,
  };
}

export default useStories;
