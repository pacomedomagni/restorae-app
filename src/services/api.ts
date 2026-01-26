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
  steps?: any;
  isPremium: boolean;
}

// Storage keys imported from secureStorage

// API Configuration
const API_ROOT = (process.env.EXPO_PUBLIC_API_URL || (__DEV__
  ? 'http://localhost:3000'
  : 'https://api.restorae.com')).replace(/\/+$/, '');
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
  async batchSync(operations: any[]) {
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
    const response = await this.client.post('/users/me/device', {
      ...device,
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
    const response = await this.client.get<{ entries: MoodEntry[]; total: number }>('/mood', { params });
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
    const response = await this.client.get<{ entries: JournalEntry[]; total: number }>('/journal', { params });
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

  // Legacy methods (kept for backward compatibility)
  async getCustomRituals() {
    return this.getRituals(false);
  }

  async createCustomRitual(data: {
    name: string;
    description?: string;
    timeOfDay: string;
    activities: any[];
    days?: string[];
  }) {
    const response = await this.client.post('/rituals/custom', data);
    return response.data;
  }

  async completeRitual(data: {
    ritualId?: string;
    customRitualId?: string;
    duration: number;
    completedActivities: string[];
    notes?: string;
  }) {
    const response = await this.client.post('/rituals/complete', data);
    return response.data;
  }

  async getRitualStats(period: 'week' | 'month' = 'week') {
    const response = await this.client.get('/rituals/stats', { params: { period } });
    return response.data;
  }

  // =========================================================================
  // SUBSCRIPTION ENDPOINTS
  // =========================================================================

  async getSubscription() {
    const response = await this.client.get<Subscription>('/subscriptions/me');
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
  // REMINDERS ENDPOINTS
  // =========================================================================

  async getReminders() {
    const response = await this.client.get('/reminders');
    return response.data;
  }

  async createReminder(data: {
    type: string;
    time: string;
    days: string[];
    message?: string;
  }) {
    const response = await this.client.post('/reminders', data);
    return response.data;
  }

  async updateReminder(id: string, data: Partial<{
    time: string;
    days: string[];
    message: string;
    isActive: boolean;
  }>) {
    const response = await this.client.patch(`/reminders/${id}`, data);
    return response.data;
  }

  async deleteReminder(id: string) {
    await this.client.delete(`/reminders/${id}`);
  }

  // =========================================================================
  // GOALS ENDPOINTS
  // =========================================================================

  async getWeeklyGoals() {
    const response = await this.client.get('/goals/weekly');
    return response.data;
  }

  async getWeeklyGoal() {
    // Get the most recent/active weekly goal for mood tracking
    const response = await this.client.get('/goals/weekly');
    const goals = response.data?.goals || response.data || [];
    return Array.isArray(goals) ? goals[0] : goals;
  }

  async createWeeklyGoal(data: {
    type: string;
    target: number;
    weekStart: string;
  }) {
    const response = await this.client.post('/goals/weekly', data);
    return response.data;
  }

  async setWeeklyGoalTarget(targetDays: number) {
    const response = await this.client.patch('/goals/weekly/target', { targetDays });
    return response.data;
  }

  async updateGoalProgress(id: string, progress: number) {
    const response = await this.client.patch(`/goals/weekly/${id}`, { progress });
    return response.data;
  }

  // =========================================================================
  // FEEDBACK ENDPOINTS
  // =========================================================================

  async submitFeedback(data: {
    type: string;
    message: string;
    metadata?: Record<string, any>;
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
}

// Export singleton instance
export const api = new ApiClient();
export default api;
