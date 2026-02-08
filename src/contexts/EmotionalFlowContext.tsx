/**
 * EmotionalFlowContext - Emotional state tracking for personalization
 *
 * Derives emotional temperature and patterns from MoodContext data.
 * Used by useContextualCopy (adaptive language) and useBreathingTransition (pacing).
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type FlowState = 'arriving' | 'present' | 'transitioning' | 'completing' | 'returning';

export interface EmotionalPattern {
  dominantMood: MoodType | null;
  recentTrend: 'improving' | 'struggling' | 'stable' | null;
  timeSinceLastVisit: number | null;
  journeyDays: number;
}

export interface EmotionalJourney {
  totalCheckIns: number;
  reliefMoments: number;
  totalSessions: number;
}

export interface EmotionalTemperature {
  /** Multiplier for animation/transition speed. 1.0 = normal, <1 = slower/gentler, >1 = more energetic */
  pacing: number;
}

export interface EmotionalFlowContextType {
  currentMood: MoodType | null;
  patterns: EmotionalPattern;
  journey: EmotionalJourney;
  hasRecentSession: boolean;
  isInChallengingState: boolean;
  needsGentleness: boolean;
  flowState: FlowState;
  temperature: EmotionalTemperature;
  setFlowState: (state: FlowState) => void;
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_PATTERNS: EmotionalPattern = {
  dominantMood: null,
  recentTrend: null,
  timeSinceLastVisit: null,
  journeyDays: 0,
};

const DEFAULT_JOURNEY: EmotionalJourney = {
  totalCheckIns: 0,
  reliefMoments: 0,
  totalSessions: 0,
};

const DEFAULT_TEMPERATURE: EmotionalTemperature = {
  pacing: 1.0,
};

// =============================================================================
// CONTEXT
// =============================================================================

const EmotionalFlowContext = createContext<EmotionalFlowContextType | undefined>(undefined);

export function EmotionalFlowProvider({ children }: { children: React.ReactNode }) {
  const [flowState, setFlowStateInternal] = useState<FlowState>('arriving');

  // In a full implementation, these would derive from MoodContext entries.
  // For now, provide sensible defaults that make all consuming code functional.
  const currentMood: MoodType | null = null;
  const hasRecentSession = false;

  const isInChallengingState = currentMood === 'anxious' || currentMood === 'low' || currentMood === 'tough';
  const needsGentleness = isInChallengingState;

  const temperature: EmotionalTemperature = useMemo(() => ({
    pacing: needsGentleness ? 0.8 : 1.0,
  }), [needsGentleness]);

  const setFlowState = useCallback((state: FlowState) => {
    setFlowStateInternal(state);
  }, []);

  const value = useMemo<EmotionalFlowContextType>(
    () => ({
      currentMood,
      patterns: DEFAULT_PATTERNS,
      journey: DEFAULT_JOURNEY,
      hasRecentSession,
      isInChallengingState,
      needsGentleness,
      flowState,
      temperature,
      setFlowState,
    }),
    [currentMood, hasRecentSession, isInChallengingState, needsGentleness, flowState, temperature, setFlowState],
  );

  return (
    <EmotionalFlowContext.Provider value={value}>
      {children}
    </EmotionalFlowContext.Provider>
  );
}

export function useEmotionalFlow(): EmotionalFlowContextType {
  const context = useContext(EmotionalFlowContext);
  if (!context) {
    throw new Error('useEmotionalFlow must be used within an EmotionalFlowProvider');
  }
  return context;
}

export type { EmotionalPattern as EmotionalPatternType };
export type { EmotionalJourney as EmotionalJourneyType };

export default EmotionalFlowProvider;
