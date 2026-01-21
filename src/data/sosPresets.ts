/**
 * Complete SOS Presets Library
 * 8 emergency presets as specified in RESTORAE_SPEC.md
 */

export interface SOSPhase {
  id: string;
  type: 'interrupt' | 'ground' | 'reassure' | 'next-step';
  title: string;
  instruction: string;
  duration: number; // seconds
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
  };
}

export interface SOSPreset {
  id: string;
  name: string;
  description: string;
  totalDuration: string;
  icon: string;
  phases: SOSPhase[];
}

export const SOS_PRESETS: SOSPreset[] = [
  // 1. Panic Attack
  {
    id: 'panic-attack',
    name: 'Panic Attack',
    description: 'Guided sequence to slow down a panic response',
    totalDuration: '4 min',
    icon: '🫁',
    phases: [
      {
        id: 'panic-1',
        type: 'interrupt',
        title: 'You\'re safe',
        instruction: 'Place your hand on your chest. Feel your heartbeat. You are safe right now.',
        duration: 30,
        breathingPattern: { inhale: 4, hold: 2, exhale: 6 },
      },
      {
        id: 'panic-2',
        type: 'ground',
        title: 'Ground yourself',
        instruction: 'Press your feet firmly into the floor. Feel the solid ground beneath you.',
        duration: 45,
      },
      {
        id: 'panic-3',
        type: 'reassure',
        title: 'This will pass',
        instruction: 'Panic cannot hurt you. It always passes. You\'ve survived every one before.',
        duration: 30,
        breathingPattern: { inhale: 4, hold: 4, exhale: 6 },
      },
      {
        id: 'panic-4',
        type: 'next-step',
        title: 'One small step',
        instruction: 'What\'s one small thing you can do right now? Even just staying still is enough.',
        duration: 30,
      },
    ],
  },
  // 2. Overwhelm
  {
    id: 'overwhelm',
    name: 'Overwhelm',
    description: 'When everything feels like too much',
    totalDuration: '3 min',
    icon: '😵',
    phases: [
      {
        id: 'overwhelm-1',
        type: 'interrupt',
        title: 'Pause everything',
        instruction: 'Stop. Put everything down. Close your eyes for a moment.',
        duration: 20,
      },
      {
        id: 'overwhelm-2',
        type: 'ground',
        title: 'Simplify',
        instruction: 'Right now, nothing else matters. Just this breath. Just this moment.',
        duration: 40,
        breathingPattern: { inhale: 4, hold: 0, exhale: 6 },
      },
      {
        id: 'overwhelm-3',
        type: 'reassure',
        title: 'One thing at a time',
        instruction: 'You don\'t have to do everything. Just the next small thing.',
        duration: 30,
      },
      {
        id: 'overwhelm-4',
        type: 'next-step',
        title: 'Choose one',
        instruction: 'What is ONE thing you can focus on? Just one. Everything else can wait.',
        duration: 30,
      },
    ],
  },
  // 3. Sadness Wave
  {
    id: 'sadness-wave',
    name: 'Sadness Wave',
    description: 'When sadness hits and you need gentle support',
    totalDuration: '4 min',
    icon: '💙',
    phases: [
      {
        id: 'sadness-1',
        type: 'interrupt',
        title: 'It\'s okay to feel',
        instruction: 'Sadness is a natural emotion. You don\'t have to fight it.',
        duration: 30,
        breathingPattern: { inhale: 4, hold: 0, exhale: 6 },
      },
      {
        id: 'sadness-2',
        type: 'ground',
        title: 'Be gentle',
        instruction: 'Place your hand on your heart. Speak to yourself like you would a dear friend.',
        duration: 45,
      },
      {
        id: 'sadness-3',
        type: 'reassure',
        title: 'Allow the feeling',
        instruction: 'Let the sadness be here. It\'s passing through, not staying forever.',
        duration: 45,
        breathingPattern: { inhale: 5, hold: 0, exhale: 7 },
      },
      {
        id: 'sadness-4',
        type: 'next-step',
        title: 'Small comfort',
        instruction: 'What small comfort can you give yourself right now? Tea? A blanket? Fresh air?',
        duration: 30,
      },
    ],
  },
  // 4. Anger Surge
  {
    id: 'anger-surge',
    name: 'Anger Surge',
    description: 'Cool down intense frustration safely',
    totalDuration: '3 min',
    icon: '🔥',
    phases: [
      {
        id: 'anger-1',
        type: 'interrupt',
        title: 'Physical release',
        instruction: 'Clench your fists tight for 5 seconds. Now release. Shake out your hands.',
        duration: 25,
      },
      {
        id: 'anger-2',
        type: 'ground',
        title: 'Cool down breath',
        instruction: 'Long exhales activate your calm response. Breathe out slowly.',
        duration: 45,
        breathingPattern: { inhale: 4, hold: 2, exhale: 8 },
      },
      {
        id: 'anger-3',
        type: 'reassure',
        title: 'Space from reaction',
        instruction: 'You don\'t have to act on this feeling. You can respond when you\'re ready.',
        duration: 30,
      },
      {
        id: 'anger-4',
        type: 'next-step',
        title: 'Perspective',
        instruction: 'Will this matter in a week? A month? What response would you be proud of?',
        duration: 30,
      },
    ],
  },
  // 5. Anxiety Spiral
  {
    id: 'anxiety-spiral',
    name: 'Anxiety Spiral',
    description: 'Interrupt and ground racing anxious thoughts',
    totalDuration: '4 min',
    icon: '🌀',
    phases: [
      {
        id: 'anxiety-1',
        type: 'interrupt',
        title: 'Interrupt the loop',
        instruction: 'Say out loud or whisper: "I notice I\'m feeling anxious. That\'s okay."',
        duration: 20,
      },
      {
        id: 'anxiety-2',
        type: 'ground',
        title: 'Come back to now',
        instruction: 'Name 5 things you can see right now. Say them out loud.',
        duration: 45,
      },
      {
        id: 'anxiety-3',
        type: 'reassure',
        title: 'Reality check',
        instruction: 'The worst-case scenario your mind shows you is not the most likely outcome.',
        duration: 40,
        breathingPattern: { inhale: 4, hold: 4, exhale: 6 },
      },
      {
        id: 'anxiety-4',
        type: 'next-step',
        title: 'One action',
        instruction: 'What\'s one small action you can take? Even writing down your thoughts counts.',
        duration: 30,
      },
    ],
  },
  // 6. Can't Sleep
  {
    id: 'cant-sleep',
    name: 'Can\'t Sleep',
    description: 'Release tension and quiet the mind for sleep',
    totalDuration: '5 min',
    icon: '🌙',
    phases: [
      {
        id: 'sleep-1',
        type: 'interrupt',
        title: 'Stop trying',
        instruction: 'Stop trying to sleep. Just focus on rest. That\'s enough for now.',
        duration: 30,
      },
      {
        id: 'sleep-2',
        type: 'ground',
        title: 'Body scan',
        instruction: 'Starting from your feet, consciously relax each part of your body.',
        duration: 90,
      },
      {
        id: 'sleep-3',
        type: 'reassure',
        title: 'Release thoughts',
        instruction: 'Imagine each thought as a cloud drifting by. You don\'t need to hold onto any of them.',
        duration: 60,
        breathingPattern: { inhale: 4, hold: 4, exhale: 8 },
      },
      {
        id: 'sleep-4',
        type: 'next-step',
        title: 'Rest is enough',
        instruction: 'Even if sleep doesn\'t come, rest is healing. Let your body be still.',
        duration: 30,
      },
    ],
  },
  // 7. Social Anxiety
  {
    id: 'social-anxiety',
    name: 'Social Anxiety',
    description: 'Calm nerves before or during social situations',
    totalDuration: '3 min',
    icon: '👥',
    phases: [
      {
        id: 'social-1',
        type: 'interrupt',
        title: 'Confidence breath',
        instruction: 'Stand or sit tall. Take a deep breath. You belong in any space you enter.',
        duration: 25,
        breathingPattern: { inhale: 5, hold: 3, exhale: 5 },
      },
      {
        id: 'social-2',
        type: 'ground',
        title: 'Physical anchor',
        instruction: 'Feel your feet on the ground. You are solid. You are present.',
        duration: 30,
      },
      {
        id: 'social-3',
        type: 'reassure',
        title: 'You belong here',
        instruction: 'People are not judging you as harshly as you think. Everyone is focused on themselves.',
        duration: 35,
      },
      {
        id: 'social-4',
        type: 'next-step',
        title: 'One connection',
        instruction: 'Focus on just one person. One genuine interaction. That\'s all you need.',
        duration: 25,
      },
    ],
  },
  // 8. Before Difficult Conversation
  {
    id: 'difficult-conversation',
    name: 'Before Difficult Conversation',
    description: 'Center yourself before challenging discussions',
    totalDuration: '3 min',
    icon: '💬',
    phases: [
      {
        id: 'convo-1',
        type: 'interrupt',
        title: 'Center yourself',
        instruction: 'Take three slow breaths. Feel your body become calm and alert.',
        duration: 30,
        breathingPattern: { inhale: 4, hold: 2, exhale: 6 },
      },
      {
        id: 'convo-2',
        type: 'ground',
        title: 'Set your intention',
        instruction: 'What outcome do you truly want? Not to win—to understand and be understood.',
        duration: 35,
      },
      {
        id: 'convo-3',
        type: 'reassure',
        title: 'You can handle this',
        instruction: 'You\'ve had hard conversations before. You can stay calm and speak your truth.',
        duration: 30,
      },
      {
        id: 'convo-4',
        type: 'next-step',
        title: 'Ready',
        instruction: 'Lead with curiosity, not defense. Listen first. You\'ve got this.',
        duration: 25,
      },
    ],
  },
];

export function getPresetById(id: string): SOSPreset | undefined {
  return SOS_PRESETS.find(p => p.id === id);
}
