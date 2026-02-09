import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import logger from './logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { secureStorage, SECURE_KEYS, STORAGE_KEYS } from './secureStorage';

// Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  timezone: string;
  locale: string;
  role: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  preferences?: UserPreferences;
  subscription?: Subscription;
}

export interface UserPreferences {
  id: string;
  morningReminderTime?: string;
  eveningReminderTime?: string;
  notificationsEnabled: boolean;
  dailyCheckInReminder: boolean;
  breathingReminders: boolean;
  journalReminders: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  darkMode: boolean;
  lockEnabled: boolean;
  lockMethod: string;
}

export interface Subscription {
  id: string;
  tier: 'FREE' | 'PREMIUM' | 'LIFETIME';
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface MoodEntry {
  id: string;
  mood: string;
  context: string;
  note?: string;
  energyLevel?: number;
  sleepQuality?: number;
  tags: string[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  encryptedContent?: string;
  promptId?: string;
  mood?: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  type: string;
  duration?: number;
  audioUrl?: string;
  steps?: Array<{ instruction: string; duration?: number }>;
  isPremium: boolean;
}

// Storage keys imported from secureStorage

// API Configuration
const API_ROOT = (process.env.EXPO_PUBLIC_API_URL || (__DEV__
  ? 'http://localhost:3001'
  : 'https://api.restorae.kouakoudomagni.com')).replace(/\/+$/, '');
const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX || '/api/v1';
const API_BASE_URL = `${API_ROOT}${API_PREFIX}`;

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private onAuthError?: () => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Batch sync offline operations
   */
  async batchSync(operations: Array<Record<string, unknown>>) {
    return this.client.post('/sync/batch', { operations });
  }

  setAuthErrorHandler(handler: () => void) {
    this.onAuthError = handler;
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await secureStorage.getItem(SECURE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshTokens();
            if (tokens && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - logout user
            await this.clearTokens();
            this.onAuthError?.();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshTokens(): Promise<AuthTokens | null> {
    // Prevent multiple refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await secureStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const tokens: AuthTokens = response.data;
        await this.saveTokens(tokens);
        return tokens;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async saveTokens(tokens: AuthTokens) {
    await secureStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
  }

  async clearTokens() {
    await secureStorage.clearTokens();
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }

  async saveUser(user: User) {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  async hasValidToken(): Promise<boolean> {
    const token = await secureStorage.getItem(SECURE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  private getDeviceInfo() {
    return {
      deviceId: Constants.sessionId || Device.modelId || 'unknown',
      platform: Platform.OS,
      osVersion: Platform.Version?.toString(),
      appVersion: Constants.expoConfig?.version || '1.0.0',
    };
  }

  // =========================================================================
  // AUTH ENDPOINTS
  // =========================================================================

  async register(email: string, password: string, name?: string) {
    const device = this.getDeviceInfo();
    const response = await this.client.post<{ user: User } & AuthTokens>('/auth/register', {
      email,
      password,
      name,
      ...device,
    });
    
    await this.saveTokens(response.data);
    await this.saveUser(response.data.user);
    return response.data;
  }

  async login(email: string, password: string) {
    const device = this.getDeviceInfo();
    const response = await this.client.post<{ user: User } & AuthTokens>('/auth/login', {
      email,
      password,
      ...device,
    });
    
    await this.saveTokens(response.data);
    await this.saveUser(response.data.user);
    return response.data;
  }

  async signInWithApple(identityToken: string, name?: string) {
    const response = await this.client.post<{ user: User; isNewUser: boolean } & AuthTokens>('/auth/apple', {
      identityToken,
      name,
    });
    
    await this.saveTokens(response.data);
    await this.saveUser(response.data.user);
    return response.data;
  }

  async signInWithGoogle(idToken: string) {
    const response = await this.client.post<{ user: User; isNewUser: boolean } & AuthTokens>('/auth/google', {
      idToken,
      platform: Platform.OS as 'ios' | 'android',
    });
    
    await this.saveTokens(response.data);
    await this.saveUser(response.data.user);
    return response.data;
  }

  async registerAnonymous() {
    const device = this.getDeviceInfo();
    const response = await this.client.post<{ user: User } & AuthTokens>('/auth/anonymous', device);
    
    await this.saveTokens(response.data);
    await this.saveUser(response.data.user);
    return response.data;
  }

  async upgradeAccount(email: string, password: string, name?: string) {
    const response = await this.client.post<User>('/auth/upgrade', {
      email,
      password,
      name,
    });
    
    await this.saveUser(response.data);
    return response.data;
  }

  async logout() {
    try {
      const refreshToken = await secureStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await this.client.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // Ignore logout errors
    }
    await this.clearTokens();
  }

  async forgotPassword(email: string) {
    const response = await this.client.post<{ message: string }>('/auth/password/forgot', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.client.post<{ message: string }>('/auth/password/reset', { token, password });
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.post<{ message: string }>('/auth/password/change', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // =========================================================================
  // USER ENDPOINTS
  // =========================================================================

  async getProfile() {
    const response = await this.client.get<User>('/users/me');
    await this.saveUser(response.data);
    return response.data;
  }

  async updateProfile(data: Partial<Pick<User, 'name' | 'timezone' | 'locale'>>) {
    const response = await this.client.patch<User>('/users/me', data);
    await this.saveUser(response.data);
    return response.data;
  }

  async updatePreferences(preferences: Partial<UserPreferences>) {
    const response = await this.client.patch<UserPreferences>('/users/me/preferences', preferences);
    return response.data;
  }

  async updatePushToken(pushToken: string) {
    const device = this.getDeviceInfo();
    const response = await this.client.post('/notifications/register', {
      deviceId: device.deviceId,
      pushToken,
    });
    return response.data;
  }

  async deleteAccount() {
    await this.client.delete('/users/me');
    await this.clearTokens();
  }

  // =========================================================================
  // MOOD ENDPOINTS
  // =========================================================================

  async getMoodEntries(params?: { 
    startDate?: string; 
    endDate?: string; 
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get<MoodEntry[]>('/mood', { params });
    return response.data;
  }

  async createMoodEntry(data: {
    mood: string;
    context: string;
    note?: string;
    energyLevel?: number;
    sleepQuality?: number;
    tags?: string[];
  }) {
    const response = await this.client.post<MoodEntry>('/mood', data);
    return response.data;
  }

  async updateMoodEntry(id: string, data: Partial<{
    mood: string;
    context: string;
    note: string;
    energyLevel: number;
    sleepQuality: number;
    tags: string[];
  }>) {
    const response = await this.client.patch<MoodEntry>(`/mood/${id}`, data);
    return response.data;
  }

  async deleteMoodEntry(id: string) {
    await this.client.delete(`/mood/${id}`);
  }

  async getMoodStats(period: 'week' | 'month' | 'year' = 'week') {
    const response = await this.client.get('/mood/stats', { params: { period } });
    return response.data;
  }

  // =========================================================================
  // JOURNAL ENDPOINTS
  // =========================================================================

  async getJournalEntries(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const response = await this.client.get<JournalEntry[]>('/journal', { params });
    return response.data;
  }

  async createJournalEntry(data: {
    content: string;
    promptId?: string;
    mood?: string;
    tags?: string[];
    isPrivate?: boolean;
  }) {
    const response = await this.client.post<JournalEntry>('/journal', data);
    return response.data;
  }

  async updateJournalEntry(id: string, data: Partial<{
    content: string;
    mood: string;
    tags: string[];
    isPrivate: boolean;
  }>) {
    const response = await this.client.patch<JournalEntry>(`/journal/${id}`, data);
    return response.data;
  }

  async deleteJournalEntry(id: string) {
    await this.client.delete(`/journal/${id}`);
  }

  async getJournalPrompts() {
    const response = await this.client.get<Content[]>('/content', {
      params: { type: 'PROMPT', status: 'PUBLISHED' },
    });
    return response.data;
  }

  // =========================================================================
  // CONTENT ENDPOINTS
  // =========================================================================

  async getContent(params?: {
    type?: string;
    isPremium?: boolean;
    search?: string;
  }) {
    const response = await this.client.get<Content[]>('/content', { params });
    return response.data;
  }

  async getContentById(id: string) {
    const response = await this.client.get<Content>(`/content/${id}`);
    return response.data;
  }

  async getBreathingExercises() {
    return this.getContent({ type: 'BREATHING' });
  }

  async getGroundingExercises() {
    return this.getContent({ type: 'GROUNDING' });
  }

  async getSOSContent() {
    return this.getContent({ type: 'SOS' });
  }

  // =========================================================================
  // RITUALS ENDPOINTS
  // =========================================================================

  async getMorningRituals() {
    return this.getContent({ type: 'MORNING_RITUAL' });
  }

  async getEveningRituals() {
    return this.getContent({ type: 'EVENING_RITUAL' });
  }

  async getRituals(includeArchived = false) {
    const response = await this.client.get('/rituals', { 
      params: { includeArchived } 
    });
    return response.data;
  }

  async getRitualById(id: string) {
    const response = await this.client.get(`/rituals/${id}`);
    return response.data;
  }

  async getTodayRituals() {
    const response = await this.client.get('/rituals/today');
    return response.data;
  }

  async getFavoriteRituals() {
    const response = await this.client.get('/rituals/favorites');
    return response.data;
  }

  async createRitual(data: {
    title: string;
    description?: string;
    steps: Array<{
      id: string;
      title: string;
      duration: number;
      description?: string;
    }>;
    timeOfDay: 'morning' | 'midday' | 'evening' | 'anytime';
    days: string[];
    reminderEnabled?: boolean;
    reminderTime?: string;
  }) {
    const response = await this.client.post('/rituals', data);
    return response.data;
  }

  async updateRitual(id: string, data: Partial<{
    title: string;
    description: string;
    steps: Array<{
      id: string;
      title: string;
      duration: number;
      description?: string;
    }>;
    timeOfDay: 'morning' | 'midday' | 'evening' | 'anytime';
    days: string[];
    reminderEnabled: boolean;
    reminderTime: string;
  }>) {
    const response = await this.client.patch(`/rituals/${id}`, data);
    return response.data;
  }

  async deleteRitual(id: string) {
    const response = await this.client.delete(`/rituals/${id}`);
    return response.data;
  }

  async archiveRitual(id: string) {
    const response = await this.client.post(`/rituals/${id}/archive`);
    return response.data;
  }

  async unarchiveRitual(id: string) {
    const response = await this.client.post(`/rituals/${id}/unarchive`);
    return response.data;
  }

  async toggleRitualFavorite(id: string) {
    const response = await this.client.post(`/rituals/${id}/favorite`);
    return response.data;
  }

  async getRitualCompletions(ritualId?: string, limit = 30) {
    const response = await this.client.get('/rituals/completions', {
      params: { ritualId, limit }
    });
    return response.data;
  }

  async recordRitualCompletion(data: {
    ritualId: string;
    duration: number;
    completedSteps: number;
    totalSteps: number;
    mood?: 'great' | 'good' | 'okay' | 'tired';
    notes?: string;
  }) {
    const response = await this.client.post('/rituals/completions', data);
    return response.data;
  }

  async getRitualStreak() {
    const response = await this.client.get('/rituals/streak');
    return response.data;
  }

  async getWeeklyCompletionRate() {
    const response = await this.client.get('/rituals/weekly-rate');
    return response.data;
  }

  // =========================================================================
  // SUBSCRIPTION ENDPOINTS
  // =========================================================================

  async getSubscription() {
    const response = await this.client.get<Subscription>('/subscriptions');
    return response.data;
  }

  async validatePurchase(receipt: string, productId: string) {
    const response = await this.client.post('/subscriptions/validate', {
      receipt,
      productId,
      platform: Platform.OS,
    });
    return response.data;
  }

  async restorePurchases() {
    const response = await this.client.post('/subscriptions/restore', {
      platform: Platform.OS,
    });
    return response.data;
  }

  // =========================================================================
  // REMINDERS ENDPOINTS (via notifications)
  // =========================================================================

  async getReminders() {
    const response = await this.client.get('/notifications/reminders');
    return response.data;
  }

  async createReminder(data: {
    type: string;
    label: string;
    time: string;
    ritualId?: string;
  }) {
    const response = await this.client.post('/notifications/reminders', data);
    return response.data;
  }

  async updateReminder(id: string, data: Partial<{
    label: string;
    time: string;
    enabled: boolean;
  }>) {
    const response = await this.client.patch(`/notifications/reminders/${id}`, data);
    return response.data;
  }

  async deleteReminder(id: string) {
    await this.client.delete(`/notifications/reminders/${id}`);
  }

  async toggleReminder(id: string) {
    const response = await this.client.post(`/notifications/reminders/${id}/toggle`);
    return response.data;
  }

  // =========================================================================
  // WEEKLY GOALS ENDPOINTS (via mood)
  // =========================================================================

  async getWeeklyGoal() {
    // Weekly goal is managed via mood module
    const response = await this.client.get('/mood/goal');
    return response.data;
  }

  async setWeeklyGoalTarget(targetDays: number) {
    const response = await this.client.patch('/mood/goal', { targetDays });
    return response.data;
  }

  // =========================================================================
  // ACTIVITY LOGGING ENDPOINTS
  // =========================================================================

  async logActivity(data: {
    category: string;
    activityType: string;
    activityId?: string;
    duration: number;
    completed: boolean;
    metadata?: Record<string, unknown>;
    timestamp: string;
  }) {
    const response = await this.client.post('/activities/log', data);
    return response.data;
  }

  async logActivitiesBatch(activities: Array<{
    category: string;
    activityType: string;
    activityId?: string;
    duration: number;
    completed: boolean;
    metadata?: Record<string, unknown>;
    timestamp: string;
  }>) {
    const response = await this.client.post('/activities/log/batch', { activities });
    return response.data;
  }

  async getActivityStats(startDate?: string, endDate?: string) {
    const response = await this.client.get('/activities/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async getActivityHistory(params?: {
    category?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/activities/history', { params });
    return response.data;
  }

  // =========================================================================
  // SESSION ENDPOINTS
  // =========================================================================

  async createSession(data: {
    mode: 'SINGLE' | 'RITUAL' | 'SOS';
    ritualId?: string;
    ritualSlug?: string;
    sosPresetId?: string;
    activities: Array<{
      activityType: string;
      activityId: string;
      activityName: string;
      order: number;
    }>;
  }) {
    const response = await this.client.post('/sessions', data);
    return response.data;
  }

  async getSession(sessionId: string) {
    const response = await this.client.get(`/sessions/${sessionId}`);
    return response.data;
  }

  async getSessions(params?: {
    mode?: 'SINGLE' | 'RITUAL' | 'SOS';
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'EXITED' | 'INTERRUPTED';
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/sessions', { params });
    return response.data;
  }

  async updateSession(sessionId: string, data: {
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'EXITED' | 'INTERRUPTED';
    completedCount?: number;
    skippedCount?: number;
    totalDuration?: number;
    wasPartial?: boolean;
    wasInterrupted?: boolean;
    completedAt?: string;
  }) {
    const response = await this.client.patch(`/sessions/${sessionId}`, data);
    return response.data;
  }

  async updateSessionActivity(sessionId: string, activityId: string, data: {
    completed?: boolean;
    skipped?: boolean;
    duration?: number;
    startedAt?: string;
    completedAt?: string;
  }) {
    const response = await this.client.patch(`/sessions/${sessionId}/activities/${activityId}`, data);
    return response.data;
  }

  async getSessionStats(startDate?: string, endDate?: string) {
    const response = await this.client.get('/sessions/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  // =========================================================================
  // FEEDBACK ENDPOINTS
  // =========================================================================

  async submitFeedback(data: {
    type: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const device = this.getDeviceInfo();
    const response = await this.client.post('/feedback', {
      ...data,
      ...device,
    });
    return response.data;
  }

  // =========================================================================
  // AMBIENT SOUNDS
  // =========================================================================

  async getAmbientSounds() {
    return this.getContent({ type: 'AMBIENT_SOUND' });
  }

  // =========================================================================
  // BEDTIME STORIES
  // =========================================================================

  async getStories(locale = 'en') {
    const response = await this.client.get('/stories', { params: { locale } });
    return response.data;
  }

  async getStoryBySlug(slug: string, locale = 'en') {
    const response = await this.client.get(`/stories/${slug}`, { params: { locale } });
    return response.data;
  }

  async getStoryCategories(locale = 'en') {
    const response = await this.client.get('/stories/categories', { params: { locale } });
    return response.data;
  }

  async getStoriesByCategory(categorySlug: string, locale = 'en') {
    const response = await this.client.get(`/stories/category/${categorySlug}`, { params: { locale } });
    return response.data;
  }

  async getStoriesByMood(mood: string, locale = 'en') {
    const response = await this.client.get(`/stories/mood/${mood}`, { params: { locale } });
    return response.data;
  }

  async getFreeStoryIds() {
    const response = await this.client.get('/stories/free-ids');
    return response.data;
  }

  async trackStoryPlay(storyId: string) {
    const response = await this.client.post(`/stories/${storyId}/play`);
    return response.data;
  }

  async toggleStoryFavorite(storyId: string) {
    const response = await this.client.post(`/stories/${storyId}/favorite`);
    return response.data;
  }

  async getFavoriteStories(locale = 'en') {
    const response = await this.client.get('/stories/user/favorites', { params: { locale } });
    return response.data;
  }

  // =========================================================================
  // ACHIEVEMENTS & GAMIFICATION
  // =========================================================================

  async getAchievements() {
    const response = await this.client.get('/achievements');
    return response.data;
  }

  async getAchievementsByCategory(category: string) {
    const response = await this.client.get(`/achievements/category/${category}`);
    return response.data;
  }

  async getUserAchievements() {
    const response = await this.client.get('/achievements/user/unlocked');
    return response.data;
  }

  async getUserProgress() {
    const response = await this.client.get('/achievements/user/progress');
    return response.data;
  }

  async trackSessionComplete(durationMinutes: number, sessionType: string) {
    const response = await this.client.post('/achievements/track/session', {
      durationMinutes,
      sessionType,
    });
    return response.data;
  }

  async updateStreak() {
    const response = await this.client.post('/achievements/track/streak');
    return response.data;
  }

  async unlockAchievement(slug: string) {
    const response = await this.client.post(`/achievements/unlock/${slug}`);
    return response.data;
  }

  async getLeaderboard(limit = 10) {
    const response = await this.client.get('/achievements/leaderboard', { params: { limit } });
    return response.data;
  }

  // =========================================================================
  // COACH MARKS (Onboarding tooltips)
  // =========================================================================

  async getCoachMarks() {
    const response = await this.client.get('/coach-marks');
    return response.data;
  }

  async getCoachMarksByScreen(screen: string) {
    const response = await this.client.get(`/coach-marks/screen/${screen}`);
    return response.data;
  }

  async getSeenCoachMarks() {
    const response = await this.client.get('/coach-marks/user/seen');
    return response.data;
  }

  async markCoachMarkSeen(key: string) {
    const response = await this.client.post(`/coach-marks/user/seen/${key}`);
    return response.data;
  }

  async resetCoachMarks() {
    const response = await this.client.post('/coach-marks/user/reset');
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
