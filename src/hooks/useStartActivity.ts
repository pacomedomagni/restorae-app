/**
 * useStartActivity
 * 
 * Helper hook to easily start activities from selection screens.
 * Creates proper Activity objects from the existing data types.
 */
import { useCallback } from 'react';
import { useSession } from '../contexts/SessionContext';
import { Activity, ActivityType, Ritual, SOSPreset } from '../types/session';
import { BreathingPattern, GroundingExercise, FocusSession as FocusSessionType } from '../types';
import {
  getPatternById,
  getTechniqueById,
  getSessionById,
  getExerciseById,
} from '../data';
import {
  getRitualPresetById,
  getSOSPresetById,
  MORNING_RITUAL_PRESETS,
  EVENING_RITUAL_PRESETS,
  SOS_SESSION_PRESETS,
} from '../data/sessionPresets';

// =============================================================================
// ACTIVITY FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a breathing activity from a pattern ID or pattern object
 */
export function createBreathingActivity(
  patternIdOrPattern: string | BreathingPattern
): Activity {
  const pattern = typeof patternIdOrPattern === 'string'
    ? getPatternById(patternIdOrPattern)
    : patternIdOrPattern;

  if (!pattern) {
    throw new Error(`Breathing pattern not found: ${patternIdOrPattern}`);
  }

  // Calculate total duration: (inhale + hold1 + exhale + hold2) * cycles
  const cycleTime = pattern.inhale + (pattern.hold1 || 0) + pattern.exhale + (pattern.hold2 || 0);
  const totalDuration = cycleTime * pattern.cycles;

  return {
    id: `breathing-${pattern.id}-${Date.now()}`,
    type: 'breathing',
    name: pattern.name,
    description: pattern.description,
    duration: totalDuration,
    tone: 'calm',
    icon: pattern.icon || '🌬️',
    config: {
      type: 'breathing',
      patternId: pattern.id,
      cycles: pattern.cycles,
      inhale: pattern.inhale,
      exhale: pattern.exhale,
      hold1: pattern.hold1,
      hold2: pattern.hold2,
    },
  };
}

/**
 * Create a grounding activity from a technique ID
 */
