/**
 * Hooks Index
 * 
 * Export all custom hooks
 */

export { useHaptics } from './useHaptics';
export { useBiometrics, getBiometricName, type BiometricType } from './useBiometrics';
export { useNotifications, type ReminderSettings, type CustomReminder } from './useNotifications';
export { usePremiumFeature } from './usePremiumFeature';
export { 
  useBackendSync, 
  useMoodSync, 
  useJournalSync, 
  useSubscriptionSync, 
  useContentSync 
} from './useBackendSync';
