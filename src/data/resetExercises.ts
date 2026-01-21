/**
 * Complete Body Reset Exercises Library
 * 14 exercises as specified in RESTORAE_SPEC.md
 */

export interface ResetExercise {
  id: string;
  name: string;
  description: string;
  targetArea: string;
  duration: string;
  bestFor: string;
  steps: string[];
  category: 'face' | 'upper' | 'lower' | 'full';
}

export const RESET_EXERCISES: ResetExercise[] = [
  // 1. Jaw Release
  {
    id: 'jaw-release',
    name: 'Jaw Release',
    description: 'Release tension from jaw and face muscles',
    targetArea: 'Jaw, face muscles',
    duration: '90 sec',
    bestFor: 'Stress, teeth grinding',
    category: 'face',
    steps: [
      'Let your jaw drop open slightly',
      'Place your tongue on the roof of your mouth',
      'Slowly open your mouth wide, then close',
      'Move your jaw gently side to side',
      'Massage your jaw muscles with your fingers',
      'Let your jaw rest in a relaxed position',
    ],
  },
  // 2. Shoulder Drop
  {
    id: 'shoulder-drop',
    name: 'Shoulder Drop',
    description: 'Release tension from shoulders and upper back',
    targetArea: 'Shoulders, upper back',
    duration: '2 min',
    bestFor: 'Desk workers',
    category: 'upper',
    steps: [
      'Inhale and lift your shoulders to your ears',
      'Hold for 5 seconds',
      'Exhale and drop them completely',
      'Roll your shoulders backward 5 times',
      'Roll your shoulders forward 5 times',
      'Let them rest in a neutral position',
    ],
  },
  // 3. Hand Shake Out
  {
    id: 'hand-shake',
    name: 'Hand Shake Out',
    description: 'Release nervous energy through movement',
    targetArea: 'Hands, arms, nervous energy',
    duration: '1 min',
    bestFor: 'Quick energy shift',
    category: 'upper',
    steps: [
      'Shake your hands vigorously for 10 seconds',
      'Shake your arms from the shoulders',
      'Let the shaking travel up to your shoulders',
      'Shake your whole upper body',
      'Gradually slow down',
      'Feel the tingling sensation settle',
    ],
  },
  // 4. Full Body Scan
  {
    id: 'body-scan',
    name: 'Full Body Scan',
    description: 'Complete head to toe awareness and release',
    targetArea: 'Head to toe awareness',
    duration: '4 min',
    bestFor: 'Complete reset',
    category: 'full',
    steps: [
      'Start at the top of your head',
      'Notice any tension in your forehead, eyes, jaw',
      'Move down to neck and shoulders',
      'Feel your chest and stomach',
      'Notice your lower back and hips',
      'Scan down through legs to your feet',
      'Breathe into any areas of tension',
    ],
  },
  // 5. Eye Palming
  {
    id: 'eye-palming',
    name: 'Eye Palming',
    description: 'Rest and refresh tired eyes',
    targetArea: 'Eye strain, visual rest',
    duration: '90 sec',
    bestFor: 'Screen fatigue',
    category: 'face',
    steps: [
      'Rub your palms together to warm them',
      'Cup your palms over your closed eyes',
      'Don\'t press on your eyes, just cover them',
      'Let your eyes rest in complete darkness',
      'Breathe deeply and relax',
      'Slowly remove your hands and blink gently',
    ],
  },
  // 6. Neck Rolls
  {
    id: 'neck-rolls',
    name: 'Neck Rolls',
    description: 'Gently release neck tension',
    targetArea: 'Neck tension',
    duration: '2 min',
    bestFor: 'Tension headaches',
    category: 'upper',
    steps: [
      'Drop your chin to your chest',
      'Slowly roll your head to the right',
      'Continue rolling back (gently)',
      'Roll to the left',
      'Return to center',
      'Repeat 3 times each direction',
    ],
  },
  // 7. Forehead Smooth
  {
    id: 'forehead-smooth',
    name: 'Forehead Smooth',
    description: 'Release forehead and brow tension',
    targetArea: 'Forehead, brow relaxation',
    duration: '1 min',
    bestFor: 'Concentration strain',
    category: 'face',
    steps: [
      'Place your fingertips at the center of your forehead',
      'Gently stroke outward toward your temples',
      'Repeat 5 times',
      'Now place fingers above your eyebrows',
      'Stroke upward toward your hairline',
      'Feel your forehead relax and smooth',
    ],
  },
  // 8. Chest Opener
  {
    id: 'chest-opener',
    name: 'Chest Opener',
    description: 'Open the chest and improve posture',
    targetArea: 'Chest, posture',
    duration: '90 sec',
    bestFor: 'Hunched posture',
    category: 'upper',
    steps: [
      'Interlace your fingers behind your back',
      'Straighten your arms and lift slightly',
      'Open your chest and squeeze shoulder blades',
      'Look up slightly if comfortable',
      'Hold for 15-20 seconds',
      'Release and notice the openness',
    ],
  },
  // 9. Hip Circles
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    description: 'Release lower back and hip tension',
    targetArea: 'Lower back, hips',
    duration: '2 min',
    bestFor: 'Sitting all day',
    category: 'lower',
    steps: [
      'Stand with feet hip-width apart',
      'Place hands on your hips',
      'Circle your hips clockwise 10 times',
      'Make the circles larger',
      'Reverse direction for 10 circles',
      'Return to center and notice the release',
    ],
  },
  // 10. Ankle Rotations
  {
    id: 'ankle-rotations',
    name: 'Ankle Rotations',
    description: 'Improve circulation and release feet',
    targetArea: 'Feet, circulation',
    duration: '1 min',
    bestFor: 'Stagnation',
    category: 'lower',
    steps: [
      'Lift one foot slightly off the ground',
      'Rotate your ankle clockwise 10 times',
      'Rotate counterclockwise 10 times',
      'Point and flex your foot 5 times',
      'Switch to the other foot',
      'Feel the increased circulation',
    ],
  },
  // 11. Spine Twist
  {
    id: 'spine-twist',
    name: 'Spine Twist',
    description: 'Gentle twist to release back tension',
    targetArea: 'Back tension, mobility',
    duration: '2 min',
    bestFor: 'Stiffness',
    category: 'full',
    steps: [
      'Sit tall in your chair',
      'Place your right hand on your left knee',
      'Place your left hand behind you',
      'Gently twist to the left',
      'Hold for 20-30 seconds',
      'Return to center and repeat on the other side',
    ],
  },
  // 12. Wrist Circles
  {
    id: 'wrist-circles',
    name: 'Wrist Circles',
    description: 'Release wrist and forearm tension',
    targetArea: 'Wrist strain',
    duration: '1 min',
    bestFor: 'Typing fatigue',
    category: 'upper',
    steps: [
      'Extend your arms in front of you',
      'Make fists with both hands',
      'Circle your wrists inward 10 times',
      'Circle outward 10 times',
      'Shake your hands out',
      'Stretch fingers wide, then relax',
    ],
  },
  // 13. Face Massage
  {
    id: 'face-massage',
    name: 'Face Massage',
    description: 'Complete facial relaxation',
    targetArea: 'Full face relaxation',
    duration: '2 min',
    bestFor: 'Complete facial release',
    category: 'face',
    steps: [
      'Start with small circles on your temples',
      'Move to your forehead',
      'Massage around your eye sockets',
      'Press along your cheekbones',
      'Massage your jaw muscles',
      'End with gentle strokes down your neck',
    ],
  },
  // 14. Progressive Muscle Relaxation
  {
    id: 'progressive-muscle',
    name: 'Progressive Muscle',
    description: 'Tense and release through entire body',
    targetArea: 'Tense-release full body',
    duration: '5 min',
    bestFor: 'Deep relaxation',
    category: 'full',
    steps: [
      'Start with your feet - tense for 5 seconds, release',
      'Move to calves - tense, hold, release',
      'Thighs - tense, hold, release',
      'Stomach - tense, hold, release',
      'Chest and back - tense, hold, release',
      'Arms, hands, face - tense, hold, release',
      'Feel the wave of relaxation through your body',
    ],
  },
];

export const RESET_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔄' },
  { id: 'face', label: 'Face', icon: '😌' },
  { id: 'upper', label: 'Upper Body', icon: '💪' },
  { id: 'lower', label: 'Lower Body', icon: '🦵' },
  { id: 'full', label: 'Full Body', icon: '🧘' },
] as const;

export type ResetCategory = typeof RESET_CATEGORIES[number]['id'];

export function getExercisesByCategory(category: ResetCategory): ResetExercise[] {
  if (category === 'all') return RESET_EXERCISES;
  return RESET_EXERCISES.filter(e => e.category === category);
}

export function getExerciseById(id: string): ResetExercise | undefined {
  return RESET_EXERCISES.find(e => e.id === id);
}
