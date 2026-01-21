/**
 * Complete Breathing Patterns Library
 * 15 patterns as specified in RESTORAE_SPEC.md
 */

import { BreathingPattern } from '../types';

export const BREATHING_PATTERNS: BreathingPattern[] = [
  // 1. Box Breathing
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'Used by Navy SEALs to stay calm under pressure',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    duration: '3 min',
    category: 'focus',
    bestFor: 'Focus, reset',
  },
  // 2. 4-7-8 Calm
  {
    id: '4-7-8-calm',
    name: '4-7-8 Calm',
    description: "Dr. Weil's relaxation technique for anxiety and sleep",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
    duration: '2 min',
    category: 'calm',
    bestFor: 'Anxiety, sleep',
  },
  // 3. Energizing Breath
  {
    id: 'energizing-breath',
    name: 'Energizing Breath',
    description: 'Quick bursts to boost energy and alertness',
    inhale: 2,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    cycles: 15,
    duration: '1 min',
    category: 'energy',
    bestFor: 'Low energy',
  },
  // 4. Slow Wave
  {
    id: 'slow-wave',
    name: 'Slow Wave',
    description: 'Extended exhale for deep parasympathetic activation',
    inhale: 4,
    hold1: 0,
    exhale: 8,
    hold2: 0,
    cycles: 6,
    duration: '3 min',
    category: 'calm',
    bestFor: 'Deep calm',
  },
  // 5. Heart Coherence
  {
    id: 'heart-coherence',
    name: 'Heart Coherence',
    description: 'Balanced rhythm for emotional regulation',
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
    cycles: 12,
    duration: '2 min',
    category: 'balance',
    bestFor: 'Emotional balance',
  },
  // 6. Breath Hold
  {
    id: 'breath-hold',
    name: 'Breath Hold',
    description: 'Interrupt panic with controlled breath retention',
    inhale: 4,
    hold1: 7,
    exhale: 4,
    hold2: 0,
    cycles: 4,
    duration: '90 sec',
    category: 'emergency',
    bestFor: 'Panic interrupt',
  },
  // 7. Ocean Breath
  {
    id: 'ocean-breath',
    name: 'Ocean Breath',
    description: 'Wave-like rhythm for meditation preparation',
    inhale: 5,
    hold1: 2,
    exhale: 6,
    hold2: 2,
    cycles: 6,
    duration: '3 min',
    category: 'calm',
    bestFor: 'Meditation prep',
  },
  // 8. Triangle Breath
  {
    id: 'triangle-breath',
    name: 'Triangle Breath',
    description: 'Simple three-part pattern for quick reset',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    cycles: 6,
    duration: '90 sec',
    category: 'focus',
    bestFor: 'Simple reset',
  },
  // 9. Extended Exhale
  {
    id: 'extended-exhale',
    name: 'Extended Exhale',
    description: 'Progressive exhale lengthening for nervous system calm',
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 0,
    cycles: 6,
    duration: '2 min',
    category: 'calm',
    bestFor: 'Nervous system calm',
  },
  // 10. Morning Rise
  {
    id: 'morning-rise',
    name: 'Morning Rise',
    description: 'Energizing progression to wake up your body',
    inhale: 3,
    hold1: 2,
    exhale: 3,
    hold2: 0,
    cycles: 8,
    duration: '2 min',
    category: 'energy',
    bestFor: 'Wake up',
  },
  // 11. Sleep Descent
  {
    id: 'sleep-descent',
    name: 'Sleep Descent',
    description: 'Gradually slowing pattern for sleep preparation',
    inhale: 4,
    hold1: 4,
    exhale: 8,
    hold2: 4,
    cycles: 6,
    duration: '4 min',
    category: 'sleep',
    bestFor: 'Before bed',
  },
  // 12. Stress Release
  {
    id: 'stress-release',
    name: 'Stress Release',
    description: 'Sighing exhales to release acute tension',
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 0,
    cycles: 6,
    duration: '90 sec',
    category: 'emergency',
    bestFor: 'Acute stress',
  },
  // 13. Focus Sharpener
  {
    id: 'focus-sharpener',
    name: 'Focus Sharpener',
    description: 'Rhythmic holds to sharpen concentration',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 2,
    cycles: 6,
    duration: '2 min',
    category: 'focus',
    bestFor: 'Pre-task',
  },
  // 14. Anger Cool-Down
  {
    id: 'anger-cooldown',
    name: 'Anger Cool-Down',
    description: 'Long exhales to release frustration safely',
    inhale: 4,
    hold1: 2,
    exhale: 8,
    hold2: 2,
    cycles: 5,
    duration: '2 min',
    category: 'emergency',
    bestFor: 'Frustration',
  },
  // 15. Confidence Builder
  {
    id: 'confidence-builder',
    name: 'Confidence Builder',
    description: 'Power breathing before challenging situations',
    inhale: 5,
    hold1: 3,
    exhale: 5,
    hold2: 0,
    cycles: 6,
    duration: '90 sec',
    category: 'energy',
    bestFor: 'Before challenges',
  },
];

export const BREATHING_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'calm', label: 'Calm', icon: '🌊' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'sleep', label: 'Sleep', icon: '🌙' },
  { id: 'emergency', label: 'SOS', icon: '🆘' },
  { id: 'balance', label: 'Balance', icon: '☯️' },
] as const;

export type BreathingCategory = typeof BREATHING_CATEGORIES[number]['id'];

export function getPatternsByCategory(category: BreathingCategory): BreathingPattern[] {
  if (category === 'all') return BREATHING_PATTERNS;
  return BREATHING_PATTERNS.filter(p => p.category === category);
}

export function getPatternById(id: string): BreathingPattern | undefined {
  return BREATHING_PATTERNS.find(p => p.id === id);
}
