/**
 * SessionContext
 * 
 * The core session engine that manages all activity sessions in the app.
 * Handles single activities, rituals, and SOS flows with:
 * - Queue management
 * - Smooth transitions between activities
 * - Partial completion tracking
 * - Session persistence for interruption recovery
 * - XP calculations
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import {
  SessionState,
  SessionContextType,
  SessionContextActions,
  Activity,
  ActivityState,
  Ritual,
  SOSPreset,
  SessionSummary,
  PersistedSession,
  INITIAL_SESSION_STATE,
  SessionMode,
  SessionStatus,
} from '../types/session';
import { RootStackParamList } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { activityLogger } from '../services/activityLogger';
import { gamification } from '../services/gamification';
import logger from '../services/logger';

// =============================================================================
// STORAGE KEYS
// =============================================================================
const SESSION_STORAGE_KEY = '@restorae:persisted_session';

// =============================================================================
// ACTION TYPES
// =============================================================================
type SessionAction =
  | { type: 'START_SINGLE'; activity: Activity }
  | { type: 'START_RITUAL'; ritual: Ritual }
  | { type: 'START_SOS'; preset: SOSPreset }
  | { type: 'COMPLETE_CURRENT_ACTIVITY' }
  | { type: 'SKIP_CURRENT_ACTIVITY' }
  | { type: 'SKIP_ACTIVITY'; index: number }
  | { type: 'ADD_ACTIVITY'; activity: Activity; atIndex?: number }
  | { type: 'START_TRANSITION' }
  | { type: 'COMPLETE_TRANSITION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'EXIT_SESSION' }
  | { type: 'MARK_RITUAL_COMPLETE' }
  | { type: 'TOGGLE_PROGRESS_DRAWER' }
  | { type: 'TOGGLE_AMBIENT_MODE' }
  | { type: 'SHOW_EXIT_CONFIRMATION' }
  | { type: 'HIDE_EXIT_CONFIRMATION' }
  | { type: 'RECOVER_SESSION'; state: SessionState }
  | { type: 'RESET' };

// =============================================================================
// REDUCER
// =============================================================================
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SINGLE': {
      const activityState: ActivityState = {
        activity: action.activity,
        status: 'in-progress',
        startedAt: Date.now(),
      };
      return {
        ...INITIAL_SESSION_STATE,
        mode: 'single',
        status: 'in-progress',
        queue: [activityState],
        currentIndex: 0,
        sessionStartTime: Date.now(),
      };
    }

    case 'START_RITUAL': {
      const queue: ActivityState[] = action.ritual.activities.map((activity, index) => ({
        activity,
        status: index === 0 ? 'in-progress' : 'pending',
        startedAt: index === 0 ? Date.now() : undefined,
      }));
      return {
        ...INITIAL_SESSION_STATE,
        mode: 'ritual',
        status: 'in-progress',
        queue,
        currentIndex: 0,
        ritualId: action.ritual.id,
        ritualName: action.ritual.name,
        sessionStartTime: Date.now(),
      };
    }

    case 'START_SOS': {
      const queue: ActivityState[] = action.preset.activities.map((activity, index) => ({
        activity,
        status: index === 0 ? 'in-progress' : 'pending',
        startedAt: index === 0 ? Date.now() : undefined,
      }));
      return {
        ...INITIAL_SESSION_STATE,
        mode: 'sos',
        status: 'in-progress',
        queue,
        currentIndex: 0,
        sosPresetId: action.preset.id,
        sosPresetName: action.preset.name,
        sessionStartTime: Date.now(),
      };
    }

    case 'COMPLETE_CURRENT_ACTIVITY': {
      if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) {
        return state;
      }

      const newQueue = [...state.queue];
      const currentState = newQueue[state.currentIndex];
      newQueue[state.currentIndex] = {
        ...currentState,
        status: 'completed',
        completedAt: Date.now(),
        actualDuration: currentState.startedAt 
          ? Math.round((Date.now() - currentState.startedAt) / 1000)
          : currentState.activity.duration,
      };

      // Check if there are more activities
      const nextIndex = state.currentIndex + 1;
      const hasMore = nextIndex < state.queue.length;

      if (hasMore) {
        // Start transition to next activity
        return {
          ...state,
          queue: newQueue,
          isTransitioning: true,
          transitionTo: newQueue[nextIndex].activity,
        };
      } else {
        // Session complete
        return {
          ...state,
          queue: newQueue,
          status: 'completed',
          sessionEndTime: Date.now(),
        };
      }
    }

    case 'SKIP_CURRENT_ACTIVITY': {
      if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) {
        return state;
      }

      const newQueue = [...state.queue];
      newQueue[state.currentIndex] = {
        ...newQueue[state.currentIndex],
        status: 'skipped',
        completedAt: Date.now(),
      };

      const nextIndex = state.currentIndex + 1;
      const hasMore = nextIndex < state.queue.length;

      if (hasMore) {
        // Move to next without transition (skip is instant)
        newQueue[nextIndex] = {
          ...newQueue[nextIndex],
          status: 'in-progress',
          startedAt: Date.now(),
        };
        return {
          ...state,
          queue: newQueue,
          currentIndex: nextIndex,
        };
      } else {
        return {
          ...state,
          queue: newQueue,
          status: 'completed',
          sessionEndTime: Date.now(),
        };
      }
    }

    case 'SKIP_ACTIVITY': {
      if (action.index < 0 || action.index >= state.queue.length) {
        return state;
      }

      const newQueue = [...state.queue];
      newQueue[action.index] = {
        ...newQueue[action.index],
        status: 'skipped',
      };

      return {
        ...state,
        queue: newQueue,
      };
    }

    case 'ADD_ACTIVITY': {
      const newActivityState: ActivityState = {
        activity: action.activity,
        status: 'pending',
      };

      const newQueue = [...state.queue];
      const insertIndex = action.atIndex ?? newQueue.length;
      newQueue.splice(insertIndex, 0, newActivityState);

      return {
        ...state,
        queue: newQueue,
      };
    }

    case 'START_TRANSITION': {
      return {
        ...state,
        isTransitioning: true,
        status: 'transitioning',
      };
    }

    case 'COMPLETE_TRANSITION': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        return {
          ...state,
          isTransitioning: false,
          transitionTo: undefined,
          status: 'completed',
          sessionEndTime: Date.now(),
        };
      }

      const newQueue = [...state.queue];
      newQueue[nextIndex] = {
        ...newQueue[nextIndex],
        status: 'in-progress',
        startedAt: Date.now(),
      };

      return {
        ...state,
        queue: newQueue,
        currentIndex: nextIndex,
        isTransitioning: false,
        transitionTo: undefined,
        status: 'in-progress',
      };
    }

    case 'PAUSE_SESSION': {
      return {
        ...state,
        status: 'paused',
      };
    }

    case 'RESUME_SESSION': {
      return {
        ...state,
        status: 'in-progress',
      };
    }

    case 'EXIT_SESSION': {
      return {
        ...state,
        status: 'exited',
        sessionEndTime: Date.now(),
        showExitConfirmation: false,
      };
    }

    case 'MARK_RITUAL_COMPLETE': {
      // Mark all remaining pending activities as skipped and complete the session
      const newQueue = state.queue.map((actState, index) => {
        if (index > state.currentIndex && actState.status === 'pending') {
          return { ...actState, status: 'skipped' as const };
        }
        if (index === state.currentIndex && actState.status === 'in-progress') {
          return { 
            ...actState, 
            status: 'completed' as const, 
            completedAt: Date.now(),
            actualDuration: actState.startedAt 
              ? Math.round((Date.now() - actState.startedAt) / 1000)
              : actState.activity.duration,
          };
        }
        return actState;
      });

      return {
        ...state,
        queue: newQueue,
        status: 'completed',
        sessionEndTime: Date.now(),
        showExitConfirmation: false,
      };
    }

    case 'TOGGLE_PROGRESS_DRAWER': {
      return {
        ...state,
        showProgressDrawer: !state.showProgressDrawer,
      };
    }

    case 'TOGGLE_AMBIENT_MODE': {
      return {
        ...state,
        showAmbientMode: !state.showAmbientMode,
      };
    }

    case 'SHOW_EXIT_CONFIRMATION': {
      return {
        ...state,
        showExitConfirmation: true,
      };
    }

    case 'HIDE_EXIT_CONFIRMATION': {
      return {
        ...state,
        showExitConfirmation: false,
      };
    }

    case 'RECOVER_SESSION': {
      return {
        ...action.state,
        status: 'paused', // Start paused so user can choose to continue
      };
    }

    case 'RESET': {
      return INITIAL_SESSION_STATE;
    }

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium, notificationSuccess } = useHaptics();

  // =========================================================================
  // PERSISTENCE
  // =========================================================================
  
  // Save session state when it changes (for recovery)
  useEffect(() => {
    if (state.mode !== 'idle' && state.status === 'in-progress') {
      const persisted: PersistedSession = {
        state,
        persistedAt: Date.now(),
        appVersion: Constants.expoConfig?.version || '1.0.0',
      };
      AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(persisted)).catch(
        (err) => logger.error('Failed to persist session:', err)
      );
    }
  }, [state]);

  // Clear persisted session when completed or exited
  useEffect(() => {
    if (state.status === 'completed' || state.status === 'exited') {
      AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(
        (err) => logger.error('Failed to clear persisted session:', err)
      );
    }
  }, [state.status]);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================
  const currentActivity = useMemo(() => {
    if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
      return state.queue[state.currentIndex].activity;
    }
    return null;
  }, [state.queue, state.currentIndex]);

  const currentActivityState = useMemo(() => {
    if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
      return state.queue[state.currentIndex];
    }
    return null;
  }, [state.queue, state.currentIndex]);

  const completedActivities = useMemo(() => {
    return state.queue.filter((a) => a.status === 'completed').length;
  }, [state.queue]);

  const remainingActivities = useMemo(() => {
    return state.queue.filter((a) => a.status === 'pending' || a.status === 'in-progress').length;
  }, [state.queue]);

  const progress = useMemo(() => {
    if (state.queue.length === 0) return 0;
    const completed = state.queue.filter((a) => a.status === 'completed' || a.status === 'skipped').length;
    return completed / state.queue.length;
  }, [state.queue]);

  const isLastActivity = useMemo(() => {
    return state.currentIndex === state.queue.length - 1;
  }, [state.currentIndex, state.queue.length]);

  const canSkip = useMemo(() => {
    // Can always skip in rituals, cannot skip in single mode
    return state.mode === 'ritual' || state.mode === 'sos';
  }, [state.mode]);

  const estimatedTimeRemaining = useMemo(() => {
    return state.queue
      .filter((a) => a.status === 'pending' || a.status === 'in-progress')
      .reduce((sum, a) => sum + a.activity.duration, 0);
  }, [state.queue]);

  const isActive = useMemo(() => {
    return state.mode !== 'idle' && state.status === 'in-progress';
  }, [state.mode, state.status]);

  // =========================================================================
  // ACTIONS
  // =========================================================================
  const startSingle = useCallback((activity: Activity) => {
    dispatch({ type: 'START_SINGLE', activity });
    impactMedium();
    navigation.navigate('UnifiedSession');
  }, [navigation, impactMedium]);

  const startRitual = useCallback((ritual: Ritual) => {
    dispatch({ type: 'START_RITUAL', ritual });
    impactMedium();
    navigation.navigate('UnifiedSession');
  }, [navigation, impactMedium]);

  const startSOS = useCallback((preset: SOSPreset) => {
    dispatch({ type: 'START_SOS', preset });
    impactMedium();
    navigation.navigate('UnifiedSession');
  }, [navigation, impactMedium]);

  const completeCurrentActivity = useCallback(async () => {
    const activityState = state.queue[state.currentIndex];
    if (!activityState) return;

    // Log the activity completion
    try {
      const context = state.mode === 'ritual' 
        ? 'ritual' 
        : state.mode === 'sos' 
          ? 'sos' 
          : 'standalone';
      
      await activityLogger.logActivity({
        category: activityState.activity.type as any,
        activityId: activityState.activity.id,
        activityName: activityState.activity.name,
        startedAt: activityState.startedAt || Date.now(),
        durationSeconds: activityState.startedAt 
          ? Math.round((Date.now() - activityState.startedAt) / 1000)
          : activityState.activity.duration,
        completed: true,
        metadata: {
          context,
          ritualId: state.ritualId,
          sosPresetId: state.sosPresetId,
        },
      });
    } catch (err) {
      logger.error('Failed to log activity:', err);
    }

    dispatch({ type: 'COMPLETE_CURRENT_ACTIVITY' });
    notificationSuccess();
  }, [state.queue, state.currentIndex, state.mode, state.ritualId, state.sosPresetId, notificationSuccess]);

  const skipCurrentActivity = useCallback(() => {
    dispatch({ type: 'SKIP_CURRENT_ACTIVITY' });
  }, []);

  const pauseSession = useCallback(() => {
    dispatch({ type: 'PAUSE_SESSION' });
  }, []);

  const resumeSession = useCallback(() => {
    dispatch({ type: 'RESUME_SESSION' });
  }, []);

  const exitSession = useCallback((saveProgress = false) => {
    dispatch({ type: 'EXIT_SESSION' });
    
    // Navigate based on whether we should show summary
    if (saveProgress && completedActivities > 0) {
      // Build summary and navigate
      const summary = buildSessionSummary(state, true);
      navigation.navigate('SessionSummary', { summary });
    } else {
      navigation.navigate('Main');
    }
  }, [navigation, state, completedActivities]);

  const markRitualComplete = useCallback(async () => {
    dispatch({ type: 'MARK_RITUAL_COMPLETE' });
    
    // Award XP for ritual completion
    try {
      await gamification.recordActivity(
        'ritual',
        Math.round((Date.now() - (state.sessionStartTime || Date.now())) / 60000),
        { ritualId: state.ritualId, ritualName: state.ritualName }
      );
    } catch (err) {
      logger.error('Failed to record ritual completion:', err);
    }
    
    notificationSuccess();
  }, [state.sessionStartTime, state.ritualId, state.ritualName, notificationSuccess]);

  const skipActivity = useCallback((index: number) => {
    dispatch({ type: 'SKIP_ACTIVITY', index });
  }, []);

  const addActivity = useCallback((activity: Activity, atIndex?: number) => {
    dispatch({ type: 'ADD_ACTIVITY', activity, atIndex });
  }, []);

  const toggleProgressDrawer = useCallback(() => {
    dispatch({ type: 'TOGGLE_PROGRESS_DRAWER' });
  }, []);

  const toggleAmbientMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_AMBIENT_MODE' });
  }, []);

  const setShowExitConfirmation = useCallback((show: boolean) => {
    if (show) {
      dispatch({ type: 'SHOW_EXIT_CONFIRMATION' });
    } else {
      dispatch({ type: 'HIDE_EXIT_CONFIRMATION' });
    }
  }, []);

  const startTransition = useCallback(() => {
    dispatch({ type: 'START_TRANSITION' });
  }, []);

  const completeTransition = useCallback(() => {
    dispatch({ type: 'COMPLETE_TRANSITION' });
  }, []);

  const recoverSession = useCallback((persisted: PersistedSession) => {
    dispatch({ type: 'RECOVER_SESSION', state: persisted.state });
    navigation.navigate('UnifiedSession');
  }, [navigation]);

  const clearPersistedSession = useCallback(() => {
    AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(
      (err) => logger.error('Failed to clear persisted session:', err)
    );
    dispatch({ type: 'RESET' });
  }, []);

  // =========================================================================
  // HANDLE SESSION COMPLETION NAVIGATION
  // =========================================================================
  useEffect(() => {
    if (state.status === 'completed') {
      const summary = buildSessionSummary(state, false);
      navigation.navigate('SessionSummary', { summary });
      // Reset after navigation
      setTimeout(() => dispatch({ type: 'RESET' }), 500);
    }
  }, [state.status, navigation, state]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================
  const contextValue: SessionContextType = {
    ...state,
    // Computed
    currentActivity,
    currentActivityState,
    progress,
    remainingActivities,
    completedActivities,
    isLastActivity,
    canSkip,
    estimatedTimeRemaining,
    isActive,
    // Actions
    startSingle,
    startRitual,
    startSOS,
    completeCurrentActivity,
    skipCurrentActivity,
    pauseSession,
    resumeSession,
    exitSession,
    markRitualComplete,
    skipActivity,
    addActivity,
    toggleProgressDrawer,
    toggleAmbientMode,
    setShowExitConfirmation,
    startTransition,
    completeTransition,
    recoverSession,
    clearPersistedSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Build a session summary for the completion screen
 */
