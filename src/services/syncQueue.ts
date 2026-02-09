/**
 * SyncQueue Utility
 * 
 * Manages a queue of pending API operations for offline-first sync.
 * Automatically retries failed operations when connection is restored.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import logger from './logger';
import { api } from './api';

// Extended operation types to support ritual-specific actions
export type SyncOperationType = 
  | 'create' | 'update' | 'delete'
  | 'create_ritual' | 'update_ritual' | 'delete_ritual'
  | 'archive_ritual' | 'unarchive_ritual' | 'toggle_favorite'
  | 'complete_ritual';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: 'mood' | 'journal' | 'ritual' | 'completion' | 'session';
  data: Record<string, unknown>;
  localId?: string;
  createdAt: string;
  retryCount: number;
}

const SYNC_QUEUE_KEY = '@restorae/sync_queue';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1s base delay for exponential backoff

class SyncQueueManager {
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private listeners: Set<(queue: SyncOperation[]) => void> = new Set();
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Calculate delay with exponential backoff + jitter */
  private getRetryDelay(retryCount: number): number {
    const exponentialDelay = BASE_DELAY_MS * Math.pow(2, retryCount);
    const jitter = Math.random() * BASE_DELAY_MS;
    return Math.min(exponentialDelay + jitter, 60_000); // cap at 60s
  }

  async initialize() {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      logger.error('Failed to load sync queue:', error);
    }

    // Listen for network restoration
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.processQueue();
      }
    });
  }

  async addToQueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount'>) {
    const op: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.queue.push(op);
    await this.saveQueue();
    this.notifyListeners();

    // Try to process immediately if online
    this.processQueue();
  }

  async removeFromQueue(id: string) {
    this.queue = this.queue.filter((op) => op.id !== id);
    await this.saveQueue();
    this.notifyListeners();
  }

  async updateLocalId(syncId: string, serverId: string) {
    const op = this.queue.find((o) => o.id === syncId);
    if (op) {
      op.data.serverId = serverId;
      await this.saveQueue();
    }
  }

  getQueue(): SyncOperation[] {
    return [...this.queue];
  }

  getPendingForEntity(entity: SyncOperation['entity']): SyncOperation[] {
    return this.queue.filter((op) => op.entity === entity);
  }

  hasPendingOperations(): boolean {
    return this.queue.length > 0;
  }

  subscribe(listener: (queue: SyncOperation[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.queue]));
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save sync queue:', error);
    }
  }

  async processQueue(executor?: (op: SyncOperation) => Promise<{ success: boolean; serverId?: string }>) {
    if (this.isProcessing || this.queue.length === 0) return;

    // Use custom executor if provided (for context-specific processing)
    if (executor) {
       return this.processQueueWithExecutor(executor);
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) return;

    this.isProcessing = true;

    try {
      const sortedQueue = [...this.queue].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const batch = sortedQueue.slice(0, 50);

      try {
        const response = await api.batchSync(batch as unknown as Array<Record<string, unknown>>);

        if (response.data?.results) {
           const successIds = response.data.results
             .filter((r: { success: boolean }) => r.success)
             .map((r: { id: string }) => r.id);

           const failedIds = response.data.results
             .filter((r: { success: boolean }) => !r.success)
             .map((r: { id: string }) => r.id);

           this.queue = this.queue.filter(op => !successIds.includes(op.id));

           this.queue = this.queue.map(op => {
             if (failedIds.includes(op.id)) {
               return { ...op, retryCount: op.retryCount + 1 };
             }
             return op;
           });

           this.queue = this.queue.filter(op => op.retryCount < MAX_RETRIES);

           await this.saveQueue();

           // Schedule retry with backoff if there are still failed items
           const maxRetry = Math.max(0, ...this.queue.map(op => op.retryCount));
           if (this.queue.length > 0 && maxRetry > 0) {
             this.scheduleRetry(maxRetry);
           }
        }
      } catch (error) {
        // Network-level failure — increment all batch items and schedule backoff retry
        logger.error('Batch sync failed:', error);
        const maxRetry = Math.max(0, ...batch.map(op => op.retryCount));
        this.queue = this.queue.map(op => {
          if (batch.some(b => b.id === op.id)) {
            return { ...op, retryCount: op.retryCount + 1 };
          }
          return op;
        });
        this.queue = this.queue.filter(op => op.retryCount < MAX_RETRIES);
        await this.saveQueue();
        if (this.queue.length > 0) {
          this.scheduleRetry(maxRetry + 1);
        }
      }

    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  // Process queue with a custom executor function
  private async processQueueWithExecutor(executor: (op: SyncOperation) => Promise<{ success: boolean; serverId?: string }>) {
      try {
      const sortedQueue = [...this.queue].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const operation of sortedQueue) {
        try {
          const result = await executor(operation);
          if (result.success) {
            await this.removeFromQueue(operation.id);
          } else {
            operation.retryCount++;
            if (operation.retryCount >= MAX_RETRIES) {
              await this.removeFromQueue(operation.id);
            } else {
              await this.saveQueue();
            }
          }
        } catch (error) {
            operation.retryCount++;
            await this.saveQueue();
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  /** Schedule a retry with exponential backoff */
  private scheduleRetry(retryCount: number) {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    const delay = this.getRetryDelay(retryCount);
    logger.info(`Sync retry scheduled in ${Math.round(delay / 1000)}s (attempt ${retryCount})`);
    this.retryTimeoutId = setTimeout(() => {
      this.retryTimeoutId = null;
      this.processQueue();
    }, delay);
  }

  async clearQueue() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.queue = [];
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    this.notifyListeners();
  }
}

export const syncQueue = new SyncQueueManager();

// Initialize on module load
syncQueue.initialize();

export default syncQueue;
