/**
 * AmbientContext - Unified State
 * 
 * Tracks environmental and user state for adaptive experiences.
 * - Time of day
 * - Recent mood
 * - Session history
 * - Device state
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { MoodType } from '../theme/tokens';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface AmbientState {
  // Time awareness
  timeOfDay: TimeOfDay;
  currentHour: number;
  
  // Mood state
  currentMood: MoodType | null;
  lastMoodTimestamp: number | null;
  moodHistory: Array<{ mood: MoodType; timestamp: number }>;
  
  // Session state
  lastSessionTimestamp: number | null;
  sessionsToday: number;
  totalSessions: number;
  streakDays: number;
  
  // User state
  userName: string;
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
  
  // Device state
  isActive: boolean;
}

interface AmbientContextType extends AmbientState {
  // Mood actions
  setMood: (mood: MoodType) => Promise<void>;
  clearMood: () => void;
  
  // Session actions
  recordSession: (type: string, duration: number) => Promise<void>;
  
  // User actions
  setUserName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  
  // Computed
  needsGentleness: boolean;
  timeSinceLastSession: number | null;
  greeting: string;
}

const AmbientContext = createContext<AmbientContextType | null>(null);

const STORAGE_KEYS = {
  mood: '@restorae/ambient_mood',
  moodHistory: '@restorae/mood_history',
  sessions: '@restorae/session_stats',
  user: '@restorae/user_data',
};

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getGreeting(timeOfDay: TimeOfDay, userName: string): string {
  const name = userName ? `, ${userName}` : '';
  switch (timeOfDay) {
    case 'morning':
      return `Good morning${name}`;
    case 'afternoon':
      return `Good afternoon${name}`;
    case 'evening':
      return `Good evening${name}`;
    case 'night':
      return `Hello${name}`;
  }
}

export function AmbientProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AmbientState>({
    timeOfDay: getTimeOfDay(new Date().getHours()),
    currentHour: new Date().getHours(),
    currentMood: null,
    lastMoodTimestamp: null,
    moodHistory: [],
    lastSessionTimestamp: null,
    sessionsToday: 0,
    totalSessions: 0,
    streakDays: 0,
    userName: '',
    isFirstVisit: true,
    hasCompletedOnboarding: false,
    isActive: true,
  });

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      const hour = new Date().getHours();
      setState(prev => ({
        ...prev,
        currentHour: hour,
        timeOfDay: getTimeOfDay(hour),
      }));
    }, 60000);

    // Track app state
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(timeInterval);
      appStateSubscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    setState(prev => ({
      ...prev,
      isActive: nextAppState === 'active',
    }));
  };

  const loadPersistedState = async () => {
    try {
      const [moodData, sessionData, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.mood),
        AsyncStorage.getItem(STORAGE_KEYS.sessions),
        AsyncStorage.getItem(STORAGE_KEYS.user),
      ]);

      const mood = moodData ? JSON.parse(moodData) : null;
      const sessions = sessionData ? JSON.parse(sessionData) : null;
      const user = userData ? JSON.parse(userData) : null;

      setState(prev => ({
        ...prev,
        currentMood: mood?.mood || null,
        lastMoodTimestamp: mood?.timestamp || null,
        moodHistory: mood?.history || [],
        lastSessionTimestamp: sessions?.lastTimestamp || null,
        sessionsToday: sessions?.today || 0,
        totalSessions: sessions?.total || 0,
        streakDays: sessions?.streak || 0,
        userName: user?.name || '',
        isFirstVisit: user?.isFirstVisit ?? true,
        hasCompletedOnboarding: user?.hasCompletedOnboarding ?? false,
      }));
    } catch (error) {
      console.error('Failed to load ambient state:', error);
    }
  };

  const setMood = useCallback(async (mood: MoodType) => {
    const timestamp = Date.now();
    const newHistory = [
      { mood, timestamp },
      ...state.moodHistory.slice(0, 29), // Keep last 30 entries
    ];

    setState(prev => ({
      ...prev,
      currentMood: mood,
      lastMoodTimestamp: timestamp,
      moodHistory: newHistory,
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.mood, JSON.stringify({
      mood,
      timestamp,
      history: newHistory,
    }));
  }, [state.moodHistory]);

  const clearMood = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentMood: null,
    }));
  }, []);

  const recordSession = useCallback(async (type: string, duration: number) => {
    const timestamp = Date.now();
    const today = new Date().toDateString();
    const lastDate = state.lastSessionTimestamp
      ? new Date(state.lastSessionTimestamp).toDateString()
      : null;

    // Calculate if we need to reset today's count
    const sessionsToday = lastDate === today ? state.sessionsToday + 1 : 1;
    
    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastDate === yesterday.toDateString() || lastDate === today;
    const streakDays = isConsecutive ? state.streakDays + (lastDate === today ? 0 : 1) : 1;

    setState(prev => ({
      ...prev,
      lastSessionTimestamp: timestamp,
      sessionsToday,
      totalSessions: prev.totalSessions + 1,
      streakDays,
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify({
      lastTimestamp: timestamp,
      today: sessionsToday,
      total: state.totalSessions + 1,
      streak: streakDays,
    }));
  }, [state]);

  const setUserName = useCallback(async (name: string) => {
    setState(prev => ({
      ...prev,
      userName: name,
      isFirstVisit: false,
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify({
      name,
      isFirstVisit: false,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
    }));
  }, [state.hasCompletedOnboarding]);

  const completeOnboarding = useCallback(async () => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      isFirstVisit: false,
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify({
      name: state.userName,
      isFirstVisit: false,
      hasCompletedOnboarding: true,
    }));
  }, [state.userName]);

  // Computed values
  const needsGentleness = state.currentMood === 'anxious' || state.currentMood === 'low';
  
  const timeSinceLastSession = state.lastSessionTimestamp
    ? Date.now() - state.lastSessionTimestamp
    : null;

  const greeting = getGreeting(state.timeOfDay, state.userName);

  const contextValue: AmbientContextType = {
    ...state,
    setMood,
    clearMood,
    recordSession,
    setUserName,
    completeOnboarding,
    needsGentleness,
    timeSinceLastSession,
    greeting,
  };

  return (
    <AmbientContext.Provider value={contextValue}>
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbient() {
  const context = useContext(AmbientContext);
  if (!context) {
    throw new Error('useAmbient must be used within an AmbientProvider');
  }
  return context;
}
