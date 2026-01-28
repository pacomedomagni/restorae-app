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
  analyticsService,
  Analytics,
  ANALYTICS_EVENTS,
  ANALYTICS_SCREENS,
  ANALYTICS_USER_PROPERTIES,
  FUNNELS,
  type AnalyticsEvent,
  type UserProperties,
  type FunnelConfig,
  type FunnelStep,
} from './analytics';

// Audio
export {
  audioService,
  AUDIO_EVENTS,
  type AudioTrack,
  type AudioState,
  type PlaybackState,
  type AudioError,
  type AudioEventHandler,
} from './audio';

// i18n (Internationalization)
export {
  i18n,
  t,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  type TranslationKey,
} from './i18n';
