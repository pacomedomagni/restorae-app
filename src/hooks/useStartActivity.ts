/**
 * useStartActivity - Bridge between data layer IDs and SessionContext
 *
 * Converts simple pattern/technique IDs into full Activity objects
 * and calls the appropriate SessionContext start method.
 */
import { useCallback, useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';
import { Activity, BreathingConfig, GroundingConfig, JournalConfig, ResetConfig } from '../types/session';
import { getPatternById } from '../data';
import { getTechniqueById } from '../data';
import { SOS_SESSION_PRESETS } from '../data/sessionPresets';

// =============================================================================
// FACTORY FUNCTIONS (pure, no hooks — can be imported by data files)
// =============================================================================

/**
 * Create a breathing Activity from a pattern ID
 */
export function createBreathingActivity(patternId: string): Activity {
  const pattern = getPatternById(patternId);
  if (!pattern) {
    throw new Error(`Breathing pattern not found: ${patternId}`);
  }

  const cycleDuration = (pattern.inhale + (pattern.hold1 || 0) + pattern.exhale + (pattern.hold2 || 0));
  const totalDuration = cycleDuration * pattern.cycles;

  return {
    id: `breathing-${pattern.id}`,
    type: 'breathing',
    name: pattern.name,
    description: pattern.description,
    duration: totalDuration,
    tone: pattern.category === 'calm' || pattern.category === 'sleep' ? 'calm' : 'primary',
    icon: '🌬️',
    config: {
      type: 'breathing',
      patternId: pattern.id,
      inhale: pattern.inhale,
      hold1: pattern.hold1 || 0,
      exhale: pattern.exhale,
      hold2: pattern.hold2 || 0,
      cycles: pattern.cycles,
    } as BreathingConfig,
  };
}

/**
 * Create a grounding Activity from a technique ID
 */
export function createGroundingActivity(techniqueId: string): Activity {
  const technique = getTechniqueById(techniqueId);
  if (!technique) {
    throw new Error(`Grounding technique not found: ${techniqueId}`);
  }

  // Parse duration string like "3 min" to seconds
  const match = technique.duration.match(/(\d+)/);
  const durationSeconds = match ? parseInt(match[1], 10) * 60 : 180;

  return {
    id: `grounding-${technique.id}`,
    type: 'grounding',
    name: technique.name,
    description: technique.description,
    duration: durationSeconds,
    tone: 'calm',
    icon: '🌍',
    config: {
      type: 'grounding',
      techniqueId: technique.id,
      steps: technique.steps,
    } as GroundingConfig,
  };
}

/**
 * Create a journal Activity from a prompt
 */
export function createJournalActivity(prompt: string, promptId?: string): Activity {
  return {
    id: `journal-${promptId || 'freeform'}`,
    type: 'journal',
    name: 'Journal',
    description: prompt,
    duration: 300, // 5 minutes default
    tone: 'warm',
    icon: '📝',
    config: {
      type: 'journal',
      promptId,
      prompt,
      showTextInput: true,
    } as JournalConfig,
  };
}

/**
 * Create a reset Activity
 */
export function createResetActivity(name: string, steps: Array<{ instruction: string; duration: number }>): Activity {
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  return {
    id: `reset-${name.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'reset',
    name,
    duration: totalDuration,
    tone: 'neutral',
    icon: '🔄',
    config: {
      type: 'reset',
      exerciseId: name.toLowerCase().replace(/\s+/g, '-'),
      steps,
    } as ResetConfig,
  };
}

// =============================================================================
// HOOK
// =============================================================================

export function useStartActivity() {
  const session = useSession();

  const startBreathing = useCallback(
    (patternId: string) => {
      const activity = createBreathingActivity(patternId);
      session.startSingle(activity);
    },
    [session],
  );

  const startGrounding = useCallback(
    (techniqueId: string) => {
      const activity = createGroundingActivity(techniqueId);
      session.startSingle(activity);
    },
    [session],
  );

  const startSOSSession = useCallback(
    (preset: (typeof SOS_SESSION_PRESETS)[number]) => {
      session.startSOS(preset);
    },
    [session],
  );

  const sosPresets = useMemo(() => SOS_SESSION_PRESETS, []);

  return {
    startBreathing,
    startGrounding,
    startSOSSession,
    sosPresets,
  };
}

export default useStartActivity;
