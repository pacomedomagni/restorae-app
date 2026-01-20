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
}

// Grounding exercise
export interface GroundingExercise {
  id: string;
  name: string;
  description: string;
  duration: string;
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
  Breathing: { patternId: string };
  Grounding: { exerciseId: string };
  Movement: { exerciseId: string };
  Focus: { sessionId: string };
  Journal: { promptId?: string; entryId?: string };
  SOS: { protocolId?: string };
  Settings: undefined;
  Subscription: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tools: undefined;
  JournalTab: undefined;
  Profile: undefined;
};
