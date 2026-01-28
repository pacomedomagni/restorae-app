/**
 * Content Tagging System for Personalized Recommendations
 * 
 * This system tags all content with:
 * - Moods: What emotional states the content helps with
 * - Times: Best times of day for this content
 * - Goals: Which wellness goals this supports
 * - Difficulty: Experience level needed
 * - Duration: Quick/medium/long
 */

import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type WellnessGoal = 'anxiety' | 'sleep' | 'focus' | 'stress' | 'mood' | 'presence';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type DurationCategory = 'quick' | 'medium' | 'long'; // <3min, 3-10min, >10min

export interface ContentTags {
  moods: MoodType[];           // Which moods this helps with
  times: TimeOfDay[];          // Best times to do this
  goals: WellnessGoal[];       // Which wellness goals this supports
  difficulty: Difficulty;       // Experience level
  durationCategory: DurationCategory;
  keywords: string[];          // Additional searchable keywords
}

export interface TaggedContent {
  id: string;
  type: 'breathing' | 'grounding' | 'focus' | 'journal' | 'story' | 'reset';
  name: string;
  description: string;
  duration: string;
  icon: string;
  route: string;
  routeParams?: Record<string, any>;
  tags: ContentTags;
  isPremium?: boolean;
}

// =============================================================================
// BREATHING PATTERN TAGS
// =============================================================================

