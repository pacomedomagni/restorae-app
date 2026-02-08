/**
 * Session Types
 * 
 * Core type definitions for the unified session system.
 * This file defines the data structures for activities, rituals, and session management.
 */

// =============================================================================
// ACTIVITY TYPES
// =============================================================================

export type ActivityType = 
  | 'breathing'
  | 'grounding'
  | 'reset'
  | 'focus'
  | 'journal';

export type ActivityTone = 'primary' | 'warm' | 'calm' | 'neutral';

/**
 * Base activity definition - a template for an exercise
 */
export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  description?: string;
  duration: number; // estimated duration in seconds
  tone: ActivityTone;
  icon?: string;
  config?: ActivityConfig;
}

/**
 * Type-specific configuration for activities
 */
export type ActivityConfig = 
  | BreathingConfig
  | GroundingConfig
  | FocusConfig
  | JournalConfig
  | ResetConfig;

export interface BreathingConfig {
  type: 'breathing';
  patternId: string;
  inhale: number;
  hold1?: number;
  exhale: number;
  hold2?: number;
  cycles: number;
}

export interface GroundingConfig {
  type: 'grounding';
  techniqueId?: string;
  steps: string[];
}

export interface FocusConfig {
  type: 'focus';
  soundscapeId?: string;
  targetMinutes: number;
}

export interface JournalConfig {
  type: 'journal';
  promptId?: string;
  prompt?: string;
  prompts?: Array<{ id: string; prompt: string }>;
  reflectionDuration?: number;
  showTextInput?: boolean;
}

export interface ResetConfig {
  type: 'reset';
  exerciseId: string;
  steps: ResetStep[];
}

export interface ResetStep {
  instruction: string;
  duration: number;
}

// =============================================================================
// SESSION TYPES
// =============================================================================

export type SessionMode = 'idle' | 'single' | 'ritual' | 'sos' | 'program';

export type SessionStatus = 
  | 'not-started'
  | 'in-progress'
  | 'transitioning'
  | 'paused'
  | 'completed'
  | 'exited';

/**
 * Tracks the state of a single activity within a session
 */
export interface ActivityState {
  activity: Activity;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  actualDuration?: number; // actual time spent in seconds
}

/**
 * The main session state managed by SessionContext
 */
export interface SessionState {
  // Mode & Status
  mode: SessionMode;
  status: SessionStatus;
  
  // Backend Sync
  backendSessionId?: string; // ID from the backend UserSession
  
  // Queue Management
  queue: ActivityState[];
  currentIndex: number;
  
  // Ritual Context (if mode === 'ritual')
  ritualId?: string;
  ritualName?: string;
  
  // SOS Context (if mode === 'sos')
  sosPresetId?: string;
  sosPresetName?: string;

  // Program Context (if mode === 'program')
  programId?: string;
  programDay?: number;
  
  // Timing
  sessionStartTime?: number;
  sessionEndTime?: number;
  
  // Transition State
  isTransitioning: boolean;
  transitionTo?: Activity; // next activity being transitioned to
  
  // UI State
  showProgressDrawer: boolean;
  showAmbientMode: boolean;
  showExitConfirmation: boolean;
}

/**
 * Initial/idle session state
 */
export const INITIAL_SESSION_STATE: SessionState = {
  mode: 'idle',
  status: 'not-started',
  queue: [],
  currentIndex: -1,
  isTransitioning: false,
  showProgressDrawer: false,
  showAmbientMode: false,
  showExitConfirmation: false,
};

// =============================================================================
// RITUAL TYPES
// =============================================================================

export type RitualScheduleType = 'morning' | 'evening' | 'custom';

export interface RitualSchedule {
  type: RitualScheduleType;
  time?: string; // HH:MM format
  days?: DayOfWeek[];
  enabled: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * A ritual is a named sequence of activities
 */
export interface Ritual {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  activities: Activity[];
  schedule?: RitualSchedule;
  isDefault?: boolean; // system-provided vs user-created
  createdAt?: number;
  updatedAt?: number;
  estimatedDuration?: number; // total duration in seconds
  category?: 'morning' | 'evening' | 'custom';
}

/**
 * Tracks completion of a ritual
 */
export interface RitualCompletion {
  ritualId: string;
  completedAt: number;
  activitiesCompleted: string[]; // activity IDs that were completed
  activitiesSkipped: string[]; // activity IDs that were skipped
  totalDuration: number; // in seconds
  wasPartial: boolean; // true if user exited early but marked complete
}

// =============================================================================
// SOS PRESETS
// =============================================================================

export interface SOSPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  activities: Activity[];
  intensity: 'gentle' | 'moderate' | 'intensive';
  estimatedDuration?: number; // total duration in seconds
  urgency?: 'low' | 'medium' | 'high';
}

// =============================================================================
// SESSION COMPLETION & SUMMARY
// =============================================================================

export interface SessionSummary {
  mode: SessionMode;
  ritualId?: string;
  ritualName?: string;
  sosPresetId?: string;
  sosPresetName?: string;
  
  // Activities
  activitiesCompleted: ActivityState[];
  activitiesSkipped: ActivityState[];
  
  // Stats
  totalDuration: number; // in seconds
  activitiesCount: number;
  completedCount: number;
  skippedCount: number;
  
  // Rewards
  xpEarned: number;
  
  // Timestamps
  startTime: number;
  endTime: number;
  
  // Flags
  wasPartial: boolean;
  wasInterrupted: boolean;
}

// =============================================================================
// SESSION PERSISTENCE (for interruption recovery)
// =============================================================================

export interface PersistedSession {
  state: SessionState;
  persistedAt: number;
  appVersion: string;
}

// =============================================================================
// CONTEXT ACTIONS
// =============================================================================

export interface SessionContextActions {
  // Starting Sessions
  startSingle: (activity: Activity) => void;
  startRitual: (ritual: Ritual) => void;
  startSOS: (preset: SOSPreset) => void;
  startProgramDay: (ritual: Ritual, programId: string, programDay: number) => void;
  
  // Activity Lifecycle
  completeCurrentActivity: () => void;
  skipCurrentActivity: () => void;
  
  // Session Control
  pauseSession: () => void;
  resumeSession: () => void;
  exitSession: (saveProgress?: boolean) => void;
  markRitualComplete: () => void;
  
  // Queue Modifications (mid-session)
  skipActivity: (index: number) => void;
  addActivity: (activity: Activity, atIndex?: number) => void;
  
  // UI Control
  toggleProgressDrawer: () => void;
  toggleAmbientMode: () => void;
  setShowExitConfirmation: (show: boolean) => void;
  
  // Transition Control
  startTransition: () => void;
  completeTransition: () => void;
  
  // Recovery
  recoverSession: (persisted: PersistedSession) => void;
  clearPersistedSession: () => void;
}

export interface SessionContextType extends SessionState, SessionContextActions {
  // Computed Properties
  currentActivity: Activity | null;
  currentActivityState: ActivityState | null;
  progress: number; // 0-1 overall progress
  remainingActivities: number;
  completedActivities: number;
  isLastActivity: boolean;
  canSkip: boolean;
  estimatedTimeRemaining: number; // in seconds
  isActive: boolean; // whether a session is in progress
}