export function createGroundingActivity(
  techniqueIdOrTechnique: string | GroundingExercise
): Activity {
  const technique = typeof techniqueIdOrTechnique === 'string'
    ? getTechniqueById(techniqueIdOrTechnique)
    : techniqueIdOrTechnique;

  if (!technique) {
    throw new Error(`Grounding technique not found: ${techniqueIdOrTechnique}`);
  }

  // Parse duration string (e.g., "5 min" -> 300 seconds)
  const durationMatch = technique.duration.match(/(\d+)/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 5;

  return {
    id: `grounding-${technique.id}-${Date.now()}`,
    type: 'grounding',
    name: technique.name,
    description: technique.description,
    duration: durationMinutes * 60,
    tone: 'calm',
    icon: '🌿',
    config: {
      type: 'grounding',
      techniqueId: technique.id,
      steps: technique.steps,
    },
  };
}

/**
 * Create a focus activity from a session ID
 */
export function createFocusActivity(
  sessionIdOrSession: string | FocusSessionType,
  durationOverride?: number
): Activity {
  const session = typeof sessionIdOrSession === 'string'
    ? getSessionById(sessionIdOrSession)
    : sessionIdOrSession;

  if (!session) {
    throw new Error(`Focus session not found: ${sessionIdOrSession}`);
  }

  const duration = durationOverride ?? session.duration;

  return {
    id: `focus-${session.id}-${Date.now()}`,
    type: 'focus',
    name: session.name,
    description: session.description,
    duration: duration * 60, // Convert minutes to seconds
    tone: 'primary',
    icon: '🎯',
    config: {
      type: 'focus',
      soundscapeId: 'soundscape' in session ? (session as any).soundscape : undefined,
      targetMinutes: duration,
    },
  };
}

/**
 * Create a reset/body activity from an exercise ID
 */
export function createResetActivity(exerciseId: string): Activity {
  const exercise = getExerciseById(exerciseId);

  if (!exercise) {
    throw new Error(`Reset exercise not found: ${exerciseId}`);
  }

  // Parse duration string
  const durationMatch = exercise.duration.match(/(\d+)/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 3;

  // Convert string steps to ResetStep format
  const stepDuration = (durationMinutes * 60) / exercise.steps.length;
  const steps = exercise.steps.map((instruction: string) => ({
    instruction,
    duration: stepDuration,
  }));

  return {
    id: `reset-${exercise.id}-${Date.now()}`,
    type: 'reset',
    name: exercise.name,
    description: exercise.description,
    duration: durationMinutes * 60,
    tone: 'warm',
    icon: '🧘',
    config: {
      type: 'reset',
      exerciseId: exercise.id,
      steps,
    },
  };
}

/**
 * Create a journal activity with optional prompts
 */
export function createJournalActivity(
  name: string = 'Journal Reflection',
  prompts?: Array<{ id: string; prompt: string }>,
  options?: {
    showTextInput?: boolean;
    reflectionDuration?: number;
  }
): Activity {
  const defaultPrompts = [
    { id: '1', prompt: 'What are you grateful for today?' },
    { id: '2', prompt: 'How are you feeling in this moment?' },
    { id: '3', prompt: 'What would make today meaningful?' },
  ];

  const actualPrompts = prompts || defaultPrompts;
  const reflectionDuration = options?.reflectionDuration || 60;
  const totalDuration = actualPrompts.length * reflectionDuration;

  return {
    id: `journal-${Date.now()}`,
    type: 'journal',
    name,
    description: 'Take a moment to reflect',
    duration: totalDuration,
    tone: 'warm',
    icon: '📝',
    config: {
      type: 'journal',
      prompts: actualPrompts,
      showTextInput: options?.showTextInput ?? false,
      reflectionDuration,
    },
  };
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to easily start sessions from selection screens
 */
export function useStartActivity() {
  const { startSingle, startRitual, startSOS } = useSession();

  /**
   * Start a breathing exercise
   */
  const startBreathing = useCallback((patternId: string) => {
    const activity = createBreathingActivity(patternId);
    startSingle(activity);
  }, [startSingle]);

  /**
   * Start a grounding exercise
   */
  const startGrounding = useCallback((techniqueId: string) => {
    const activity = createGroundingActivity(techniqueId);
    startSingle(activity);
  }, [startSingle]);

  /**
   * Start a focus session
   */
  const startFocus = useCallback((sessionId: string, duration?: number) => {
    const activity = createFocusActivity(sessionId, duration);
    startSingle(activity);
  }, [startSingle]);

  /**
   * Start a body reset exercise
   */
  const startReset = useCallback((exerciseId: string) => {
    const activity = createResetActivity(exerciseId);
    startSingle(activity);
  }, [startSingle]);

  /**
   * Start a journal session
   */
  const startJournal = useCallback((
    prompts?: Array<{ id: string; prompt: string }>,
    options?: { showTextInput?: boolean; reflectionDuration?: number }
  ) => {
    const activity = createJournalActivity('Journal Reflection', prompts, options);
    startSingle(activity);
  }, [startSingle]);

  /**
   * Start a custom ritual
   */
  const startCustomRitual = useCallback((ritual: Ritual) => {
    startRitual(ritual);
  }, [startRitual]);

  /**
   * Start an SOS session
   */
  const startSOSSession = useCallback((preset: SOSPreset) => {
    startSOS(preset);
  }, [startSOS]);

  /**
   * Start a ritual by ID (from presets)
   */
  const startRitualById = useCallback((ritualId: string) => {
    const preset = getRitualPresetById(ritualId);
    if (preset) {
      startRitual(preset);
    } else {
      console.warn(`Ritual preset not found: ${ritualId}`);
    }
  }, [startRitual]);

  /**
   * Start an SOS session by ID (from presets)
   */
  const startSOSById = useCallback((sosId: string) => {
    const preset = getSOSPresetById(sosId);
    if (preset) {
      startSOS(preset);
    } else {
      console.warn(`SOS preset not found: ${sosId}`);
    }
  }, [startSOS]);

  return {
    startBreathing,
    startGrounding,
    startFocus,
    startReset,
    startJournal,
    startCustomRitual,
    startSOSSession,
    // Convenience methods using preset IDs
    startRitualById,
    startSOSById,
    // Available presets for selection screens
    morningRituals: MORNING_RITUAL_PRESETS,
    eveningRituals: EVENING_RITUAL_PRESETS,
    sosPresets: SOS_SESSION_PRESETS,
    // Also expose raw activity creators for advanced usage
    createBreathingActivity,
    createGroundingActivity,
    createFocusActivity,
    createResetActivity,
    createJournalActivity,
  };
}

export default useStartActivity;
