/**
 * useTimeAwareContent Hook
 * 
 * Premium personalization based on time of day and user patterns.
 * Matches industry standards from Calm, Headspace, and Balance.
 * 
 * Features:
 * - Time-based greetings
 * - Contextual content recommendations
 * - Appropriate visual themes
 * - Activity suggestions
 * - Mood-aware messaging
 */
import { useCallback, useMemo } from 'react';
import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================
export type TimeOfDay = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';

export interface TimeContext {
  timeOfDay: TimeOfDay;
  hour: number;
  greeting: string;
  emoji: string;
  backgroundVariant: 'morning' | 'calm' | 'evening';
  suggestedActivity: SuggestedActivity;
  ambientMood: 'energizing' | 'neutral' | 'calming' | 'sleepy';
  colorTone: 'warm' | 'neutral' | 'cool';
}

export interface SuggestedActivity {
  type: 'breathing' | 'grounding' | 'journal' | 'focus' | 'ritual' | 'sleep';
  title: string;
  description: string;
  icon: string;
  duration: string;
}

export interface PersonalizedMessage {
  headline: string;
  subheadline: string;
  encouragement: string;
}

// =============================================================================
// TIME UTILITIES
// =============================================================================

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return 'early-morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 && hour < 24) return 'night';
  return 'late-night'; // 0-4
}

function getGreeting(hour: number, userName?: string): string {
  const name = userName ? `, ${userName}` : '';
  
  if (hour >= 5 && hour < 12) return `Good morning${name}`;
  if (hour >= 12 && hour < 17) return `Good afternoon${name}`;
  if (hour >= 17 && hour < 21) return `Good evening${name}`;
  return `Hello${name}`;
}

function getTimeEmoji(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'early-morning': return '🌅';
    case 'morning': return '☀️';
    case 'afternoon': return '🌤️';
    case 'evening': return '🌆';
    case 'night': return '🌙';
    case 'late-night': return '🌌';
  }
}

function getBackgroundVariant(timeOfDay: TimeOfDay): 'morning' | 'calm' | 'evening' {
  switch (timeOfDay) {
    case 'early-morning':
    case 'morning':
      return 'morning';
    case 'afternoon':
      return 'calm';
    case 'evening':
    case 'night':
    case 'late-night':
      return 'evening';
  }
}

function getAmbientMood(timeOfDay: TimeOfDay): 'energizing' | 'neutral' | 'calming' | 'sleepy' {
  switch (timeOfDay) {
    case 'early-morning':
    case 'morning':
      return 'energizing';
    case 'afternoon':
      return 'neutral';
    case 'evening':
      return 'calming';
    case 'night':
    case 'late-night':
      return 'sleepy';
  }
}

function getColorTone(timeOfDay: TimeOfDay): 'warm' | 'neutral' | 'cool' {
  switch (timeOfDay) {
    case 'early-morning':
    case 'morning':
      return 'warm';
    case 'afternoon':
      return 'neutral';
    case 'evening':
    case 'night':
    case 'late-night':
      return 'cool';
  }
}

// =============================================================================
// ACTIVITY SUGGESTIONS
// =============================================================================

function getSuggestedActivity(timeOfDay: TimeOfDay): SuggestedActivity {
  switch (timeOfDay) {
    case 'early-morning':
      return {
        type: 'ritual',
        title: 'Morning Ritual',
        description: 'Start your day with intention',
        icon: '🌅',
        duration: '5 min',
      };
    case 'morning':
      return {
        type: 'breathing',
        title: 'Energizing Breath',
        description: 'Boost your focus and clarity',
        icon: '🫁',
        duration: '3 min',
      };
    case 'afternoon':
      return {
        type: 'focus',
        title: 'Focus Session',
        description: 'Deep work with ambient sounds',
        icon: '🎯',
        duration: '25 min',
      };
    case 'evening':
      return {
        type: 'ritual',
        title: 'Evening Wind-down',
        description: 'Transition peacefully into rest',
        icon: '🌆',
        duration: '8 min',
      };
    case 'night':
      return {
        type: 'grounding',
        title: 'Bedtime Grounding',
        description: 'Release the day\'s tension',
        icon: '🌙',
        duration: '5 min',
      };
    case 'late-night':
      return {
        type: 'sleep',
        title: 'Sleep Breathing',
        description: 'Drift off peacefully',
        icon: '😴',
        duration: '10 min',
      };
  }
}

// =============================================================================
// PERSONALIZED MESSAGES
// =============================================================================

const TIME_MESSAGES: Record<TimeOfDay, PersonalizedMessage> = {
  'early-morning': {
    headline: 'A new day begins',
    subheadline: 'How would you like to start?',
    encouragement: 'The morning holds endless possibilities',
  },
  'morning': {
    headline: 'How are you feeling?',
    subheadline: 'Take a moment to check in',
    encouragement: 'You\'re doing great by being here',
  },
  'afternoon': {
    headline: 'Time for a reset?',
    subheadline: 'A brief pause can transform your day',
    encouragement: 'Even small moments of calm add up',
  },
  'evening': {
    headline: 'Winding down',
    subheadline: 'How was your day?',
    encouragement: 'You made it through today',
  },
  'night': {
    headline: 'Ready for rest',
    subheadline: 'Let\'s prepare for peaceful sleep',
    encouragement: 'Tomorrow is a fresh start',
  },
  'late-night': {
    headline: 'Can\'t sleep?',
    subheadline: 'Let\'s find some calm together',
    encouragement: 'It\'s okay. You\'re safe here',
  },
};

