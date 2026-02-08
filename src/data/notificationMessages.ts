/**
 * Notification Message Pools
 *
 * Warm, rotating message content for scheduled reminders.
 * Each pool provides variety so notifications feel fresh, not robotic.
 */

// =============================================================================
// MORNING MESSAGES
// =============================================================================

export const MORNING_MESSAGES = [
  {
    title: 'Good morning',
    body: 'A few quiet breaths can set the tone for your whole day.',
  },
  {
    title: 'Rise gently',
    body: 'Your sanctuary is here whenever you are ready.',
  },
  {
    title: 'A new day',
    body: 'Start with intention — even one mindful minute counts.',
  },
  {
    title: 'Morning moment',
    body: 'Before the world gets busy, take a breath for yourself.',
  },
  {
    title: 'Gentle start',
    body: 'How are you feeling? A quick check-in can ground your morning.',
  },
  {
    title: 'Welcome back',
    body: 'Your morning practice is waiting — no rush, just calm.',
  },
];

// =============================================================================
// MIDDAY MESSAGES
// =============================================================================

export const MIDDAY_MESSAGES = [
  {
    title: 'Midday pause',
    body: 'A one-minute breathing break can reset your afternoon.',
  },
  {
    title: 'Check in',
    body: 'How is your day going? Take a moment to notice.',
  },
  {
    title: 'Breathe',
    body: 'Wherever you are, three deep breaths can shift everything.',
  },
  {
    title: 'Gentle reminder',
    body: 'You deserve a quiet moment in the middle of everything.',
  },
  {
    title: 'Pause here',
    body: 'A small break now can carry you through the rest of the day.',
  },
  {
    title: 'Still waters',
    body: 'Even a brief grounding exercise can bring clarity.',
  },
];

// =============================================================================
// EVENING MESSAGES
// =============================================================================

export const EVENING_MESSAGES = [
  {
    title: 'Wind down',
    body: 'Reflect on what went well today — even the small things.',
  },
  {
    title: 'Evening quiet',
    body: 'A few minutes of calm breathing can prepare you for restful sleep.',
  },
  {
    title: 'Day is done',
    body: 'Let the day settle. Your sanctuary is a gentle place to close it.',
  },
  {
    title: 'Rest ahead',
    body: 'Take a moment to release what you are carrying before bed.',
  },
  {
    title: 'Soft close',
    body: 'Journal a thought or two — your future self will thank you.',
  },
  {
    title: 'Night falls',
    body: 'Your evening reflection is ready whenever you are.',
  },
];

// =============================================================================
// MOOD CHECK MESSAGES
// =============================================================================

export const MOOD_CHECK_MESSAGES = [
  {
    title: 'How are you?',
    body: 'A quick mood check helps you stay in touch with yourself.',
  },
  {
    title: 'Check in',
    body: 'Notice how you feel right now — no judgement, just awareness.',
  },
  {
    title: 'Moment of clarity',
    body: 'Tap to log your mood. Small patterns reveal big insights.',
  },
  {
    title: 'Feeling check',
    body: 'Take a breath and ask: how am I, really?',
  },
  {
    title: 'Your mood matters',
    body: 'Even a brief check-in builds self-awareness over time.',
  },
  {
    title: 'Pause and notice',
    body: 'What is present for you right now? Log it in a tap.',
  },
];

// =============================================================================
// HELPERS
// =============================================================================

export interface NotificationMessage {
  title: string;
  body: string;
}

/**
 * Pick a random message from a pool.
 */
export function pickRandomMessage(pool: NotificationMessage[]): NotificationMessage {
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
