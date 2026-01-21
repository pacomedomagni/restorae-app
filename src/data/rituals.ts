/**
 * Morning & Evening Ritual Definitions
 * 8 Morning + 8 Evening variations as specified in RESTORAE_SPEC.md
 */

import { MoodType } from '../types';

export interface RitualStep {
  id: string;
  type: 'breathing' | 'reflection' | 'intention' | 'gratitude' | 'release' | 'affirmation';
  title: string;
  instruction: string;
  duration: number; // seconds
  optional?: boolean;
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    cycles: number;
  };
}

export interface MorningRitual {
  id: string;
  name: string;
  description: string;
  focus: string;
  totalDuration: string;
  forMoods: MoodType[];
  steps: RitualStep[];
}

export interface EveningRitual {
  id: string;
  name: string;
  description: string;
  focus: string;
  totalDuration: string;
  forMoods: MoodType[];
  steps: RitualStep[];
}

// =============================================================================
// 8 MORNING RITUAL VARIATIONS
// =============================================================================

export const MORNING_RITUALS: MorningRitual[] = [
  // 1. Energized Morning
  {
    id: 'energized-morning',
    name: 'Energized Morning',
    description: 'High energy start with motivation',
    focus: 'High energy, motivation',
    totalDuration: '5 min',
    forMoods: ['energized', 'good'],
    steps: [
      {
        id: 'em-1',
        type: 'breathing',
        title: 'Wake Up Breath',
        instruction: 'Take 5 energizing breaths to awaken your body',
        duration: 45,
        breathingPattern: { inhale: 3, hold: 0, exhale: 3, cycles: 5 },
      },
      {
        id: 'em-2',
        type: 'gratitude',
        title: 'Morning Gratitude',
        instruction: 'Name 3 things you\'re grateful for this morning',
        duration: 60,
      },
      {
        id: 'em-3',
        type: 'intention',
        title: 'Power Intention',
        instruction: 'What\'s your main focus for today? State it with confidence.',
        duration: 60,
      },
      {
        id: 'em-4',
        type: 'affirmation',
        title: 'Ready to Go',
        instruction: 'Say: "I have the energy and focus to make today great."',
        duration: 30,
      },
    ],
  },
  // 2. Calm Morning
  {
    id: 'calm-morning',
    name: 'Calm Morning',
    description: 'Gentle, peaceful start to your day',
    focus: 'Gentle, peaceful start',
    totalDuration: '7 min',
    forMoods: ['calm', 'good'],
    steps: [
      {
        id: 'cm-1',
        type: 'breathing',
        title: 'Peaceful Breath',
        instruction: 'Slow, gentle breaths to ease into the day',
        duration: 90,
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, cycles: 6 },
      },
      {
        id: 'cm-2',
        type: 'reflection',
        title: 'Body Check-in',
        instruction: 'Scan your body. Notice how you feel without judgment.',
        duration: 60,
      },
      {
        id: 'cm-3',
        type: 'gratitude',
        title: 'Quiet Gratitude',
        instruction: 'Silently appreciate one simple thing in your life',
        duration: 45,
      },
      {
        id: 'cm-4',
        type: 'intention',
        title: 'Gentle Intention',
        instruction: 'What would make today feel complete? Set a soft intention.',
        duration: 60,
      },
      {
        id: 'cm-5',
        type: 'affirmation',
        title: 'Peace Affirmation',
        instruction: 'Say: "I move through today with calm and presence."',
        duration: 30,
      },
    ],
  },
  // 3. Focused Morning
  {
    id: 'focused-morning',
    name: 'Focused Morning',
    description: 'Intention-heavy start for productive days',
    focus: 'Intention-heavy',
    totalDuration: '5 min',
    forMoods: ['energized', 'calm', 'good'],
    steps: [
      {
        id: 'fm-1',
        type: 'breathing',
        title: 'Clarity Breath',
        instruction: 'Clear your mind with box breathing',
        duration: 60,
        breathingPattern: { inhale: 4, hold: 4, exhale: 4, cycles: 4 },
      },
      {
        id: 'fm-2',
        type: 'intention',
        title: 'Priority Setting',
        instruction: 'What is the ONE most important thing to accomplish today?',
        duration: 60,
      },
      {
        id: 'fm-3',
        type: 'reflection',
        title: 'Obstacle Prep',
        instruction: 'What might distract you? How will you handle it?',
        duration: 45,
      },
      {
        id: 'fm-4',
        type: 'affirmation',
        title: 'Focus Lock',
        instruction: 'Say: "I am focused. I am productive. I achieve my goals."',
        duration: 30,
      },
    ],
  },
  // 4. Grateful Morning
  {
    id: 'grateful-morning',
    name: 'Grateful Morning',
    description: 'Start with deep gratitude practice',
    focus: 'Gratitude-centered',
    totalDuration: '5 min',
    forMoods: ['good', 'calm', 'low'],
    steps: [
      {
        id: 'gm-1',
        type: 'breathing',
        title: 'Heart Opening Breath',
        instruction: 'Breathe into your heart space',
        duration: 45,
        breathingPattern: { inhale: 5, hold: 2, exhale: 5, cycles: 4 },
      },
      {
        id: 'gm-2',
        type: 'gratitude',
        title: 'People Gratitude',
        instruction: 'Think of someone you\'re grateful for. Send them mental thanks.',
        duration: 60,
      },
      {
        id: 'gm-3',
        type: 'gratitude',
        title: 'Self Gratitude',
        instruction: 'What do you appreciate about yourself today?',
        duration: 60,
      },
      {
        id: 'gm-4',
        type: 'intention',
        title: 'Spread Gratitude',
        instruction: 'How will you share gratitude or kindness today?',
        duration: 45,
      },
    ],
  },
  // 5. Quick Morning
  {
    id: 'quick-morning',
    name: 'Quick Morning',
    description: 'Minimal but effective 3-minute start',
    focus: 'Minimal but effective',
    totalDuration: '3 min',
    forMoods: ['energized', 'good', 'calm'],
    steps: [
      {
        id: 'qm-1',
        type: 'breathing',
        title: 'Power Breath',
        instruction: '3 deep breaths to center yourself',
        duration: 30,
        breathingPattern: { inhale: 4, hold: 0, exhale: 4, cycles: 3 },
      },
      {
        id: 'qm-2',
        type: 'intention',
        title: 'Today\'s Focus',
        instruction: 'One word for today. What energy do you want to bring?',
        duration: 30,
      },
      {
        id: 'qm-3',
        type: 'affirmation',
        title: 'Go Time',
        instruction: 'Take a breath and step into your day with purpose.',
        duration: 20,
      },
    ],
  },
  // 6. Anxious Morning
  {
    id: 'anxious-morning',
    name: 'Anxious Morning',
    description: 'Extra grounding for anxious starts',
    focus: 'Extra grounding',
    totalDuration: '7 min',
    forMoods: ['anxious', 'tough'],
    steps: [
      {
        id: 'am-1',
        type: 'breathing',
        title: 'Calming Breath',
        instruction: 'Extended exhale to activate your calm response',
        duration: 90,
        breathingPattern: { inhale: 4, hold: 4, exhale: 8, cycles: 5 },
      },
      {
        id: 'am-2',
        type: 'reflection',
        title: 'Ground Yourself',
        instruction: 'Feel your feet on the floor. Name 5 things you can see.',
        duration: 60,
      },
      {
        id: 'am-3',
        type: 'reflection',
        title: 'Reality Check',
        instruction: 'What are you worried about? Is it happening right now?',
        duration: 60,
      },
      {
        id: 'am-4',
        type: 'intention',
        title: 'One Step at a Time',
        instruction: 'What\'s the first small thing you\'ll do today? Just the first.',
        duration: 45,
      },
      {
        id: 'am-5',
        type: 'affirmation',
        title: 'You Can Handle This',
        instruction: 'Say: "I can handle whatever today brings. One moment at a time."',
        duration: 30,
      },
    ],
  },
  // 7. Low Energy Morning
  {
    id: 'low-energy-morning',
    name: 'Low Energy Morning',
    description: 'Gentle activation when energy is low',
    focus: 'Gentle activation',
    totalDuration: '5 min',
    forMoods: ['low', 'tough'],
    steps: [
      {
        id: 'lem-1',
        type: 'breathing',
        title: 'Gentle Wake',
        instruction: 'Slow breaths to gently wake your system',
        duration: 60,
        breathingPattern: { inhale: 4, hold: 0, exhale: 4, cycles: 5 },
      },
      {
        id: 'lem-2',
        type: 'reflection',
        title: 'Compassion Check',
        instruction: 'It\'s okay to feel low. What does your body need right now?',
        duration: 45,
      },
      {
        id: 'lem-3',
        type: 'intention',
        title: 'Minimum Viable Day',
        instruction: 'What\'s the ONE thing you\'ll do today? Keep it small.',
        duration: 45,
      },
      {
        id: 'lem-4',
        type: 'gratitude',
        title: 'Tiny Gratitude',
        instruction: 'One small thing you\'re grateful for, even if it\'s just being alive.',
        duration: 30,
      },
      {
        id: 'lem-5',
        type: 'affirmation',
        title: 'Small Steps Count',
        instruction: 'Say: "I don\'t have to do everything. I just have to begin."',
        duration: 30,
      },
    ],
  },
  // 8. Big Day Morning
  {
    id: 'big-day-morning',
    name: 'Big Day Morning',
    description: 'Confidence and focus for important days',
    focus: 'Confidence + focus',
    totalDuration: '7 min',
    forMoods: ['anxious', 'energized', 'good'],
    steps: [
      {
        id: 'bdm-1',
        type: 'breathing',
        title: 'Power Stance Breath',
        instruction: 'Stand tall. Breathe confidence into your body.',
        duration: 60,
        breathingPattern: { inhale: 5, hold: 3, exhale: 5, cycles: 4 },
      },
      {
        id: 'bdm-2',
        type: 'reflection',
        title: 'Why Today Matters',
        instruction: 'Why is today important? Connect to your purpose.',
        duration: 60,
      },
      {
        id: 'bdm-3',
        type: 'reflection',
        title: 'Past Success',
        instruction: 'Remember a time you succeeded. You\'ve done hard things before.',
        duration: 60,
      },
      {
        id: 'bdm-4',
        type: 'intention',
        title: 'Visualize Success',
        instruction: 'See yourself succeeding. How does it feel?',
        duration: 60,
      },
      {
        id: 'bdm-5',
        type: 'affirmation',
        title: 'You\'ve Got This',
        instruction: 'Say: "I am prepared. I am capable. Today is my day."',
        duration: 30,
      },
    ],
  },
];