function buildSessionSummary(state: SessionState, wasInterrupted: boolean): SessionSummary {
  const completed = state.queue.filter((a) => a.status === 'completed');
  const skipped = state.queue.filter((a) => a.status === 'skipped');
  
  const totalDuration = completed.reduce(
    (sum, a) => sum + (a.actualDuration || a.activity.duration),
    0
  );

  // Calculate XP
  let xpEarned = 0;
  if (state.mode === 'single') {
    xpEarned = 15; // Base XP for single activity
  } else if (state.mode === 'ritual') {
    xpEarned = completed.length > 0 ? 30 : 0; // Ritual XP
    if (skipped.length > 0) xpEarned = Math.max(10, xpEarned - skipped.length * 5);
  } else if (state.mode === 'sos') {
    xpEarned = 5; // SOS always gives small XP for seeking help
  }

  return {
    mode: state.mode,
    ritualId: state.ritualId,
    ritualName: state.ritualName,
    sosPresetId: state.sosPresetId,
    sosPresetName: state.sosPresetName,
    activitiesCompleted: completed,
    activitiesSkipped: skipped,
    totalDuration,
    activitiesCount: state.queue.length,
    completedCount: completed.length,
    skippedCount: skipped.length,
    xpEarned,
    startTime: state.sessionStartTime || Date.now(),
    endTime: state.sessionEndTime || Date.now(),
    wasPartial: skipped.length > 0,
    wasInterrupted,
  };
}

/**
 * Check for and retrieve a persisted session (for recovery on app launch)
 */
export async function getPersistedSession(): Promise<PersistedSession | null> {
  try {
    const json = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!json) return null;
    
    const persisted: PersistedSession = JSON.parse(json);
    
    // Check if session is too old (more than 2 hours)
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    if (Date.now() - persisted.persistedAt > maxAge) {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    
    return persisted;
  } catch (err) {
    logger.error('Failed to get persisted session:', err);
    return null;
  }
}

export default SessionContext;
