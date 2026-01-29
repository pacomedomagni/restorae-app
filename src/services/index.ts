/**
 * Services Index
 * 
 * Export all API and service modules
 */

export { api, default as apiClient } from './api';
export type {
  ApiResponse,
  AuthTokens,
  User,
  UserPreferences,
  Subscription,
  MoodEntry,
  JournalEntry,
  Content,
} from './api';

// Analytics
export {
  analytics,
  AnalyticsEvents,
  Funnels,
  useAnalytics,
  type AnalyticsEvent,
  type UserProperties,
  type FunnelStep,
} from './analytics';

// Audio
export {
  audioService,
  type AudioTrack,
  type PlaybackState,
} from './audio';

// i18n (Internationalization)
export {
  i18n,
  useTranslation,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  type TranslationKey,
} from './i18n';
