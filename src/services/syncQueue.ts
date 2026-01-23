/**
 * SyncQueue Utility
 * 
 * Manages a queue of pending API operations for offline-first sync.
 * Automatically retries failed operations when connection is restored.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import logger from './logger';

// Extended operation types to support ritual-specific actions
export type SyncOperationType = 
  | 'create' | 'update' | 'delete'
  | 'create_ritual' | 'update_ritual' | 'delete_ritual'
  | 'archive_ritual' | 'unarchive_ritual' | 'toggle_favorite'
  | 'complete_ritual';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: 'mood' | 'journal' | 'ritual' | 'completion';
  data: any;
  localId?: string;
  createdAt: string;
  retryCount: number;
}

const SYNC_QUEUE_KEY = '@restorae/sync_queue';
const MAX_RETRIES = 3;

class SyncQueueManager {
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private listeners: Set<(queue: SyncOperation[]) => void> = new Set();

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

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) return;

    this.isProcessing = true;

    try {
      // Process in order (oldest first)
      const sortedQueue = [...this.queue].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const operation of sortedQueue) {
        if (!executor) break;

        try {
          const result = await executor(operation);
          if (result.success) {
            await this.removeFromQueue(operation.id);
          } else {
            operation.retryCount++;
            if (operation.retryCount >= MAX_RETRIES) {
              logger.warn(`Sync operation ${operation.id} failed after ${MAX_RETRIES} retries`);
              await this.removeFromQueue(operation.id);
            } else {
              await this.saveQueue();
            }
          }
        } catch (error) {
          logger.error(`Sync operation ${operation.id} failed:`, error);
          operation.retryCount++;
          if (operation.retryCount >= MAX_RETRIES) {
            await this.removeFromQueue(operation.id);
          } else {
            await this.saveQueue();
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async clearQueue() {
    this.queue = [];
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    this.notifyListeners();
  }
}

export const syncQueue = new SyncQueueManager();

// Initialize on module load
syncQueue.initialize();

export default syncQueue;