// =============================================================================
// 8 EVENING RITUAL VARIATIONS
// =============================================================================

export const EVENING_RITUALS: EveningRitual[] = [
  // 1. Standard Wind-Down
  {
    id: 'standard-evening',
    name: 'Standard Wind-Down',
    description: 'Review your day and release',
    focus: 'Review + release',
    totalDuration: '5 min',
    forMoods: ['good', 'calm', 'energized'],
    steps: [
      {
        id: 'se-1',
        type: 'breathing',
        title: 'Transition Breath',
        instruction: 'Breathe to signal the day is ending',
        duration: 45,
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, cycles: 4 },
      },
      {
        id: 'se-2',
        type: 'reflection',
        title: 'Day Review',
        instruction: 'What happened today? Just notice without judgment.',
        duration: 60,
      },
      {
        id: 'se-3',
        type: 'gratitude',
        title: 'Evening Gratitude',
        instruction: 'What was good about today? Find at least one thing.',
        duration: 60,
      },
      {
        id: 'se-4',
        type: 'release',
        title: 'Let It Go',
        instruction: 'What can you release before sleep? Exhale it out.',
        duration: 45,
        optional: true,
      },
      {
        id: 'se-5',
        type: 'affirmation',
        title: 'Rest Well',
        instruction: 'Say: "I did enough today. I deserve rest."',
        duration: 30,
      },
    ],
  },
  // 2. After Hard Day
  {
    id: 'hard-day-evening',
    name: 'After Hard Day',
    description: 'Extra compassion after difficult days',
    focus: 'Extra compassion',
    totalDuration: '7 min',
    forMoods: ['tough', 'anxious', 'low'],
    steps: [
      {
        id: 'hde-1',
        type: 'breathing',
        title: 'Release Breath',
        instruction: 'Long exhales to let go of the day\'s weight',
        duration: 90,
        breathingPattern: { inhale: 4, hold: 2, exhale: 8, cycles: 5 },
      },
      {
        id: 'hde-2',
        type: 'reflection',
        title: 'Acknowledge Difficulty',
        instruction: 'Today was hard. That\'s real. You don\'t have to pretend otherwise.',
        duration: 45,
      },
      {
        id: 'hde-3',
        type: 'reflection',
        title: 'Self-Compassion',
        instruction: 'Place your hand on your heart. Say: "I did my best today."',
        duration: 60,
      },
      {
        id: 'hde-4',
        type: 'release',
        title: 'Write and Release',
        instruction: 'What\'s one thing you\'re carrying? Name it and let it go.',
        duration: 60,
      },
      {
        id: 'hde-5',
        type: 'affirmation',
        title: 'Tomorrow is New',
        instruction: 'Say: "Tomorrow is a fresh start. I release today."',
        duration: 30,
      },
    ],
  },
  // 3. After Good Day
  {
    id: 'good-day-evening',
    name: 'After Good Day',
    description: 'Celebrate and capture gratitude',
    focus: 'Celebrate + gratitude',
    totalDuration: '5 min',
    forMoods: ['good', 'energized', 'calm'],
    steps: [
      {
        id: 'gde-1',
        type: 'breathing',
        title: 'Savoring Breath',
        instruction: 'Breathe in the good feelings from today',
        duration: 45,
        breathingPattern: { inhale: 5, hold: 3, exhale: 5, cycles: 4 },
      },
      {
        id: 'gde-2',
        type: 'gratitude',
        title: 'Celebrate Wins',
        instruction: 'What went well today? Name 3 things, big or small.',
        duration: 60,
      },
      {
        id: 'gde-3',
        type: 'reflection',
        title: 'What Made It Good?',
        instruction: 'What contributed to today being good? Remember this.',
        duration: 60,
      },
      {
        id: 'gde-4',
        type: 'intention',
        title: 'Carry Forward',
        instruction: 'How can you bring this energy into tomorrow?',
        duration: 45,
      },
      {
        id: 'gde-5',
        type: 'affirmation',
        title: 'Well Done',
        instruction: 'Say: "Today was good. I am grateful. I deserve rest."',
        duration: 30,
      },
    ],
  },
  // 4. Anxious Evening
  {
    id: 'anxious-evening',
    name: 'Anxious Evening',
    description: 'Calming sequence for worried nights',
    focus: 'Calming sequence',
    totalDuration: '7 min',
    forMoods: ['anxious', 'tough'],
    steps: [
      {
        id: 'ae-1',
        type: 'breathing',
        title: 'Deep Calm Breath',
        instruction: '4-7-8 breathing to activate deep relaxation',
        duration: 120,
        breathingPattern: { inhale: 4, hold: 7, exhale: 8, cycles: 4 },
      },
      {
        id: 'ae-2',
        type: 'reflection',
        title: 'Worry Inventory',
        instruction: 'What are you worried about? Name each worry.',
        duration: 45,
      },
      {
        id: 'ae-3',
        type: 'reflection',
        title: 'Reality Check',
        instruction: 'For each worry: Can you do anything about it tonight? If not, let it wait.',
        duration: 60,
      },
      {
        id: 'ae-4',
        type: 'release',
        title: 'Tomorrow\'s Problem',
        instruction: 'Imagine putting your worries in a box. You\'ll deal with them tomorrow.',
        duration: 45,
      },
      {
        id: 'ae-5',
        type: 'affirmation',
        title: 'You Are Safe',
        instruction: 'Say: "Right now, I am safe. I can rest. Tomorrow I\'ll handle what comes."',
        duration: 30,
      },
    ],
  },
  // 5. Can't Stop Thinking
  {
    id: 'racing-thoughts-evening',
    name: "Can't Stop Thinking",
    description: 'Brain dump and release for busy minds',
    focus: 'Brain dump + release',
    totalDuration: '7 min',
    forMoods: ['anxious', 'energized'],
    steps: [
      {
        id: 'rte-1',
        type: 'reflection',
        title: 'Brain Dump',
        instruction: 'Write down or mentally list everything on your mind. Get it all out.',
        duration: 120,
      },
      {
        id: 'rte-2',
        type: 'breathing',
        title: 'Clearing Breath',
        instruction: 'Breathe to clear the mental clutter',
        duration: 60,
        breathingPattern: { inhale: 4, hold: 4, exhale: 6, cycles: 5 },
      },
      {
        id: 'rte-3',
        type: 'reflection',
        title: 'Prioritize',
        instruction: 'Of everything you listed, what\'s actually urgent? Most things can wait.',
        duration: 45,
      },
      {
        id: 'rte-4',
        type: 'release',
        title: 'Permission to Rest',
        instruction: 'Your thoughts will still be there tomorrow. Give yourself permission to rest.',
        duration: 30,
      },
      {
        id: 'rte-5',
        type: 'affirmation',
        title: 'Mind at Peace',
        instruction: 'Say: "I can let my mind rest. Solutions come easier with sleep."',
        duration: 30,
      },
    ],
  },
  // 6. Quick Close
  {
    id: 'quick-evening',
    name: 'Quick Close',
    description: 'Minimal but complete 3-minute wind-down',
    focus: 'Minimal but complete',
    totalDuration: '3 min',
    forMoods: ['good', 'calm', 'energized'],
    steps: [
      {
        id: 'qe-1',
        type: 'breathing',
        title: 'Three Slow Breaths',
        instruction: 'Three deep breaths to signal day\'s end',
        duration: 30,
        breathingPattern: { inhale: 4, hold: 0, exhale: 6, cycles: 3 },
      },
      {
        id: 'qe-2',
        type: 'gratitude',
        title: 'One Good Thing',
        instruction: 'Name one good thing from today.',
        duration: 30,
      },
      {
        id: 'qe-3',
        type: 'release',
        title: 'Release',
        instruction: 'One exhale to let go of anything you\'re carrying.',
        duration: 20,
      },
      {
        id: 'qe-4',
        type: 'affirmation',
        title: 'Good Night',
        instruction: 'Say: "Day complete. Time to rest."',
        duration: 20,
      },
    ],
  },
  // 7. Sunday Reset
  {
    id: 'sunday-reset',
    name: 'Sunday Reset',
    description: 'Week reflection and intention setting',
    focus: 'Week reflection',
    totalDuration: '10 min',
    forMoods: ['good', 'calm', 'low'],
    steps: [
      {
        id: 'sr-1',
        type: 'breathing',
        title: 'Week Release Breath',
        instruction: 'Breathe out the entire week',
        duration: 60,
        breathingPattern: { inhale: 4, hold: 2, exhale: 8, cycles: 4 },
      },
      {
        id: 'sr-2',
        type: 'reflection',
        title: 'Week Review',
        instruction: 'What happened this week? Highs, lows, and in-between.',
        duration: 120,
      },
      {
        id: 'sr-3',
        type: 'gratitude',
        title: 'Week Gratitude',
        instruction: 'What are you grateful for from this week?',
        duration: 60,
      },
      {
        id: 'sr-4',
        type: 'reflection',
        title: 'Lessons',
        instruction: 'What did you learn this week? What would you do differently?',
        duration: 90,
      },
      {
        id: 'sr-5',
        type: 'intention',
        title: 'Week Ahead',
        instruction: 'What\'s your intention for the coming week?',
        duration: 60,
      },
      {
        id: 'sr-6',
        type: 'affirmation',
        title: 'Fresh Start',
        instruction: 'Say: "This week is complete. Next week is a fresh beginning."',
        duration: 30,
      },
    ],
  },
  // 8. Before Sleep
  {
    id: 'before-sleep',
    name: 'Before Sleep',
    description: 'Sleep-optimized gentle wind-down',
    focus: 'Sleep-optimized',
    totalDuration: '5 min',
    forMoods: ['calm', 'low', 'anxious'],
    steps: [
      {
        id: 'bs-1',
        type: 'breathing',
        title: 'Sleep Breath',
        instruction: '4-7-8 pattern to prepare for sleep',
        duration: 120,
        breathingPattern: { inhale: 4, hold: 7, exhale: 8, cycles: 4 },
      },
      {
        id: 'bs-2',
        type: 'reflection',
        title: 'Body Relaxation',
        instruction: 'Starting from your toes, relax each part of your body',
        duration: 60,
      },
      {
        id: 'bs-3',
        type: 'release',
        title: 'Release the Day',
        instruction: 'Let the day drift away. Nothing needs your attention now.',
        duration: 45,
      },
      {
        id: 'bs-4',
        type: 'affirmation',
        title: 'Sleep Invitation',
        instruction: 'Say: "My body is relaxed. My mind is quiet. Sleep is welcome."',
        duration: 30,
      },
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getMorningRitualForMood(mood: MoodType): MorningRitual {
  const matching = MORNING_RITUALS.filter(r => r.forMoods.includes(mood));
  return matching.length > 0 ? matching[0] : MORNING_RITUALS[4]; // Default to Quick Morning
}

export function getEveningRitualForMood(mood: MoodType): EveningRitual {
  const matching = EVENING_RITUALS.filter(r => r.forMoods.includes(mood));
  return matching.length > 0 ? matching[0] : EVENING_RITUALS[0]; // Default to Standard
}

export function getMorningRitualById(id: string): MorningRitual | undefined {
  return MORNING_RITUALS.find(r => r.id === id);
}

export function getEveningRitualById(id: string): EveningRitual | undefined {
  return EVENING_RITUALS.find(r => r.id === id);
}

export function getAllMorningRituals(): MorningRitual[] {
  return MORNING_RITUALS;
}

export function getAllEveningRituals(): EveningRitual[] {
  return EVENING_RITUALS;
}
