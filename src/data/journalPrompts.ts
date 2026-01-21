/**
 * Complete Journal Prompts Library
 * 15 prompts as specified in RESTORAE_SPEC.md
 */

export interface JournalPrompt {
  id: string;
  text: string;
  category: 'gratitude' | 'reflection' | 'growth' | 'release';
  description?: string;
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // Gratitude prompts
  {
    id: 'whats-on-mind',
    text: "What's on your mind?",
    category: 'reflection',
    description: 'Free form expression',
  },
  {
    id: 'how-feeling',
    text: 'How are you really feeling today?',
    category: 'reflection',
    description: 'Emotional check-in',
  },
  {
    id: 'worth-remembering',
    text: 'What happened today worth remembering?',
    category: 'reflection',
    description: 'Daily highlights',
  },
  {
    id: 'grateful-for',
    text: 'What are you grateful for?',
    category: 'gratitude',
    description: 'Gratitude practice',
  },
  {
    id: 'learned-today',
    text: "What's one thing you learned today?",
    category: 'growth',
    description: 'Daily learning',
  },
  {
    id: 'weighing-on',
    text: "What's weighing on you?",
    category: 'release',
    description: 'Release burdens',
  },
  {
    id: 'made-smile',
    text: 'What made you smile today?',
    category: 'gratitude',
    description: 'Find the joy',
  },
  {
    id: 'let-go',
    text: 'What do you need to let go of?',
    category: 'release',
    description: 'Release exercise',
  },
  {
    id: 'looking-forward',
    text: 'What are you looking forward to?',
    category: 'gratitude',
    description: 'Future positivity',
  },
  {
    id: 'three-words',
    text: 'Describe today in three words.',
    category: 'reflection',
    description: 'Quick reflection',
  },
  {
    id: 'better-tomorrow',
    text: 'What would make tomorrow better?',
    category: 'growth',
    description: 'Forward thinking',
  },
  {
    id: 'letter-self',
    text: 'Write a letter to yourself.',
    category: 'reflection',
    description: 'Self-compassion',
  },
  {
    id: 'proud-of',
    text: "What's something you're proud of?",
    category: 'gratitude',
    description: 'Self-recognition',
  },
  {
    id: 'challenge-facing',
    text: "What's a challenge you're facing?",
    category: 'growth',
    description: 'Problem processing',
  },
  {
    id: 'free-write',
    text: 'Free write—no rules, just write.',
    category: 'release',
    description: 'Stream of consciousness',
  },
];

export const PROMPT_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
  { id: 'reflection', label: 'Reflection', icon: '💭' },
  { id: 'growth', label: 'Growth', icon: '🌱' },
  { id: 'release', label: 'Release', icon: '🍃' },
] as const;

export type PromptCategory = typeof PROMPT_CATEGORIES[number]['id'];

export function getPromptsByCategory(category: PromptCategory): JournalPrompt[] {
  if (category === 'all') return JOURNAL_PROMPTS;
  return JOURNAL_PROMPTS.filter(p => p.category === category);
}

export function getPromptById(id: string): JournalPrompt | undefined {
  return JOURNAL_PROMPTS.find(p => p.id === id);
}

export function getRandomPrompt(): JournalPrompt {
  return JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
}
