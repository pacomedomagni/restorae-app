/**
 * Global Type Definitions for Restorae
 * Following RESTORAE_SPEC.md conventions
 */

// =============================================================================
// MOOD TYPES
// =============================================================================
export type MoodType = 
  | 'energized'
  | 'calm'
  | 'good'
  | 'anxious'
  | 'low'
  | 'tough';

export interface MoodEntry {
  id: string;
  type: MoodType;
  timestamp: Date;
  note?: string;
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================
export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
  Home: undefined;
  Tools: undefined;
  Journal: undefined;
  Profile: undefined;
  Breathing: { patternId: string };
  Meditation: { sessionId: string };
  MoodLog: { initialMood?: MoodType };
  Ritual: { type: 'morning' | 'evening' };
  QuickReset: undefined;
  MoodCheckin: undefined;
  MoodSelect: { group: 'positive' | 'challenging' };
  MoodResult: { mood: MoodType };
  ToolsMore: undefined;
  JournalPrompts: undefined;
  JournalEntries: undefined;
  JournalEntry: { mode: 'new' | 'prompt' | 'view'; prompt?: string; entry?: { title?: string; content: string } };
  Appearance: undefined;
  Preferences: undefined;
  SoundHaptics: undefined;
  Reminders: undefined;
  Privacy: undefined;
  Support: undefined;
  Grounding: undefined;
  Reset: undefined;
  Focus: undefined;
  Sos: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ToolsTab: undefined;
  JournalTab: undefined;
  ProfileTab: undefined;
};

// =============================================================================
// BREATHING TYPES
// =============================================================================
export type BreathingPattern = {
  id: string;
  name: string;
  description: string;
  inhale: number;   // seconds
  hold1?: number;   // seconds (after inhale)
  exhale: number;   // seconds
  hold2?: number;   // seconds (after exhale)
  cycles: number;
  duration: number; // total minutes
};

// =============================================================================
// JOURNAL TYPES
// =============================================================================
export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood?: MoodType;
  createdAt: Date;
  updatedAt: Date;
  isDraft: boolean;
}

export type JournalPrompt = {
  id: string;
  text: string;
  category: 'gratitude' | 'reflection' | 'growth' | 'release';
};

// =============================================================================
// RITUAL TYPES
// =============================================================================
export type RitualType = 'morning' | 'evening' | 'custom';

export interface Ritual {
  id: string;
  name: string;
  type: RitualType;
  steps: RitualStep[];
  duration: number; // minutes
}

export interface RitualStep {
  id: string;
  type: 'breathing' | 'meditation' | 'prompt' | 'movement';
  duration: number; // seconds
  config?: Record<string, unknown>;
}

// =============================================================================
// USER PREFERENCES
// =============================================================================
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  haptics: boolean;
  notifications: boolean;
  morningRitualTime?: string; // HH:mm
  eveningRitualTime?: string; // HH:mm
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================
export interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: {
    timestamp: number;
    cached?: boolean;
  };
}

// =============================================================================
// THEME TYPES (re-exported for convenience)
// =============================================================================
export type ThemeMode = 'light' | 'dark' | 'system';
