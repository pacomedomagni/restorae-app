/**
 * Session Presets
 * 
 * Converts existing ritual and SOS data into the unified session format.
 * Provides ready-to-use Ritual and SOSPreset objects for the SessionContext.
 */
import { Activity, Ritual, SOSPreset as SessionSOSPreset } from '../types/session';
import type { MoodType } from '../types';
import { MORNING_RITUALS, EVENING_RITUALS, MorningRitual, EveningRitual } from './rituals';
import { SOS_PRESETS, SOSPreset as DataSOSPreset } from './sosPresets';
import {
  createBreathingActivity,
  createGroundingActivity,
  createJournalActivity,
  createResetActivity,
} from '../hooks/useStartActivity';

// =============================================================================
// CONVERT RITUAL STEPS TO ACTIVITIES
// =============================================================================

/**
 * Convert a ritual step type to a proper activity
 */
function ritualStepToActivity(
  step: { id: string; type: string; title: string; instruction: string; duration: number; breathingPattern?: { inhale: number; hold: number; exhale: number; cycles?: number } },
  index: number
): Activity {
  // If it's a breathing step with a pattern, create a breathing activity
  if (step.type === 'breathing' && step.breathingPattern) {
    return {
      id: `ritual-${step.id}`,
      type: 'breathing',
      name: step.title,
      description: step.instruction,
      duration: step.duration,
      tone: 'calm',
      icon: '🌬️',
      config: {
        type: 'breathing',
        patternId: 'custom',
        inhale: step.breathingPattern.inhale,
        exhale: step.breathingPattern.exhale,
        hold1: step.breathingPattern.hold || 0,
        hold2: 0,
        cycles: step.breathingPattern.cycles || 4,
      },
    };
  }

  // For reflection/gratitude/intention types, use journal prompts
  if (['reflection', 'gratitude', 'intention', 'release', 'affirmation'].includes(step.type)) {
    return {
      id: `ritual-${step.id}`,
      type: 'journal',
      name: step.title,
      description: step.instruction,
      duration: step.duration,
      tone: 'warm',
      icon: step.type === 'gratitude' ? '🙏' : step.type === 'affirmation' ? '✨' : '📝',
      config: {
        type: 'journal',
        prompts: [{ id: step.id, prompt: step.instruction }],
        reflectionDuration: step.duration,
        showTextInput: false, // Quick reflection, no typing needed
      },
    };
  }

  // Default to journal type for any other step type
  return {
    id: `ritual-${step.id}`,
    type: 'journal',
    name: step.title,
    description: step.instruction,
    duration: step.duration,
    tone: 'neutral',
    icon: '📝',
    config: {
      type: 'journal',
      prompts: [{ id: step.id, prompt: step.instruction }],
      reflectionDuration: step.duration,
    },
  };
}

/**
 * Convert a MorningRitual or EveningRitual to the unified Ritual format
 */
function convertRitualToSession(
  ritual: MorningRitual | EveningRitual,
  timeOfDay: 'morning' | 'evening'
): Ritual {
  const activities: Activity[] = ritual.steps.map((step, index) => 
    ritualStepToActivity(step, index)
  );

  // Parse duration string (e.g., "5 min" -> 300)
  const durationMatch = ritual.totalDuration.match(/(\d+)/);
  const totalDuration = durationMatch ? parseInt(durationMatch[1]) * 60 : 300;

  return {
    id: ritual.id,
    name: ritual.name,
    description: ritual.description,
    icon: timeOfDay === 'morning' ? '🌅' : '🌙',
    activities,
    estimatedDuration: totalDuration,
    category: timeOfDay,
  };
}

// =============================================================================
// CONVERT SOS PRESETS TO SESSION FORMAT
// =============================================================================

/**
 * Convert SOS phase to an activity
 */
function sosPhaseToActivity(
  phase: { id: string; type: string; title: string; instruction: string; duration: number; breathingPattern?: { inhale: number; hold: number; exhale: number; cycles?: number } },
  index: number
): Activity {
  // If it has a breathing pattern, treat as breathing activity
  if (phase.breathingPattern) {
    return {
      id: `sos-${phase.id}`,
      type: 'breathing',
      name: phase.title,
      description: phase.instruction,
      duration: phase.duration,
      tone: 'calm',
      icon: '🌬️',
      config: {
        type: 'breathing',
        patternId: 'sos-custom',
        inhale: phase.breathingPattern.inhale,
        exhale: phase.breathingPattern.exhale,
        hold1: phase.breathingPattern.hold || 0,
        hold2: 0,
        cycles: Math.max(2, Math.floor(phase.duration / (phase.breathingPattern.inhale + phase.breathingPattern.exhale + (phase.breathingPattern.hold || 0)))),
      },
    };
  }

  // Ground phases can use grounding technique
  if (phase.type === 'ground') {
    return {
      id: `sos-${phase.id}`,
      type: 'grounding',
      name: phase.title,
      description: phase.instruction,
      duration: phase.duration,
      tone: 'calm',
      icon: '🌿',
      config: {
        type: 'grounding',
        steps: [phase.instruction],
      },
    };
  }

  // Other phases are journal/reflection style
  return {
    id: `sos-${phase.id}`,
    type: 'journal',
    name: phase.title,
    description: phase.instruction,
    duration: phase.duration,
    tone: 'warm',
    icon: phase.type === 'reassure' ? '💙' : phase.type === 'next-step' ? '👣' : '✨',
    config: {
      type: 'journal',
      prompts: [{ id: phase.id, prompt: phase.instruction }],
      reflectionDuration: phase.duration,
      showTextInput: false,
    },
  };
}

