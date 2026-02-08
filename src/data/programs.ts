/**
 * Guided Wellness Programs
 *
 * Multi-day structured programs that build skills progressively.
 * Each day is a curated sequence of breathing, grounding, and journaling
 * activities referencing existing content by ID.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ProgramCategory = 'calm' | 'stress' | 'sleep' | 'resilience';

export interface ProgramDayActivity {
  id: string;
  type: 'breathing' | 'grounding' | 'journal' | 'reflection';
  title: string;
  description: string;
  duration: number; // seconds
  /** Reference to existing content ID (breathing pattern, grounding technique, or journal prompt) */
  referenceId?: string;
  /** Inline breathing config for custom patterns */
  breathingPattern?: {
    inhale: number;
    hold1?: number;
    exhale: number;
    hold2?: number;
    cycles: number;
  };
  /** Journal prompt text for journal/reflection types */
  prompt?: string;
  /** Steps for grounding activities */
  steps?: string[];
}

export interface ProgramDay {
  day: number;
  title: string;
  theme: string;
  description: string;
  estimatedDuration: string;
  activities: ProgramDayActivity[];
}

export interface WellnessProgram {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: ProgramCategory;
  totalDays: number;
  estimatedDailyDuration: string;
  isPremium: boolean;
  icon: string; // Ionicons name
  accentColor: 'calm' | 'warm' | 'primary';
  days: ProgramDay[];
}

// =============================================================================
// 7-DAY CALM FOUNDATIONS (FREE)
// =============================================================================

