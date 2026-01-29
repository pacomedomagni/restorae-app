/**
 * CoachMarkContext
 * 
 * Manages first-time user guidance tooltips (coach marks).
 * Tracks which tips have been shown and provides methods to display them.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../services/logger';

// =============================================================================
// TYPES
// =============================================================================

export type CoachMarkId = 
  // Home Screen
  | 'home_for_you'
  | 'home_mood_checkin'
  | 'home_mood_select'
  | 'home_quick_actions'
  // Tools Screen
  | 'tools_long_press'
  | 'tools_categories'
  | 'tools_browse'
  // Breathing
  | 'breathing_tap_to_pause'
  | 'breathing_tap'
  | 'breathing_swipe_patterns'
  // Journal
  | 'journal_swipe_entries'
  | 'journal_swipe'
  | 'journal_long_press'
  | 'journal_search'
  | 'journal_private'
  // Focus
  | 'focus_ambient_sounds'
  | 'focus_timer'
  // Stories
  | 'stories_sleep_timer'
  | 'stories_scrub'
  // Profile
  | 'profile_streak'
  | 'profile_achievements'
  | 'profile_customize';

export interface CoachMark {
  id: CoachMarkId;
  title: string;
  message: string;
  icon?: string;
  position?: 'top' | 'bottom' | 'center';
  highlightArea?: { x: number; y: number; width: number; height: number };
}

interface CoachMarkState {
  shownMarks: Set<CoachMarkId>;
  isLoaded: boolean;
}

interface CoachMarkContextType {
  // Check if a coach mark has been shown
  hasBeenShown: (id: CoachMarkId) => boolean;
  
  // Mark a coach mark as shown
  markAsShown: (id: CoachMarkId) => Promise<void>;
  
  // Get pending coach mark for a screen (returns first unshown)
  getPendingMark: (screenMarks: CoachMarkId[]) => CoachMarkId | null;
  
  // Show a specific coach mark (if not already shown)
  shouldShow: (id: CoachMarkId) => boolean;
  
  // Alias for shouldShow
  shouldShowCoachMark: (id: CoachMarkId) => boolean;
  
  // Coach mark definitions
  COACH_MARKS: Record<CoachMarkId, Omit<CoachMark, 'id'>>;
  
  // Reset all coach marks (for testing)
  resetAllMarks: () => Promise<void>;
  
  // Current active coach mark
  activeCoachMark: CoachMark | null;
  setActiveCoachMark: (mark: CoachMark | null) => void;
  
  // Dismiss current coach mark
  dismissCoachMark: () => Promise<void>;
  
  // Loading state
  isLoaded: boolean;
}

// =============================================================================
// COACH MARK DEFINITIONS
// =============================================================================

export const COACH_MARKS: Record<CoachMarkId, Omit<CoachMark, 'id'>> = {
  // Home Screen
  home_for_you: {
    title: 'Personalized For You',
    message: 'These recommendations adapt to your mood, time of day, and wellness goals.',
    icon: '✨',
    position: 'bottom',
  },
  home_mood_checkin: {
    title: 'Track Your Mood',
    message: 'Regular check-ins help us personalize your experience and show your progress.',
    icon: '🎯',
    position: 'bottom',
  },
  home_mood_select: {
    title: 'How Are You Feeling?',
    message: 'Tap a mood orb to check in. This helps personalize your experience.',
    icon: '💫',
    position: 'center',
  },
  home_quick_actions: {
    title: 'Quick Actions',
    message: 'Tap any tool to start a session. Your most-used tools appear first.',
    icon: '⚡',
    position: 'top',
  },
  
  // Tools Screen
  tools_long_press: {
    title: 'Quick Start',
    message: 'Long press any tool to start immediately with default settings.',
    icon: '👆',
    position: 'center',
  },
  tools_categories: {
    title: 'Explore Categories',
    message: 'Swipe to discover breathing, grounding, focus, and more wellness tools.',
    icon: '🧭',
    position: 'top',
  },
  
  // Breathing
  breathing_tap_to_pause: {
    title: 'Tap to Control',
    message: 'Tap anywhere on the screen to pause or resume your breathing session.',
    icon: '⏸️',
    position: 'center',
  },
  breathing_swipe_patterns: {
    title: 'More Patterns',
    message: 'Swipe left or right to explore different breathing techniques.',
    icon: '👈',
    position: 'bottom',
  },
  
  // Journal
  journal_swipe_entries: {
    title: 'Swipe to Navigate',
    message: 'Swipe left on an entry to delete, or swipe right to edit.',
    icon: '📝',
    position: 'center',
  },
  journal_long_press: {
    title: 'Entry Options',
    message: 'Long press an entry for more options like share or archive.',
    icon: '📋',
    position: 'center',
  },
  journal_search: {
    title: 'Search Your Thoughts',
    message: 'Use the search bar to find entries by keyword, mood, or date.',
    icon: '🔍',
    position: 'top',
  },
  
  // Focus
  focus_ambient_sounds: {
    title: 'Ambient Sounds',
    message: 'Tap the sound icon to add relaxing background audio to your session.',
    icon: '🎵',
    position: 'bottom',
  },
  focus_timer: {
    title: 'Flexible Timer',
    message: 'Sessions can be timed or open-ended. Find what works for you.',
    icon: '⏱️',
    position: 'center',
  },
  
  // Stories
  stories_sleep_timer: {
    title: 'Sleep Timer',
    message: 'Set a sleep timer to automatically stop the story as you drift off.',
    icon: '🌙',
    position: 'bottom',
  },
  
  // Profile
  profile_streak: {
    title: 'Keep Your Streak',
    message: 'Practice daily to build your streak. Consistency beats intensity!',
    icon: '🔥',
    position: 'top',
  },
  profile_achievements: {
    title: 'Earn Achievements',
    message: 'Complete milestones to unlock achievements and track your growth.',
    icon: '🏆',
    position: 'center',
  },
  profile_customize: {
    title: 'Personalize Your Experience',
    message: 'Customize your profile settings and preferences here.',
    icon: '⚙️',
    position: 'center',
  },
  // Additional tools
  tools_browse: {
    title: 'Browse Tools',
    message: 'Explore all available wellness tools organized by category.',
    icon: '🔎',
    position: 'top',
  },
  // Additional breathing
  breathing_tap: {
    title: 'Tap to Control',
    message: 'Tap anywhere on the screen to pause or resume your breathing session.',
    icon: '⏸️',
    position: 'center',
  },
  // Additional journal
  journal_swipe: {
    title: 'Swipe to Navigate',
    message: 'Swipe left on an entry to delete, or swipe right to edit.',
    icon: '📝',
    position: 'center',
  },
  journal_private: {
    title: 'Private & Secure',
    message: 'Your journal entries are private and stored securely on your device.',
    icon: '🔒',
    position: 'top',
  },
  // Additional stories
  stories_scrub: {
    title: 'Scrub Through Story',
    message: 'Drag the progress bar to jump to any point in the story.',
    icon: '⏩',
    position: 'bottom',
  },
};

// =============================================================================
// CONTEXT
// =============================================================================

const STORAGE_KEY = '@restorae/coach_marks_shown';

const CoachMarkContext = createContext<CoachMarkContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

export function CoachMarkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CoachMarkState>({
    shownMarks: new Set(),
    isLoaded: false,
  });
  const [activeCoachMark, setActiveCoachMark] = useState<CoachMark | null>(null);

  // Load shown marks from storage
  useEffect(() => {
    async function loadShownMarks() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CoachMarkId[];
          setState({
            shownMarks: new Set(parsed),
            isLoaded: true,
          });
        } else {
          setState(prev => ({ ...prev, isLoaded: true }));
        }
      } catch (error) {
        logger.error('Failed to load coach marks:', error);
        setState(prev => ({ ...prev, isLoaded: true }));
      }
    }
    loadShownMarks();
  }, []);

  // Save shown marks to storage
  const saveShownMarks = useCallback(async (marks: Set<CoachMarkId>) => {
    try {
      const array = Array.from(marks);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
      logger.error('Failed to save coach marks:', error);
    }
  }, []);

  // Check if a mark has been shown
  const hasBeenShown = useCallback((id: CoachMarkId): boolean => {
    return state.shownMarks.has(id);
  }, [state.shownMarks]);

  // Mark as shown
  const markAsShown = useCallback(async (id: CoachMarkId) => {
    setState(prev => {
      const newShown = new Set(prev.shownMarks);
      newShown.add(id);
      saveShownMarks(newShown);
      return { ...prev, shownMarks: newShown };
    });
  }, [saveShownMarks]);

  // Get pending mark for a screen
  const getPendingMark = useCallback((screenMarks: CoachMarkId[]): CoachMarkId | null => {
    for (const id of screenMarks) {
      if (!state.shownMarks.has(id)) {
        return id;
      }
    }
    return null;
  }, [state.shownMarks]);

  // Should show a mark
  const shouldShow = useCallback((id: CoachMarkId): boolean => {
    return state.isLoaded && !state.shownMarks.has(id);
  }, [state.isLoaded, state.shownMarks]);

  // Dismiss current coach mark
  const dismissCoachMark = useCallback(async () => {
    if (activeCoachMark) {
      await markAsShown(activeCoachMark.id);
      setActiveCoachMark(null);
    }
  }, [activeCoachMark, markAsShown]);

  // Reset all marks
  const resetAllMarks = useCallback(async () => {
    setState({
      shownMarks: new Set(),
      isLoaded: true,
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<CoachMarkContextType>(() => ({
    hasBeenShown,
    markAsShown,
    getPendingMark,
    shouldShow,
    shouldShowCoachMark: shouldShow,
    COACH_MARKS,
    resetAllMarks,
    activeCoachMark,
    setActiveCoachMark,
    dismissCoachMark,
    isLoaded: state.isLoaded,
  }), [
    hasBeenShown,
    markAsShown,
    getPendingMark,
    shouldShow,
    resetAllMarks,
    activeCoachMark,
    dismissCoachMark,
    state.isLoaded,
  ]);

  return (
    <CoachMarkContext.Provider value={value}>
      {children}
    </CoachMarkContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useCoachMarks() {
  const context = useContext(CoachMarkContext);
  if (!context) {
    throw new Error('useCoachMarks must be used within a CoachMarkProvider');
  }
  return context;
}

export default CoachMarkProvider;