/**
 * Convert a data SOS preset to the session format
 */
function convertSOSToSession(preset: DataSOSPreset): SessionSOSPreset {
  const activities: Activity[] = preset.phases.map((phase, index) =>
    sosPhaseToActivity(phase, index)
  );

  // Parse duration string
  const durationMatch = preset.totalDuration.match(/(\d+)/);
  const totalDuration = durationMatch ? parseInt(durationMatch[1]) * 60 : 180;

  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    icon: preset.icon,
    activities,
    intensity: 'moderate', // Default intensity
    estimatedDuration: totalDuration,
    urgency: 'high', // All SOS presets are high urgency
  };
}

// =============================================================================
// EXPORTED PRESETS
// =============================================================================

/**
 * All morning rituals converted to session format
 */
export const MORNING_RITUAL_PRESETS: Ritual[] = MORNING_RITUALS.map(r => 
  convertRitualToSession(r, 'morning')
);

/**
 * All evening rituals converted to session format
 */
export const EVENING_RITUAL_PRESETS: Ritual[] = EVENING_RITUALS.map(r => 
  convertRitualToSession(r, 'evening')
);

/**
 * All rituals (morning + evening) combined
 */
export const ALL_RITUAL_PRESETS: Ritual[] = [
  ...MORNING_RITUAL_PRESETS,
  ...EVENING_RITUAL_PRESETS,
];

/**
 * All SOS presets converted to session format
 */
export const SOS_SESSION_PRESETS: SessionSOSPreset[] = SOS_PRESETS.map(convertSOSToSession);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a ritual preset by ID
 */
export function getRitualPresetById(id: string): Ritual | undefined {
  return ALL_RITUAL_PRESETS.find(r => r.id === id);
}

/**
 * Get morning rituals for a specific mood
 */
export function getMorningRitualsForMood(mood: string): Ritual[] {
  const matching = MORNING_RITUALS.filter(r => r.forMoods.includes(mood as MoodType));
  return matching.map(r => convertRitualToSession(r, 'morning'));
}

/**
 * Get evening rituals for a specific mood
 */
export function getEveningRitualsForMood(mood: string): Ritual[] {
  const matching = EVENING_RITUALS.filter(r => r.forMoods.includes(mood as MoodType));
  return matching.map(r => convertRitualToSession(r, 'evening'));
}

/**
 * Get an SOS preset by ID
 */
export function getSOSPresetById(id: string): SessionSOSPreset | undefined {
  return SOS_SESSION_PRESETS.find(p => p.id === id);
}

/**
 * Get a recommended morning ritual based on current mood
 */
export function getRecommendedMorningRitual(mood: string): Ritual {
  const forMood = getMorningRitualsForMood(mood);
  if (forMood.length > 0) {
    return forMood[0];
  }
  // Default to calm morning if no mood match
  return MORNING_RITUAL_PRESETS.find(r => r.id === 'calm-morning') || MORNING_RITUAL_PRESETS[0];
}

/**
 * Get a recommended evening ritual based on current mood
 */
export function getRecommendedEveningRitual(mood: string): Ritual {
  const forMood = getEveningRitualsForMood(mood);
  if (forMood.length > 0) {
    return forMood[0];
  }
  // Default to peaceful evening if no mood match
  return EVENING_RITUAL_PRESETS.find(r => r.id === 'peaceful-evening') || EVENING_RITUAL_PRESETS[0];
}

// =============================================================================
// QUICK ACCESS PRESETS
// =============================================================================

/**
 * Quick SOS presets for the most common situations
 */
export const QUICK_SOS_PRESETS = {
  panic: getSOSPresetById('panic-attack'),
  overwhelm: getSOSPresetById('overwhelm'),
  anxiety: getSOSPresetById('anxiety-spiral'),
  sadness: getSOSPresetById('sadness-wave'),
};

/**
 * Default rituals for quick access
 */
export const DEFAULT_RITUALS = {
  morning: getRitualPresetById('calm-morning'),
  evening: getRitualPresetById('peaceful-evening'),
  energized: getRitualPresetById('energized-morning'),
  focused: getRitualPresetById('focused-morning'),
};