const CALM_FOUNDATIONS: WellnessProgram = {
  id: 'calm-foundations',
  name: '7-Day Calm Foundations',
  subtitle: 'Build a daily calm practice',
  description:
    'A gentle introduction to breathwork, grounding, and self-reflection. Each day builds on the last, helping you develop a sustainable calm practice.',
  category: 'calm',
  totalDays: 7,
  estimatedDailyDuration: '8-12 min',
  isPremium: false,
  icon: 'leaf-outline',
  accentColor: 'calm',
  days: [
    {
      day: 1,
      title: 'Finding Your Breath',
      theme: 'Awareness',
      description: 'Begin with the simplest and most powerful tool you have — your breath.',
      estimatedDuration: '8 min',
      activities: [
        {
          id: 'cf-1-1',
          type: 'breathing',
          title: 'Box Breathing',
          description: 'Equal counts in, hold, out, hold. A foundation of calm.',
          duration: 180,
          referenceId: 'box-breathing',
        },
        {
          id: 'cf-1-2',
          type: 'journal',
          title: 'First Check-in',
          description: 'Take a moment to notice how you feel right now.',
          duration: 120,
          prompt: 'How are you really feeling today?',
          referenceId: 'how-feeling',
        },
      ],
    },
    {
      day: 2,
      title: 'Grounding in the Present',
      theme: 'Presence',
      description: 'Learn to anchor yourself when your mind wanders.',
      estimatedDuration: '9 min',
      activities: [
        {
          id: 'cf-2-1',
          type: 'breathing',
          title: 'Heart Coherence',
          description: 'Even, steady breathing to calm your nervous system.',
          duration: 120,
          referenceId: 'heart-coherence',
        },
        {
          id: 'cf-2-2',
          type: 'grounding',
          title: '5-4-3-2-1 Senses',
          description: 'Use your senses to return to the present moment.',
          duration: 120,
          referenceId: '5-4-3-2-1',
        },
        {
          id: 'cf-2-3',
          type: 'journal',
          title: 'Gratitude Moment',
          description: 'Notice what is good, even in small things.',
          duration: 120,
          prompt: 'What are you grateful for?',
          referenceId: 'grateful-for',
        },
      ],
    },
    {
      day: 3,
      title: 'Releasing Tension',
      theme: 'Release',
      description: 'Learn to notice and let go of what you are holding.',
      estimatedDuration: '10 min',
      activities: [
        {
          id: 'cf-3-1',
          type: 'breathing',
          title: 'Extended Exhale',
          description: 'A longer exhale activates your rest-and-digest system.',
          duration: 120,
          referenceId: 'extended-exhale',
        },
        {
          id: 'cf-3-2',
          type: 'grounding',
          title: 'Body Anchor',
          description: 'Reconnect with the physical sensations in your body.',
          duration: 90,
          referenceId: 'body-anchor',
        },
        {
          id: 'cf-3-3',
          type: 'journal',
          title: 'Letting Go',
          description: 'Name what no longer serves you.',
          duration: 180,
          prompt: 'What do you need to let go of?',
          referenceId: 'let-go',
        },
      ],
    },
    {
      day: 4,
      title: 'Finding Stillness',
      theme: 'Quiet',
      description: 'Practice staying present even when nothing is happening.',
      estimatedDuration: '10 min',
      activities: [
        {
          id: 'cf-4-1',
          type: 'breathing',
          title: 'Slow Wave',
          description: 'Long, slow breaths like gentle ocean waves.',
          duration: 180,
          referenceId: 'slow-wave',
        },
        {
          id: 'cf-4-2',
          type: 'grounding',
          title: 'Sound Mapping',
          description: 'Close your eyes and listen to the world around you.',
          duration: 90,
          referenceId: 'sound-mapping',
        },
        {
          id: 'cf-4-3',
          type: 'reflection',
          title: 'Three Words',
          description: 'Distill this moment into three words.',
          duration: 120,
          prompt: 'Describe today in three words.',
          referenceId: 'three-words',
        },
      ],
    },
    {
      day: 5,
      title: 'Building Resilience',
      theme: 'Strength',
      description: 'Discover the calm strength within you.',
      estimatedDuration: '10 min',
      activities: [
        {
          id: 'cf-5-1',
          type: 'breathing',
          title: '4-7-8 Calm',
          description: 'The classic relaxation breath used by millions.',
          duration: 120,
          referenceId: '4-7-8-calm',
        },
        {
          id: 'cf-5-2',
          type: 'grounding',
          title: 'Gravity Drop',
          description: 'Feel the weight of your body supported by the earth.',
          duration: 120,
          referenceId: 'gravity-drop',
        },
        {
          id: 'cf-5-3',
          type: 'journal',
          title: 'Facing Challenges',
          description: 'Acknowledge what is hard with compassion.',
          duration: 180,
          prompt: "What's a challenge you're facing?",
          referenceId: 'challenge-facing',
        },
      ],
    },
    {
      day: 6,
      title: 'Deepening Practice',
      theme: 'Depth',
      description: 'Combine techniques for a richer experience.',
      estimatedDuration: '12 min',
      activities: [
        {
          id: 'cf-6-1',
          type: 'breathing',
          title: 'Resonance Breathing',
          description: 'Find your natural breathing rhythm.',
          duration: 240,
          referenceId: 'resonance-breathing',
        },
        {
          id: 'cf-6-2',
          type: 'grounding',
          title: 'Temperature Awareness',
          description: 'Notice the subtle warmth and coolness around you.',
          duration: 90,
          referenceId: 'temperature-awareness',
        },
        {
          id: 'cf-6-3',
          type: 'journal',
          title: 'Growth Reflection',
          description: 'Notice how far you have come.',
          duration: 180,
          prompt: "What's one thing you learned today?",
          referenceId: 'learned-today',
        },
      ],
    },
    {
      day: 7,
      title: 'Your Calm Practice',
      theme: 'Integration',
      description: 'Bring everything together into your own sustainable ritual.',
      estimatedDuration: '12 min',
      activities: [
        {
          id: 'cf-7-1',
          type: 'breathing',
          title: 'Gratitude Breath',
          description: 'Breathe with intention and appreciation.',
          duration: 180,
          referenceId: 'gratitude-breath',
        },
        {
          id: 'cf-7-2',
          type: 'grounding',
          title: 'Peripheral Vision',
          description: 'Expand your awareness to encompass everything around you.',
          duration: 90,
          referenceId: 'peripheral-vision',
        },
        {
          id: 'cf-7-3',
          type: 'journal',
          title: 'Letter to Yourself',
          description: 'Write what you want to remember from this week.',
          duration: 180,
          prompt: 'Write a letter to yourself.',
          referenceId: 'letter-self',
        },
        {
          id: 'cf-7-4',
          type: 'reflection',
          title: 'What Comes Next',
          description: 'Set an intention for your ongoing practice.',
          duration: 120,
          prompt: 'What would make tomorrow better?',
          referenceId: 'better-tomorrow',
        },
      ],
    },
  ],
};