export const BREATHING_TAGS: Record<string, ContentTags> = {
  // Calm & Anxiety Relief
  'box-breathing': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'focus', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['navy seals', 'calm', 'pressure', 'reset'],
  },
  '4-7-8-calm': {
    moods: ['anxious', 'tough'],
    times: ['evening', 'night'],
    goals: ['anxiety', 'sleep'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['dr weil', 'relaxation', 'sleep', 'anxiety'],
  },
  'energizing-breath': {
    moods: ['low', 'calm'],
    times: ['morning', 'afternoon'],
    goals: ['mood', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['energy', 'alertness', 'wake up'],
  },
  'slow-wave': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'stress', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['parasympathetic', 'deep calm'],
  },
  'heart-coherence': {
    moods: ['anxious', 'tough', 'low'],
    times: ['anytime'],
    goals: ['stress', 'mood', 'presence'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['emotional regulation', 'balance', 'hrv'],
  },
  'breath-hold': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['panic', 'interrupt', 'emergency'],
  },
  'ocean-breath': {
    moods: ['calm', 'good'],
    times: ['morning', 'evening'],
    goals: ['presence', 'stress'],
    difficulty: 'intermediate',
    durationCategory: 'medium',
    keywords: ['meditation', 'ujjayi', 'wave'],
  },
  'triangle-breath': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['simple', 'reset', 'quick'],
  },
  'extended-exhale': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['nervous system', 'calm'],
  },
  'morning-rise': {
    moods: ['low', 'calm'],
    times: ['morning'],
    goals: ['mood', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['wake up', 'energizing', 'start day'],
  },
  'sleep-descent': {
    moods: ['anxious', 'energized'],
    times: ['night'],
    goals: ['sleep'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['bedtime', 'sleep prep', 'wind down'],
  },
  'stress-release': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['stress', 'anxiety'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['sighing', 'tension', 'acute stress'],
  },
  'focus-sharpener': {
    moods: ['calm', 'low'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['concentration', 'pre-task', 'work'],
  },
  'anger-cooldown': {
    moods: ['tough'],
    times: ['anytime'],
    goals: ['stress', 'mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['frustration', 'anger', 'cool down'],
  },
  'confidence-builder': {
    moods: ['anxious', 'low'],
    times: ['morning', 'afternoon'],
    goals: ['anxiety', 'mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['power', 'challenge', 'presentation'],
  },
  'wim-hof-light': {
    moods: ['low', 'calm'],
    times: ['morning'],
    goals: ['mood', 'focus'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['energy', 'morning', 'breath retention'],
  },
  'alternate-nostril': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['presence', 'stress', 'focus'],
    difficulty: 'intermediate',
    durationCategory: 'medium',
    keywords: ['balance', 'clarity', 'nadi shodhana'],
  },
  'calming-ratio': {
    moods: ['anxious', 'tough'],
    times: ['evening', 'night'],
    goals: ['anxiety', 'sleep', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['deep relaxation', '2-1-4-1'],
  },
  'quick-reset': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['60 seconds', 'instant calm', 'emergency'],
  },
  'belly-breath': {
    moods: ['anxious', 'calm'],
    times: ['anytime'],
    goals: ['anxiety', 'stress', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['diaphragmatic', 'beginner', 'basic'],
  },
  'resonance-breathing': {
    moods: ['calm', 'good'],
    times: ['anytime'],
    goals: ['stress', 'presence'],
    difficulty: 'intermediate',
    durationCategory: 'medium',
    keywords: ['hrv', 'heart health', 'coherence'],
  },
  'power-exhale': {
    moods: ['low', 'tough'],
    times: ['anytime'],
    goals: ['mood', 'stress'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['energy release', 'stuck', 'forceful'],
  },
  'lunar-breath': {
    moods: ['tough', 'anxious'],
    times: ['evening', 'night'],
    goals: ['stress', 'anxiety'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['cooling', 'overheated', 'calm'],
  },
  'solar-breath': {
    moods: ['low', 'calm'],
    times: ['morning', 'afternoon'],
    goals: ['mood', 'focus'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['warming', 'energy', 'fire'],
  },
  'counting-breath': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'focus', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['mind anchor', 'wandering', 'simple'],
  },
  'deep-sleep-prep': {
    moods: ['anxious', 'energized'],
    times: ['night'],
    goals: ['sleep'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['insomnia', 'sleep response', 'extended exhale'],
  },
  'meeting-calm': {
    moods: ['anxious'],
    times: ['afternoon'],
    goals: ['anxiety', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['discrete', 'meetings', 'work', 'office'],
  },
  'post-workout': {
    moods: ['energized'],
    times: ['anytime'],
    goals: ['stress', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['recovery', 'exercise', 'cool down'],
  },
  'gratitude-breath': {
    moods: ['calm', 'good', 'low'],
    times: ['morning', 'evening'],
    goals: ['mood', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['appreciation', 'mindfulness', 'gratitude'],
  },
  'tension-release': {
    moods: ['tough', 'anxious'],
    times: ['anytime'],
    goals: ['stress', 'anxiety'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['body scan', 'physical tension', 'body'],
  },
  'focus-flow': {
    moods: ['calm', 'good'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['flow state', 'creative', 'work'],
  },
  'midday-reset': {
    moods: ['low', 'tough'],
    times: ['afternoon'],
    goals: ['focus', 'mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['afternoon slump', 'energy', 'reset'],
  },
};

// =============================================================================
// GROUNDING TECHNIQUE TAGS
// =============================================================================

export const GROUNDING_TAGS: Record<string, ContentTags> = {
  '5-4-3-2-1': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['senses', 'dissociation', 'spiraling', 'panic'],
  },
  'body-anchor': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['feet', 'quick reset', 'body'],
  },
  'cold-reset': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['cold water', 'ice', 'intense anxiety', 'emergency'],
  },
  'object-focus': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'focus', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['racing thoughts', 'detail', 'mindfulness'],
  },
  'room-scan': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['overwhelm', 'colors', 'shapes', 'awareness'],
  },
  'touch-points': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['subtle', 'fingertips', 'discrete'],
  },
  'texture-hunt': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['textures', 'tactile', 'anchoring'],
  },
  'sound-mapping': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['sounds', 'awareness', 'listening'],
  },
  'temperature-awareness': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['body connection', 'warm', 'cool'],
  },
  'gravity-drop': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['anxiety', 'stress', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['deep grounding', 'weight', 'sink'],
  },
  'peripheral-vision': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'presence'],
    difficulty: 'intermediate',
    durationCategory: 'quick',
    keywords: ['tunnel vision', 'expand', 'awareness'],
  },
  'counting-anchors': {
    moods: ['anxious'],
    times: ['anytime'],
    goals: ['anxiety', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['distraction', 'counting', 'mental'],
  },
};

// =============================================================================
// JOURNAL PROMPT TAGS
// =============================================================================

export const JOURNAL_TAGS: Record<string, ContentTags> = {
  'whats-on-mind': {
    moods: ['anxious', 'tough', 'low', 'calm', 'good', 'energized'],
    times: ['anytime'],
    goals: ['stress', 'mood', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['free form', 'expression', 'open'],
  },
  'how-feeling': {
    moods: ['anxious', 'tough', 'low', 'calm', 'good', 'energized'],
    times: ['morning', 'evening'],
    goals: ['mood', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['emotional check-in', 'feelings'],
  },
  'worth-remembering': {
    moods: ['calm', 'good'],
    times: ['evening'],
    goals: ['mood', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['highlights', 'memory', 'positive'],
  },
  'grateful-for': {
    moods: ['low', 'calm', 'good'],
    times: ['morning', 'evening'],
    goals: ['mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['gratitude', 'appreciation', 'thankful'],
  },
  'learned-today': {
    moods: ['calm', 'good', 'energized'],
    times: ['evening'],
    goals: ['focus', 'mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['learning', 'growth', 'reflection'],
  },
  'weighing-on': {
    moods: ['anxious', 'tough', 'low'],
    times: ['anytime'],
    goals: ['anxiety', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['burden', 'release', 'worry'],
  },
  'made-smile': {
    moods: ['low', 'calm', 'good'],
    times: ['evening'],
    goals: ['mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['joy', 'happiness', 'positive'],
  },
  'let-go': {
    moods: ['anxious', 'tough'],
    times: ['evening'],
    goals: ['stress', 'anxiety'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['release', 'let go', 'burden'],
  },
  'looking-forward': {
    moods: ['low', 'calm', 'good'],
    times: ['morning', 'evening'],
    goals: ['mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['future', 'anticipation', 'hope'],
  },
  'three-words': {
    moods: ['calm', 'good', 'energized'],
    times: ['evening'],
    goals: ['presence', 'mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['quick reflection', 'summary'],
  },
  'better-tomorrow': {
    moods: ['low', 'tough'],
    times: ['evening'],
    goals: ['mood', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['improvement', 'planning', 'future'],
  },
  'letter-self': {
    moods: ['low', 'tough', 'anxious'],
    times: ['anytime'],
    goals: ['mood', 'stress'],
    difficulty: 'intermediate',
    durationCategory: 'long',
    keywords: ['self-compassion', 'kindness', 'letter'],
  },
  'proud-of': {
    moods: ['low', 'calm', 'good'],
    times: ['evening'],
    goals: ['mood'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['pride', 'accomplishment', 'recognition'],
  },
  'challenge-facing': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['stress', 'focus'],
    difficulty: 'intermediate',
    durationCategory: 'medium',
    keywords: ['problem solving', 'challenge', 'processing'],
  },
  'free-write': {
    moods: ['anxious', 'tough', 'low', 'calm', 'good', 'energized'],
    times: ['anytime'],
    goals: ['stress', 'mood', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['stream of consciousness', 'no rules', 'free'],
  },
};

// =============================================================================
// FOCUS SESSION TAGS
// =============================================================================

export const FOCUS_TAGS: Record<string, ContentTags> = {
  'power-start': {
    moods: ['calm', 'good', 'energized'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['deep work', 'productivity', 'pomodoro'],
  },
  'quick-sprint': {
    moods: ['low', 'calm', 'good'],
    times: ['anytime'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'medium',
    keywords: ['procrastination', 'burst', 'quick'],
  },
  'clarity-pause': {
    moods: ['anxious', 'tough'],
    times: ['anytime'],
    goals: ['focus', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['decision', 'perspective', 'pause'],
  },
  'creative-flow': {
    moods: ['calm', 'good', 'energized'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['creativity', 'no timer', 'flow'],
  },
  'meeting-prep': {
    moods: ['anxious'],
    times: ['afternoon'],
    goals: ['anxiety', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['meeting', 'calls', 'preparation'],
  },
  'end-of-day': {
    moods: ['calm', 'good'],
    times: ['evening'],
    goals: ['stress', 'focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['review', 'transition', 'work-life'],
  },
  'morning-intention': {
    moods: ['calm', 'good'],
    times: ['morning'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['intention', 'clarity', 'start day'],
  },
  'decision-space': {
    moods: ['anxious', 'calm'],
    times: ['anytime'],
    goals: ['focus', 'stress'],
    difficulty: 'intermediate',
    durationCategory: 'medium',
    keywords: ['decision', 'options', 'weigh'],
  },
  'study-mode': {
    moods: ['calm', 'good'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['learning', 'retention', 'study'],
  },
  'writing-flow': {
    moods: ['calm', 'good'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['writing', 'words', 'creative'],
  },
  'problem-solving': {
    moods: ['calm', 'good'],
    times: ['morning', 'afternoon'],
    goals: ['focus'],
    difficulty: 'intermediate',
    durationCategory: 'medium',
    keywords: ['complex', 'systematic', 'thinking'],
  },
  'micro-focus': {
    moods: ['low', 'calm', 'good'],
    times: ['anytime'],
    goals: ['focus'],
    difficulty: 'beginner',
    durationCategory: 'quick',
    keywords: ['5 minutes', 'small task', 'quick'],
  },
};

// =============================================================================
// BEDTIME STORY TAGS
// =============================================================================

export const STORY_TAGS: Record<string, ContentTags> = {
  'quiet-forest': {
    moods: ['anxious', 'calm'],
    times: ['night'],
    goals: ['sleep', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['forest', 'nature', 'peaceful', 'relaxing'],
  },
  'train-through-alps': {
    moods: ['calm', 'good'],
    times: ['night'],
    goals: ['sleep'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['train', 'travel', 'mountains', 'journey'],
  },
  'rainy-day-cottage': {
    moods: ['anxious', 'low', 'calm'],
    times: ['night'],
    goals: ['sleep', 'stress'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['rain', 'cozy', 'comfort', 'fireplace'],
  },
  'starlight-garden': {
    moods: ['calm', 'good'],
    times: ['night'],
    goals: ['sleep'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['magic', 'garden', 'stars', 'dreams'],
  },
  'ocean-lighthouse': {
    moods: ['calm'],
    times: ['night'],
    goals: ['sleep'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['ocean', 'waves', 'lighthouse', 'coastal'],
  },
  'japanese-garden': {
    moods: ['anxious', 'calm'],
    times: ['night'],
    goals: ['sleep', 'presence'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['zen', 'japan', 'peaceful', 'tranquil'],
  },
  'northern-lights': {
    moods: ['calm', 'good'],
    times: ['night'],
    goals: ['sleep'],
    difficulty: 'beginner',
    durationCategory: 'long',
    keywords: ['aurora', 'arctic', 'magical', 'wonder'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tags for a breathing pattern by ID
 */
export function getBreathingTags(id: string): ContentTags | undefined {
  return BREATHING_TAGS[id];
}

/**
 * Get tags for a grounding technique by ID
 */
export function getGroundingTags(id: string): ContentTags | undefined {
  return GROUNDING_TAGS[id];
}

/**
 * Get tags for a journal prompt by ID
 */
export function getJournalTags(id: string): ContentTags | undefined {
  return JOURNAL_TAGS[id];
}

/**
 * Get tags for a focus session by ID
 */
export function getFocusTags(id: string): ContentTags | undefined {
  return FOCUS_TAGS[id];
}

/**
 * Get tags for a bedtime story by ID
 */
export function getStoryTags(id: string): ContentTags | undefined {
  return STORY_TAGS[id];
}

/**
 * Check if content matches a mood
 */
export function matchesMood(tags: ContentTags, mood: MoodType): boolean {
  return tags.moods.includes(mood);
}

/**
 * Check if content matches a time of day
 */
export function matchesTime(tags: ContentTags, time: TimeOfDay): boolean {
  return tags.times.includes(time) || tags.times.includes('anytime');
}

/**
 * Check if content matches a wellness goal
 */
export function matchesGoal(tags: ContentTags, goal: WellnessGoal): boolean {
  return tags.goals.includes(goal);
}

/**
 * Calculate relevance score (0-100)
 */
export function calculateRelevanceScore(
  tags: ContentTags,
  mood?: MoodType,
  time?: TimeOfDay,
  goals?: WellnessGoal[],
  difficulty?: Difficulty
): number {
  let score = 50; // Base score

  // Mood match (+20)
  if (mood && matchesMood(tags, mood)) {
    score += 20;
  }

  // Time match (+15)
  if (time && matchesTime(tags, time)) {
    score += 15;
  }

  // Goals match (+10 per matching goal, max 30)
  if (goals && goals.length > 0) {
    const matchingGoals = goals.filter(g => matchesGoal(tags, g)).length;
    score += Math.min(matchingGoals * 10, 30);
  }

  // Difficulty preference (+5 for beginner content)
  if (difficulty === 'beginner' && tags.difficulty === 'beginner') {
    score += 5;
  }

  return Math.min(score, 100);
}
