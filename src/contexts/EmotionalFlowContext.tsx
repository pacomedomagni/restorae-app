/**
 * EmotionalFlowContext - The Heart of the Experience
 * 
 * This context creates a living, breathing emotional awareness throughout the app.
 * It tracks emotional patterns, influences UI presentation, and creates continuity
 * between interactions - transforming the app from a "tool" to a "companion."
 * 
 * Core Principles:
 * 1. ACKNOWLEDGMENT - Every emotional input is honored, not just processed
 * 2. CONTINUITY - The app remembers and references your journey
 * 3. ADAPTATION - UI responds organically to emotional state
 * 4. GENTLENESS - Transitions are breaths, not clicks
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/** Emotional intensity affects UI warmth and pacing */
export type EmotionalIntensity = 'low' | 'medium' | 'high';

/** Flow state represents the user's current journey phase */
export type FlowState = 
  | 'arriving'      // Just opened app, settling in
  | 'present'       // Actively engaged
  | 'transitioning' // Moving between experiences
  | 'completing'    // Finishing a session
  | 'resting'       // Post-session calm
  | 'returning';    // Coming back after time away

/** Ambient mood influences app-wide color temperature and animation speed */
export type AmbientMood = 
  | 'nurturing'     // For anxious/low states - extra warmth
  | 'grounding'     // For unsettled states - stability
  | 'celebrating'   // For positive states - gentle joy
  | 'neutral';      // Default balanced state

export interface EmotionalMoment {
  mood: MoodType;
  intensity: EmotionalIntensity;
  timestamp: number;
  context?: string; // What triggered this moment
  acknowledged: boolean; // Was this feeling properly seen?
}

export interface EmotionalPattern {
  /** Recent mood trend */
  recentTrend: 'improving' | 'stable' | 'struggling' | 'unknown';
  /** Most frequent mood in last 7 days */
  dominantMood: MoodType | null;
  /** Number of consecutive days with same mood category */
  moodConsistency: number;
  /** Time since last interaction */
  timeSinceLastVisit: number | null; // minutes
  /** Whether user tends to check in mornings, evenings, or irregular */
  checkInPattern: 'morning' | 'evening' | 'varied' | 'unknown';
  /** Days user has been using the app */
  journeyDays: number;
}

export interface EmotionalJourney {
  /** When user first started using app */
  startDate: string | null;
  /** Total mood check-ins */
  totalCheckIns: number;
  /** Sessions completed */
  totalSessions: number;
  /** Moments of breakthrough/relief (mood improved after session) */
  reliefMoments: number;
  /** User's self-reported goals */
  goals: string[];
  /** Personalized insights generated from patterns */
  insights: string[];
}

/** The emotional "temperature" affects global UI */
export interface EmotionalTemperature {
  /** Color warmth adjustment (negative = cooler, positive = warmer) */
  warmth: number; // -1 to 1
  /** Animation speed factor (lower = gentler for anxious states) */
  pacing: number; // 0.5 to 1.5
  /** Opacity of decorative elements (lower for low energy) */
  vibrancy: number; // 0.5 to 1
  /** How much space/breathing room in layouts */
  spaciousness: number; // 0.8 to 1.2
}

export interface EmotionalFlowState {
  // Current emotional state
  currentMood: MoodType | null;
  currentIntensity: EmotionalIntensity;
  flowState: FlowState;
  ambientMood: AmbientMood;
  
  // History
  recentMoments: EmotionalMoment[];
  lastSessionCompletedAt: number | null;
  lastMoodCheckInAt: number | null;
  
  // Patterns
  patterns: EmotionalPattern;
  journey: EmotionalJourney;
  
  // UI influence
  temperature: EmotionalTemperature;
  
  // Interaction state
  isAcknowledgingMood: boolean;
  pendingAcknowledgment: EmotionalMoment | null;
  
