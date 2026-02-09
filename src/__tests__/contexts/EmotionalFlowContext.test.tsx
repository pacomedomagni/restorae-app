/**
 * EmotionalFlowContext Tests
 *
 * Tests the EmotionalFlowProvider and useEmotionalFlow hook.
 * Validates derived emotional state, patterns, and temperature from mood entries.
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks  (jest.mock factories are hoisted, so use inline definitions)
// ---------------------------------------------------------------------------

const mockUseMood = jest.fn();

jest.mock('../../contexts/MoodContext', () => ({
  useMood: () => mockUseMood(),
}));

jest.mock('../../services/activityLogger', () => ({
  activityLogger: {
    initialize: jest.fn(() => Promise.resolve()),
    getStats: jest.fn(() => ({
      today: { sessions: 0, minutes: 0, byCategory: {} },
      thisWeek: { sessions: 0, minutes: 0, byCategory: {}, dailyBreakdown: {} },
      allTime: { sessions: 5, minutes: 30, byCategory: {} },
    })),
    getRecentLogs: jest.fn(() => []),
  },
}));

import { EmotionalFlowProvider, useEmotionalFlow } from '../../contexts/EmotionalFlowContext';
import { activityLogger } from '../../services/activityLogger';

// Cast for easy access in tests
const mockActivityLogger = activityLogger as jest.Mocked<typeof activityLogger>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <EmotionalFlowProvider>{children}</EmotionalFlowProvider>;
  };
}

/** Default mood data: one calm entry, stable trend */
function setDefaultMoodData() {
  mockUseMood.mockReturnValue({
    entries: [
      { id: '1', mood: 'calm', timestamp: new Date().toISOString(), note: '' },
    ],
    stats: {
      totalEntries: 1,
      currentStreak: 1,
      longestStreak: 1,
      weeklyEntries: 1,
      monthlyEntries: 1,
      moodDistribution: { calm: 1 },
      averageMoodsPerDay: 1,
      lastSevenDays: [],
      mostCommonMood: 'calm',
      moodTrend: 'stable',
    },
  });
}

/** Mood data with an anxious latest entry */
function setAnxiousMoodData() {
  mockUseMood.mockReturnValue({
    entries: [
      { id: '2', mood: 'anxious', timestamp: new Date().toISOString(), note: '' },
    ],
    stats: {
      totalEntries: 1,
      currentStreak: 1,
      longestStreak: 1,
      weeklyEntries: 1,
      monthlyEntries: 1,
      moodDistribution: { anxious: 1 },
      averageMoodsPerDay: 1,
      lastSevenDays: [],
      mostCommonMood: 'anxious',
      moodTrend: 'declining',
    },
  });
}

/** Mood data with a "low" latest entry */
function setLowMoodData() {
  mockUseMood.mockReturnValue({
    entries: [
      { id: '3', mood: 'low', timestamp: new Date().toISOString(), note: '' },
    ],
    stats: {
      totalEntries: 1,
      currentStreak: 1,
      longestStreak: 1,
      weeklyEntries: 1,
      monthlyEntries: 1,
      moodDistribution: { low: 1 },
      averageMoodsPerDay: 1,
      lastSevenDays: [],
      mostCommonMood: 'low',
      moodTrend: 'declining',
    },
  });
}

