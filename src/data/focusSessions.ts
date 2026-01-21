/**
 * Complete Focus Sessions Library
 * 12 sessions + 10 ambient sounds as specified in RESTORAE_SPEC.md
 */

export interface FocusSession {
  id: string;
  name: string;
  description: string;
  purpose: string;
  duration: number; // in minutes, 0 = open/unlimited
  defaultSound?: string;
  category: 'work' | 'creative' | 'planning' | 'quick';
}

export const FOCUS_SESSIONS: FocusSession[] = [
  // 1. Power Start
  {
    id: 'power-start',
    name: 'Power Start',
    description: 'Deep work intention setting for productivity',
    purpose: 'Set intention and dive into focused work',
    duration: 25,
    defaultSound: 'library',
    category: 'work',
  },
  // 2. Quick Sprint
  {
    id: 'quick-sprint',
    name: 'Quick Sprint',
    description: 'Focused burst for tasks you\'ve been avoiding',
    purpose: 'Overcome procrastination with a short commitment',
    duration: 15,
    defaultSound: 'coffee-shop',
    category: 'quick',
  },
  // 3. Clarity Pause
  {
    id: 'clarity-pause',
    name: 'Clarity Pause',
    description: 'Think before acting or making decisions',
    purpose: 'Step back and gain perspective',
    duration: 5,
    defaultSound: 'gentle-rain',
    category: 'planning',
  },
  // 4. Creative Flow
  {
    id: 'creative-flow',
    name: 'Creative Flow',
    description: 'Ambient sound, no timer pressure',
    purpose: 'Let creativity flow without time constraints',
    duration: 0, // Open-ended
    defaultSound: 'forest-morning',
    category: 'creative',
  },
  // 5. Meeting Prep
  {
    id: 'meeting-prep',
    name: 'Meeting Prep',
    description: 'Center yourself before important calls',
    purpose: 'Arrive at meetings calm and prepared',
    duration: 3,
    defaultSound: 'white-noise',
    category: 'quick',
  },
  // 6. End of Day Close
  {
    id: 'end-of-day',
    name: 'End of Day Close',
    description: 'Review what you did and release work',
    purpose: 'Transition from work to personal time',
    duration: 5,
    defaultSound: 'fireplace',
    category: 'planning',
  },
  // 7. Morning Intention
  {
    id: 'morning-intention',
    name: 'Morning Intention',
    description: 'Set the day\'s primary focus',
    purpose: 'Start each day with clarity',
    duration: 5,
    defaultSound: 'forest-morning',
    category: 'planning',
  },
  // 8. Decision Space
  {
    id: 'decision-space',
    name: 'Decision Space',
    description: 'Weigh options calmly without pressure',
    purpose: 'Make better decisions with a clear mind',
    duration: 10,
    defaultSound: 'ocean-waves',
    category: 'planning',
  },
  // 9. Study Mode
  {
    id: 'study-mode',
    name: 'Study Mode',
    description: 'Learning and retention focused session',
    purpose: 'Absorb information effectively',
    duration: 25,
    defaultSound: 'library',
    category: 'work',
  },
  // 10. Writing Flow
  {
    id: 'writing-flow',
    name: 'Writing Flow',
    description: 'Dedicated environment for writing',
    purpose: 'Let words flow without distraction',
    duration: 25,
    defaultSound: 'coffee-shop',
    category: 'creative',
  },
  // 11. Problem Solving
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    description: 'Structured thinking space for complex problems',
    purpose: 'Work through challenges systematically',
    duration: 15,
    defaultSound: 'white-noise',
    category: 'work',
  },
  // 12. Micro Focus
  {
    id: 'micro-focus',
    name: 'Micro Focus',
    description: '5-minute burst for a quick task',
    purpose: 'Complete small tasks efficiently',
    duration: 5,
    defaultSound: 'gentle-rain',
    category: 'quick',
  },
];

export interface AmbientSound {
  id: string;
  name: string;
  description: string;
  vibe: string;
  icon: string;
  // In a real app, this would be the audio file path
  // For now, we'll use placeholder
  audioUrl?: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'gentle-rain',
    name: 'Gentle Rain',
    description: 'Soft rainfall on a quiet afternoon',
    vibe: 'Calm, focus',
    icon: '🌧️',
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    description: 'Ambient café chatter and clinking cups',
    vibe: 'Background energy',
    icon: '☕',
  },
  {
    id: 'forest-morning',
    name: 'Forest Morning',
    description: 'Birds chirping in a peaceful forest',
    vibe: 'Nature, peace',
    icon: '🌲',
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Rhythmic waves on a sandy shore',
    vibe: 'Rhythm, vastness',
    icon: '🌊',
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    description: 'Pure consistent background sound',
    vibe: 'Pure focus',
    icon: '📻',
  },
  {
    id: 'night-crickets',
    name: 'Night Crickets',
    description: 'Summer evening with gentle crickets',
    vibe: 'Evening calm',
    icon: '🦗',
  },
  {
    id: 'thunderstorm',
    name: 'Thunderstorm',
    description: 'Distant thunder and heavy rain',
    vibe: 'Cozy, dramatic',
    icon: '⛈️',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Crackling fire on a cold night',
    vibe: 'Warmth, comfort',
    icon: '🔥',
  },
  {
    id: 'wind-trees',
    name: 'Wind Through Trees',
    description: 'Gentle breeze rustling leaves',
    vibe: 'Gentle movement',
    icon: '🍃',
  },
  {
    id: 'library',
    name: 'Library Ambience',
    description: 'Quiet library with soft page turns',
    vibe: 'Quiet productivity',
    icon: '📚',
  },
];

export const FOCUS_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'work', label: 'Deep Work', icon: '💼' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'planning', label: 'Planning', icon: '📋' },
  { id: 'quick', label: 'Quick', icon: '⚡' },
] as const;

export type FocusCategory = typeof FOCUS_CATEGORIES[number]['id'];

export function getSessionsByCategory(category: FocusCategory): FocusSession[] {
  if (category === 'all') return FOCUS_SESSIONS;
  return FOCUS_SESSIONS.filter(s => s.category === category);
}

export function getSessionById(id: string): FocusSession | undefined {
  return FOCUS_SESSIONS.find(s => s.id === id);
}

export function getSoundById(id: string): AmbientSound | undefined {
  return AMBIENT_SOUNDS.find(s => s.id === id);
}
