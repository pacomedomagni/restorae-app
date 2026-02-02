/**
 * useFavorites Hook
 * 
 * Manages user's favorite/pinned tools for quick access.
 * Features:
 * - Persistent storage
 * - Max 4 favorites for clean UI
 * - Reordering support
 * - Usage frequency tracking
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from './useHaptics';

// =============================================================================
// TYPES
// =============================================================================

export interface FavoriteItem {
  id: string;
  type: 'breathing' | 'grounding' | 'reset' | 'focus' | 'journal' | 'stories' | 'sos';
  name: string;
  icon: string;
  route: string;
  routeParams?: Record<string, any>;
  addedAt: number;
  usageCount: number;
  lastUsedAt?: number;
}

interface FavoritesState {
  items: FavoriteItem[];
  maxItems: number;
}

const STORAGE_KEY = '@restorae/favorites';
const MAX_FAVORITES = 4;

// =============================================================================
// HOOK
// =============================================================================

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { impactMedium, notificationSuccess } = useHaptics();

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: FavoritesState = JSON.parse(stored);
        setFavorites(parsed.items || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (items: FavoriteItem[]) => {
    try {
      const state: FavoritesState = { items, maxItems: MAX_FAVORITES };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  // Add a favorite
  const addFavorite = useCallback(async (item: Omit<FavoriteItem, 'addedAt' | 'usageCount'>) => {
    if (favorites.length >= MAX_FAVORITES) {
      return { success: false, reason: 'max_reached' };
    }

    if (favorites.some(f => f.id === item.id)) {
      return { success: false, reason: 'already_exists' };
    }

    const newItem: FavoriteItem = {
      ...item,
      addedAt: Date.now(),
      usageCount: 0,
    };

    const updated = [...favorites, newItem];
    setFavorites(updated);
    await saveFavorites(updated);
    await impactMedium();
    await notificationSuccess();

    return { success: true };
  }, [favorites, impactMedium, notificationSuccess]);

  // Remove a favorite
  const removeFavorite = useCallback(async (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    await saveFavorites(updated);
    await impactMedium();

    return { success: true, removed: favorites.find(f => f.id === id) };
  }, [favorites, impactMedium]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (item: Omit<FavoriteItem, 'addedAt' | 'usageCount'>) => {
    const exists = favorites.some(f => f.id === item.id);
    if (exists) {
      return removeFavorite(item.id);
    } else {
      return addFavorite(item);
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Check if item is favorite
  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  // Record usage (for smart suggestions)
  const recordUsage = useCallback(async (id: string) => {
    const updated = favorites.map(f => 
      f.id === id 
        ? { ...f, usageCount: f.usageCount + 1, lastUsedAt: Date.now() }
        : f
    );
    setFavorites(updated);
    await saveFavorites(updated);
  }, [favorites]);

  // Reorder favorites
  const reorderFavorites = useCallback(async (newOrder: string[]) => {
    const reordered = newOrder
      .map(id => favorites.find(f => f.id === id))
      .filter((f): f is FavoriteItem => f !== undefined);
    
    setFavorites(reordered);
    await saveFavorites(reordered);
  }, [favorites]);

  // Get favorites sorted by recent usage
  const getRecentlyUsed = useCallback(() => {
    return [...favorites]
      .filter(f => f.lastUsedAt)
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  }, [favorites]);

  // Get favorites sorted by frequency
  const getMostUsed = useCallback(() => {
    return [...favorites].sort((a, b) => b.usageCount - a.usageCount);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    canAddMore: favorites.length < MAX_FAVORITES,
    maxFavorites: MAX_FAVORITES,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    recordUsage,
    reorderFavorites,
    getRecentlyUsed,
    getMostUsed,
  };
}
