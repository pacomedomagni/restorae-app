/**
 * Reflective Quotes & Affirmations
 *
 * Shown on session completion. Curated for each session type.
 * Tone: quiet, warm, grounding — never preachy or gamified.
 */

export type SessionType =
  | 'breathing'
  | 'grounding'
  | 'reset'
  | 'focus'
  | 'journal'
  | 'story'
  | 'ritual'
  | 'mood';

const breathingReflections = [
  'The breath you return to is always there for you.',
  'Each exhale is a small act of letting go.',
  'You gave yourself the gift of stillness.',
  'Notice how your body feels right now.',
  'The calm you created here stays with you.',
];

const groundingReflections = [
  'You are here. That is enough.',
  'Your feet are on the ground. You are safe.',
  'Presence is the most generous thing you can offer yourself.',
  'The world slowed down for a moment — and you noticed.',
  'You chose to return to now. That takes courage.',
];

const resetReflections = [
  'Tension released. Space restored.',
  'You chose to pause instead of push through.',
  'Rest is not a reward — it is a need.',
  'You pressed reset. That is wisdom, not weakness.',
  'Your body thanks you for listening.',
];

const focusReflections = [
  'Clarity earned, one moment at a time.',
  'Deep work is a practice. You just practiced.',
  'Your attention is a gift — you spent it well.',
  'Focus is not forcing. It is choosing, gently.',
  'The noise faded. The work remained.',
];

const journalReflections = [
  'Writing is how we hold space for ourselves.',
  'Your thoughts deserve a place to land.',
  'Reflection is how we grow without rushing.',
  'Something you wrote today may matter tomorrow.',
  'The page does not judge. It only holds.',
];

const storyReflections = [
  'May your rest be deep and untroubled.',
  'Let the story carry you gently into sleep.',
  'Tomorrow is waiting. Tonight, rest.',
  'The night is yours. Be still.',
  'Sweet dreams await.',
];

const ritualReflections = [
  'A beautiful practice, completed with care.',
  'Rituals become anchors. You are building one.',
  'Consistency is quiet power.',
  'You showed up for yourself. That matters.',
  'The practice is the progress.',
];

const moodReflections = [
  'Noticing how you feel is the first step.',
  'Self-awareness is a form of self-respect.',
  'No feeling is wrong. Every feeling is data.',
  'You checked in. That is more than most people do.',
  'Knowing where you are helps you choose where to go.',
];

const reflectionsByType: Record<SessionType, string[]> = {
  breathing: breathingReflections,
  grounding: groundingReflections,
  reset: resetReflections,
  focus: focusReflections,
  journal: journalReflections,
  story: storyReflections,
  ritual: ritualReflections,
  mood: moodReflections,
};

/**
 * Get a random reflection for the given session type.
 * Uses a simple hash of the current date + type to avoid
 * showing the same quote on the same day for the same type.
 */
export function getReflection(sessionType: SessionType): string {
  const quotes = reflectionsByType[sessionType];
  const today = new Date().toDateString();
  const seed = today + sessionType;

  // Simple string hash for deterministic but varied selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % quotes.length;
  return quotes[index];
}