  // Loading
  isHydrated: boolean;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const DEFAULT_TEMPERATURE: EmotionalTemperature = {
  warmth: 0,
  pacing: 1,
  vibrancy: 1,
  spaciousness: 1,
};

const DEFAULT_PATTERNS: EmotionalPattern = {
  recentTrend: 'unknown',
  dominantMood: null,
  moodConsistency: 0,
  timeSinceLastVisit: null,
  checkInPattern: 'unknown',
  journeyDays: 0,
};

const DEFAULT_JOURNEY: EmotionalJourney = {
  startDate: null,
  totalCheckIns: 0,
  totalSessions: 0,
  reliefMoments: 0,
  goals: [],
  insights: [],
};

const INITIAL_STATE: EmotionalFlowState = {
  currentMood: null,
  currentIntensity: 'medium',
  flowState: 'arriving',
  ambientMood: 'neutral',
  recentMoments: [],
  lastSessionCompletedAt: null,
  lastMoodCheckInAt: null,
  patterns: DEFAULT_PATTERNS,
  journey: DEFAULT_JOURNEY,
  temperature: DEFAULT_TEMPERATURE,
  isAcknowledgingMood: false,
  pendingAcknowledgment: null,
  isHydrated: false,
};

// =============================================================================
// MOOD CATEGORIZATION
// =============================================================================

const MOOD_CATEGORIES = {
  positive: ['good', 'calm', 'energized'] as MoodType[],
  challenging: ['anxious', 'low', 'tough'] as MoodType[],
};

// =============================================================================
// HELPERS
// =============================================================================

function isMoodType(value: unknown): value is MoodType {
  return (
    typeof value === 'string' &&
    (MOOD_CATEGORIES.positive.includes(value as MoodType) ||
      MOOD_CATEGORIES.challenging.includes(value as MoodType))
  );
}

function isEmotionalIntensity(value: unknown): value is EmotionalIntensity {
  return value === 'low' || value === 'medium' || value === 'high';
}

function calculateAmbientMood(mood: MoodType | null, intensity: EmotionalIntensity): AmbientMood {
  if (!mood) return 'neutral';
  
  if (mood === 'anxious' || mood === 'tough') return 'nurturing';
  if (mood === 'low') return 'grounding';
  if (MOOD_CATEGORIES.positive.includes(mood) && intensity !== 'low') return 'celebrating';
  
  return 'neutral';
}

function calculateTemperature(
  mood: MoodType | null, 
  intensity: EmotionalIntensity,
  flowState: FlowState
): EmotionalTemperature {
  let warmth = 0;
  let pacing = 1;
  let vibrancy = 1;
  let spaciousness = 1;

  // Mood-based adjustments
  if (mood) {
    if (mood === 'anxious') {
      warmth = 0.3; // Warmer colors for anxiety
      pacing = 0.7; // Slower animations
      vibrancy = 0.8; // Less visual noise
      spaciousness = 1.15; // More breathing room
    } else if (mood === 'low') {
      warmth = 0.4;
      pacing = 0.6;
      vibrancy = 0.7;
      spaciousness = 1.1;
    } else if (mood === 'tough') {
      warmth = 0.2;
      pacing = 0.75;
      vibrancy = 0.85;
      spaciousness = 1.1;
    } else if (mood === 'energized') {
      warmth = -0.1;
      pacing = 1.1;
      vibrancy = 1.1;
      spaciousness = 0.95;
    } else if (mood === 'good' || mood === 'calm') {
      warmth = 0.1;
      pacing = 1;
      vibrancy = 1;
      spaciousness = 1;
    }
  }

  // Flow state adjustments
  if (flowState === 'resting') {
    pacing *= 0.8;
    vibrancy *= 0.9;
  } else if (flowState === 'transitioning') {
    pacing *= 0.85;
  } else if (flowState === 'completing') {
    warmth += 0.1;
    vibrancy = Math.min(1.1, vibrancy * 1.1);
  }

  // Intensity adjustments
  if (intensity === 'high') {
    warmth *= 1.2;
    pacing *= 0.9;
  } else if (intensity === 'low') {
    warmth *= 0.8;
  }

  return {
    warmth: Math.max(-1, Math.min(1, warmth)),
    pacing: Math.max(0.5, Math.min(1.5, pacing)),
    vibrancy: Math.max(0.5, Math.min(1.2, vibrancy)),
    spaciousness: Math.max(0.8, Math.min(1.3, spaciousness)),
  };
}

function calculateTrend(moments: EmotionalMoment[]): EmotionalPattern['recentTrend'] {
  if (moments.length < 3) return 'unknown';
  
  const recent = moments.slice(0, 5);
  const positiveCount = recent.filter(m => MOOD_CATEGORIES.positive.includes(m.mood)).length;
  const ratio = positiveCount / recent.length;
  
  // Compare to older entries if available
  const older = moments.slice(5, 10);
  if (older.length >= 3) {
    const olderPositive = older.filter(m => MOOD_CATEGORIES.positive.includes(m.mood)).length;
    const olderRatio = olderPositive / older.length;
    
    if (ratio > olderRatio + 0.2) return 'improving';
    if (ratio < olderRatio - 0.2) return 'struggling';
  }
  
  if (ratio >= 0.6) return 'improving';
  if (ratio <= 0.3) return 'struggling';
  return 'stable';
}

// =============================================================================
// ACTIONS
// =============================================================================

type EmotionalFlowAction =
  | { type: 'HYDRATE'; payload: Partial<EmotionalFlowState> }
  | { type: 'SET_MOOD'; payload: { mood: MoodType; intensity?: EmotionalIntensity; context?: string } }
  | { type: 'ACKNOWLEDGE_MOOD' }
  | { type: 'COMPLETE_ACKNOWLEDGMENT' }
  | { type: 'SET_FLOW_STATE'; payload: FlowState }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'UPDATE_JOURNEY'; payload: Partial<EmotionalJourney> }
  | { type: 'RECORD_RELIEF_MOMENT' }
  | { type: 'UPDATE_PATTERNS' }
  | { type: 'CLEAR_PENDING_ACKNOWLEDGMENT' };