/** Mood data with no entries */
function setEmptyMoodData() {
  mockUseMood.mockReturnValue({
    entries: [],
    stats: {
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyEntries: 0,
      monthlyEntries: 0,
      moodDistribution: {},
      averageMoodsPerDay: 0,
      lastSevenDays: [],
      mostCommonMood: null,
      moodTrend: 'insufficient',
    },
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe('EmotionalFlowContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Restore default mock implementations after clearAllMocks wipes them
    (mockActivityLogger.initialize as jest.Mock).mockImplementation(() => Promise.resolve());
    (mockActivityLogger.getStats as jest.Mock).mockReturnValue({
      today: { sessions: 0, minutes: 0, byCategory: {} },
      thisWeek: { sessions: 0, minutes: 0, byCategory: {}, dailyBreakdown: {} },
      allTime: { sessions: 5, minutes: 30, byCategory: {} },
    });
    (mockActivityLogger.getRecentLogs as jest.Mock).mockReturnValue([]);

    setDefaultMoodData();
  });

  // ---------------------------------------------------------------------------
  // Hook guard
  // ---------------------------------------------------------------------------
  describe('useEmotionalFlow outside provider', () => {
    it('throws when used outside EmotionalFlowProvider', () => {
      // Suppress console.error for the expected error
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useEmotionalFlow());
      }).toThrow('useEmotionalFlow must be used within an EmotionalFlowProvider');

      spy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // currentMood
  // ---------------------------------------------------------------------------
  describe('currentMood', () => {
    it('exposes currentMood from the latest mood entry', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentMood).toBe('calm');
    });

    it('sets currentMood to null when there are no entries', async () => {
      setEmptyMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentMood).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // patterns
  // ---------------------------------------------------------------------------
  describe('patterns', () => {
    it('exposes dominantMood from mood stats mostCommonMood', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.patterns.dominantMood).toBe('calm');
    });

    it('maps "stable" mood trend to "stable" recentTrend', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.patterns.recentTrend).toBe('stable');
    });

    it('maps "declining" mood trend to "struggling" recentTrend', async () => {
      setAnxiousMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.patterns.recentTrend).toBe('struggling');
    });

    it('maps "insufficient" mood trend to null recentTrend', async () => {
      setEmptyMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.patterns.recentTrend).toBeNull();
    });

    it('calculates journeyDays from unique entry dates', async () => {
      mockUseMood.mockReturnValue({
        entries: [
          { id: '1', mood: 'calm', timestamp: '2025-02-07T10:00:00.000Z', note: '' },
          { id: '2', mood: 'good', timestamp: '2025-02-07T18:00:00.000Z', note: '' },
          { id: '3', mood: 'calm', timestamp: '2025-02-06T10:00:00.000Z', note: '' },
        ],
        stats: {
          totalEntries: 3,
          currentStreak: 2,
          longestStreak: 2,
          weeklyEntries: 3,
          monthlyEntries: 3,
          moodDistribution: { calm: 2, good: 1 },
          averageMoodsPerDay: 1.5,
          lastSevenDays: [],
          mostCommonMood: 'calm',
          moodTrend: 'stable',
        },
      });

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      // Two unique dates: Feb 6 and Feb 7
      expect(result.current.patterns.journeyDays).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // isInChallengingState
  // ---------------------------------------------------------------------------
  describe('isInChallengingState', () => {
    it('is true when current mood is "anxious"', async () => {
      setAnxiousMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isInChallengingState).toBe(true);
    });

    it('is true when current mood is "low"', async () => {
      setLowMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isInChallengingState).toBe(true);
    });

    it('is true when current mood is "tough"', async () => {
      mockUseMood.mockReturnValue({
        entries: [
          { id: '4', mood: 'tough', timestamp: new Date().toISOString(), note: '' },
        ],
        stats: {
          totalEntries: 1,
          currentStreak: 1,
          longestStreak: 1,
          weeklyEntries: 1,
          monthlyEntries: 1,
          moodDistribution: { tough: 1 },
          averageMoodsPerDay: 1,
          lastSevenDays: [],
          mostCommonMood: 'tough',
          moodTrend: 'declining',
        },
      });

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isInChallengingState).toBe(true);
    });

    it('is false when current mood is "calm"', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isInChallengingState).toBe(false);
    });

    it('is false when there are no mood entries', async () => {
      setEmptyMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isInChallengingState).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // needsGentleness
  // ---------------------------------------------------------------------------
  describe('needsGentleness', () => {
    it('is true when in a challenging state', async () => {
      setAnxiousMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.needsGentleness).toBe(true);
    });

    it('is false when mood is not challenging', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.needsGentleness).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // temperature
  // ---------------------------------------------------------------------------
  describe('temperature', () => {
    it('sets pacing to 0.8 when needsGentleness is true', async () => {
      setAnxiousMoodData();

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.temperature.pacing).toBe(0.8);
    });

    it('sets pacing to 1.0 when needsGentleness is false', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.temperature.pacing).toBe(1.0);
    });
  });

  // ---------------------------------------------------------------------------
  // flowState and setFlowState
  // ---------------------------------------------------------------------------
  describe('flowState', () => {
    it('defaults to "arriving"', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.flowState).toBe('arriving');
    });

    it('updates flowState via setFlowState', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setFlowState('present');
      });

      expect(result.current.flowState).toBe('present');
    });

    it('can transition through multiple flow states', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setFlowState('transitioning');
      });
      expect(result.current.flowState).toBe('transitioning');

      act(() => {
        result.current.setFlowState('completing');
      });
      expect(result.current.flowState).toBe('completing');
    });
  });

  // ---------------------------------------------------------------------------
  // hasRecentSession
  // ---------------------------------------------------------------------------
  describe('hasRecentSession', () => {
    it('is false when no recent activity logs exist', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockActivityLogger.initialize).toHaveBeenCalled();
      });

      expect(result.current.hasRecentSession).toBe(false);
    });

    it('is true when there is a session completed less than 2 hours ago', async () => {
      const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
      (mockActivityLogger.getRecentLogs as jest.Mock).mockReturnValue([
        {
          id: 'log-1',
          category: 'breathing',
          activityId: 'box-breathing',
          activityName: 'Box Breathing',
          startedAt: recentTime,
          completedAt: recentTime,
          durationSeconds: 120,
          completed: true,
          isSynced: false,
        },
      ]);

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasRecentSession).toBe(true);
      });
    });

    it('is false when last session was more than 2 hours ago', async () => {
      const oldTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
      (mockActivityLogger.getRecentLogs as jest.Mock).mockReturnValue([
        {
          id: 'log-2',
          category: 'grounding',
          activityId: '5-4-3-2-1',
          activityName: '5-4-3-2-1 Senses',
          startedAt: oldTime,
          completedAt: oldTime,
          durationSeconds: 180,
          completed: true,
          isSynced: false,
        },
      ]);

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockActivityLogger.initialize).toHaveBeenCalled();
      });

      expect(result.current.hasRecentSession).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // journey
  // ---------------------------------------------------------------------------
  describe('journey', () => {
    it('exposes totalCheckIns from mood stats', async () => {
      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.journey.totalCheckIns).toBe(1);
    });

    it('counts reliefMoments from calm/good/energized entries', async () => {
      mockUseMood.mockReturnValue({
        entries: [
          { id: '1', mood: 'calm', timestamp: new Date().toISOString() },
          { id: '2', mood: 'good', timestamp: new Date().toISOString() },
          { id: '3', mood: 'anxious', timestamp: new Date().toISOString() },
          { id: '4', mood: 'energized', timestamp: new Date().toISOString() },
        ],
        stats: {
          totalEntries: 4,
          currentStreak: 1,
          longestStreak: 1,
          weeklyEntries: 4,
          monthlyEntries: 4,
          moodDistribution: {},
          averageMoodsPerDay: 4,
          lastSevenDays: [],
          mostCommonMood: 'calm',
          moodTrend: 'stable',
        },
      });

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      // calm + good + energized = 3, anxious is not a relief mood
      expect(result.current.journey.reliefMoments).toBe(3);
    });

    it('exposes totalSessions from activity logger stats', async () => {
      (mockActivityLogger.getStats as jest.Mock).mockReturnValue({
        today: { sessions: 0, minutes: 0, byCategory: {} },
        thisWeek: { sessions: 0, minutes: 0, byCategory: {}, dailyBreakdown: {} },
        allTime: { sessions: 12, minutes: 60, byCategory: {} },
      });

      const { result } = renderHook(() => useEmotionalFlow(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.journey.totalSessions).toBe(12);
      });
    });
  });
});
