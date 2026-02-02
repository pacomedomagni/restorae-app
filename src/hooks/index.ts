/**
 * Hooks Index
 * 
 * Export all custom hooks
 */

// Haptic feedback
export { useHaptics, type HapticPattern } from './useHaptics';

// UI Sound effects
export { useUISounds, type UISoundType } from './useUISounds';

// Biometric authentication
export { useBiometrics, getBiometricName, type BiometricType } from './useBiometrics';

// Notifications
export { useNotifications, type ReminderSettings, type CustomReminder } from './useNotifications';

// Premium features
export { usePremiumFeature } from './usePremiumFeature';

// Backend sync
export { 
  useBackendSync, 
  useMoodSync, 
  useJournalSync, 
  useSubscriptionSync, 
  useContentSync 
} from './useBackendSync';

// Session audio
export { 
  useSessionAudio, 
  useSoundEffect, 
  type SessionType, 
  type SessionAudioConfig 
} from './useSessionAudio';

// Time-aware content personalization
export { 
  useTimeAwareContent, 
  type TimeOfDay, 
  type TimeContext, 
  type SuggestedActivity, 
  type PersonalizedMessage 
} from './useTimeAwareContent';

// Network status
export { useNetworkStatus } from './useNetworkStatus';

// Stories
export { 
  useStories, 
  type BedtimeStory, 
  type StoryCategory 
} from './useStories';

// Achievements & Gamification
export { 
  useAchievements, 
  type Achievement, 
  type UserProgress, 
  type AchievementTier, 
  type AchievementCategory,
  type TrackSessionResult 
} from './useAchievements';

// Coach Marks (Backend synced onboarding)
export { useCoachMarksSync, type CoachMark } from './useCoachMarksSync';

// Session persistence
export { useSessionPersistence } from './useSessionPersistence';

// Session starting helper
export { useStartActivity } from './useStartActivity';

// Session recovery
export { useSessionRecovery } from './useSessionRecovery';

// Optimistic updates
export { useOptimisticUpdate, useOptimisticList } from './useOptimisticUpdate';

// Breathing transitions for emotional flow
export { useBreathingTransition } from './useBreathingTransition';

// Contextual micro-copy that responds to emotional state
export { useContextualCopy } from './useContextualCopy';

// Favorites/Quick Access
export { useFavorites, type FavoriteItem } from './useFavorites';

// Time-adaptive theming (color temperature based on time of day)
export { useTimeAdaptiveTheme, type TimeOfDay as AdaptiveTimeOfDay } from './useTimeAdaptiveTheme';

// Session milestone celebrations
export { useSessionMilestones, type Milestone, type MilestoneType } from './useSessionMilestones';

// Smart haptics (time & context aware)
export { useSmartHaptics, type HapticIntensity, type HapticContext } from './useSmartHaptics';
