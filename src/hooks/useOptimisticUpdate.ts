/**
 * useOptimisticUpdate Hook
 * 
 * Provides optimistic UI update functionality with:
 * - Immediate visual feedback
 * - Automatic rollback on failure
 * - Undo toast support
 * - Offline queue support
 */
import { useState, useCallback, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useNetworkStatus } from './useNetworkStatus';
import { useHaptics } from './useHaptics';

interface OptimisticUpdateOptions<T> {
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast */
  errorMessage?: string;
  /** Whether to show undo option */
  showUndo?: boolean;
  /** Undo duration in ms */
  undoDuration?: number;
  /** Callback when update succeeds */
  onSuccess?: (result: T) => void;
  /** Callback when update fails */
  onError?: (error: Error) => void;
  /** Callback when user undoes the action */
  onUndo?: () => void;
}

interface OptimisticState<T> {
  /** Current optimistic value */
  value: T;
  /** Whether an update is in progress */
  isPending: boolean;
  /** Whether the last update failed */
  hasError: boolean;
  /** Error from the last failed update */
  error: Error | null;
}

export function useOptimisticUpdate<T>(initialValue: T) {
  const { showSuccess, showError, showUndo, showOffline } = useToast();
  const { isOffline } = useNetworkStatus();
  const { notificationSuccess, notificationError, impactLight } = useHaptics();
  
  const [state, setState] = useState<OptimisticState<T>>({
    value: initialValue,
    isPending: false,
    hasError: false,
    error: null,
  });

  const previousValueRef = useRef<T>(initialValue);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform an optimistic update
   * 
   * @param optimisticValue - The value to show immediately
   * @param updateFn - Async function that performs the actual update
   * @param options - Configuration options
   */
  const update = useCallback(async <R>(
    optimisticValue: T,
    updateFn: () => Promise<R>,
    options: OptimisticUpdateOptions<R> = {}
  ): Promise<R | null> => {
    const {
      successMessage,
      errorMessage = 'Something went wrong. Please try again.',
      showUndo: enableUndo = false,
      undoDuration = 5000,
      onSuccess,
      onError,
      onUndo,
    } = options;

    // Store previous value for potential rollback
    previousValueRef.current = state.value;

    // Apply optimistic update immediately
    setState(prev => ({
      ...prev,
      value: optimisticValue,
      isPending: true,
      hasError: false,
      error: null,
    }));

    // Haptic feedback for immediate response
    await impactLight();

    // Check offline status
    if (isOffline) {
      showOffline('Action queued. Will sync when online.', () => {
        // Retry logic
        update(optimisticValue, updateFn, options);
      });
      
      setState(prev => ({
        ...prev,
        isPending: false,
      }));
      
      return null;
    }

    try {
      const result = await updateFn();

      setState(prev => ({
        ...prev,
        isPending: false,
        hasError: false,
        error: null,
      }));

      // Success haptic
      await notificationSuccess();

      // Show success message
      if (successMessage) {
        if (enableUndo && onUndo) {
          showUndo(successMessage, async () => {
            // Rollback to previous value
            setState(prev => ({
              ...prev,
              value: previousValueRef.current,
            }));
            await impactLight();
            onUndo();
          }, undoDuration);
        } else {
          showSuccess(successMessage);
        }
      }

      onSuccess?.(result);
      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Rollback to previous value
      setState({
        value: previousValueRef.current,
        isPending: false,
        hasError: true,
        error: err,
      });

      // Error haptic
      await notificationError();

      // Show error with retry option
      showError(errorMessage, {
        onRetry: () => update(optimisticValue, updateFn, options),
      });

      onError?.(err);
      return null;
    }
  }, [state.value, isOffline, showSuccess, showError, showUndo, showOffline, impactLight, notificationSuccess, notificationError]);

  /**
   * Manually rollback to the previous value
   */
  const rollback = useCallback(() => {
    setState(prev => ({
      ...prev,
      value: previousValueRef.current,
    }));
  }, []);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      error: null,
    }));
  }, []);

  /**
   * Set value directly (for external updates)
   */
  const setValue = useCallback((newValue: T) => {
    previousValueRef.current = state.value;
    setState(prev => ({
      ...prev,
      value: newValue,
    }));
  }, [state.value]);

  return {
    ...state,
    update,
    rollback,
    clearError,
    setValue,
  };
}

