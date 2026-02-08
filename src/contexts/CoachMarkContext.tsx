/**
 * CoachMarkContext - Progressive disclosure for first-time features
 *
 * Tracks which coach marks have been shown via AsyncStorage.
 * Used by BreathingScreen (tap hint) and StoryPlayerScreen (sleep timer, scrub).
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@restorae/coach_marks_seen';

// =============================================================================
// COACH MARK DEFINITIONS
// =============================================================================

export interface CoachMarkConfig {
  id: string;
  title: string;
  description: string;
}

export const COACH_MARKS: Record<string, CoachMarkConfig> = {
  breathing_tap: {
    id: 'breathing_tap',
    title: 'Tap to pause',
    description: 'Tap anywhere to pause or resume your breathing session',
  },
  stories_sleep_timer: {
    id: 'stories_sleep_timer',
    title: 'Sleep timer',
    description: 'Set a sleep timer to automatically stop playback',
  },
  stories_scrub: {
    id: 'stories_scrub',
    title: 'Scrub to seek',
    description: 'Drag the progress bar to jump to any point',
  },
};

// =============================================================================
// CONTEXT
// =============================================================================

interface CoachMarkContextType {
  shouldShowCoachMark: (markId: string) => boolean;
  markAsShown: (markId: string) => void;
  COACH_MARKS: Record<string, CoachMarkConfig>;
}

const CoachMarkContext = createContext<CoachMarkContextType | undefined>(undefined);

export function CoachMarkProvider({ children }: { children: React.ReactNode }) {
  const [seenMarks, setSeenMarks] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load seen marks from storage
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSeenMarks(new Set(JSON.parse(stored)));
        }
      } catch {
        // Silently fail
      }
      setLoaded(true);
    };
    load();
  }, []);

  const shouldShowCoachMark = useCallback(
    (markId: string): boolean => {
      if (!loaded) return false;
      return !seenMarks.has(markId);
    },
    [seenMarks, loaded],
  );

  const markAsShown = useCallback(
    (markId: string) => {
      setSeenMarks((prev) => {
        const next = new Set(prev);
        next.add(markId);
        // Persist asynchronously
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ shouldShowCoachMark, markAsShown, COACH_MARKS }),
    [shouldShowCoachMark, markAsShown],
  );

  return (
    <CoachMarkContext.Provider value={value}>
      {children}
    </CoachMarkContext.Provider>
  );
}

export function useCoachMarks(): CoachMarkContextType {
  const context = useContext(CoachMarkContext);
  if (!context) {
    throw new Error('useCoachMarks must be used within a CoachMarkProvider');
  }
  return context;
}

export default CoachMarkProvider;
