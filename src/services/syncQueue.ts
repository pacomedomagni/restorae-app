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
        const response = await api.batchSync(batch);
        
        if (response.data?.results) {
           const successIds = response.data.results
             .filter((r: any) => r.success)
             .map((r: any) => r.id);
             
           const failedIds = response.data.results
             .filter((r: any) => !r.success)
             .map((r: any) => r.id);
             
           this.queue = this.queue.filter(op => !successIds.includes(op.id));
           
           this.queue = this.queue.map(op => {
             if (failedIds.includes(op.id)) {
               return { ...op, retryCount: op.retryCount + 1 };
             }
             return op;
           });
           
           this.queue = this.queue.filter(op => op.retryCount < MAX_RETRIES);
           
           await this.saveQueue();
        }
      } catch (error) {
        logger.error('Batch sync failed:', error);
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
