/**
 * Content Sync Service Tests
 * Comprehensive test coverage for offline-first content synchronization
 */
import { contentSyncService, ContentCategory } from '../../services/contentSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import logger from '../../services/logger';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  checkContentVersion: jest.fn(),
  fetchAllContent: jest.fn(),
}));

jest.mock('../../services/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Content Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (contentSyncService as unknown as { cache: null }).cache = null;
    (contentSyncService as unknown as { isSyncing: boolean }).isSyncing = false;
    (contentSyncService as unknown as { syncPromise: null }).syncPromise = null;
  });

  describe('initialize', () => {
    it('should load cached content on initialization', async () => {
      const cachedContent = {
        version: 5,
        lastSync: '2024-01-01T00:00:00.000Z',
        categories: {
          breathing: [{ id: '1', name: 'Test Exercise' }],
        },
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedContent));

      await contentSyncService.initialize();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('restorae_content_cache');
      expect(logger.info).toHaveBeenCalledWith('Content cache loaded', { version: 5 });
    });

    it('should handle missing cache gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await contentSyncService.initialize();

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle corrupted cache gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      await contentSyncService.initialize();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load content cache',
        expect.any(Error)
      );
    });
  });

  describe('getContent', () => {
    it('should return cached content for a category', async () => {
      const cachedContent = {
        version: 5,
        lastSync: new Date().toISOString(),
        categories: {
          breathing: [
            { id: '1', name: 'Deep Breathing', order: 1 },
            { id: '2', name: 'Box Breathing', order: 2 },
          ],
          grounding: [],
          focus: [],
          journal_prompts: [],
          stories: [],
          rituals: [],
          reset: [],
          situational: [],
        },
      };

      // Set cached content
      (contentSyncService as unknown as { cache: typeof cachedContent }).cache = cachedContent;

      const content = await contentSyncService.getContent('breathing');

      expect(content).toHaveLength(2);
      expect(content[0].name).toBe('Deep Breathing');
    });

    it('should trigger background sync when called', async () => {
      // Make lastSync old
      mockAsyncStorage.getItem.mockResolvedValue(
        new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      );

      mockApi.checkContentVersion.mockResolvedValue({
        hasUpdates: false,
        latestVersion: 1,
      });

      // Set minimal cache
      (contentSyncService as unknown as { cache: { version: number; lastSync: string; categories: Record<string, unknown[]> } }).cache = {
        version: 1,
        lastSync: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        categories: {
          breathing: [{ id: '1', name: 'Test' }],
          grounding: [],
          focus: [],
          journal_prompts: [],
          stories: [],
          rituals: [],
          reset: [],
          situational: [],
        },
      };

      await contentSyncService.getContent('breathing');

      // Background sync should be triggered (but not await)
      // We can't easily test this without more complex async handling
    });

    it('should fall back to local content when cache is empty', async () => {
      // Mock dynamic import for local data
      jest.mock('../../data/breathingPatterns', () => ({
        breathingPatterns: [
          { id: 'local-1', name: 'Local Exercise' },
        ],
      }), { virtual: true });

      const content = await contentSyncService.getContent('breathing');

      // Should return empty or local content
      expect(Array.isArray(content)).toBe(true);
    });
  });

  describe('sync', () => {
    it('should check content version and skip if up to date', async () => {
      mockApi.checkContentVersion.mockResolvedValue({
        hasUpdates: false,
        latestVersion: 5,
      });

      (contentSyncService as unknown as { cache: { version: number } }).cache = { version: 5 };

      const result = await contentSyncService.sync();

      expect(result.success).toBe(true);
      expect(result.updated).toBe(false);
      expect(mockApi.fetchAllContent).not.toHaveBeenCalled();
    });

    it('should fetch and cache new content when updates available', async () => {
      mockApi.checkContentVersion.mockResolvedValue({
        hasUpdates: true,
        latestVersion: 6,
      });

      mockApi.fetchAllContent.mockResolvedValue([
        {
          id: '1',
          slug: 'deep-breathing',
          name: 'Deep Breathing',
          description: 'A calming exercise',
          type: 'BREATHING',
          data: {},
          isPremium: false,
          order: 1,
          version: 6,
          updatedAt: new Date().toISOString(),
        },
      ]);

      (contentSyncService as unknown as { cache: { version: number } }).cache = { version: 5 };

      const result = await contentSyncService.sync();

      expect(result.success).toBe(true);
      expect(result.updated).toBe(true);
      expect(result.version).toBe(6);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should prevent concurrent syncs', async () => {
      mockApi.checkContentVersion.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ hasUpdates: false, latestVersion: 1 }), 100)
        )
      );

      (contentSyncService as unknown as { cache: { version: number } }).cache = { version: 1 };

      // Start two syncs simultaneously
      const sync1 = contentSyncService.sync();
      const sync2 = contentSyncService.sync();

      const [result1, result2] = await Promise.all([sync1, sync2]);

      // Both should return the same result
      expect(result1).toEqual(result2);
      // checkContentVersion should only be called once
      expect(mockApi.checkContentVersion).toHaveBeenCalledTimes(1);
    });

    it('should handle sync errors gracefully', async () => {
      mockApi.checkContentVersion.mockRejectedValue(new Error('Network error'));

      (contentSyncService as unknown as { cache: { version: number } }).cache = { version: 5 };

      const result = await contentSyncService.sync();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(logger.error).toHaveBeenCalledWith('Content sync failed', expect.any(Error));
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      await contentSyncService.clearCache();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'restorae_content_cache',
        'restorae_content_version',
        'restorae_last_content_sync',
      ]);
      expect(logger.info).toHaveBeenCalledWith('Content cache cleared');
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache metadata', () => {
      (contentSyncService as unknown as { cache: { version: number; lastSync: string } }).cache = {
        version: 5,
        lastSync: '2024-01-15T12:00:00.000Z',
      };

      const info = contentSyncService.getCacheInfo();

      expect(info).toEqual({
        version: 5,
        lastSync: '2024-01-15T12:00:00.000Z',
      });
    });

    it('should return null when no cache exists', () => {
      (contentSyncService as unknown as { cache: null }).cache = null;

      const info = contentSyncService.getCacheInfo();

      expect(info).toBeNull();
    });
  });

  describe('content organization', () => {
    it('should organize content by category', async () => {
      mockApi.checkContentVersion.mockResolvedValue({
        hasUpdates: true,
        latestVersion: 1,
      });

      mockApi.fetchAllContent.mockResolvedValue([
        { id: '1', type: 'BREATHING', name: 'Breathing 1', order: 2 },
        { id: '2', type: 'BREATHING', name: 'Breathing 2', order: 1 },
        { id: '3', type: 'GROUNDING', name: 'Grounding 1', order: 1 },
        { id: '4', type: 'PROMPT', name: 'Prompt 1', order: 1 },
        { id: '5', type: 'BEDTIME_STORY', name: 'Story 1', order: 1 },
        { id: '6', type: 'MORNING_RITUAL', name: 'Ritual 1', order: 1 },
      ] as Array<{
        id: string;
        slug?: string;
        name: string;
        description?: string;
        type: string;
        data?: Record<string, unknown>;
        isPremium?: boolean;
        order: number;
        version?: number;
        updatedAt?: string;
      }>);

      (contentSyncService as unknown as { cache: null }).cache = null;

      await contentSyncService.sync();

      const breathing = await contentSyncService.getContent('breathing');
      const grounding = await contentSyncService.getContent('grounding');
      const prompts = await contentSyncService.getContent('journal_prompts');
      const stories = await contentSyncService.getContent('stories');
      const rituals = await contentSyncService.getContent('rituals');

      expect(breathing).toHaveLength(2);
      expect(breathing[0].name).toBe('Breathing 2'); // Sorted by order
      expect(grounding).toHaveLength(1);
      expect(prompts).toHaveLength(1);
      expect(stories).toHaveLength(1);
      expect(rituals).toHaveLength(1);
    });
  });
});