// Mood-specific messages that overlay time-based ones
const MOOD_MESSAGES: Partial<Record<MoodType, Partial<PersonalizedMessage>>> = {
  anxious: {
    subheadline: 'Let\'s take this one breath at a time',
    encouragement: 'You\'re not alone in this feeling',
  },
  low: {
    subheadline: 'It\'s okay to feel this way',
    encouragement: 'Being here is a step forward',
  },
  tough: {
    subheadline: 'Let\'s work through this together',
    encouragement: 'Your strength shows in small moments too',
  },
  calm: {
    subheadline: 'Enjoying a peaceful moment',
    encouragement: 'Savor this feeling',
  },
  good: {
    subheadline: 'Great to see you!',
    encouragement: 'Keep this positive momentum',
  },
  energized: {
    subheadline: 'Ready to channel that energy?',
    encouragement: 'Let\'s make the most of this feeling',
  },
};

// =============================================================================
// HOOK
// =============================================================================

export function useTimeAwareContent(userName?: string, currentMood?: MoodType) {
  const hour = new Date().getHours();
  
  const timeContext: TimeContext = useMemo(() => {
    const timeOfDay = getTimeOfDay(hour);
    
    return {
      timeOfDay,
      hour,
      greeting: getGreeting(hour, userName),
      emoji: getTimeEmoji(timeOfDay),
      backgroundVariant: getBackgroundVariant(timeOfDay),
      suggestedActivity: getSuggestedActivity(timeOfDay),
      ambientMood: getAmbientMood(timeOfDay),
      colorTone: getColorTone(timeOfDay),
    };
  }, [hour, userName]);

  const message = useMemo((): PersonalizedMessage => {
    const baseMessage = TIME_MESSAGES[timeContext.timeOfDay];
    const moodOverrides = currentMood ? MOOD_MESSAGES[currentMood] : undefined;
    
    return {
      ...baseMessage,
      ...moodOverrides,
    };
  }, [timeContext.timeOfDay, currentMood]);

  /**
   * Get contextual journal prompts based on time of day
   */
  const getJournalPrompts = useCallback(() => {
    switch (timeContext.timeOfDay) {
      case 'early-morning':
      case 'morning':
        return [
          'What are you looking forward to today?',
          'How do you want to feel by the end of today?',
          'What\'s one small thing you can do for yourself today?',
        ];
      case 'afternoon':
        return [
          'What\'s been on your mind today?',
          'What moment made you pause today?',
          'How are you really feeling right now?',
        ];
      case 'evening':
      case 'night':
        return [
          'What went well today?',
          'What are you grateful for from today?',
          'What would you like to let go of before sleep?',
        ];
      case 'late-night':
        return [
          'What\'s keeping you awake?',
          'What would help you feel more at peace?',
          'What do you need right now?',
        ];
    }
  }, [timeContext.timeOfDay]);

  /**
   * Get appropriate breathing pattern recommendation
   */
  const getBreathingRecommendation = useCallback(() => {
    switch (timeContext.timeOfDay) {
      case 'early-morning':
        return { pattern: 'energizing', name: 'Morning Energizer', duration: 3 };
      case 'morning':
        return { pattern: 'focus', name: 'Focus Breath', duration: 4 };
      case 'afternoon':
        return { pattern: 'reset', name: 'Quick Reset', duration: 2 };
      case 'evening':
        return { pattern: 'calm', name: 'Evening Calm', duration: 5 };
      case 'night':
        return { pattern: 'sleep', name: '4-7-8 Sleep', duration: 8 };
      case 'late-night':
        return { pattern: 'deep-calm', name: 'Deep Relaxation', duration: 10 };
    }
  }, [timeContext.timeOfDay]);

  /**
   * Get appropriate grounding technique recommendation
   */
  const getGroundingRecommendation = useCallback(() => {
    switch (timeContext.timeOfDay) {
      case 'early-morning':
        return { technique: 'body-scan', name: 'Morning Body Scan', duration: 5 };
      case 'morning':
      case 'afternoon':
        return { technique: '5-4-3-2-1', name: '5-4-3-2-1 Senses', duration: 3 };
      case 'evening':
        return { technique: 'progressive-relaxation', name: 'Progressive Relaxation', duration: 8 };
      case 'night':
      case 'late-night':
        return { technique: 'body-scan', name: 'Sleep Body Scan', duration: 10 };
    }
  }, [timeContext.timeOfDay]);

  /**
   * Check if it's time for morning/evening ritual
   */
  const getRitualSuggestion = useCallback(() => {
    if (timeContext.timeOfDay === 'early-morning' || timeContext.timeOfDay === 'morning') {
      return { type: 'morning', available: true };
    }
    if (timeContext.timeOfDay === 'evening' || timeContext.timeOfDay === 'night') {
      return { type: 'evening', available: true };
    }
    return { type: null, available: false };
  }, [timeContext.timeOfDay]);

  return {
    // Core context
    ...timeContext,
    message,
    
    // Personalized recommendations
    getJournalPrompts,
    getBreathingRecommendation,
    getGroundingRecommendation,
    getRitualSuggestion,
    
    // Quick access helpers
    isWorkHours: hour >= 9 && hour < 17,
    isSleepTime: hour >= 22 || hour < 6,
    isRitualTime: timeContext.timeOfDay === 'early-morning' || timeContext.timeOfDay === 'evening',
  };
}

export default useTimeAwareContent;
