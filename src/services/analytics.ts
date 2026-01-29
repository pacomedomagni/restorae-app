/**
 * Analytics Service
 * 
 * Comprehensive analytics tracking with support for:
 * - Event tracking with properties
 * - User identification and properties
 * - Funnel tracking
 * - Session tracking
 * - Revenue tracking
 * 
 * Supports multiple providers: Mixpanel, Amplitude, or custom backend
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import logger from './logger';

// API Base URL
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api/v1';

// Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  subscriptionTier?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface FunnelStep {
  name: string;
  timestamp: string;
  properties?: Record<string, any>;
}

// Storage keys
const STORAGE_KEYS = {
  ANONYMOUS_ID: '@restorae/analytics_anonymous_id',
  USER_ID: '@restorae/analytics_user_id',
  SESSION_ID: '@restorae/analytics_session_id',
  SESSION_START: '@restorae/analytics_session_start',
  EVENT_QUEUE: '@restorae/analytics_event_queue',
  FUNNEL_STATE: '@restorae/analytics_funnel_state',
};

// Event names (centralized for consistency)
export const AnalyticsEvents = {
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_FOREGROUNDED: 'app_foregrounded',
  
  // Auth
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  LOGIN_STARTED: 'login_started',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',
  
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  
  // Mood tracking
  MOOD_CHECKIN_STARTED: 'mood_checkin_started',
  MOOD_SELECTED: 'mood_selected',
  MOOD_CHECKIN_COMPLETED: 'mood_checkin_completed',
  MOOD_HISTORY_VIEWED: 'mood_history_viewed',
  
  // Tools
  TOOL_VIEWED: 'tool_viewed',
  TOOL_STARTED: 'tool_started',
  TOOL_COMPLETED: 'tool_completed',
  TOOL_ABANDONED: 'tool_abandoned',
  
  // Breathing
  BREATHING_STARTED: 'breathing_started',
  BREATHING_COMPLETED: 'breathing_completed',
  BREATHING_PATTERN_SELECTED: 'breathing_pattern_selected',
  
  // Journal
  JOURNAL_ENTRY_STARTED: 'journal_entry_started',
  JOURNAL_ENTRY_SAVED: 'journal_entry_saved',
  JOURNAL_PROMPT_USED: 'journal_prompt_used',
  
  // Rituals
  RITUAL_STARTED: 'ritual_started',
  RITUAL_COMPLETED: 'ritual_completed',
  CUSTOM_RITUAL_CREATED: 'custom_ritual_created',
  
  // Stories (new)
  STORY_STARTED: 'story_started',
  STORY_COMPLETED: 'story_completed',
  STORY_PAUSED: 'story_paused',
  SLEEP_TIMER_SET: 'sleep_timer_set',
  
  // Subscription
  PAYWALL_VIEWED: 'paywall_viewed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  TRIAL_STARTED: 'trial_started',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  
  // Engagement
  STREAK_ACHIEVED: 'streak_achieved',
  FEATURE_DISCOVERED: 'feature_discovered',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
} as const;

// Funnel definitions
export const Funnels = {
  ONBOARDING: 'onboarding_funnel',
  FIRST_MOOD_CHECKIN: 'first_mood_checkin_funnel',
  FIRST_BREATHING: 'first_breathing_funnel',
  SUBSCRIPTION: 'subscription_funnel',
  STORY_COMPLETION: 'story_completion_funnel',
} as const;

class AnalyticsService {
  private anonymousId: string | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private sessionStartTime: Date | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private userProperties: UserProperties = {};
  private superProperties: Record<string, any> = {};
  private funnelStates: Map<string, FunnelStep[]> = new Map();
  private isInitialized = false;
  private flushInterval: NodeJS.Timeout | null = null;

  // Config
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load or create anonymous ID
      let storedAnonymousId = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
      if (!storedAnonymousId) {
        storedAnonymousId = this.generateId();
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, storedAnonymousId);
      }
      this.anonymousId = storedAnonymousId;

      // Load user ID if exists
      this.userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

      // Load event queue
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.EVENT_QUEUE);
      if (queueData) {
        this.eventQueue = JSON.parse(queueData);
      }

      // Load funnel states
      const funnelData = await AsyncStorage.getItem(STORAGE_KEYS.FUNNEL_STATE);
      if (funnelData) {
        const parsed = JSON.parse(funnelData);
        this.funnelStates = new Map(Object.entries(parsed));
      }

      // Start new session or continue existing
      await this.startSession();

      // Set up device super properties
      this.superProperties = {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        deviceModel: Device.modelName,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
      };

      // Start flush interval
      this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL);

      this.isInitialized = true;
      logger.info('Analytics initialized');
    } catch (error) {
      logger.error('Analytics initialization failed:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async startSession(): Promise<void> {
    const lastSessionStart = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_START);
    const lastSessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);

    const now = new Date();
    const shouldStartNewSession = !lastSessionStart || 
      (now.getTime() - new Date(lastSessionStart).getTime() > this.SESSION_TIMEOUT);

    if (shouldStartNewSession) {
      this.sessionId = this.generateId();
      this.sessionStartTime = now;
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, this.sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_START, now.toISOString());
      
      this.track(AnalyticsEvents.APP_OPENED, {
        isNewSession: true,
      });
    } else {
      this.sessionId = lastSessionId;
      this.sessionStartTime = new Date(lastSessionStart!);
    }
  }

  /**
   * Identify a user
   */
  async identify(userId: string, properties?: UserProperties): Promise<void> {
    this.userId = userId;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);

    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties };
    }

    // Track identification
    this.track('user_identified', {
      previousAnonymousId: this.anonymousId,
    });
  }

  /**
   * Reset user (on logout)
   */
  async reset(): Promise<void> {
    this.userId = null;
    this.userProperties = {};
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
    
    // Generate new anonymous ID
    this.anonymousId = this.generateId();
    await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, this.anonymousId);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  /**
   * Set super properties (included with every event)
   */
  setSuperProperties(properties: Record<string, any>): void {
    this.superProperties = { ...this.superProperties, ...properties };
  }

  /**
   * Track an event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...this.superProperties,
        ...properties,
        distinctId: this.userId || this.anonymousId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(event);

    // Log in dev
    if (__DEV__) {
      logger.info(`[Analytics] ${eventName}`, event.properties);
    }

    // Auto-flush if queue is large
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }

    // Save queue
    this.saveQueue();
  }

  /**
   * Track screen view
   */
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.track('screen_viewed', {
      screenName,
      ...properties,
    });
  }

  /**
   * Start a funnel
   */
  startFunnel(funnelName: string, properties?: Record<string, any>): void {
    this.funnelStates.set(funnelName, [{
      name: 'funnel_started',
      timestamp: new Date().toISOString(),
      properties,
    }]);
    this.saveFunnelState();
    
    this.track(`${funnelName}_started`, properties);
  }

  /**
   * Track funnel step
   */
  trackFunnelStep(funnelName: string, stepName: string, properties?: Record<string, any>): void {
    const funnel = this.funnelStates.get(funnelName) || [];
    funnel.push({
      name: stepName,
      timestamp: new Date().toISOString(),
      properties,
    });
    this.funnelStates.set(funnelName, funnel);
    this.saveFunnelState();

    this.track(`${funnelName}_step`, {
      step: stepName,
      stepNumber: funnel.length,
      ...properties,
    });
  }

  /**
   * Complete a funnel
   */
  completeFunnel(funnelName: string, properties?: Record<string, any>): void {
    const funnel = this.funnelStates.get(funnelName) || [];
    const startTime = funnel[0]?.timestamp;
    const duration = startTime 
      ? new Date().getTime() - new Date(startTime).getTime() 
      : 0;

    this.track(`${funnelName}_completed`, {
      totalSteps: funnel.length,
      durationMs: duration,
      ...properties,
    });

    this.funnelStates.delete(funnelName);
    this.saveFunnelState();
  }

  /**
   * Track revenue event
   */
  trackRevenue(
    productId: string, 
    price: number, 
    currency: string = 'USD',
    properties?: Record<string, any>
  ): void {
    this.track('revenue', {
      productId,
      price,
      currency,
      ...properties,
    });
  }

  /**
   * Track timing event
   */
  trackTiming(category: string, variable: string, durationMs: number): void {
    this.track('timing', {
      category,
      variable,
      durationMs,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track(AnalyticsEvents.ERROR_OCCURRED, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500),
      ...context,
    });
  }

  /**
   * Flush events to backend
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    await this.saveQueue();

    try {
      // Send to analytics backend
      const response = await fetch(`${API_BASE_URL}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          userId: this.userId,
          anonymousId: this.anonymousId,
          userProperties: this.userProperties,
          deviceInfo: this.superProperties,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics flush failed: ${response.status}`);
      }

      if (__DEV__) {
        logger.info(`[Analytics] Flushed ${eventsToSend.length} events to backend`);
      }
    } catch (error) {
      // Re-add events to queue on failure
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      await this.saveQueue();
      
      if (__DEV__) {
        logger.warn('Analytics flush failed, events re-queued:', error);
      }
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      logger.error('Failed to save analytics queue:', error);
    }
  }

  private async saveFunnelState(): Promise<void> {
    try {
      const data = Object.fromEntries(this.funnelStates);
      await AsyncStorage.setItem(STORAGE_KEYS.FUNNEL_STATE, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save funnel state:', error);
    }
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Date.now() - this.sessionStartTime.getTime();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export hook for React components
export function useAnalytics() {
  return {
    track: (event: string, props?: Record<string, any>) => analytics.track(event, props),
    trackScreen: (screen: string, props?: Record<string, any>) => analytics.trackScreen(screen, props),
    identify: (userId: string, props?: UserProperties) => analytics.identify(userId, props),
    setUserProperties: (props: UserProperties) => analytics.setUserProperties(props),
    trackError: (error: Error, context?: Record<string, any>) => analytics.trackError(error, context),
    startFunnel: (name: string, props?: Record<string, any>) => analytics.startFunnel(name, props),
    trackFunnelStep: (funnel: string, step: string, props?: Record<string, any>) => analytics.trackFunnelStep(funnel, step, props),
    completeFunnel: (name: string, props?: Record<string, any>) => analytics.completeFunnel(name, props),
  };
}

export default analytics;
