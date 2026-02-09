/**
 * EmotionalFlowContext - Emotional state tracking for personalization
 *
 * Derives emotional temperature and patterns from MoodContext data
 * and activity history from activityLogger.
 * Used by useContextualCopy (adaptive language) and useBreathingTransition (pacing).
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { MoodType } from '../types';
import { useMood } from './MoodContext';
import { activityLogger } from '../services/activityLogger';

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
// HELPERS
// =============================================================================

const CHALLENGING_MOODS: ReadonlySet<MoodType> = new Set(['anxious', 'low', 'tough']);
const RELIEF_MOODS: ReadonlySet<MoodType> = new Set(['calm', 'good', 'energized']);

/** Map MoodContext trend vocabulary to EmotionalFlow vocabulary */
function mapTrend(
  moodTrend: 'improving' | 'stable' | 'declining' | 'insufficient',
): 'improving' | 'struggling' | 'stable' | null {
  switch (moodTrend) {
    case 'improving': return 'improving';
    case 'declining': return 'struggling';
    case 'stable': return 'stable';
    case 'insufficient': return null;
  }
}

/** Count unique calendar days from mood entry timestamps */
function countUniqueDays(entries: Array<{ timestamp: string }>): number {
  const days = new Set(entries.map(e => new Date(e.timestamp).toDateString()));
  return days.size;
}

/** Hours since a timestamp, or null if no timestamp */
function hoursSince(isoTimestamp: string | undefined): number | null {
  if (!isoTimestamp) return null;
  return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);
}

// =============================================================================
// CONTEXT
// =============================================================================

const EmotionalFlowContext = createContext<EmotionalFlowContextType | undefined>(undefined);

export function EmotionalFlowProvider({ children }: { children: React.ReactNode }) {
  const { entries, stats } = useMood();
  const [flowState, setFlowStateInternal] = useState<FlowState>('arriving');
  const [sessionStats, setSessionStats] = useState({ totalSessions: 0, hasRecent: false });
  const mountedRef = useRef(true);

  // Load activity logger stats on mount and periodically
  useEffect(() => {
    mountedRef.current = true;

    async function loadActivityStats() {
      await activityLogger.initialize();
      if (!mountedRef.current) return;

      const actStats = activityLogger.getStats();
      const recentLogs = activityLogger.getRecentLogs(1);
      const lastLogTime = recentLogs[0]?.completedAt;
      const hoursAgo = lastLogTime ? hoursSince(lastLogTime) : null;

      setSessionStats({
        totalSessions: actStats.allTime.sessions,
        hasRecent: hoursAgo !== null && hoursAgo < 2,
      });
    }

    loadActivityStats();

    // Refresh every 60s to keep hasRecentSession accurate
    const interval = setInterval(loadActivityStats, 60_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Derive current mood from latest entry
  const currentMood: MoodType | null = entries.length > 0 ? entries[0].mood : null;

  // Derive patterns from MoodContext stats
  const patterns = useMemo<EmotionalPattern>(() => {
    const latestTimestamp = entries[0]?.timestamp;
    const hoursSinceVisit = hoursSince(latestTimestamp);

    return {
      dominantMood: stats.mostCommonMood,
      recentTrend: mapTrend(stats.moodTrend),
      timeSinceLastVisit: hoursSinceVisit,
      journeyDays: countUniqueDays(entries),
    };
  }, [entries, stats.mostCommonMood, stats.moodTrend]);

  // Derive journey from mood entries + activity stats
  const journey = useMemo<EmotionalJourney>(() => ({
    totalCheckIns: stats.totalEntries,
    reliefMoments: entries.filter(e => RELIEF_MOODS.has(e.mood)).length,
    totalSessions: sessionStats.totalSessions,
  }), [stats.totalEntries, entries, sessionStats.totalSessions]);

  const hasRecentSession = sessionStats.hasRecent;
  const isInChallengingState = currentMood !== null && CHALLENGING_MOODS.has(currentMood);
  const needsGentleness = isInChallengingState;

  const temperature = useMemo<EmotionalTemperature>(() => ({
    pacing: needsGentleness ? 0.8 : 1.0,
  }), [needsGentleness]);

  const setFlowState = useCallback((state: FlowState) => {
    setFlowStateInternal(state);
  }, []);

  const value = useMemo<EmotionalFlowContextType>(
    () => ({
      currentMood,
      patterns,
      journey,
      hasRecentSession,
      isInChallengingState,
      needsGentleness,
      flowState,
      temperature,
      setFlowState,
    }),
    [currentMood, patterns, journey, hasRecentSession, isInChallengingState, needsGentleness, flowState, temperature, setFlowState],
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
