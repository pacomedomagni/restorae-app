/**
 * Hooks Index
 * 
 * Export all custom hooks
 */

// Haptic feedback
export { useHaptics, type HapticPattern } from './useHaptics';

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

// Session persistence
export { useSessionPersistence } from './useSessionPersistence';
