/**
 * Data Module Index
 * Central export for all content libraries
 */

// Breathing
export {
  BREATHING_PATTERNS,
  BREATHING_CATEGORIES,
  getPatternsByCategory,
  getPatternById,
  type BreathingCategory,
} from './breathingPatterns';

// Re-export BreathingPattern type from types for convenience
export type { BreathingPattern } from '../types';

// Grounding
export {
  GROUNDING_TECHNIQUES,
  GROUNDING_CATEGORIES,
  getTechniquesByCategory,
  getTechniqueById,
  type GroundingTechnique,
  type GroundingCategory,
} from './groundingTechniques';

// Reset/Body Exercises
export {
  RESET_EXERCISES,
  RESET_CATEGORIES,
  getExercisesByCategory,
  getExerciseById,
  type ResetExercise,
  type ResetCategory,
} from './resetExercises';

// Focus Sessions
export {
  FOCUS_SESSIONS,
  FOCUS_CATEGORIES,
  AMBIENT_SOUNDS,
  getSessionsByCategory,
  getSessionById,
  getSoundById,
  type FocusSession,
  type FocusCategory,
  type AmbientSound,
} from './focusSessions';

// SOS Presets
export {
  SOS_PRESETS,
  getPresetById,
  type SOSPreset,
  type SOSPhase,
} from './sosPresets';

// Situational Guides
export {
  SITUATIONAL_GUIDES,
  SITUATIONAL_CATEGORIES,
  getGuidesByCategory,
  getGuideById,
  type SituationalGuide,
  type SituationalStep,
  type SituationalCategory,
} from './situationalGuides';

// Journal Prompts
export {
  JOURNAL_PROMPTS,
  PROMPT_CATEGORIES,
  getPromptsByCategory,
  getPromptById,
  getRandomPrompt,
  type JournalPrompt,
  type PromptCategory,
} from './journalPrompts';

// Rituals
export {
  MORNING_RITUALS,
  EVENING_RITUALS,
  getMorningRitualForMood,
  getEveningRitualForMood,
  getMorningRitualById,
  getEveningRitualById,
  getAllMorningRituals,
  getAllEveningRituals,
  type MorningRitual,
  type EveningRitual,
  type RitualStep,
} from './rituals';

// Bedtime Stories
export {
  BEDTIME_STORIES,
  STORY_CATEGORIES,
  SLEEP_TIMER_OPTIONS,
  getStoriesByCategory,
  getStoryById,
  getFreeStories,
  getPremiumStories,
  getStoriesByMood,
  getSoundscapes,
  formatDuration,
  type BedtimeStory,
  type StoryCategory,
} from './bedtimeStories';
