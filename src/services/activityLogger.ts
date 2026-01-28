/**
 * Activity Logging Service
 * 
 * Comprehensive logging of all user activities with backend sync.
 * Tracks sessions, completions, durations, and user journey.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';
import logger from './logger';

// =============================================================================
// TYPES
// =============================================================================

export type ActivityCategory = 
  | 'breathing'
  | 'grounding'
  | 'reset'
  | 'focus'
  | 'journal'
  | 'mood'
  | 'story'
  | 'ritual'
  | 'sos';

export interface ActivityLog {
  id: string;
  category: ActivityCategory;
  activityId: string;
  activityName: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  completed: boolean;
  metadata?: Record<string, any>;
  isSynced: boolean;
}

export interface ActivityStats {
  today: {
    sessions: number;
    minutes: number;
    byCategory: Record<ActivityCategory, number>;
  };
  thisWeek: {
    sessions: number;
    minutes: number;
    byCategory: Record<ActivityCategory, number>;
    dailyBreakdown: Record<string, number>;
  };
  allTime: {
    sessions: number;
    minutes: number;
    byCategory: Record<ActivityCategory, number>;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  ACTIVITY_LOG: '@restorae:activity_log',
  ACTIVITY_STATS: '@restorae:activity_stats',
  LAST_SYNC: '@restorae:activity_last_sync',
};

const DEFAULT_STATS: ActivityStats = {
  today: { sessions: 0, minutes: 0, byCategory: {} as Record<ActivityCategory, number> },
  thisWeek: { sessions: 0, minutes: 0, byCategory: {} as Record<ActivityCategory, number>, dailyBreakdown: {} },
  allTime: { sessions: 0, minutes: 0, byCategory: {} as Record<ActivityCategory, number> },
};

// =============================================================================
// ACTIVITY LOGGER SERVICE
// =============================================================================

class ActivityLoggerService {
  private logs: ActivityLog[] = [];
  private stats: ActivityStats = DEFAULT_STATS;
  private isInitialized = false;

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [logsData, statsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_STATS),
      ]);

      if (logsData) {
        this.logs = JSON.parse(logsData);
        // Keep only last 30 days of logs locally
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        this.logs = this.logs.filter(log => new Date(log.completedAt) > thirtyDaysAgo);
      }

      if (statsData) {
        this.stats = JSON.parse(statsData);
      }

      // Reset daily stats if new day
      this.checkDailyReset();

      this.isInitialized = true;
      logger.info(`ActivityLogger initialized with ${this.logs.length} logs`);

      // Try to sync unsynced logs
      this.syncPendingLogs();
    } catch (error) {
      logger.error('ActivityLogger initialization failed:', error);
      this.isInitialized = true; // Continue anyway
    }
  }

  private checkDailyReset(): void {
    const today = new Date().toDateString();
    const lastLogDate = this.logs.length > 0 
      ? new Date(this.logs[0].completedAt).toDateString() 
      : null;

    if (lastLogDate !== today) {
      // New day, reset daily stats
      this.stats.today = { 
        sessions: 0, 
        minutes: 0, 
        byCategory: {} as Record<ActivityCategory, number> 
      };
    }
  }

  // ---------------------------------------------------------------------------
  // LOGGING
  // ---------------------------------------------------------------------------

  /**
   * Log a completed activity
   */
  async logActivity(params: {
    category: ActivityCategory;
    activityId: string;
    activityName: string;
    startedAt: Date | number;
    durationSeconds: number;
    completed: boolean;
    metadata?: Record<string, any>;
  }): Promise<ActivityLog> {
    await this.initialize();

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: params.category,
      activityId: params.activityId,
      activityName: params.activityName,
      startedAt: typeof params.startedAt === 'number' 
        ? new Date(params.startedAt).toISOString()
        : params.startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: params.durationSeconds,
      completed: params.completed,
      metadata: params.metadata,
      isSynced: false,
    };

    // Add to local logs
    this.logs.unshift(log);
    await this.saveLogs();

    // Update stats
    await this.updateStats(log);

    // Try to sync to server
    this.syncLog(log);

    logger.info(`Activity logged: ${params.category}/${params.activityName} (${params.durationSeconds}s)`);

    return log;
  }

  /**
   * Log an abandoned/incomplete session
   */
  async logAbandoned(params: {
    category: ActivityCategory;
    activityId: string;
    activityName: string;
    startedAt: Date | number;
    durationSeconds: number;
    reason?: string;
  }): Promise<void> {
    await this.logActivity({
      ...params,
      completed: false,
      metadata: { abandonedReason: params.reason },
    });
  }

  // ---------------------------------------------------------------------------
  // STATS
  // ---------------------------------------------------------------------------

  private async updateStats(log: ActivityLog): Promise<void> {
    const minutes = Math.round(log.durationSeconds / 60);

    // Update today stats
    this.stats.today.sessions++;
    this.stats.today.minutes += minutes;
    this.stats.today.byCategory[log.category] = 
      (this.stats.today.byCategory[log.category] || 0) + 1;

    // Update weekly stats
    this.stats.thisWeek.sessions++;
    this.stats.thisWeek.minutes += minutes;
    this.stats.thisWeek.byCategory[log.category] = 
      (this.stats.thisWeek.byCategory[log.category] || 0) + 1;
    
    const dayKey = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    this.stats.thisWeek.dailyBreakdown[dayKey] = 
      (this.stats.thisWeek.dailyBreakdown[dayKey] || 0) + 1;

    // Update all-time stats
    this.stats.allTime.sessions++;
    this.stats.allTime.minutes += minutes;
    this.stats.allTime.byCategory[log.category] = 
      (this.stats.allTime.byCategory[log.category] || 0) + 1;

    await this.saveStats();
  }

  getStats(): ActivityStats {
    return { ...this.stats };
  }

  getTodayStats(): ActivityStats['today'] {
    return { ...this.stats.today };
  }

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  getRecentLogs(limit = 20): ActivityLog[] {
    return this.logs.slice(0, limit);
  }

  getLogsByCategory(category: ActivityCategory, limit = 50): ActivityLog[] {
    return this.logs.filter(log => log.category === category).slice(0, limit);
  }

  getTodayLogs(): ActivityLog[] {
    const today = new Date().toDateString();
    return this.logs.filter(log => new Date(log.completedAt).toDateString() === today);
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  private async saveLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(this.logs));
    } catch (error) {
      logger.error('Failed to save activity logs:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_STATS, JSON.stringify(this.stats));
    } catch (error) {
      logger.error('Failed to save activity stats:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // SYNC
  // ---------------------------------------------------------------------------

  private async syncLog(log: ActivityLog): Promise<void> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      // Will be synced later via syncPendingLogs
      logger.info('Offline - activity log will be synced later');
      return;
    }

    try {
      await api.logActivity({
        category: log.category,
        activityType: log.activityName,
        activityId: log.activityId,
        duration: log.durationSeconds,
        completed: log.completed,
        metadata: {
          ...log.metadata,
          startedAt: log.startedAt,
          completedAt: log.completedAt,
        },
        timestamp: log.completedAt,
      });

      // Mark as synced
      const index = this.logs.findIndex(l => l.id === log.id);
      if (index !== -1) {
        this.logs[index].isSynced = true;
        await this.saveLogs();
      }
    } catch (error) {
      // Will be retried via syncPendingLogs
      logger.error('Failed to sync activity log:', error);
    }
  }

  private async syncPendingLogs(): Promise<void> {
    const unsynced = this.logs.filter(log => !log.isSynced);
    if (unsynced.length === 0) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) return;

    logger.info(`Syncing ${unsynced.length} pending activity logs`);

    for (const log of unsynced) {
      await this.syncLog(log);
    }
  }

  /**
   * Force sync all pending logs
   */
  async forceSyncAll(): Promise<void> {
    await this.syncPendingLogs();
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const activityLogger = new ActivityLoggerService();
export default activityLogger;
