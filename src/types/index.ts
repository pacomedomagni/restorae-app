/**
 * Restorae Type Definitions
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
  videoUrl?: string; // Background video loop
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

// Movement/Reset exercise
export interface MovementExercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  steps: string[];
  category: 'stretch' | 'shake' | 'flow';
}

// Focus session
export interface FocusSession {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
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

// Routine
export interface Routine {
  id: string;
  name: string;
  time: 'morning' | 'evening' | 'midday';
  steps: RoutineStep[];
}

export interface RoutineStep {
  id: string;
  type: ToolType;
  toolId: string;
  order: number;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Tool: { type: ToolType; id?: string };
  Breathing: { patternId?: string };
  BreathingSelect: undefined;
  Grounding: { techniqueId?: string };
  GroundingSelect: undefined;
  GroundingSession: { techniqueId?: string };
  Movement: { exerciseId: string };
  Reset: { exerciseId?: string };
  ResetSelect: undefined;
  ResetSession: { exerciseId?: string };
  Focus: { sessionId?: string };
  FocusSelect: undefined;
  FocusSession: { sessionId?: string; soundId?: string };
  Journal: { promptId?: string; entryId?: string };
  JournalEntry: { 
    mode: 'view' | 'prompt' | 'new'; 
    prompt?: string;
    entryId?: string;
    entry?: { id?: string; title?: string; content: string; };
  };
  JournalEntries: undefined;
  JournalPrompts: undefined;
  JournalSearch: undefined;
  Sos: { presetId?: string };
  SOSSelect: undefined;
  SOSSession: { presetId?: string };
  SituationalSelect: undefined;
  SituationalSession: { guideId?: string };
  // Stories & Sleep
  Stories: undefined;
  StoryPlayer: { storyId: string };
  // Settings
  Settings: undefined;
  Subscription: undefined;
  Paywall: { feature?: string; featureName?: string };
  Preferences: undefined;
  Appearance: undefined;
  SoundHaptics: undefined;
  Reminders: undefined;
  Privacy: undefined;
  Support: undefined;
  EditProfile: undefined;
  MoodCheckin: { mood?: MoodType; moodId?: string; moodLabel?: string };
  MoodAcknowledgment: { mood?: MoodType };
  MoodSelect: undefined;
  MoodResult: { 
    mood?: MoodType; 
    moodId?: string;
    moodLabel?: string;
    factors?: string[];
    notes?: string;
    note?: string; 
  };
  MoodHistory: undefined;
  Progress: undefined;
  ToolsMore: undefined;
  QuickReset: undefined;
  // Unified completion screen
  SessionComplete: {
    sessionType: 'breathing' | 'grounding' | 'reset' | 'focus' | 'journal' | 'story' | 'ritual' | 'mood';
    sessionName?: string;
    duration?: number; // in seconds
    cycles?: number;
    steps?: number;
    wordCount?: number;
    mood?: MoodType;
  };
  Ritual: { type?: 'morning' | 'evening'; ritualId?: string };
  RitualSession: { type: 'morning' | 'evening'; ritualId: string };
  MorningRitual: undefined;
  EveningRitual: undefined;
  CreateRitual: undefined;
  CustomRitualSession: { ritualId: string };
  AppLock: undefined;
  AppLockSetup: undefined;
  DataSettings: undefined;
  SecuritySettings: undefined;
  // Unified Session System
  UnifiedSession: undefined;
  SessionSummary: { summary: import('./session').SessionSummary };
};

export type MainTabParamList = {
  HomeTab: undefined;
  ToolsTab: undefined;
  JournalTab: undefined;
  ProfileTab: undefined;
};

// Theme
export type ThemeMode = 'light' | 'dark' | 'system';
