/**
 * Contexts Index
 * 
 * Export all context providers and hooks
 */

// Auth
export { AuthProvider, useAuth } from './AuthContext';

// Theme
export { ThemeProvider, useTheme } from './ThemeContext';

// Preferences
export { PreferencesProvider, usePreferences } from './PreferencesContext';

// Subscription
export { SubscriptionProvider, useSubscription } from './SubscriptionContext';
export type { SubscriptionTier, SubscriptionState } from './SubscriptionContext';

// Audio
export { AudioProvider, useAudio, useFocusAudio, AMBIENT_SOUNDS_DATA } from './AudioContext';
export type { AmbientSound } from './AudioContext';

// Journal
export { JournalProvider, useJournal } from './JournalContext';
export type { JournalEntry } from './JournalContext';

// Mood
export { MoodProvider, useMood } from './MoodContext';
export type { MoodEntry, MoodStats, WeeklyGoal } from './MoodContext';

// App Lock
export { AppLockProvider, useAppLock } from './AppLockContext';
export type { LockMethod } from './AppLockContext';

// Rituals
export { RitualsProvider, useRituals } from './RitualsContext';
export type { 
  CustomRitual, 
  RitualStep, 
  RitualCompletion, 
  TimeOfDay, 
  DayOfWeek 
} from './RitualsContext';

// Coach Marks (first-time user guidance)
export { CoachMarkProvider, useCoachMarks, COACH_MARKS } from './CoachMarkContext';
export type { CoachMarkId, CoachMark } from './CoachMarkContext';

// Toast notifications
export { ToastProvider, useToast } from './ToastContext';

// Accessibility announcements
export { 
  AccessibilityAnnouncerProvider, 
  useAccessibilityAnnouncer,
  useStateAnnouncement,
  useConnectionAnnouncement,
} from './AccessibilityContext';