// =============================================================================
// 5-DAY STRESS RESET (FREE)
// =============================================================================

const STRESS_RESET: WellnessProgram = {
  id: 'stress-reset',
  name: '5-Day Stress Reset',
  subtitle: 'Release tension, find ease',
  description:
    'A focused program for when stress has been building. Each day targets a different dimension of stress — body, breath, mind, emotions, and integration.',
  category: 'stress',
  totalDays: 5,
  estimatedDailyDuration: '10-14 min',
  isPremium: false,
  icon: 'water-outline',
  accentColor: 'warm',
  days: [
    {
      day: 1,
      title: 'Calming the Breath',
      theme: 'Breath',
      description: 'Stress lives in shallow breathing. Let us slow it down.',
      estimatedDuration: '10 min',
      activities: [
        {
          id: 'sr-1-1',
          type: 'breathing',
          title: '4-7-8 Calm',
          description: 'The gold standard for stress relief breathing.',
          duration: 120,
          referenceId: '4-7-8-calm',
        },
        {
          id: 'sr-1-2',
          type: 'breathing',
          title: 'Stress Release',
          description: 'Extended exhales to activate your parasympathetic system.',
          duration: 90,
          referenceId: 'stress-release',
        },
        {
          id: 'sr-1-3',
          type: 'journal',
          title: 'Name the Weight',
          description: 'Putting words to stress takes away some of its power.',
          duration: 180,
          prompt: "What's weighing on you?",
          referenceId: 'weighing-on',
        },
      ],
    },
    {
      day: 2,
      title: 'Grounding the Body',
      theme: 'Body',
      description: 'Your body holds stress even when your mind forgets. Let us release it.',
      estimatedDuration: '10 min',
      activities: [
        {
          id: 'sr-2-1',
          type: 'grounding',
          title: 'Body Anchor',
          description: 'Feel into your body and notice where you hold tension.',
          duration: 90,
          referenceId: 'body-anchor',
        },
        {
          id: 'sr-2-2',
          type: 'breathing',
          title: 'Tension Release',
          description: 'Breathe into tight places and consciously soften.',
          duration: 180,
          referenceId: 'tension-release',
        },
        {
          id: 'sr-2-3',
          type: 'grounding',
          title: 'Touch Points',
          description: 'Tactile grounding to bring you back to now.',
          duration: 60,
          referenceId: 'touch-points',
        },
        {
          id: 'sr-2-4',
          type: 'reflection',
          title: 'Body Gratitude',
          description: 'Thank your body for carrying you through.',
          duration: 120,
          prompt: "What's something you're proud of?",
          referenceId: 'proud-of',
        },
      ],
    },
    {
      day: 3,
      title: 'Quieting the Mind',
      theme: 'Mind',
      description: 'When thoughts race, we can learn to observe without following.',
      estimatedDuration: '12 min',
      activities: [
        {
          id: 'sr-3-1',
          type: 'breathing',
          title: 'Extended Exhale',
          description: 'Longer out-breaths quiet the mental chatter.',
          duration: 120,
          referenceId: 'extended-exhale',
        },
        {
          id: 'sr-3-2',
          type: 'grounding',
          title: 'Object Focus',
          description: 'Give your mind one thing to attend to fully.',
          duration: 120,
          referenceId: 'object-focus',
        },
        {
          id: 'sr-3-3',
          type: 'breathing',
          title: 'Counting Breath',
          description: 'An anchor for a wandering mind.',
          duration: 120,
          referenceId: 'counting-breath',
        },
        {
          id: 'sr-3-4',
          type: 'journal',
          title: 'Free Write',
          description: 'Empty the mental clutter onto the page.',
          duration: 180,
          prompt: 'Free write — no rules, just write.',
          referenceId: 'free-write',
        },
      ],
    },
    {
      day: 4,
      title: 'Processing Emotions',
      theme: 'Emotions',
      description: 'Stress often masks deeper feelings. Let us make space for them.',
      estimatedDuration: '12 min',
      activities: [
        {
          id: 'sr-4-1',
          type: 'breathing',
          title: 'Ocean Breath',
          description: 'A warm, wave-like breath that opens the chest.',
          duration: 180,
          referenceId: 'ocean-breath',
        },
        {
          id: 'sr-4-2',
          type: 'grounding',
          title: '5-4-3-2-1 Senses',
          description: 'Return to the present before going inward.',
          duration: 120,
          referenceId: '5-4-3-2-1',
        },
        {
          id: 'sr-4-3',
          type: 'journal',
          title: 'Emotional Inventory',
          description: 'Name what you feel without judgment.',
          duration: 180,
          prompt: 'How are you really feeling today?',
          referenceId: 'how-feeling',
        },
        {
          id: 'sr-4-4',
          type: 'reflection',
          title: 'Release',
          description: 'Consciously set down what you have been carrying.',
          duration: 120,
          prompt: 'What do you need to let go of?',
          referenceId: 'let-go',
        },
      ],
    },
    {
      day: 5,
      title: 'Integration & Renewal',
      theme: 'Integration',
      description: 'Bring together everything you have practiced this week.',
      estimatedDuration: '14 min',
      activities: [
        {
          id: 'sr-5-1',
          type: 'breathing',
          title: 'Resonance Breathing',
          description: 'Find your natural, effortless breathing rhythm.',
          duration: 240,
          referenceId: 'resonance-breathing',
        },
        {
          id: 'sr-5-2',
          type: 'grounding',
          title: 'Gravity Drop',
          description: 'Let the earth hold you.',
          duration: 120,
          referenceId: 'gravity-drop',
        },
        {
          id: 'sr-5-3',
          type: 'journal',
          title: 'Gratitude & Growth',
          description: 'Reflect on what this week has taught you.',
          duration: 180,
          prompt: 'What are you grateful for?',
          referenceId: 'grateful-for',
        },
        {
          id: 'sr-5-4',
          type: 'reflection',
          title: 'Looking Forward',
          description: 'Set an intention for carrying this calm forward.',
          duration: 120,
          prompt: 'What are you looking forward to?',
          referenceId: 'looking-forward',
        },
      ],
    },
  ],
};

