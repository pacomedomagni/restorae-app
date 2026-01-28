/**
 * useSessionPersistence Hook
 * 
 * Saves and restores session state when app is backgrounded/foregrounded.
 * Prevents data loss during breathing, grounding, and focus sessions.
 * 
 * Features:
 * - Auto-save on app state change
 * - Restore on mount with user prompt
 * - Cleanup on session complete
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../services/logger';

// Session types that support persistence
export type PersistableSessionType = 'breathing' | 'grounding' | 'focus';

interface SessionState {
  sessionType: PersistableSessionType;
  sessionId: string;
  phase: string;
  progress: number;
  startTime: number;
  lastSavedAt: number;
  customData?: Record<string, any>;
}

interface UseSessionPersistenceOptions {
  sessionType: PersistableSessionType;
  sessionId: string;
  enabled?: boolean;
  onRestore?: (state: SessionState) => void;
}

interface UseSessionPersistenceReturn {
  saveState: (state: Partial<SessionState>) => Promise<void>;
  clearState: () => Promise<void>;
  hasSavedSession: boolean;
  savedState: SessionState | null;
  checkForSavedSession: () => Promise<SessionState | null>;
}

const STORAGE_KEY_PREFIX = '@restorae/session_';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionPersistence({
  sessionType,
  sessionId,
  enabled = true,
  onRestore,
}: UseSessionPersistenceOptions): UseSessionPersistenceReturn {
  const [savedState, setSavedState] = useState<SessionState | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const appState = useRef(AppState.currentState);
  const currentState = useRef<Partial<SessionState>>({});

  const storageKey = `${STORAGE_KEY_PREFIX}${sessionType}`;

  // Check for existing saved session on mount
  const checkForSavedSession = useCallback(async (): Promise<SessionState | null> => {
    if (!enabled) return null;

    try {
      const saved = await AsyncStorage.getItem(storageKey);
      if (!saved) return null;

      const state: SessionState = JSON.parse(saved);
      
      // Check if session is expired
      const now = Date.now();
      if (now - state.lastSavedAt > SESSION_EXPIRY_MS) {
        await AsyncStorage.removeItem(storageKey);
        return null;
      }

      // Check if it's the same session type
      if (state.sessionType !== sessionType) {
        return null;
      }

      setSavedState(state);
      setHasSavedSession(true);
      return state;
    } catch (error) {
      logger.debug('Failed to check for saved session', { error });
      return null;
    }
  }, [enabled, sessionType, storageKey]);

  // Save current state
  const saveState = useCallback(async (state: Partial<SessionState>): Promise<void> => {
    if (!enabled) return;

    currentState.current = { ...currentState.current, ...state };

    const fullState: SessionState = {
      sessionType,
      sessionId,
      phase: 'unknown',
      progress: 0,
      startTime: Date.now(),
      ...currentState.current,
      lastSavedAt: Date.now(),
    };

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(fullState));
      logger.debug('Session state saved', { sessionType, phase: fullState.phase });
    } catch (error) {
      logger.debug('Failed to save session state', { error });
    }
  }, [enabled, sessionType, sessionId, storageKey]);

  // Clear saved state (call on session complete)
  const clearState = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setSavedState(null);
      setHasSavedSession(false);
      currentState.current = {};
      logger.debug('Session state cleared', { sessionType });
    } catch (error) {
      logger.debug('Failed to clear session state', { error });
    }
  }, [sessionType, storageKey]);

  // Handle app state changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App going to background - save state
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (currentState.current.phase && currentState.current.phase !== 'idle' && currentState.current.phase !== 'complete') {
          await saveState({});
        }
      }

      // App coming to foreground - check for restore
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const saved = await checkForSavedSession();
        if (saved && onRestore) {
          // Show restore prompt
          Alert.alert(
            'Resume Session?',
            `You have an unfinished ${sessionType} session. Would you like to continue where you left off?`,
            [
              {
                text: 'Start Fresh',
                style: 'destructive',
                onPress: () => clearState(),
              },
              {
                text: 'Resume',
                onPress: () => onRestore(saved),
              },
            ]
          );
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, sessionType, saveState, checkForSavedSession, clearState, onRestore]);

  // Check for saved session on mount
  useEffect(() => {
    checkForSavedSession();
  }, [checkForSavedSession]);

  return {
    saveState,
    clearState,
    hasSavedSession,
    savedState,
    checkForSavedSession,
  };
}

export default useSessionPersistence;
