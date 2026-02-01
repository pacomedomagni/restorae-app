/**
 * useContextualCopy
 * 
 * A hook that generates dynamic, empathetic micro-copy throughout the app.
 * Instead of static labels, text responds to:
 * - Current emotional state
 * - Recent patterns and trends
 * - Time of day
 * - Journey milestones
 * - Time since last visit
 * 
 * This transforms the app from "transactional" to "conversational"
 */
import { useMemo, useCallback } from 'react';
import { useEmotionalFlow, EmotionalPattern, EmotionalJourney } from '../contexts/EmotionalFlowContext';
import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type CopyContext = 
  | 'home_greeting'
  | 'home_mood_prompt'
  | 'mood_selected'
  | 'session_start'
  | 'session_complete'
  | 'session_mid_checkin'
  | 'journal_prompt'
  | 'returning_user'
  | 'streak_message'
  | 'tool_suggestion'
  | 'encouragement'
  | 'celebration'
  | 'gentle_nudge';

export interface CopyOptions {
  /** User's name for personalization */
  userName?: string;
  /** Specific mood to reference */
  mood?: MoodType;
  /** Additional context data */
  context?: Record<string, any>;
}

// =============================================================================
// TIME UTILITIES
// =============================================================================

function getTimeOfDay(): 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function formatTimeSince(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return 'a little while';
  if (minutes < 120) return 'about an hour';
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} hours`;
  if (minutes < 60 * 24 * 2) return 'a day';
  return `${Math.round(minutes / (60 * 24))} days`;
}

// =============================================================================
// COPY TEMPLATES
// =============================================================================

// Home greetings based on context
const HOME_GREETINGS = {
  // Time-based defaults
  early_morning: [
    "The world is still quiet",
    "A gentle start",
    "Before the rush",
  ],
  morning: [
    "Good morning",
    "A new day awaits",
    "Fresh beginnings",
  ],
  afternoon: [
    "Good afternoon",
    "Taking a moment",
    "A pause in your day",
  ],
  evening: [
    "Good evening",
    "Winding down",
    "The day softens",
  ],
  night: [
    "Still here with you",
    "In the quiet hours",
    "Before rest",
  ],
  
  // Returning after absence
  returning_after_day: [
    "Welcome back",
    "You returned",
    "Here again",
  ],
  returning_after_week: [
    "It's been a while",
    "Welcome back",
    "Good to see you",
  ],
  
  // Post-session states
  after_session: [
    "How do you feel now?",
    "Taking a breath",
    "Settling in",
  ],
  
  // Streak-aware
  on_streak: [
    "Day {streak} together",
    "You keep showing up",
    "Another day of presence",
  ],
  
  // Trend-aware
  improving_trend: [
    "Things are looking up",
    "Progress, one day at a time",
    "Noticing a shift",
  ],
  struggling_trend: [
    "Still here with you",
    "One moment at a time",
    "You're not alone in this",
  ],
};

// Mood prompts that feel like invitations, not demands
const MOOD_PROMPTS = {
  default: [
    "How are you, really?",
    "Check in with yourself",
    "What's present for you?",
  ],
  gentle: [
    "When you're ready...",
    "There's no rush",
    "Take your time",
  ],
  returning: [
    "How are you today?",
    "Where are you right now?",
    "What's here with you?",
  ],
  after_challenging: [
    "How are things now?",
    "Anything shifted?",
    "What do you notice?",
  ],
};

// Session starting messages
const SESSION_START = {
  default: [
    "Let's begin",
    "We'll go at your pace",
    "Ready when you are",
  ],
  anxious: [
    "This is a safe space",
    "We'll go slowly",
    "Just be here",
  ],
  low: [
    "No pressure here",
    "Just as you are",
    "One moment at a time",
  ],
  energized: [
    "Let's channel that energy",
    "Here we go",
    "Ready to begin",
  ],
};

// Mid-session check-ins
const SESSION_MID_CHECKIN = {
  default: [
    "How's this landing?",
    "Still with me?",
    "What do you notice?",
  ],
  anxious: [
    "You're doing great",
    "Stay with the breath",
    "Almost there",
  ],
  low: [
    "You're showing up",
    "That takes something",
    "Keep going",
  ],
};

// Encouragement messages
const ENCOURAGEMENTS = {
  general: [
    "You're doing something meaningful",
    "This matters",
    "Small steps add up",
  ],
  after_hard_day: [
    "You reached out. That's strength",
    "Tomorrow is a new page",
    "Rest well tonight",
  ],
  milestone: [
    "Look how far you've come",
    "This is real progress",
    "You should be proud",
  ],
  struggling: [
    "Difficult days pass",
    "You're still here, still trying",
    "That's enough",
  ],
};

// Gentle nudges (not pushy!)
const GENTLE_NUDGES = {
  return_after_absence: [
    "Your space is here whenever you need it",
    "No judgment for the gap",
    "Welcome back, at your own pace",
  ],
  incomplete_session: [
    "We can pick up where you left off",
    "Or start fresh—your choice",
    "Both are okay",
  ],
};

// Tool suggestions based on mood
const TOOL_SUGGESTIONS: Record<MoodType, string[]> = {
  good: [
    "Capture this feeling in a journal",
    "A focus session could amplify this",
    "Ride this wave with intention",
  ],
  calm: [
    "Deepen this with a meditation",
    "A reflective journal moment",
    "Stay in this space a while",
  ],
  energized: [
    "Channel this into focus time",
    "A brief grounding might help direct this",
    "Use this energy wisely",
  ],
  anxious: [
    "Breathing can settle the nervous system",
    "Grounding brings you back to now",
    "A quick reset might help",
  ],
  low: [
    "A gentle breathing exercise",
    "Some movement might shift things",
    "Even just being here is something",
  ],
  tough: [
    "Let's start with a reset",
    "Grounding can help right now",
    "One breath at a time",
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function interpolate(template: string, values: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useContextualCopy() {
  const {
    currentMood,
    patterns,
    journey,
    hasRecentSession,
    isInChallengingState,
    needsGentleness,
    flowState,
  } = useEmotionalFlow();

  // Get contextual greeting
  const getGreeting = useCallback((options: CopyOptions = {}): string => {
    const { userName } = options;
    const timeOfDay = getTimeOfDay();
    const timeSince = patterns.timeSinceLastVisit;

    // Post-session state
    if (hasRecentSession) {
      return pickRandom(HOME_GREETINGS.after_session);
    }

    // Returning after long absence
    if (timeSince && timeSince > 60 * 24 * 7) {
      return pickRandom(HOME_GREETINGS.returning_after_week);
    }
    if (timeSince && timeSince > 60 * 24) {
      return pickRandom(HOME_GREETINGS.returning_after_day);
    }

    // Trend-aware
    if (patterns.recentTrend === 'improving') {
      return pickRandom(HOME_GREETINGS.improving_trend);
    }
    if (patterns.recentTrend === 'struggling') {
      return pickRandom(HOME_GREETINGS.struggling_trend);
    }

    // Default time-based
    const greeting = pickRandom(HOME_GREETINGS[timeOfDay]);
    return userName ? `${greeting}, ${userName}` : greeting;
  }, [patterns, hasRecentSession]);

  // Get mood prompt
  const getMoodPrompt = useCallback((options: CopyOptions = {}): string => {
    // After challenging mood, be extra gentle
    if (patterns.dominantMood && ['anxious', 'low', 'tough'].includes(patterns.dominantMood)) {
      return pickRandom(MOOD_PROMPTS.gentle);
    }

    // Returning user
    if (flowState === 'returning') {
      return pickRandom(MOOD_PROMPTS.returning);
    }

    // After a session where they worked through something
    if (hasRecentSession && isInChallengingState) {
      return pickRandom(MOOD_PROMPTS.after_challenging);
    }

    return pickRandom(MOOD_PROMPTS.default);
  }, [patterns, flowState, hasRecentSession, isInChallengingState]);

  // Get session start message
  const getSessionStartMessage = useCallback((options: CopyOptions = {}): string => {
    const mood = options.mood || currentMood;

    if (mood === 'anxious') {
      return pickRandom(SESSION_START.anxious);
    }
    if (mood === 'low') {
      return pickRandom(SESSION_START.low);
    }
    if (mood === 'energized') {
      return pickRandom(SESSION_START.energized);
    }

    return pickRandom(SESSION_START.default);
  }, [currentMood]);

  // Get mid-session check-in
  const getMidSessionCheckin = useCallback((options: CopyOptions = {}): string => {
    const mood = options.mood || currentMood;

    if (mood === 'anxious') {
      return pickRandom(SESSION_MID_CHECKIN.anxious);
    }
    if (mood === 'low') {
      return pickRandom(SESSION_MID_CHECKIN.low);
    }

    return pickRandom(SESSION_MID_CHECKIN.default);
  }, [currentMood]);

  // Get encouragement
  const getEncouragement = useCallback((options: CopyOptions = {}): string => {
    const { context } = options;

    // Milestone celebration
    if (context?.milestone) {
      return pickRandom(ENCOURAGEMENTS.milestone);
    }

    // After a hard day
    if (patterns.recentTrend === 'struggling') {
      return pickRandom(ENCOURAGEMENTS.struggling);
    }

    // After working through challenging mood
    if (isInChallengingState) {
      return pickRandom(ENCOURAGEMENTS.after_hard_day);
    }

    return pickRandom(ENCOURAGEMENTS.general);
  }, [patterns, isInChallengingState]);

  // Get tool suggestion
  const getToolSuggestion = useCallback((options: CopyOptions = {}): string => {
    const mood = options.mood || currentMood || 'calm';
    return pickRandom(TOOL_SUGGESTIONS[mood]);
  }, [currentMood]);

  // Get gentle nudge
  const getGentleNudge = useCallback((type: 'return' | 'incomplete'): string => {
    if (type === 'incomplete') {
      return pickRandom(GENTLE_NUDGES.incomplete_session);
    }
    return pickRandom(GENTLE_NUDGES.return_after_absence);
  }, []);

  // Get streak message
  const getStreakMessage = useCallback((streakDays: number): string => {
    if (streakDays <= 1) return "Starting a streak";
    if (streakDays < 7) return `Day ${streakDays} of showing up`;
    if (streakDays === 7) return "A full week of presence";
    if (streakDays < 30) return `${streakDays} days of consistency`;
    if (streakDays === 30) return "A month of dedication";
    return `${streakDays} days strong`;
  }, []);

  // Generate copy for any context
  const getCopy = useCallback((copyContext: CopyContext, options: CopyOptions = {}): string => {
    switch (copyContext) {
      case 'home_greeting':
        return getGreeting(options);
      case 'home_mood_prompt':
        return getMoodPrompt(options);
      case 'session_start':
        return getSessionStartMessage(options);
      case 'session_mid_checkin':
        return getMidSessionCheckin(options);
      case 'encouragement':
        return getEncouragement(options);
      case 'tool_suggestion':
        return getToolSuggestion(options);
      case 'gentle_nudge':
        return getGentleNudge(options.context?.type || 'return');
      case 'streak_message':
        return getStreakMessage(options.context?.streak || 0);
      default:
        return '';
    }
  }, [
    getGreeting,
    getMoodPrompt,
    getSessionStartMessage,
    getMidSessionCheckin,
    getEncouragement,
    getToolSuggestion,
    getGentleNudge,
    getStreakMessage,
  ]);

  // Journey-aware subtitle
  const getJourneySubtitle = useMemo((): string => {
    if (journey.totalCheckIns === 0) {
      return "Your wellness journey begins here";
    }
    if (journey.totalCheckIns < 5) {
      return "Building a practice, one check-in at a time";
    }
    if (journey.reliefMoments > 0) {
      return `${journey.reliefMoments} moments of relief found here`;
    }
    if (journey.totalSessions > 10) {
      return `${journey.totalSessions} sessions of self-care`;
    }
    return "A space for your wellbeing";
  }, [journey]);

  return {
    getCopy,
    getGreeting,
    getMoodPrompt,
    getSessionStartMessage,
    getMidSessionCheckin,
    getEncouragement,
    getToolSuggestion,
    getGentleNudge,
    getStreakMessage,
    journeySubtitle: getJourneySubtitle,
    
    // Convenience: current state awareness
    needsGentleness,
    isInChallengingState,
    currentMood,
    recentTrend: patterns.recentTrend,
    daysSinceStart: patterns.journeyDays,
  };
}

export default useContextualCopy;