// =============================================================================
// 3-DAY SLEEP JOURNEY (PREMIUM)
// =============================================================================

const SLEEP_JOURNEY: WellnessProgram = {
  id: 'sleep-journey',
  name: '3-Day Sleep Journey',
  subtitle: 'Prepare your mind for rest',
  description:
    'A short, powerful program to transform your relationship with sleep. Learn techniques to calm your nervous system and prepare for deep, restorative rest.',
  category: 'sleep',
  totalDays: 3,
  estimatedDailyDuration: '12-15 min',
  isPremium: true,
  icon: 'moon-outline',
  accentColor: 'calm',
  days: [
    {
      day: 1,
      title: 'Slowing Down',
      theme: 'Decelerate',
      description: 'The first step to better sleep is learning to decelerate your mind and body.',
      estimatedDuration: '12 min',
      activities: [
        {
          id: 'sj-1-1',
          type: 'breathing',
          title: 'Sleep Descent',
          description: 'A progressive slowing of breath that mimics the transition to sleep.',
          duration: 240,
          referenceId: 'sleep-descent',
        },
        {
          id: 'sj-1-2',
          type: 'grounding',
          title: 'Gravity Drop',
          description: 'Release muscle tension from head to toe.',
          duration: 120,
          referenceId: 'gravity-drop',
        },
        {
          id: 'sj-1-3',
          type: 'reflection',
          title: 'Day Release',
          description: 'Set down the events of the day.',
          duration: 180,
          prompt: "What happened today worth remembering?",
          referenceId: 'worth-remembering',
        },
      ],
    },
    {
      day: 2,
      title: 'Deep Relaxation',
      theme: 'Surrender',
      description: 'Go deeper into relaxation with longer exhales and body awareness.',
      estimatedDuration: '14 min',
      activities: [
        {
          id: 'sj-2-1',
          type: 'breathing',
          title: 'Deep Sleep Prep',
          description: 'Extended exhales activate your deep relaxation response.',
          duration: 240,
          referenceId: 'deep-sleep-prep',
        },
        {
          id: 'sj-2-2',
          type: 'grounding',
          title: 'Temperature Awareness',
          description: 'Notice the subtle warmth of your blanket and the cool air.',
          duration: 90,
          referenceId: 'temperature-awareness',
        },
        {
          id: 'sj-2-3',
          type: 'journal',
          title: 'Release Write',
          description: 'Empty your mind of lingering thoughts before rest.',
          duration: 180,
          prompt: 'What do you need to let go of?',
          referenceId: 'let-go',
        },
        {
          id: 'sj-2-4',
          type: 'reflection',
          title: 'Gratitude for Rest',
          description: 'Appreciate the gift of this quiet moment.',
          duration: 120,
          prompt: 'What made you smile today?',
          referenceId: 'made-smile',
        },
      ],
    },
    {
      day: 3,
      title: 'Your Sleep Ritual',
      theme: 'Ritual',
      description: 'A complete wind-down sequence you can return to any night.',
      estimatedDuration: '15 min',
      activities: [
        {
          id: 'sj-3-1',
          type: 'breathing',
          title: 'Lunar Breath',
          description: 'Cooling, calming breaths associated with nighttime.',
          duration: 120,
          referenceId: 'lunar-breath',
        },
        {
          id: 'sj-3-2',
          type: 'grounding',
          title: 'Body Anchor',
          description: 'A full body scan, releasing each area as you go.',
          duration: 90,
          referenceId: 'body-anchor',
        },
        {
          id: 'sj-3-3',
          type: 'breathing',
          title: 'Deep Sleep Prep',
          description: 'The longest exhales to carry you toward sleep.',
          duration: 240,
          referenceId: 'deep-sleep-prep',
        },
        {
          id: 'sj-3-4',
          type: 'journal',
          title: 'Tomorrow\'s Intention',
          description: 'One gentle intention for when you wake.',
          duration: 120,
          prompt: 'What would make tomorrow better?',
          referenceId: 'better-tomorrow',
        },
        {
          id: 'sj-3-5',
          type: 'reflection',
          title: 'Goodnight',
          description: 'A final moment of stillness before sleep.',
          duration: 120,
          prompt: 'What are you grateful for?',
          referenceId: 'grateful-for',
        },
      ],
    },
  ],
};

// =============================================================================
// EXPORTS
// =============================================================================

export const ALL_PROGRAMS: WellnessProgram[] = [
  CALM_FOUNDATIONS,
  STRESS_RESET,
  SLEEP_JOURNEY,
];

export function getProgramById(id: string): WellnessProgram | undefined {
  return ALL_PROGRAMS.find((p) => p.id === id);
}

export function getAllPrograms(): WellnessProgram[] {
  return ALL_PROGRAMS;
}

export function getProgramsByCategory(category: ProgramCategory): WellnessProgram[] {
  return ALL_PROGRAMS.filter((p) => p.category === category);
}

export function getFreePrograms(): WellnessProgram[] {
  return ALL_PROGRAMS.filter((p) => !p.isPremium);
}
