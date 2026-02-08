/**
 * Program Session Presets
 *
 * Converts ProgramDay activities into Ritual objects that SessionContext can play.
 * Follows the exact pattern of sessionPresets.ts ritualStepToActivity().
 */
import { Activity, Ritual } from '../types/session';
import { getProgramById, ProgramDay, ProgramDayActivity, WellnessProgram } from './programs';
import { getPatternById } from './breathingPatterns';
import { getTechniqueById } from './groundingTechniques';

// =============================================================================
// CONVERT PROGRAM ACTIVITIES TO SESSION ACTIVITIES
// =============================================================================

function programActivityToSessionActivity(activity: ProgramDayActivity): Activity {
  // Breathing activity — look up pattern for full config
  if (activity.type === 'breathing' && activity.referenceId) {
    const pattern = getPatternById(activity.referenceId);
    return {
      id: activity.id,
      type: 'breathing',
      name: activity.title,
      description: activity.description,
      duration: activity.duration,
      tone: 'calm',
      config: pattern
        ? {
            type: 'breathing',
            patternId: pattern.id,
            inhale: pattern.inhale,
            exhale: pattern.exhale,
            hold1: pattern.hold1 || 0,
            hold2: pattern.hold2 || 0,
            cycles: pattern.cycles,
          }
        : activity.breathingPattern
          ? {
              type: 'breathing',
              patternId: 'custom',
              inhale: activity.breathingPattern.inhale,
              exhale: activity.breathingPattern.exhale,
              hold1: activity.breathingPattern.hold1 || 0,
              hold2: activity.breathingPattern.hold2 || 0,
              cycles: activity.breathingPattern.cycles,
            }
          : {
              type: 'breathing',
              patternId: 'box-breathing',
              inhale: 4,
              exhale: 4,
              hold1: 4,
              hold2: 4,
              cycles: 4,
            },
    };
  }

  // Grounding activity — look up technique for steps
  if (activity.type === 'grounding' && activity.referenceId) {
    const technique = getTechniqueById(activity.referenceId);
    return {
      id: activity.id,
      type: 'grounding',
      name: activity.title,
      description: activity.description,
      duration: activity.duration,
      tone: 'calm',
      config: {
        type: 'grounding',
        techniqueId: activity.referenceId,
        steps: technique ? technique.steps.map((s: any) => s.instruction || s) : activity.steps || [activity.description],
      },
    };
  }

  // Journal or reflection activity
  return {
    id: activity.id,
    type: 'journal',
    name: activity.title,
    description: activity.description,
    duration: activity.duration,
    tone: 'warm',
    config: {
      type: 'journal',
      promptId: activity.referenceId,
      prompt: activity.prompt || activity.description,
      prompts: [{ id: activity.id, prompt: activity.prompt || activity.description }],
      reflectionDuration: activity.duration,
      showTextInput: activity.type === 'journal',
    },
  };
}

// =============================================================================
// CONVERT PROGRAM DAY TO RITUAL
// =============================================================================

/**
 * Convert a program day into a Ritual that SessionContext.startRitual() can play.
 */
export function convertProgramDayToRitual(
  program: WellnessProgram,
  day: ProgramDay,
): Ritual {
  const activities: Activity[] = day.activities.map(programActivityToSessionActivity);

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);

  return {
    id: `program-${program.id}-day-${day.day}`,
    name: `${program.name} — Day ${day.day}`,
    description: day.description,
    icon: program.icon,
    activities,
    estimatedDuration: totalDuration,
    category: 'custom',
  };
}

/**
 * Get a ready-to-play Ritual for a specific program and day number.
 */
export function getProgramDayRitual(
  programId: string,
  dayNumber: number,
): Ritual | undefined {
  const program = getProgramById(programId);
  if (!program) return undefined;

  const day = program.days.find((d) => d.day === dayNumber);
  if (!day) return undefined;

  return convertProgramDayToRitual(program, day);
}
