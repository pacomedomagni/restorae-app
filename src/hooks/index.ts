/**
 * Hooks Index - Cleaned Up
 * 
 * Export essential custom hooks for the new system.
 */

// Haptic feedback
export { useHaptics, type HapticPattern } from './useHaptics';

// UI Sound effects
export { useUISounds, type UISoundType } from './useUISounds';

// Breathing audio guidance
export { useBreathingAudio, type BreathingToneType } from './useBreathingAudio';

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

// Achievements & Gamification
export { 
  useAchievements, 
  type Achievement, 
  type UserProgress, 
  type AchievementTier, 
  type AchievementCategory,
  type TrackSessionResult 
} from './useAchievements';

// Optimistic updates
export { useOptimisticUpdate, useOptimisticList } from './useOptimisticUpdate';

// Contextual micro-copy
export { useContextualCopy } from './useContextualCopy';

// Favorites/Quick Access
export { useFavorites, type FavoriteItem } from './useFavorites';

// Time-adaptive theming
export { useTimeAdaptiveTheme, type TimeOfDay as AdaptiveTimeOfDay } from './useTimeAdaptiveTheme';