// =============================================================================
// REDUCER
// =============================================================================

function emotionalFlowReducer(
  state: EmotionalFlowState,
  action: EmotionalFlowAction
): EmotionalFlowState {
  switch (action.type) {
    case 'HYDRATE': {
      const hydratedMood = action.payload.currentMood ?? state.currentMood;
      const hydratedIntensity = action.payload.currentIntensity ?? state.currentIntensity;
      const hasPersistedData = Object.keys(action.payload).length > 0;
      const nextFlowState: FlowState = hasPersistedData ? 'returning' : 'arriving';

      return {
        ...state,
        ...action.payload,
        isHydrated: true,
        isAcknowledgingMood: false,
        pendingAcknowledgment: null,
        flowState: nextFlowState,
        ambientMood: calculateAmbientMood(hydratedMood, hydratedIntensity),
        temperature: calculateTemperature(hydratedMood, hydratedIntensity, nextFlowState),
      };
    }

    case 'SET_MOOD': {
      const { mood, intensity = 'medium', context } = action.payload;
      const moment: EmotionalMoment = {
        mood,
        intensity,
        timestamp: Date.now(),
        context,
        acknowledged: false,
      };

      const newMoments = [moment, ...state.recentMoments].slice(0, 30);
      const ambientMood = calculateAmbientMood(mood, intensity);
      const temperature = calculateTemperature(mood, intensity, state.flowState);

      return {
        ...state,
        currentMood: mood,
        currentIntensity: intensity,
        ambientMood,
        temperature,
        recentMoments: newMoments,
        lastMoodCheckInAt: Date.now(),
        pendingAcknowledgment: moment,
        journey: {
          ...state.journey,
          totalCheckIns: state.journey.totalCheckIns + 1,
          startDate: state.journey.startDate || new Date().toISOString(),
        },
      };
    }

    case 'ACKNOWLEDGE_MOOD': {
      return {
        ...state,
        isAcknowledgingMood: true,
        flowState: 'transitioning',
      };
    }

    case 'COMPLETE_ACKNOWLEDGMENT': {
      const updatedMoments = state.recentMoments.map((m, i) =>
        i === 0 ? { ...m, acknowledged: true } : m
      );

      return {
        ...state,
        isAcknowledgingMood: false,
        recentMoments: updatedMoments,
        pendingAcknowledgment: null,
        flowState: 'present',
      };
    }

    case 'SET_FLOW_STATE': {
      const temperature = calculateTemperature(
        state.currentMood,
        state.currentIntensity,
        action.payload
      );

      return {
        ...state,
        flowState: action.payload,
        temperature,
      };
    }

    case 'COMPLETE_SESSION': {
      const preMood = state.recentMoments[1]?.mood; // Mood before session
      const wasRelief = preMood && 
        MOOD_CATEGORIES.challenging.includes(preMood) &&
        state.currentMood &&
        MOOD_CATEGORIES.positive.includes(state.currentMood);

      return {
        ...state,
        lastSessionCompletedAt: Date.now(),
        flowState: 'resting',
        temperature: calculateTemperature(state.currentMood, 'low', 'resting'),
        journey: {
          ...state.journey,
          totalSessions: state.journey.totalSessions + 1,
          reliefMoments: wasRelief 
            ? state.journey.reliefMoments + 1 
            : state.journey.reliefMoments,
        },
      };
    }

    case 'UPDATE_JOURNEY': {
      return {
        ...state,
        journey: { ...state.journey, ...action.payload },
      };
    }

    case 'RECORD_RELIEF_MOMENT': {
      return {
        ...state,
        journey: {
          ...state.journey,
          reliefMoments: state.journey.reliefMoments + 1,
        },
      };
    }

    case 'UPDATE_PATTERNS': {
      const trend = calculateTrend(state.recentMoments);
      
      // Calculate dominant mood
      const moodCounts = state.recentMoments.reduce((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantMood = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as MoodType | undefined;

      // Calculate journey days
      const journeyDays = state.journey.startDate
        ? Math.ceil((Date.now() - new Date(state.journey.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate time since last visit
      const timeSinceLastVisit = state.lastMoodCheckInAt
        ? Math.round((Date.now() - state.lastMoodCheckInAt) / (1000 * 60))
        : null;

      return {
        ...state,
        patterns: {
          ...state.patterns,
          recentTrend: trend,
          dominantMood: dominantMood ?? null,
          journeyDays,
          timeSinceLastVisit,
        },
      };
    }

    case 'CLEAR_PENDING_ACKNOWLEDGMENT': {
      return {
        ...state,
        pendingAcknowledgment: null,
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface EmotionalFlowContextType extends EmotionalFlowState {
  // Actions
  setMood: (mood: MoodType, intensity?: EmotionalIntensity, context?: string) => void;
  acknowledgeMood: () => void;
  completeAcknowledgment: () => void;
  setFlowState: (state: FlowState) => void;
  completeSession: () => void;
  recordSessionComplete: (sessionType: string, mood?: MoodType) => void;
  updateJourney: (updates: Partial<EmotionalJourney>) => void;
  recordReliefMoment: () => void;
  
  // Computed
  needsGentleness: boolean;
  isInChallengingState: boolean;
  hasRecentSession: boolean;
  daysSinceStart: number;
  moodMessage: string;
  transitionDuration: number;
}

const EmotionalFlowContext = createContext<EmotionalFlowContextType | undefined>(undefined);

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = '@restorae/emotional_flow';

type PersistedEmotionalFlowStateV1 = {
  v: 1;
  currentMood: MoodType | null;
  currentIntensity: EmotionalIntensity;
  recentMoments: EmotionalMoment[];
  lastSessionCompletedAt: number | null;
  lastMoodCheckInAt: number | null;
  journey: EmotionalJourney;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeJourney(value: unknown): EmotionalJourney {
  if (!isRecord(value)) return DEFAULT_JOURNEY;

  return {
    ...DEFAULT_JOURNEY,
    startDate: typeof value.startDate === 'string' ? value.startDate : null,
    totalCheckIns: typeof value.totalCheckIns === 'number' ? value.totalCheckIns : 0,
    totalSessions: typeof value.totalSessions === 'number' ? value.totalSessions : 0,
    reliefMoments: typeof value.reliefMoments === 'number' ? value.reliefMoments : 0,
    goals: Array.isArray(value.goals) ? (value.goals.filter((g) => typeof g === 'string') as string[]) : [],
    insights: Array.isArray(value.insights)
      ? (value.insights.filter((i) => typeof i === 'string') as string[])
      : [],
  };
}

function normalizeMoments(value: unknown): EmotionalMoment[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((m): m is Record<string, unknown> => isRecord(m))
    .map((m) => {
      const mood = isMoodType(m.mood) ? m.mood : null;
      if (!mood) return null;

      const intensity: EmotionalIntensity = isEmotionalIntensity(m.intensity) ? m.intensity : 'medium';
      return {
        mood,
        intensity,
        timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now(),
        ...(typeof m.context === 'string' ? { context: m.context } : {}),
        acknowledged: typeof m.acknowledged === 'boolean' ? m.acknowledged : false,
      } as EmotionalMoment;
    })
    .filter((m): m is EmotionalMoment => m !== null)
    .slice(0, 30);
}

async function persistState(persisted: PersistedEmotionalFlowStateV1) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (e) {
    console.warn('Failed to persist emotional flow state:', e);
  }
}

async function loadState(): Promise<Partial<EmotionalFlowState> | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const parsed: unknown = JSON.parse(json);
      if (!isRecord(parsed)) return null;

      const legacyOrV1 = parsed;

      const currentMood = isMoodType(legacyOrV1.currentMood) ? legacyOrV1.currentMood : null;
      const currentIntensity: EmotionalIntensity = isEmotionalIntensity(legacyOrV1.currentIntensity)
        ? legacyOrV1.currentIntensity
        : 'medium';
      const recentMoments = normalizeMoments(legacyOrV1.recentMoments);
      const journey = normalizeJourney(legacyOrV1.journey);
      const lastSessionCompletedAt =
        typeof legacyOrV1.lastSessionCompletedAt === 'number' ? legacyOrV1.lastSessionCompletedAt : null;
      const lastMoodCheckInAt =
        typeof legacyOrV1.lastMoodCheckInAt === 'number' ? legacyOrV1.lastMoodCheckInAt : null;

      return {
        currentMood,
        currentIntensity,
        recentMoments,
        journey,
        lastSessionCompletedAt,
        lastMoodCheckInAt,
      };
    }
  } catch (e) {
    console.warn('Failed to load emotional flow state:', e);
  }
  return null;
}

// =============================================================================
// MOOD MESSAGES - Contextual, empathetic copy
// =============================================================================

function getMoodMessage(
  mood: MoodType | null,
  patterns: EmotionalPattern,
  journey: EmotionalJourney
): string {
  if (!mood) return "Take a moment to check in with yourself";

  const isFirstTime = journey.totalCheckIns <= 1;
  const isReturning = patterns.timeSinceLastVisit && patterns.timeSinceLastVisit > 60 * 24; // > 1 day
  const sameAsBefore = patterns.dominantMood === mood;

  // First-time messages
  if (isFirstTime) {
    const firstTimeMessages: Record<MoodType, string> = {
      good: "That's wonderful. Let's build on this feeling.",
      calm: "A peaceful starting point. Welcome.",
      energized: "Great energy to bring here. Let's channel it.",
      anxious: "Thank you for sharing that. You're in the right place.",
      low: "It takes courage to acknowledge this. We're here with you.",
      tough: "Thank you for being honest. Let's work through this together.",
    };
    return firstTimeMessages[mood];
  }

  // Returning after absence
  if (isReturning) {
    const returningMessages: Record<MoodType, string> = {
      good: "Welcome back. Glad you're feeling good.",
      calm: "Welcome back. Nice to find you at peace.",
      energized: "Welcome back with that energy!",
      anxious: "Welcome back. We're glad you reached out.",
      low: "Welcome back. It's okay to not be okay sometimes.",
      tough: "Welcome back. You came to the right place.",
    };
    return returningMessages[mood];
  }

  // Consistent mood patterns
  if (sameAsBefore && patterns.moodConsistency >= 3) {
    if (MOOD_CATEGORIES.challenging.includes(mood)) {
      return "I notice this has been a recurring feeling. That's valid.";
    }
  }

  // Trend-aware messages
  if (patterns.recentTrend === 'improving') {
    const improvingMessages: Record<MoodType, string> = {
      good: "Your upward trend continues. Beautiful progress.",
      calm: "Finding more calm lately. The practice is working.",
      energized: "Your energy has been building. Wonderful.",
      anxious: "Even on anxious days, your overall trend is improving.",
      low: "Low moments still happen, but you're on an upward path.",
      tough: "Tough, but you've been building resilience.",
    };
    return improvingMessages[mood];
  }

  if (patterns.recentTrend === 'struggling') {
    const strugglingMessages: Record<MoodType, string> = {
      good: "A good moment in a difficult stretch. Savor it.",
      calm: "Finding calm is a gift right now. Hold onto it.",
      energized: "This energy is a resource. Use it wisely.",
      anxious: "These have been harder days. Be extra gentle with yourself.",
      low: "This stretch has been difficult. You're still here, still trying.",
      tough: "Tough times persist, but so do you.",
    };
    return strugglingMessages[mood];
  }

  // Default contextual messages
  const defaultMessages: Record<MoodType, string> = {
    good: "Feeling good is worth acknowledging.",
    calm: "Calm is a beautiful state to be in.",
    energized: "That energy can be directed somewhere meaningful.",
    anxious: "Anxiety is information. Let's listen to it together.",
    low: "Low energy deserves gentleness, not judgment.",
    tough: "Difficult feelings are part of being human.",
  };

  return defaultMessages[mood];
}

// =============================================================================
// PROVIDER
// =============================================================================

export function EmotionalFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(emotionalFlowReducer, INITIAL_STATE);

  // Hydrate from storage on mount
  useEffect(() => {
    loadState().then((persisted) => {
      if (persisted) {
        dispatch({ type: 'HYDRATE', payload: persisted });
      } else {
        dispatch({ type: 'HYDRATE', payload: {} });
      }
    });
  }, []);

  const persistableState: PersistedEmotionalFlowStateV1 = useMemo(
    () => ({
      v: 1,
      currentMood: state.currentMood,
      currentIntensity: state.currentIntensity,
      recentMoments: state.recentMoments.slice(0, 30),
      lastSessionCompletedAt: state.lastSessionCompletedAt,
      lastMoodCheckInAt: state.lastMoodCheckInAt,
      journey: state.journey,
    }),
    [
      state.currentMood,
      state.currentIntensity,
      state.recentMoments,
      state.lastSessionCompletedAt,
      state.lastMoodCheckInAt,
      state.journey,
    ]
  );

  // Persist meaningful state changes (avoid persisting computed patterns every minute)
  useEffect(() => {
    if (state.isHydrated) {
      persistState(persistableState);
    }
  }, [state.isHydrated, persistableState]);

  // Update patterns on relevant changes
  useEffect(() => {
    if (state.isHydrated) {
      dispatch({ type: 'UPDATE_PATTERNS' });
    }
  }, [state.recentMoments.length, state.isHydrated]);

  // Update time-based patterns periodically
  useEffect(() => {
    if (!state.isHydrated) return;

    dispatch({ type: 'UPDATE_PATTERNS' });
    const intervalId = setInterval(() => {
      dispatch({ type: 'UPDATE_PATTERNS' });
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [state.isHydrated]);

  // Actions
  const setMood = useCallback((mood: MoodType, intensity?: EmotionalIntensity, context?: string) => {
    dispatch({ type: 'SET_MOOD', payload: { mood, intensity, context } });
  }, []);

  const acknowledgeMood = useCallback(() => {
    dispatch({ type: 'ACKNOWLEDGE_MOOD' });
  }, []);

  const completeAcknowledgment = useCallback(() => {
    dispatch({ type: 'COMPLETE_ACKNOWLEDGMENT' });
  }, []);

  const setFlowState = useCallback((flowState: FlowState) => {
    dispatch({ type: 'SET_FLOW_STATE', payload: flowState });
  }, []);

  const completeSession = useCallback(() => {
    dispatch({ type: 'COMPLETE_SESSION' });
  }, []);

  const recordSessionComplete = useCallback((_sessionType: string, _mood?: MoodType) => {
    dispatch({ type: 'COMPLETE_SESSION' });
  }, []);

  const updateJourney = useCallback((updates: Partial<EmotionalJourney>) => {
    dispatch({ type: 'UPDATE_JOURNEY', payload: updates });
  }, []);

  const recordReliefMoment = useCallback(() => {
    dispatch({ type: 'RECORD_RELIEF_MOMENT' });
  }, []);

  // Computed values
  const needsGentleness = useMemo(() => {
    if (!state.currentMood) return false;
    return MOOD_CATEGORIES.challenging.includes(state.currentMood) ||
           state.currentIntensity === 'high';
  }, [state.currentMood, state.currentIntensity]);

  const isInChallengingState = useMemo(() => {
    if (!state.currentMood) return false;
    return MOOD_CATEGORIES.challenging.includes(state.currentMood);
  }, [state.currentMood]);

  const hasRecentSession = useMemo(() => {
    if (!state.lastSessionCompletedAt) return false;
    const hourAgo = Date.now() - (60 * 60 * 1000);
    return state.lastSessionCompletedAt > hourAgo;
  }, [state.lastSessionCompletedAt]);

  const daysSinceStart = useMemo(() => {
    return state.patterns.journeyDays;
  }, [state.patterns.journeyDays]);

  const moodMessage = useMemo(() => {
    return getMoodMessage(state.currentMood, state.patterns, state.journey);
  }, [state.currentMood, state.patterns, state.journey]);

  const transitionDuration = useMemo(() => {
    // Base duration adjusted by pacing
    return Math.round(400 * state.temperature.pacing);
  }, [state.temperature.pacing]);

  const value: EmotionalFlowContextType = useMemo(() => ({
    ...state,
    setMood,
    acknowledgeMood,
    completeAcknowledgment,
    setFlowState,
    completeSession,
    recordSessionComplete,
    updateJourney,
    recordReliefMoment,
    needsGentleness,
    isInChallengingState,
    hasRecentSession,
    daysSinceStart,
    moodMessage,
    transitionDuration,
  }), [
    state,
    setMood,
    acknowledgeMood,
    completeAcknowledgment,
    setFlowState,
    completeSession,
    recordSessionComplete,
    updateJourney,
    recordReliefMoment,
    needsGentleness,
    isInChallengingState,
    hasRecentSession,
    daysSinceStart,
    moodMessage,
    transitionDuration,
  ]);

  return (
    <EmotionalFlowContext.Provider value={value}>
      {children}
    </EmotionalFlowContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useEmotionalFlow() {
  const context = useContext(EmotionalFlowContext);
  if (!context) {
    throw new Error('useEmotionalFlow must be used within EmotionalFlowProvider');
  }
  return context;
}

// =============================================================================
// UTILITY HOOK - For components that just need temperature
// =============================================================================

export function useEmotionalTemperature() {
  const { temperature, needsGentleness, transitionDuration } = useEmotionalFlow();
  return { temperature, needsGentleness, transitionDuration };
}

export default EmotionalFlowContext;
