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
import { useState, useEffect, useCallback, useRef } from 'react';
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
// SHARED STORE (keeps multiple hook instances in sync)
// =============================================================================

type FavoritesSubscriber = (items: FavoriteItem[]) => void;

const favoritesSubscribers = new Set<FavoritesSubscriber>();
let sharedFavorites: FavoriteItem[] = [];
let sharedHydrated = false;
let sharedHydrating: Promise<FavoriteItem[]> | null = null;

function isAllowedFavoriteType(type: unknown): type is FavoriteItem['type'] {
  return (
    type === 'breathing' ||
    type === 'grounding' ||
    type === 'reset' ||
    type === 'focus' ||
    type === 'journal' ||
    type === 'stories' ||
    type === 'sos'
  );
}

function normalizeFavorites(value: unknown): FavoriteItem[] {
  const rawItems = Array.isArray(value) ? value : (value as FavoritesState | null)?.items;
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const id = typeof item.id === 'string' ? item.id : null;
      const type = isAllowedFavoriteType(item.type) ? item.type : null;
      const name = typeof item.name === 'string' ? item.name : null;
      const icon = typeof item.icon === 'string' ? item.icon : null;
      const route = typeof item.route === 'string' ? item.route : null;
      if (!id || !type || !name || !icon || !route) return null;

      return {
        id,
        type,
        name,
        icon,
        route,
        ...(typeof item.routeParams === 'object' && item.routeParams !== null
          ? { routeParams: item.routeParams as Record<string, any> }
          : {}),
        addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
        usageCount: typeof item.usageCount === 'number' ? item.usageCount : 0,
        ...(typeof item.lastUsedAt === 'number' ? { lastUsedAt: item.lastUsedAt } : {}),
      } satisfies FavoriteItem;
    })
    .filter((item): item is FavoriteItem => item !== null)
    .slice(0, MAX_FAVORITES);
}

async function saveFavoritesToStorage(items: FavoriteItem[]) {
  try {
    const state: FavoritesState = { items, maxItems: MAX_FAVORITES };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

function setSharedFavorites(items: FavoriteItem[]) {
  sharedFavorites = items;
  sharedHydrated = true;
  favoritesSubscribers.forEach((subscriber) => subscriber(items));
}

async function hydrateSharedFavorites(): Promise<FavoriteItem[]> {
  if (sharedHydrated) return sharedFavorites;
  if (sharedHydrating) return sharedHydrating;

  sharedHydrating = (async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setSharedFavorites([]);
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    const normalized = normalizeFavorites(parsed);
    setSharedFavorites(normalized);
    return normalized;
  })()
    .catch((error) => {
      console.error('Failed to load favorites:', error);
      setSharedFavorites([]);
      return [];
    })
    .finally(() => {
      sharedHydrating = null;
    });

  return sharedHydrating;
}

// =============================================================================
// HOOK
// =============================================================================

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(
    sharedHydrated ? sharedFavorites : []
  );
  const [isLoading, setIsLoading] = useState(!sharedHydrated);
  const { impactMedium, notificationSuccess } = useHaptics();
  const favoritesRef = useRef<FavoriteItem[]>(sharedHydrated ? sharedFavorites : []);

  useEffect(() => {
    const subscriber: FavoritesSubscriber = (items) => {
      favoritesRef.current = items;
      setFavorites(items);
      setIsLoading(false);
    };
    favoritesSubscribers.add(subscriber);
    return () => {
      favoritesSubscribers.delete(subscriber);
    };
  }, []);

  // Hydrate favorites once (shared across all hook instances)
  useEffect(() => {
    if (sharedHydrated) {
      setIsLoading(false);
      return;
    }
    hydrateSharedFavorites().then((items) => {
      favoritesRef.current = items;
      setFavorites(items);
      setIsLoading(false);
    });
  }, []);

  const commitFavorites = useCallback(
    async (items: FavoriteItem[]) => {
      favoritesRef.current = items;
      setFavorites(items);
      setSharedFavorites(items);
      await saveFavoritesToStorage(items);
    },
    []
  );

  // Add a favorite
  const addFavorite = useCallback(async (item: Omit<FavoriteItem, 'addedAt' | 'usageCount'>) => {
    const current = favoritesRef.current;

    if (current.length >= MAX_FAVORITES) {
      return { success: false, reason: 'max_reached' };
    }

    if (current.some(f => f.id === item.id)) {
      return { success: false, reason: 'already_exists' };
    }

    const newItem: FavoriteItem = {
      ...item,
      addedAt: Date.now(),
      usageCount: 0,
    };

    const updated = [...current, newItem];
    await commitFavorites(updated);
    await impactMedium();
    await notificationSuccess();

    return { success: true };
  }, [commitFavorites, impactMedium, notificationSuccess]);

  // Remove a favorite
  const removeFavorite = useCallback(async (id: string) => {
    const current = favoritesRef.current;
    const removed = current.find(f => f.id === id);
    const updated = current.filter(f => f.id !== id);
    await commitFavorites(updated);
    await impactMedium();

    return { success: true, removed };
  }, [commitFavorites, impactMedium]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (item: Omit<FavoriteItem, 'addedAt' | 'usageCount'>) => {
    const exists = favoritesRef.current.some(f => f.id === item.id);
    if (exists) {
      return removeFavorite(item.id);
    } else {
      return addFavorite(item);
    }
  }, [addFavorite, removeFavorite]);

  // Check if item is favorite
  const isFavorite = useCallback((id: string) => {
    return favoritesRef.current.some(f => f.id === id);
  }, []);

  // Record usage (for smart suggestions)
  const recordUsage = useCallback(async (id: string) => {
    const current = favoritesRef.current;
    const updated = current.map(f => 
      f.id === id 
        ? { ...f, usageCount: f.usageCount + 1, lastUsedAt: Date.now() }
        : f
    );
    await commitFavorites(updated);
  }, [commitFavorites]);

  // Reorder favorites
  const reorderFavorites = useCallback(async (newOrder: string[]) => {
    const current = favoritesRef.current;
    const byId = new Map(current.map((f) => [f.id, f]));
    const seen = new Set<string>();

    const reordered: FavoriteItem[] = [];
    for (const id of newOrder) {
      if (seen.has(id)) continue;
      const found = byId.get(id);
      if (!found) continue;
      reordered.push(found);
      seen.add(id);
    }

    // Preserve any items not included in `newOrder` to avoid accidental data loss.
    for (const item of current) {
      if (!seen.has(item.id)) reordered.push(item);
    }

    await commitFavorites(reordered.slice(0, MAX_FAVORITES));
  }, [commitFavorites]);

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
