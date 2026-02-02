/**
 * Contexts Index - Cleaned Up
 * 
 * Export all context providers and hooks for the new flow.
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

// Journal (legacy - used by JournalEntryScreen)
export { JournalProvider, useJournal } from './JournalContext';
export type { JournalEntry } from './JournalContext';

// Mood (legacy - for data compatibility)
export { MoodProvider, useMood } from './MoodContext';
export type { MoodEntry, MoodStats, WeeklyGoal } from './MoodContext';

// Session (for UnifiedSessionScreen)
export { SessionProvider, useSession } from './SessionContext';

// Toast notifications
export { ToastProvider, useToast } from './ToastContext';

// Accessibility announcements
export { 
  AccessibilityAnnouncerProvider, 
  useAccessibilityAnnouncer,
  useStateAnnouncement,
  useConnectionAnnouncement,
} from './AccessibilityContext';

// ============================================
// NEW REVAMPED CONTEXTS
// ============================================

// Ambient - Environmental & user state
export { AmbientProvider, useAmbient } from './AmbientContext';

// Journey - Progress, timeline, and stats
export { JourneyProvider, useJourney } from './JourneyContext';
export type { TimelineEntry, TimelineEntryType, WeeklyStats } from './JourneyContext';
