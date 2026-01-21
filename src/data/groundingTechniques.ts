/**
 * Complete Grounding Techniques Library
 * 12 techniques as specified in RESTORAE_SPEC.md
 */

export interface GroundingTechnique {
  id: string;
  name: string;
  description: string;
  duration: string;
  bestFor: string;
  steps: string[];
  category: 'sensory' | 'body' | 'mental';
}

export const GROUNDING_TECHNIQUES: GroundingTechnique[] = [
  // 1. 5-4-3-2-1 Senses
  {
    id: '5-4-3-2-1',
    name: '5-4-3-2-1 Senses',
    description: 'Name what you see, hear, touch, smell, taste',
    duration: '2 min',
    bestFor: 'Spiraling, dissociation',
    category: 'sensory',
    steps: [
      'Take a deep breath and look around you',
      'Name 5 things you can SEE',
      'Name 4 things you can TOUCH',
      'Name 3 things you can HEAR',
      'Name 2 things you can SMELL',
      'Name 1 thing you can TASTE',
      'Take another deep breath. You are here.',
    ],
  },
  // 2. Body Anchor
  {
    id: 'body-anchor',
    name: 'Body Anchor',
    description: 'Feel feet on floor, seat, hands',
    duration: '90 sec',
    bestFor: 'Quick reset',
    category: 'body',
    steps: [
      'Press your feet firmly into the floor',
      'Feel the weight of your body in your seat',
      'Notice where your hands are resting',
      'Press your palms together firmly for 5 seconds',
      'Release and feel the sensation',
      'You are grounded. You are here.',
    ],
  },
  // 3. Cold Reset
  {
    id: 'cold-reset',
    name: 'Cold Reset',
    description: 'Splash face or hold something cold',
    duration: '1 min',
    bestFor: 'Intense anxiety',
    category: 'body',
    steps: [
      'Find cold water or hold an ice cube',
      'Splash cold water on your face',
      'Or hold ice in your hands',
      'Focus entirely on the cold sensation',
      'Let it interrupt your anxious thoughts',
      'Breathe slowly as the sensation fades',
    ],
  },
  // 4. Object Focus
  {
    id: 'object-focus',
    name: 'Object Focus',
    description: 'Describe one object in complete detail',
    duration: '2 min',
    bestFor: 'Racing thoughts',
    category: 'mental',
    steps: [
      'Pick up any object near you',
      'What color is it? Notice every shade',
      'What does it feel like? Texture, weight, temperature',
      'What shape is it? Trace its edges with your eyes',
      'What is it made of?',
      'Your mind is focused. You are present.',
    ],
  },
  // 5. Room Scan
  {
    id: 'room-scan',
    name: 'Room Scan',
    description: 'Name colors and shapes around you',
    duration: '90 sec',
    bestFor: 'Overwhelm',
    category: 'sensory',
    steps: [
      'Look slowly around your room',
      'Name 3 red things',
      'Name 3 blue things',
      'Name 3 square shapes',
      'Name 3 round shapes',
      'Your awareness is expanded. You are here.',
    ],
  },
  // 6. Touch Points
  {
    id: 'touch-points',
    name: 'Touch Points',
    description: 'Press fingertips together and feel pressure',
    duration: '1 min',
    bestFor: 'Subtle grounding',
    category: 'body',
    steps: [
      'Press your thumb and index finger together',
      'Feel the pressure between them',
      'Now thumb and middle finger',
      'Continue through each finger',
      'Press all fingertips together at once',
      'Release slowly. Feel the residual sensation.',
    ],
  },
  // 7. Texture Hunt
  {
    id: 'texture-hunt',
    name: 'Texture Hunt',
    description: 'Find 5 different textures nearby',
    duration: '2 min',
    bestFor: 'Anchoring',
    category: 'sensory',
    steps: [
      'Find something SMOOTH',
      'Find something ROUGH',
      'Find something SOFT',
      'Find something HARD',
      'Find something WARM or COOL',
      'Notice how each texture feels different',
    ],
  },
  // 8. Sound Mapping
  {
    id: 'sound-mapping',
    name: 'Sound Mapping',
    description: 'Identify 5 sounds near and far',
    duration: '90 sec',
    bestFor: 'Awareness',
    category: 'sensory',
    steps: [
      'Close your eyes gently',
      'Listen for the closest sound to you',
      'Now a sound slightly further away',
      'Listen for a distant sound',
      'Notice any sound you hadn\'t heard before',
      'Open your eyes. Your awareness is expanded.',
    ],
  },
  // 9. Temperature Awareness
  {
    id: 'temperature-awareness',
    name: 'Temperature Awareness',
    description: 'Notice warm and cool spots on your body',
    duration: '90 sec',
    bestFor: 'Body connection',
    category: 'body',
    steps: [
      'Notice where your body feels warm',
      'Where does it feel cool?',
      'Feel the temperature of your hands',
      'Notice the air on your face',
      'Is your breath warm or cool?',
      'You are connected to your body.',
    ],
  },
  // 10. Gravity Drop
  {
    id: 'gravity-drop',
    name: 'Gravity Drop',
    description: 'Feel weight sinking into chair or floor',
    duration: '2 min',
    bestFor: 'Deep grounding',
    category: 'body',
    steps: [
      'Sit or lie down comfortably',
      'Imagine gravity pulling you down gently',
      'Feel your head getting heavy',
      'Feel your shoulders drop',
      'Feel your whole body sink into the surface',
      'You are supported. You are grounded.',
    ],
  },
  // 11. Peripheral Vision
  {
    id: 'peripheral-vision',
    name: 'Peripheral Vision',
    description: 'Expand awareness to edges of vision',
    duration: '90 sec',
    bestFor: 'Tunnel vision',
    category: 'mental',
    steps: [
      'Look straight ahead at a fixed point',
      'Without moving your eyes, notice what\'s to your left',
      'Now notice what\'s to your right',
      'Notice above and below',
      'Hold this expanded awareness',
      'Your vision and mind are expanded.',
    ],
  },
  // 12. Counting Anchors
  {
    id: 'counting-anchors',
    name: 'Counting Anchors',
    description: 'Count specific things methodically',
    duration: '3 min',
    bestFor: 'Distraction',
    category: 'mental',
    steps: [
      'Count backwards from 100 by 7s',
      'Name a country for each letter A-Z',
      'Count all the corners in the room',
      'Name 10 animals',
      'Count your breaths up to 20',
      'Your mind has shifted. You are present.',
    ],
  },
];

export const GROUNDING_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌿' },
  { id: 'sensory', label: 'Senses', icon: '👁️' },
  { id: 'body', label: 'Body', icon: '🤲' },
  { id: 'mental', label: 'Mind', icon: '🧠' },
] as const;

export type GroundingCategory = typeof GROUNDING_CATEGORIES[number]['id'];

export function getTechniquesByCategory(category: GroundingCategory): GroundingTechnique[] {
  if (category === 'all') return GROUNDING_TECHNIQUES;
  return GROUNDING_TECHNIQUES.filter(t => t.category === category);
}

export function getTechniqueById(id: string): GroundingTechnique | undefined {
  return GROUNDING_TECHNIQUES.find(t => t.id === id);
}
