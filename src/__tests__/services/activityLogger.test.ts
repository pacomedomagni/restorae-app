/**
 * ActivityLoggerService Tests
 *
 * Tests the activity logging singleton: log creation, stats accumulation,
 * query methods, abandoned sessions, and AsyncStorage persistence.
 */

// ---------------------------------------------------------------------------
// Mocks — jest.mock calls are hoisted and persist across jest.resetModules()
// ---------------------------------------------------------------------------

const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
};

const mockNetInfo = {
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
};

const mockApi = {
  logActivity: jest.fn(() => Promise.resolve({ success: true })),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@react-native-community/netinfo', () => mockNetInfo);

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: mockApi,
}));

jest.mock('../../services/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Because `ActivityLoggerService` is exported only as a singleton we need a
 * fresh instance for every test.  `jest.resetModules()` clears the module
 * cache so the class is re-evaluated (and a new singleton created).
 *
 * Our top-level jest.mock() calls are hoisted and persist, so the fresh
 * module still receives the same mock objects declared above.
 */
function getFreshActivityLogger() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { activityLogger } = require('../../services/activityLogger');
  return activityLogger;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ActivityLoggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Defaults
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(null);
    mockNetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
    mockApi.logActivity.mockResolvedValue({ success: true });
  });

  // -------------------------------------------------------------------------
  // logActivity
  // -------------------------------------------------------------------------

  describe('logActivity', () => {
    it('creates a log with correct fields', async () => {
      const activityLogger = getFreshActivityLogger();

      const log = await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'box-breathing',
        activityName: 'Box Breathing',
        startedAt: new Date('2025-01-15T10:00:00Z'),
        durationSeconds: 300,
        completed: true,
      });

      expect(log).toMatchObject({
        category: 'breathing',
        activityId: 'box-breathing',
        activityName: 'Box Breathing',
        durationSeconds: 300,
        completed: true,
        isSynced: false,
      });
      // id should be a string starting with 'log_'
      expect(log.id).toMatch(/^log_/);
      // timestamps should be ISO strings
      expect(log.startedAt).toBe('2025-01-15T10:00:00.000Z');
      expect(typeof log.completedAt).toBe('string');
    });

    it('persists logs to AsyncStorage', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'grounding',
        activityId: 'g1',
        activityName: '5-4-3-2-1',
        startedAt: Date.now(),
        durationSeconds: 120,
        completed: true,
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@restorae:activity_log',
        expect.any(String),
      );
    });

    it('updates today / thisWeek / allTime stats', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Calm Breath',
        startedAt: Date.now(),
        durationSeconds: 180,
        completed: true,
      });

      const stats = activityLogger.getStats();
      expect(stats.today.sessions).toBe(1);
      expect(stats.thisWeek.sessions).toBe(1);
      expect(stats.allTime.sessions).toBe(1);
      expect(stats.today.byCategory.breathing).toBe(1);
    });

    it('includes metadata when provided', async () => {
      const activityLogger = getFreshActivityLogger();

      const log = await activityLogger.logActivity({
        category: 'journal',
        activityId: 'j1',
        activityName: 'Evening Journal',
        startedAt: Date.now(),
        durationSeconds: 600,
        completed: true,
        metadata: { promptId: 'p42', wordCount: 120 },
      });

      expect(log.metadata).toEqual({ promptId: 'p42', wordCount: 120 });
    });

    it('accepts a numeric timestamp for startedAt', async () => {
      const activityLogger = getFreshActivityLogger();
      const ts = Date.now() - 60_000;

      const log = await activityLogger.logActivity({
        category: 'focus',
        activityId: 'f1',
        activityName: 'Deep Focus',
        startedAt: ts,
        durationSeconds: 60,
        completed: true,
      });

      expect(log.startedAt).toBe(new Date(ts).toISOString());
    });
  });

  // -------------------------------------------------------------------------
  // logAbandoned
  // -------------------------------------------------------------------------

  describe('logAbandoned', () => {
    it('creates a log with completed=false and abandonedReason in metadata', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logAbandoned({
        category: 'breathing',
        activityId: 'b2',
        activityName: 'Deep Breath',
        startedAt: Date.now(),
        durationSeconds: 45,
        reason: 'user_exit',
      });

      const logs = activityLogger.getRecentLogs(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].completed).toBe(false);
      expect(logs[0].metadata).toEqual({ abandonedReason: 'user_exit' });
    });

    it('still increments stats even for abandoned sessions', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logAbandoned({
        category: 'grounding',
        activityId: 'g1',
        activityName: '5-4-3-2-1',
        startedAt: Date.now(),
        durationSeconds: 30,
        reason: 'interrupted',
      });

      const stats = activityLogger.getStats();
      expect(stats.today.sessions).toBe(1);
      expect(stats.allTime.sessions).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Query methods
  // -------------------------------------------------------------------------

  describe('getRecentLogs', () => {
    it('returns logs up to the specified limit', async () => {
      const activityLogger = getFreshActivityLogger();

      for (let i = 0; i < 5; i++) {
        await activityLogger.logActivity({
          category: 'breathing',
          activityId: `b${i}`,
          activityName: `Breath ${i}`,
          startedAt: Date.now(),
          durationSeconds: 60,
          completed: true,
        });
      }

      expect(activityLogger.getRecentLogs(3)).toHaveLength(3);
      expect(activityLogger.getRecentLogs(10)).toHaveLength(5);
      expect(activityLogger.getRecentLogs()).toHaveLength(5); // default limit 20
    });

    it('returns most recent logs first', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'first',
        activityName: 'First',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });
      await activityLogger.logActivity({
        category: 'grounding',
        activityId: 'second',
        activityName: 'Second',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });

      const recent = activityLogger.getRecentLogs(5);
      expect(recent[0].activityId).toBe('second');
      expect(recent[1].activityId).toBe('first');
    });
  });

  describe('getLogsByCategory', () => {
    it('filters logs by category', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Breath 1',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });
      await activityLogger.logActivity({
        category: 'grounding',
        activityId: 'g1',
        activityName: 'Ground 1',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });
      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b2',
        activityName: 'Breath 2',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });

      const breathingLogs = activityLogger.getLogsByCategory('breathing');
      expect(breathingLogs).toHaveLength(2);
      breathingLogs.forEach((log: any) => expect(log.category).toBe('breathing'));

      const groundingLogs = activityLogger.getLogsByCategory('grounding');
      expect(groundingLogs).toHaveLength(1);
      expect(groundingLogs[0].category).toBe('grounding');
    });

    it('respects the limit parameter', async () => {
      const activityLogger = getFreshActivityLogger();

      for (let i = 0; i < 5; i++) {
        await activityLogger.logActivity({
          category: 'focus',
          activityId: `f${i}`,
          activityName: `Focus ${i}`,
          startedAt: Date.now(),
          durationSeconds: 60,
          completed: true,
        });
      }

      expect(activityLogger.getLogsByCategory('focus', 2)).toHaveLength(2);
    });

    it('returns empty array for category with no logs', async () => {
      const activityLogger = getFreshActivityLogger();

      // Initialize so the singleton is ready (no logs loaded)
      await activityLogger.initialize();

      expect(activityLogger.getLogsByCategory('mood')).toEqual([]);
    });
  });

  describe('getTodayLogs', () => {
    it('returns only logs from today', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Today Breath',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });

      const todayLogs = activityLogger.getTodayLogs();
      expect(todayLogs).toHaveLength(1);
      expect(todayLogs[0].activityName).toBe('Today Breath');
    });
  });

  // -------------------------------------------------------------------------
  // Stats accumulation
  // -------------------------------------------------------------------------

  describe('stats accumulation', () => {
    it('accumulates sessions and minutes across multiple logActivity calls', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Breath',
        startedAt: Date.now(),
        durationSeconds: 120, // 2 min
        completed: true,
      });

      await activityLogger.logActivity({
        category: 'grounding',
        activityId: 'g1',
        activityName: 'Ground',
        startedAt: Date.now(),
        durationSeconds: 180, // 3 min
        completed: true,
      });

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b2',
        activityName: 'Breath 2',
        startedAt: Date.now(),
        durationSeconds: 60, // 1 min
        completed: true,
      });

      const stats = activityLogger.getStats();
      expect(stats.today.sessions).toBe(3);
      expect(stats.today.minutes).toBe(6); // 2+3+1
      expect(stats.allTime.sessions).toBe(3);
      expect(stats.allTime.minutes).toBe(6);
      expect(stats.today.byCategory.breathing).toBe(2);
      expect(stats.today.byCategory.grounding).toBe(1);
    });

    it('getTodayStats returns a snapshot of today stats', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'mood',
        activityId: 'm1',
        activityName: 'Mood Check',
        startedAt: Date.now(),
        durationSeconds: 30,
        completed: true,
      });

      const todayStats = activityLogger.getTodayStats();
      expect(todayStats.sessions).toBe(1);
      expect(todayStats.byCategory.mood).toBe(1);
    });

    it('persists stats to AsyncStorage', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'focus',
        activityId: 'f1',
        activityName: 'Focus',
        startedAt: Date.now(),
        durationSeconds: 1500,
        completed: true,
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@restorae:activity_stats',
        expect.any(String),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Initialization / persistence
  // -------------------------------------------------------------------------

  describe('initialize', () => {
    it('loads logs and stats from AsyncStorage', async () => {
      const existingLog = {
        id: 'log_existing',
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Saved Breath',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationSeconds: 120,
        completed: true,
        isSynced: true,
      };

      const existingStats = {
        today: { sessions: 5, minutes: 25, byCategory: { breathing: 5 } },
        thisWeek: {
          sessions: 10,
          minutes: 50,
          byCategory: { breathing: 10 },
          dailyBreakdown: {},
        },
        allTime: { sessions: 100, minutes: 500, byCategory: { breathing: 100 } },
      };

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@restorae:activity_log') return Promise.resolve(JSON.stringify([existingLog]));
        if (key === '@restorae:activity_stats') return Promise.resolve(JSON.stringify(existingStats));
        return Promise.resolve(null);
      });
      // Prevent sync attempts from succeeding (so syncPendingLogs is a no-op)
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

      const activityLogger = getFreshActivityLogger();
      await activityLogger.initialize();

      // Should have loaded the existing log
      const logs = activityLogger.getRecentLogs(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('log_existing');

      // Stats should reflect stored values
      const stats = activityLogger.getStats();
      expect(stats.allTime.sessions).toBe(100);
    });

    it('prunes logs older than 30 days during initialization', async () => {
      const recentLog = {
        id: 'log_recent',
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Recent',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationSeconds: 60,
        completed: true,
        isSynced: true,
      };

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45);
      const oldLog = {
        id: 'log_old',
        category: 'grounding',
        activityId: 'g1',
        activityName: 'Old',
        startedAt: oldDate.toISOString(),
        completedAt: oldDate.toISOString(),
        durationSeconds: 60,
        completed: true,
        isSynced: true,
      };

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@restorae:activity_log') {
          return Promise.resolve(JSON.stringify([recentLog, oldLog]));
        }
        return Promise.resolve(null);
      });
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

      const activityLogger = getFreshActivityLogger();
      await activityLogger.initialize();

      const logs = activityLogger.getRecentLogs(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('log_recent');
    });

    it('handles AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage failure'));

      const activityLogger = getFreshActivityLogger();
      // Should not throw
      await activityLogger.initialize();

      // Should still work with empty state
      const logs = activityLogger.getRecentLogs(10);
      expect(logs).toEqual([]);
    });

    it('is idempotent — calling initialize twice does not reload data', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

      const activityLogger = getFreshActivityLogger();
      await activityLogger.initialize();
      await activityLogger.initialize();

      // getItem should only have been called during the first initialization
      // (2 calls: one for logs, one for stats)
      const getItemCalls = mockAsyncStorage.getItem.mock.calls.filter(
        (c: string[]) =>
          c[0] === '@restorae:activity_log' || c[0] === '@restorae:activity_stats',
      );
      expect(getItemCalls).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Sync behavior
  // -------------------------------------------------------------------------

  describe('sync', () => {
    it('attempts to sync log to the API after logging', async () => {
      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Sync Breath',
        startedAt: Date.now(),
        durationSeconds: 120,
        completed: true,
      });

      // Give the fire-and-forget sync promises a tick to settle
      await new Promise((r) => setTimeout(r, 50));

      expect(mockApi.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'breathing',
          activityType: 'Sync Breath',
          completed: true,
        }),
      );
    });

    it('does not call API when offline', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const activityLogger = getFreshActivityLogger();

      await activityLogger.logActivity({
        category: 'breathing',
        activityId: 'b1',
        activityName: 'Offline Breath',
        startedAt: Date.now(),
        durationSeconds: 60,
        completed: true,
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(mockApi.logActivity).not.toHaveBeenCalled();
    });
  });
});
