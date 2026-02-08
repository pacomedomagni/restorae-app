/**
 * useSessionPersistence - Save/restore session state on app background
 *
 * Saves session progress to AsyncStorage when the app goes to background.
 * Restores on foreground so users can resume where they left off.
 */
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTENCE_KEY_PREFIX = '@restorae/session_state_';

interface SessionState {
  phase: string;
  progress: number;
  startTime: number;
  customData?: Record<string, any>;
}

interface UseSessionPersistenceConfig {
  sessionType: string;
  sessionId: string;
  enabled: boolean;
  onRestore: (savedState: SessionState) => void;
}

interface UseSessionPersistenceReturn {
  saveState: (state: SessionState) => void;
  clearState: () => void;
}

export function useSessionPersistence(config: UseSessionPersistenceConfig): UseSessionPersistenceReturn {
  const { sessionType, sessionId, enabled, onRestore } = config;
  const storageKey = `${PERSISTENCE_KEY_PREFIX}${sessionType}_${sessionId}`;
  const latestStateRef = useRef<SessionState | null>(null);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Attempt restore on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          const parsed: SessionState = JSON.parse(saved);
          // Only restore if saved within last 30 minutes
          if (Date.now() - parsed.startTime < 30 * 60 * 1000) {
            onRestoreRef.current(parsed);
          }
          await AsyncStorage.removeItem(storageKey);
        }
      } catch {
        // Silently fail — session persistence is best-effort
      }
    };

    restore();
  }, [storageKey]);

  // Save to storage when app backgrounds
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background' && enabled && latestStateRef.current) {
        try {
          await AsyncStorage.setItem(storageKey, JSON.stringify(latestStateRef.current));
        } catch {
          // Best-effort
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [storageKey, enabled]);

  const saveState = useCallback((state: SessionState) => {
    latestStateRef.current = state;
  }, []);

  const clearState = useCallback(async () => {
    latestStateRef.current = null;
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch {
      // Best-effort
    }
  }, [storageKey]);

  return { saveState, clearState };
}

export default useSessionPersistence;
