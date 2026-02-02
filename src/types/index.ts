/**
 * Restorae Type Definitions - New System
 */

// Mood types
export type MoodType = 'energized' | 'calm' | 'anxious' | 'low' | 'good' | 'tough';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  timestamp: Date;
  note?: string;
}

// Tool types
export type ToolType = 'breathe' | 'ground' | 'reset' | 'focus' | 'journal' | 'sos';

// Breathing pattern
export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  duration: string;
  icon?: string;
  imageUrl?: string;
  videoUrl?: string;
  category?: 'calm' | 'focus' | 'energy' | 'sleep' | 'emergency' | 'balance';
  bestFor?: string;
}

// Grounding exercise
export interface GroundingExercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  imageUrl?: string;
  videoUrl?: string;
  steps: string[];
  category: 'sensory' | 'body' | 'mental';
}

// Focus session
export interface FocusSession {
  id: string;
  name: string;
  description: string;
  duration: number;
  soundscape?: string;
}

// Journal entry
export interface JournalEntry {
  id: string;
  prompt?: string;
  content: string;
  mood?: MoodType;
  timestamp: Date;
  encrypted: boolean;
}

// Journal prompt
export interface JournalPrompt {
  id: string;
  text: string;
  category: 'gratitude' | 'reflection' | 'release' | 'growth';
}

// SOS protocol
export interface SOSProtocol {
  id: string;
  name: string;
  description: string;
  steps: string[];
  duration: string;
  urgency: 'mild' | 'moderate' | 'high';
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    morning: boolean;
    evening: boolean;
    reminders: boolean;
  };
  haptics: boolean;
  soundEnabled: boolean;
}

// ============================================
// NAVIGATION TYPES - NEW SYSTEM
// ============================================

// Main 4-tab navigation
export type MainTabParamList = {
  SanctuaryTab: undefined;
  JourneyTab: undefined;
  LibraryTab: undefined;
  YouTab: undefined;
};

// Root stack navigation
export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
  
  // Sessions
  Session: {
    type: string;
    id: string;
    mood?: string;
  };
  UnifiedSession: undefined;
  SessionSummary: { summary: any };
  SessionComplete: {
    sessionType: string;
    sessionName?: string;
    duration?: number;
    cycles?: number;
    steps?: number;
    wordCount?: number;
    mood?: MoodType;
  };
  
  // Tools
  SOSSelect: undefined;
  SOSSession: { presetId?: string };
  BreathingSelect: undefined;
  Breathing: { patternId?: string };
  GroundingSelect: undefined;
  GroundingSession: { techniqueId?: string };
  StoryPlayer: { storyId: string };
  
  // Journal
  JournalEntry: { 
    mode?: 'view' | 'prompt' | 'new'; 
    prompt?: string;
    entryId?: string;
    entry?: { id?: string; title?: string; content: string; };
  };
  
  // Settings
  Appearance: undefined;
  Privacy: undefined;
  Support: undefined;
  Reminders: undefined;
  DataSettings: undefined;
  SecuritySettings: undefined;
  EditProfile: undefined;
};

// Theme
export type ThemeMode = 'light' | 'dark' | 'system';
