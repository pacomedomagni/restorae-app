/**
 * Content Sync Service
 * 
 * Manages synchronization between local static content and remote CMS.
 * Provides offline-first experience with background updates.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';
import api from './api';

// Storage keys
const CONTENT_CACHE_KEY = 'restorae_content_cache';
const CONTENT_VERSION_KEY = 'restorae_content_version';
const LAST_SYNC_KEY = 'restorae_last_content_sync';

// Content types that can be synced
export type ContentCategory = 
  | 'breathing'
  | 'grounding'
  | 'focus'
  | 'journal_prompts'
  | 'stories'
  | 'rituals'
  | 'reset'
  | 'situational';

export interface ContentItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  data: Record<string, unknown>;
  isPremium: boolean;
  order: number;
  version: number;
  updatedAt: string;
}

export interface ContentCache {
  version: number;
  lastSync: string;
  categories: Record<ContentCategory, ContentItem[]>;
}

interface SyncResult {
  success: boolean;
  updated: boolean;
  version: number;
  error?: string;
}

class ContentSyncService {
  private cache: ContentCache | null = null;
  private isSyncing = false;
  private syncPromise: Promise<SyncResult> | null = null;

  /**
   * Initialize the service and load cached content
   */
  async initialize(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        logger.info('Content cache loaded', { version: this.cache?.version });
      }
    } catch (error) {
      logger.error('Failed to load content cache', error);
    }
  }

  /**
   * Get content for a specific category
   * Returns cached content immediately, triggers background sync
   */
  async getContent(category: ContentCategory): Promise<ContentItem[]> {
    // Trigger background sync if needed
    this.backgroundSync();

    // Return cached content
    if (this.cache?.categories[category]) {
      return this.cache.categories[category];
    }

    // Fall back to local static data
    return this.getLocalContent(category);
  }

  /**
   * Force a sync with the server
   */
  async sync(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.performSync();
    
    try {
      return await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, updated: false, version: this.cache?.version || 0 };
    }

    this.isSyncing = true;
    
    try {
      // Get current version
      const currentVersion = this.cache?.version || 0;

      // Check for updates
      const versionCheck = await api.checkContentVersion(currentVersion);
      
      if (!versionCheck.hasUpdates) {
        logger.debug('Content is up to date', { version: currentVersion });
        return { success: true, updated: false, version: currentVersion };
      }

      // Fetch updated content
      const newContent = await api.fetchAllContent();

      // Update cache
      this.cache = {
        version: versionCheck.latestVersion,
        lastSync: new Date().toISOString(),
        categories: this.organizeByCategory(newContent),
      };

      // Persist to storage
      await AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(this.cache));
      await AsyncStorage.setItem(CONTENT_VERSION_KEY, String(this.cache.version));
      await AsyncStorage.setItem(LAST_SYNC_KEY, this.cache.lastSync);

      logger.info('Content sync completed', { 
        version: this.cache.version,
        itemCount: newContent.length,
      });

      return { success: true, updated: true, version: this.cache.version };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Content sync failed', error);
      return { 
        success: false, 
        updated: false, 
        version: this.cache?.version || 0,
        error: message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Background sync - runs periodically or when app becomes active
   */
  private async backgroundSync(): Promise<void> {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    
    if (lastSync) {
      const lastSyncTime = new Date(lastSync).getTime();
      const hoursSinceSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60);
      
      // Sync every 24 hours
      if (hoursSinceSync < 24) {
        return;
      }
    }

    // Don't await - let it run in background
    this.sync().catch((error) => {
      logger.error('Background sync failed', error);
    });
  }

  /**
   * Organize content items by category
   */
  private organizeByCategory(items: ContentItem[]): Record<ContentCategory, ContentItem[]> {
    const categories: Record<ContentCategory, ContentItem[]> = {
      breathing: [],
      grounding: [],
      focus: [],
      journal_prompts: [],
      stories: [],
      rituals: [],
      reset: [],
      situational: [],
    };

    for (const item of items) {
      const category = this.mapTypeToCategory(item.type);
      if (category && categories[category]) {
        categories[category].push(item);
      }
    }

    // Sort by order within each category
    for (const category of Object.keys(categories) as ContentCategory[]) {
      categories[category].sort((a, b) => a.order - b.order);
    }

    return categories;
  }

  /**
   * Map content type to category
   */
  private mapTypeToCategory(type: string): ContentCategory | null {
    const mapping: Record<string, ContentCategory> = {
      BREATHING: 'breathing',
      GROUNDING: 'grounding',
      FOCUS: 'focus',
      PROMPT: 'journal_prompts',
      BEDTIME_STORY: 'stories',
      MORNING_RITUAL: 'rituals',
      EVENING_RITUAL: 'rituals',
      RESET: 'reset',
      SITUATIONAL: 'situational',
    };

    return mapping[type] || null;
  }

  /**
   * Get local static content as fallback
   */
  private async getLocalContent(category: ContentCategory): Promise<ContentItem[]> {
    // Import local data modules dynamically
    try {
      switch (category) {
        case 'breathing': {
          const { breathingPatterns } = await import('../data/breathingPatterns');
          return this.convertToContentItems(breathingPatterns, 'BREATHING');
        }
        case 'grounding': {
          const { groundingTechniques } = await import('../data/groundingTechniques');
          return this.convertToContentItems(groundingTechniques, 'GROUNDING');
        }
        case 'focus': {
          const { focusSessions } = await import('../data/focusSessions');
          return this.convertToContentItems(focusSessions, 'FOCUS');
        }
        case 'journal_prompts': {
          const { journalPrompts } = await import('../data/journalPrompts');
          return this.convertToContentItems(journalPrompts, 'PROMPT');
        }
        default:
          return [];
      }
    } catch (error) {
      logger.error(`Failed to load local content for ${category}`, error);
      return [];
    }
  }

  /**
   * Convert local data format to ContentItem
   */
  private convertToContentItems(items: unknown[], type: string): ContentItem[] {
    return (items as Record<string, unknown>[]).map((item, index) => ({
      id: (item.id as string) || `local-${type}-${index}`,
      slug: (item.slug as string) || (item.id as string) || `${type}-${index}`,
      name: (item.name as string) || (item.title as string) || '',
      description: (item.description as string) || '',
      type,
      data: item,
      isPremium: (item.isPremium as boolean) || false,
      order: (item.order as number) || index,
      version: 1,
      updatedAt: new Date().toISOString(),
    }));
  }

  /**
   * Clear the content cache
   */
  async clearCache(): Promise<void> {
    this.cache = null;
    await AsyncStorage.multiRemove([
      CONTENT_CACHE_KEY,
      CONTENT_VERSION_KEY,
      LAST_SYNC_KEY,
    ]);
    logger.info('Content cache cleared');
  }

  /**
   * Get cache metadata
   */
  getCacheInfo(): { version: number; lastSync: string | null } | null {
    if (!this.cache) return null;
    return {
      version: this.cache.version,
      lastSync: this.cache.lastSync,
    };
  }
}

export const contentSyncService = new ContentSyncService();
export default contentSyncService;
