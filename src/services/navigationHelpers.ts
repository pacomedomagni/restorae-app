/**
 * Navigation Helpers
 * 
 * Utility functions for consistent navigation flows throughout the app.
 * Provides unified session completion handling with gamification integration.
 */
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, MoodType } from '../types';
import { gamification, ActivityType } from './gamification';
import { recommendations } from './recommendations';

// Type for any navigation object that can navigate
type AnyNavigation = NavigationProp<ParamListBase> | { navigate: (screen: string, params?: any) => void };

// =============================================================================
// TYPES
// =============================================================================
export type SessionType = 
  | 'breathing'
  | 'grounding'
  | 'reset'
  | 'focus'
  | 'journal'
  | 'story'
  | 'ritual'
  | 'mood';

interface SessionCompleteOptions {
  sessionType: SessionType;
  sessionName?: string;
  duration?: number; // in seconds
  cycles?: number;
  steps?: number;
  wordCount?: number;
  mood?: MoodType;
  skipCompletionScreen?: boolean; // For cases where we want to go directly home
}

// =============================================================================
// SESSION XP VALUES
// =============================================================================
const SESSION_XP: Record<SessionType, number> = {
  breathing: 15,
  grounding: 15,
  reset: 10,
  focus: 25,
  journal: 20,
  story: 15,
  ritual: 30,
  mood: 10,
};

// =============================================================================
// COMPLETE SESSION
// =============================================================================
/**
 * Navigate to the SessionComplete screen with proper params.
 * This ensures all tool completions have a consistent, celebratory experience.
 */
export function navigateToSessionComplete(
  navigation: AnyNavigation,
  options: SessionCompleteOptions
) {
  const { skipCompletionScreen, ...params } = options;

  if (skipCompletionScreen) {
    // Award XP in background and go home
    processSessionCompletionBackground(options);
    navigation.navigate('Main');
  } else {
    navigation.navigate('SessionComplete', params);
  }
}

/**
 * Process session completion in background (when skipCompletionScreen is true)
 */
async function processSessionCompletionBackground(options: SessionCompleteOptions) {
  const { sessionType, sessionName, duration } = options;
  const xpEarned = SESSION_XP[sessionType];

  try {
    // Map session type to activity type
    const activityMap: Record<SessionType, ActivityType> = {
      breathing: 'breathing',
      grounding: 'grounding',
      reset: 'breathing',
      focus: 'focus',
      journal: 'journal',
      story: 'story',
      ritual: 'ritual',
      mood: 'mood',
    };

    const activityType = activityMap[sessionType];
    const durationMinutes = duration ? Math.round(duration / 60) : 0;

    // Record activity (awards XP, updates streaks, checks achievements)
    const result = await gamification.recordActivity(
      activityType,
      durationMinutes,
      { sessionName: sessionName || sessionType }
    );

    // Record activity for recommendations
    await recommendations.recordActivity(sessionType, sessionName || sessionType);

    // Store pending celebrations for home screen
    if (result.levelUp && result.newLevel) {
      await AsyncStorage.setItem(
        '@restorae:pending_levelup',
        JSON.stringify(result.newLevel)
      );
    }

    if (result.newAchievements.length > 0) {
      await AsyncStorage.setItem(
        '@restorae:pending_achievement',
        JSON.stringify(result.newAchievements[0])
      );
    }

    // Store XP earned for session complete overlay
    await AsyncStorage.setItem('@restorae:pending_session_xp', result.xpEarned.toString());
  } catch (error) {
    console.warn('Failed to process session completion:', error);
  }
}

// =============================================================================
// QUICK NAVIGATION HELPERS
// =============================================================================

/**
 * Navigate to a breathing session with the given pattern
 */
export function navigateToBreathing(
  navigation: AnyNavigation,
  patternId?: string
) {
  if (patternId) {
    navigation.navigate('Breathing', { patternId });
  } else {
    navigation.navigate('BreathingSelect');
  }
}

/**
 * Navigate to a grounding session with the given technique
 */
export function navigateToGrounding(
  navigation: AnyNavigation,
  techniqueId?: string
) {
  if (techniqueId) {
    navigation.navigate('GroundingSession', { techniqueId });
  } else {
    navigation.navigate('GroundingSelect');
  }
}

/**
 * Navigate to a focus session
 */
export function navigateToFocus(
  navigation: AnyNavigation,
  sessionId?: string
) {
  if (sessionId) {
    navigation.navigate('FocusSession', { sessionId });
  } else {
    navigation.navigate('FocusSelect');
  }
}

/**
 * Navigate to journal entry screen
 */
export function navigateToJournal(
  navigation: AnyNavigation,
  mode: 'new' | 'prompt' = 'new',
  prompt?: string
) {
  navigation.navigate('JournalEntry', { mode, prompt });
}

/**
 * Navigate to a story player
 */
export function navigateToStory(
  navigation: AnyNavigation,
  storyId: string
) {
  navigation.navigate('StoryPlayer', { storyId });
}

/**
 * Navigate to mood check-in
 */
export function navigateToMoodCheckin(
  navigation: AnyNavigation,
  mood?: MoodType
) {
  navigation.navigate('MoodCheckin', { mood });
}

// =============================================================================
// FLOW STATE HELPERS
// =============================================================================

/**
 * Check if user is in an active session
 */
const ACTIVE_SESSION_KEY = '@restorae:active_session';

export async function setActiveSession(sessionType: SessionType, startTime: number) {
  await AsyncStorage.setItem(
    ACTIVE_SESSION_KEY,
    JSON.stringify({ sessionType, startTime })
  );
}

export async function clearActiveSession() {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}

export async function getActiveSession(): Promise<{ sessionType: SessionType; startTime: number } | null> {
  const data = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Calculate session duration from start time
 */
export function calculateSessionDuration(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000);
}

// =============================================================================
// EXPORT
// =============================================================================
export const navigationHelpers = {
  navigateToSessionComplete,
  navigateToBreathing,
  navigateToGrounding,
  navigateToFocus,
  navigateToJournal,
  navigateToStory,
  navigateToMoodCheckin,
  setActiveSession,
  clearActiveSession,
  getActiveSession,
  calculateSessionDuration,
  SESSION_XP,
};

export default navigationHelpers;
