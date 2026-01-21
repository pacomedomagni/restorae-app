/**
 * Complete Situational Guides Library
 * 10 specific moments as specified in RESTORAE_SPEC.md
 */

export interface SituationalStep {
  id: string;
  title: string;
  instruction: string;
  duration: number; // seconds
  type: 'breathing' | 'reflection' | 'action' | 'affirmation';
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
  };
}

export interface SituationalGuide {
  id: string;
  name: string;
  description: string;
  totalDuration: string;
  icon: string;
  category: 'work' | 'emotional' | 'social' | 'self';
  steps: SituationalStep[];
}

export const SITUATIONAL_GUIDES: SituationalGuide[] = [
  // 1. Before a Job Interview
  {
    id: 'job-interview',
    name: 'Before a Job Interview',
    description: 'Confidence breathing + calm + focus',
    totalDuration: '5 min',
    icon: '💼',
    category: 'work',
    steps: [
      {
        id: 'interview-1',
        title: 'Power Posture',
        instruction: 'Stand tall with your shoulders back. Take up space. Feel your confidence.',
        duration: 45,
        type: 'action',
      },
      {
        id: 'interview-2',
        title: 'Confidence Breath',
        instruction: 'Breathe in your capability. Exhale any doubt.',
        duration: 60,
        type: 'breathing',
        breathingPattern: { inhale: 5, hold: 3, exhale: 5 },
      },
      {
        id: 'interview-3',
        title: 'Remember Your Value',
        instruction: 'You earned this interview. They want to meet YOU. Think of 3 things you bring to the table.',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'interview-4',
        title: 'Visualize Success',
        instruction: 'See yourself walking in confidently. Imagine the conversation going well.',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'interview-5',
        title: 'Ready',
        instruction: 'You are prepared. You are capable. Go show them who you are.',
        duration: 30,
        type: 'affirmation',
      },
    ],
  },
  // 2. After a Rejection
  {
    id: 'after-rejection',
    name: 'After a Rejection',
    description: 'Self-compassion + perspective + next step',
    totalDuration: '5 min',
    icon: '💔',
    category: 'emotional',
    steps: [
      {
        id: 'rejection-1',
        title: 'Feel It First',
        instruction: 'Rejection hurts. Let yourself feel that. It\'s a normal human response.',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'rejection-2',
        title: 'Self-Compassion',
        instruction: 'Put your hand on your heart. Say: "This is hard. I\'m doing my best."',
        duration: 45,
        type: 'affirmation',
      },
      {
        id: 'rejection-3',
        title: 'Perspective',
        instruction: 'One rejection is not a verdict on your worth. It\'s redirection, not failure.',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'rejection-4',
        title: 'Grounding Breath',
        instruction: 'Breathe through the disappointment. Let it move through you.',
        duration: 60,
        type: 'breathing',
        breathingPattern: { inhale: 4, hold: 2, exhale: 6 },
      },
      {
        id: 'rejection-5',
        title: 'Small Next Step',
        instruction: 'What\'s one small thing you can do to move forward? Even resting counts.',
        duration: 45,
        type: 'action',
      },
    ],
  },
  // 3. Stuck on a Problem
  {
    id: 'stuck-problem',
    name: 'Stuck on a Problem',
    description: 'Mental reset + fresh perspective prompt',
    totalDuration: '5 min',
    icon: '🤔',
    category: 'work',
    steps: [
      {
        id: 'stuck-1',
        title: 'Step Away',
        instruction: 'Close your eyes. Physically step away from the problem if you can.',
        duration: 30,
        type: 'action',
      },
      {
        id: 'stuck-2',
        title: 'Reset Breath',
        instruction: 'Clear your mental slate with slow, deep breaths.',
        duration: 60,
        type: 'breathing',
        breathingPattern: { inhale: 4, hold: 4, exhale: 6 },
      },
      {
        id: 'stuck-3',
        title: 'Broaden Your View',
        instruction: 'What would you tell a friend with this problem? What obvious solution are you missing?',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'stuck-4',
        title: 'Different Angle',
        instruction: 'What if the opposite of your approach was right? What would that look like?',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'stuck-5',
        title: 'Return Fresh',
        instruction: 'Your subconscious has been working. Return to the problem with fresh eyes.',
        duration: 30,
        type: 'action',
      },
    ],
  },
  // 4. Feeling Lonely
  {
    id: 'feeling-lonely',
    name: 'Feeling Lonely',
    description: 'Connection to self + self-worth',
    totalDuration: '5 min',
    icon: '🫂',
    category: 'emotional',
    steps: [
      {
        id: 'lonely-1',
        title: 'Acknowledge',
        instruction: 'Loneliness is a signal, not a flaw. It means you value connection.',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'lonely-2',
        title: 'Self-Connection',
        instruction: 'Place your hand on your heart. You are here with yourself. You matter.',
        duration: 60,
        type: 'affirmation',
      },
      {
        id: 'lonely-3',
        title: 'Comforting Breath',
        instruction: 'Breathe as if wrapping yourself in a warm blanket.',
        duration: 60,
        type: 'breathing',
        breathingPattern: { inhale: 5, hold: 2, exhale: 7 },
      },
      {
        id: 'lonely-4',
        title: 'Reach Out Plan',
        instruction: 'Think of one person you could text right now. Just a simple hello.',
        duration: 45,
        type: 'action',
      },
      {
        id: 'lonely-5',
        title: 'You Are Worthy',
        instruction: 'You deserve connection. This feeling is temporary. People care about you.',
        duration: 30,
        type: 'affirmation',
      },
    ],
  },
  // 5. Imposter Syndrome
  {
    id: 'imposter-syndrome',
    name: 'Imposter Syndrome',
    description: 'Reality check + confidence building',
    totalDuration: '4 min',
    icon: '🎭',
    category: 'work',
    steps: [
      {
        id: 'imposter-1',
        title: 'Name It',
        instruction: '"I\'m experiencing imposter syndrome." Naming it reduces its power.',
        duration: 30,
        type: 'reflection',
      },
      {
        id: 'imposter-2',
        title: 'Evidence Check',
        instruction: 'List 3 things you\'ve accomplished. You didn\'t get here by accident.',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'imposter-3',
        title: 'Confidence Breath',
        instruction: 'Breathe in your real abilities. Exhale the false narrative.',
        duration: 45,
        type: 'breathing',
        breathingPattern: { inhale: 4, hold: 3, exhale: 5 },
      },
      {
        id: 'imposter-4',
        title: 'Reframe',
        instruction: 'Feeling like a beginner means you\'re growing. Experts were all beginners once.',
        duration: 45,
        type: 'affirmation',
      },
      {
        id: 'imposter-5',
        title: 'Act Anyway',
        instruction: 'Confidence comes after action, not before. You\'ll prove yourself as you go.',
        duration: 30,
        type: 'affirmation',
      },
    ],
  },
  // 6. Procrastinating
  {
    id: 'procrastinating',
    name: 'Procrastinating',
    description: 'Gentle activation + just start',
    totalDuration: '3 min',
    icon: '⏰',
    category: 'work',
    steps: [
      {
        id: 'procrastinate-1',
        title: 'No Judgment',
        instruction: 'Procrastination is often about emotions, not laziness. Be gentle with yourself.',
        duration: 30,
        type: 'reflection',
      },
      {
        id: 'procrastinate-2',
        title: 'Activation Breath',
        instruction: 'A few energizing breaths to wake up your body and mind.',
        duration: 45,
        type: 'breathing',
        breathingPattern: { inhale: 3, hold: 0, exhale: 3 },
      },
      {
        id: 'procrastinate-3',
        title: 'Tiny First Step',
        instruction: 'What\'s the smallest possible step? Open the document. Write one word. Just begin.',
        duration: 45,
        type: 'action',
      },
      {
        id: 'procrastinate-4',
        title: 'Just 5 Minutes',
        instruction: 'Commit to just 5 minutes. Anyone can do 5 minutes. Starting is the hardest part.',
        duration: 30,
        type: 'action',
      },
    ],
  },
  // 7. After an Argument
  {
    id: 'after-argument',
    name: 'After an Argument',
    description: 'Cool-down + perspective + repair intention',
    totalDuration: '5 min',
    icon: '💬',
    category: 'social',
    steps: [
      {
        id: 'argument-1',
        title: 'Cool Down',
        instruction: 'Your nervous system is activated. Let\'s calm it first.',
        duration: 45,
        type: 'breathing',
        breathingPattern: { inhale: 4, hold: 2, exhale: 8 },
      },
      {
        id: 'argument-2',
        title: 'Feel Without Acting',
        instruction: 'You can feel hurt or angry without acting on it right now.',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'argument-3',
        title: 'Their Perspective',
        instruction: 'What might they have been feeling? What need were they trying to meet?',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'argument-4',
        title: 'Your Part',
        instruction: 'Without blame, is there anything you might do differently?',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'argument-5',
        title: 'Repair Intention',
        instruction: 'When you\'re ready, what would repair look like? Connection over being right.',
        duration: 45,
        type: 'action',
      },
    ],
  },
  // 8. Comparison Spiral
  {
    id: 'comparison-spiral',
    name: 'Comparison Spiral',
    description: 'Gratitude + your own path focus',
    totalDuration: '4 min',
    icon: '📱',
    category: 'self',
    steps: [
      {
        id: 'compare-1',
        title: 'Notice the Trigger',
        instruction: 'What triggered this comparison? Social media? A conversation? Awareness is power.',
        duration: 30,
        type: 'reflection',
      },
      {
        id: 'compare-2',
        title: 'Highlight Reel Reality',
        instruction: 'You\'re comparing your inside to their outside. You don\'t see their struggles.',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'compare-3',
        title: 'Gratitude Shift',
        instruction: 'Name 3 things in YOUR life you\'re genuinely grateful for.',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'compare-4',
        title: 'Your Path',
        instruction: 'Your timeline is yours alone. What matters is where YOU were a year ago.',
        duration: 45,
        type: 'affirmation',
      },
      {
        id: 'compare-5',
        title: 'Enough',
        instruction: 'You are enough, exactly as you are, exactly where you are.',
        duration: 30,
        type: 'affirmation',
      },
    ],
  },
  // 9. Burnout Warning
  {
    id: 'burnout-warning',
    name: 'Burnout Warning',
    description: 'Pause + boundaries + self-care prompt',
    totalDuration: '5 min',
    icon: '🔋',
    category: 'self',
    steps: [
      {
        id: 'burnout-1',
        title: 'Full Stop',
        instruction: 'Your body is sending a signal. Stop what you\'re doing. Just stop.',
        duration: 30,
        type: 'action',
      },
      {
        id: 'burnout-2',
        title: 'Recovery Breath',
        instruction: 'Extended exhales tell your body it\'s safe to rest.',
        duration: 60,
        type: 'breathing',
        breathingPattern: { inhale: 4, hold: 2, exhale: 8 },
      },
      {
        id: 'burnout-3',
        title: 'Boundary Check',
        instruction: 'What "yes" should have been a "no"? Where are you overextended?',
        duration: 60,
        type: 'reflection',
      },
      {
        id: 'burnout-4',
        title: 'Non-Negotiables',
        instruction: 'Sleep. Water. Movement. Connection. Which of these have you neglected?',
        duration: 45,
        type: 'reflection',
      },
      {
        id: 'burnout-5',
        title: 'One Boundary',
        instruction: 'Name one boundary you\'ll set this week. Protecting your energy is not selfish.',
        duration: 45,
        type: 'action',
      },
    ],
  },
  // 10. Celebrating Alone
  {
    id: 'celebrating-alone',
    name: 'Celebrating Alone',
    description: 'Self-acknowledgment + savor the win',
    totalDuration: '3 min',
    icon: '🎉',
    category: 'self',
    steps: [
      {
        id: 'celebrate-1',
        title: 'Name Your Win',
        instruction: 'What did you accomplish? Say it out loud. No minimizing.',
        duration: 30,
        type: 'reflection',
      },
      {
        id: 'celebrate-2',
        title: 'Feel the Pride',
        instruction: 'Let yourself feel genuinely proud. You did this. YOU.',
        duration: 45,
        type: 'affirmation',
      },
      {
        id: 'celebrate-3',
        title: 'Gratitude to Yourself',
        instruction: 'Thank yourself for the effort, persistence, and courage it took.',
        duration: 45,
        type: 'affirmation',
      },
      {
        id: 'celebrate-4',
        title: 'Savor',
        instruction: 'Take a deep breath and savor this moment. You don\'t need others to validate your success.',
        duration: 30,
        type: 'breathing',
        breathingPattern: { inhale: 5, hold: 3, exhale: 5 },
      },
      {
        id: 'celebrate-5',
        title: 'Mark It',
        instruction: 'How will you mark this win? A treat? A journal entry? Let it be remembered.',
        duration: 30,
        type: 'action',
      },
    ],
  },
];

export const SITUATIONAL_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'emotional', label: 'Emotional', icon: '💙' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'self', label: 'Self', icon: '🌱' },
] as const;

export type SituationalCategory = typeof SITUATIONAL_CATEGORIES[number]['id'];

export function getGuidesByCategory(category: SituationalCategory): SituationalGuide[] {
  if (category === 'all') return SITUATIONAL_GUIDES;
  return SITUATIONAL_GUIDES.filter(g => g.category === category);
}

export function getGuideById(id: string): SituationalGuide | undefined {
  return SITUATIONAL_GUIDES.find(g => g.id === id);
}