/**
 * useOptimisticList - Specialized hook for list operations
 */
export function useOptimisticList<T extends { id: string }>(initialItems: T[]) {
  const { showSuccess, showError, showUndo } = useToast();
  const { notificationSuccess, notificationError, impactLight } = useHaptics();
  
  const [items, setItems] = useState(initialItems);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const previousItemsRef = useRef<T[]>(initialItems);

  /**
   * Optimistically add an item
   */
  const addItem = useCallback(async (
    item: T,
    saveFn: () => Promise<T>,
    options?: { successMessage?: string; errorMessage?: string }
  ) => {
    previousItemsRef.current = items;
    
    // Add optimistically
    setItems(prev => [item, ...prev]);
    setPendingIds(prev => new Set(prev).add(item.id));
    await impactLight();

    try {
      const savedItem = await saveFn();
      
      // Replace temp item with saved item
      setItems(prev => prev.map(i => i.id === item.id ? savedItem : i));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      
      await notificationSuccess();
      if (options?.successMessage) {
        showSuccess(options.successMessage);
      }
      
      return savedItem;
    } catch (error) {
      // Rollback
      setItems(previousItemsRef.current);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      
      await notificationError();
      showError(options?.errorMessage || 'Failed to add item', {
        onRetry: () => addItem(item, saveFn, options),
      });
      
      return null;
    }
  }, [items, impactLight, notificationSuccess, notificationError, showSuccess, showError]);

  /**
   * Optimistically remove an item with undo support
   */
  const removeItem = useCallback(async (
    itemId: string,
    deleteFn: () => Promise<void>,
    options?: { successMessage?: string; errorMessage?: string; showUndo?: boolean }
  ) => {
    previousItemsRef.current = items;
    const removedItem = items.find(i => i.id === itemId);
    
    if (!removedItem) return;

    // Remove optimistically
    setItems(prev => prev.filter(i => i.id !== itemId));
    await impactLight();

    try {
      await deleteFn();
      
      await notificationSuccess();
      
      if (options?.successMessage) {
        if (options.showUndo !== false) {
          showUndo(options.successMessage, () => {
            // Restore item
            setItems(previousItemsRef.current);
          });
        } else {
          showSuccess(options.successMessage);
        }
      }
    } catch (error) {
      // Rollback
      setItems(previousItemsRef.current);
      
      await notificationError();
      showError(options?.errorMessage || 'Failed to remove item', {
        onRetry: () => removeItem(itemId, deleteFn, options),
      });
    }
  }, [items, impactLight, notificationSuccess, notificationError, showSuccess, showError, showUndo]);

  /**
   * Optimistically update an item
   */
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<T>,
    updateFn: () => Promise<T>,
    options?: { successMessage?: string; errorMessage?: string }
  ) => {
    previousItemsRef.current = items;
    
    // Update optimistically
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, ...updates } : i
    ));
    setPendingIds(prev => new Set(prev).add(itemId));
    await impactLight();

    try {
      const updatedItem = await updateFn();
      
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      
      await notificationSuccess();
      if (options?.successMessage) {
        showSuccess(options.successMessage);
      }
      
      return updatedItem;
    } catch (error) {
      // Rollback
      setItems(previousItemsRef.current);
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      
      await notificationError();
      showError(options?.errorMessage || 'Failed to update item', {
        onRetry: () => updateItem(itemId, updates, updateFn, options),
      });
      
      return null;
    }
  }, [items, impactLight, notificationSuccess, notificationError, showSuccess, showError]);

  return {
    items,
    pendingIds,
    addItem,
    removeItem,
    updateItem,
    setItems,
    isPending: (id: string) => pendingIds.has(id),
  };
}
