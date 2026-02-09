/**
 * useStartActivity - Factory Function Tests
 *
 * Tests the 4 pure factory functions exported from useStartActivity.ts:
 * createBreathingActivity, createGroundingActivity, createJournalActivity, createResetActivity
 */

// Mock dependencies before imports
jest.mock('../../data', () => ({
  getPatternById: jest.fn(),
  getTechniqueById: jest.fn(),
}));

jest.mock('../../contexts/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../../data/sessionPresets', () => ({
  SOS_SESSION_PRESETS: [],
}));

import {
  createBreathingActivity,
  createGroundingActivity,
  createJournalActivity,
  createResetActivity,
} from '../../hooks/useStartActivity';
import { getPatternById, getTechniqueById } from '../../data';

const mockGetPatternById = getPatternById as jest.MockedFunction<typeof getPatternById>;
const mockGetTechniqueById = getTechniqueById as jest.MockedFunction<typeof getTechniqueById>;

// =============================================================================
// FIXTURES
// =============================================================================

const mockBoxBreathing = {
  id: 'box-breathing',
  name: 'Box Breathing',
  description: 'Equal counts in, hold, out, hold.',
  category: 'calm' as const,
  inhale: 4,
  hold1: 4,
  exhale: 4,
  hold2: 4,
  cycles: 6,
  duration: '96 sec',
};

const mockEnergyPattern = {
  id: 'energy-breath',
  name: 'Energy Breath',
  description: 'Quick energizing pattern.',
  category: 'energy' as const,
  inhale: 3,
  hold1: 0,
  exhale: 3,
  hold2: 0,
  cycles: 10,
  duration: '60 sec',
};

const mockSleepPattern = {
  id: 'sleep-breath',
  name: '4-7-8 Sleep',
  description: 'Slow breathing for sleep.',
  category: 'sleep' as const,
  inhale: 4,
  hold1: 7,
  exhale: 8,
  hold2: 0,
  cycles: 4,
  duration: '76 sec',
};

const mockGroundingTechnique = {
  id: '5-4-3-2-1',
  name: '5-4-3-2-1 Senses',
  description: 'Use your senses.',
  duration: '3 min',
  bestFor: 'Spiraling, dissociation',
  category: 'sensory' as const,
  steps: [
    'Name 5 things you can SEE',
    'Name 4 things you can TOUCH',
    'Name 3 things you can HEAR',
    'Name 2 things you can SMELL',
    'Name 1 thing you can TASTE',
  ],
};

const mockFiveMinTechnique = {
  id: 'body-scan',
  name: 'Body Scan',
  description: 'Progressive body awareness.',
  duration: '5 min',
  bestFor: 'Tension awareness',
  category: 'body' as const,
  steps: ['Focus on your feet', 'Scan upward through your body'],
};

// =============================================================================
// TESTS
// =============================================================================

describe('useStartActivity factory functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createBreathingActivity
  // ---------------------------------------------------------------------------
  describe('createBreathingActivity', () => {
    it('returns a correctly structured Activity with breathing config', () => {
      mockGetPatternById.mockReturnValue(mockBoxBreathing as any);

      const activity = createBreathingActivity('box-breathing');

      expect(activity.id).toBe('breathing-box-breathing');
      expect(activity.type).toBe('breathing');
      expect(activity.name).toBe('Box Breathing');
      expect(activity.description).toBe('Equal counts in, hold, out, hold.');
      expect(activity.tone).toBe('calm');
      expect(activity.icon).toBe('\uD83C\uDF2C\uFE0F');
      expect(activity.config).toEqual({
        type: 'breathing',
        patternId: 'box-breathing',
        inhale: 4,
        hold1: 4,
        exhale: 4,
        hold2: 4,
        cycles: 6,
      });
    });

    it('throws when pattern is not found', () => {
      mockGetPatternById.mockReturnValue(undefined as any);

      expect(() => createBreathingActivity('nonexistent')).toThrow(
        'Breathing pattern not found: nonexistent',
      );
    });

    it('calculates duration correctly as cycleDuration * cycles', () => {
      mockGetPatternById.mockReturnValue(mockBoxBreathing as any);

      const activity = createBreathingActivity('box-breathing');

      // cycleDuration = inhale(4) + hold1(4) + exhale(4) + hold2(4) = 16
      // totalDuration = 16 * 6 = 96
      expect(activity.duration).toBe(96);
    });

    it('treats missing hold values as 0 in duration calculation', () => {
      mockGetPatternById.mockReturnValue(mockEnergyPattern as any);

      const activity = createBreathingActivity('energy-breath');

      // cycleDuration = inhale(3) + hold1(0) + exhale(3) + hold2(0) = 6
      // totalDuration = 6 * 10 = 60
      expect(activity.duration).toBe(60);
      expect(activity.config).toMatchObject({
        hold1: 0,
        hold2: 0,
      });
    });

    it('sets tone to "calm" for calm category patterns', () => {
      mockGetPatternById.mockReturnValue(mockBoxBreathing as any);

      const activity = createBreathingActivity('box-breathing');

      expect(activity.tone).toBe('calm');
    });

    it('sets tone to "calm" for sleep category patterns', () => {
      mockGetPatternById.mockReturnValue(mockSleepPattern as any);

      const activity = createBreathingActivity('sleep-breath');

      expect(activity.tone).toBe('calm');
    });

    it('sets tone to "primary" for non-calm, non-sleep categories', () => {
      mockGetPatternById.mockReturnValue(mockEnergyPattern as any);

      const activity = createBreathingActivity('energy-breath');

      expect(activity.tone).toBe('primary');
    });

    it('calls getPatternById with the provided ID', () => {
      mockGetPatternById.mockReturnValue(mockBoxBreathing as any);

      createBreathingActivity('box-breathing');

      expect(mockGetPatternById).toHaveBeenCalledTimes(1);
      expect(mockGetPatternById).toHaveBeenCalledWith('box-breathing');
    });
  });

  // ---------------------------------------------------------------------------
  // createGroundingActivity
  // ---------------------------------------------------------------------------
  describe('createGroundingActivity', () => {
    it('returns a correctly structured Activity with grounding config', () => {
      mockGetTechniqueById.mockReturnValue(mockGroundingTechnique as any);

      const activity = createGroundingActivity('5-4-3-2-1');

      expect(activity.id).toBe('grounding-5-4-3-2-1');
      expect(activity.type).toBe('grounding');
      expect(activity.name).toBe('5-4-3-2-1 Senses');
      expect(activity.description).toBe('Use your senses.');
      expect(activity.tone).toBe('calm');
      expect(activity.config).toEqual({
        type: 'grounding',
        techniqueId: '5-4-3-2-1',
        steps: [
          'Name 5 things you can SEE',
          'Name 4 things you can TOUCH',
          'Name 3 things you can HEAR',
          'Name 2 things you can SMELL',
          'Name 1 thing you can TASTE',
        ],
      });
    });

    it('throws when technique is not found', () => {
      mockGetTechniqueById.mockReturnValue(undefined as any);

      expect(() => createGroundingActivity('nonexistent')).toThrow(
        'Grounding technique not found: nonexistent',
      );
    });

    it('parses "3 min" duration string to 180 seconds', () => {
      mockGetTechniqueById.mockReturnValue(mockGroundingTechnique as any);

      const activity = createGroundingActivity('5-4-3-2-1');

      expect(activity.duration).toBe(180);
    });

    it('parses "5 min" duration string to 300 seconds', () => {
      mockGetTechniqueById.mockReturnValue(mockFiveMinTechnique as any);

      const activity = createGroundingActivity('body-scan');

      expect(activity.duration).toBe(300);
    });

    it('defaults to 180 seconds if duration string has no number', () => {
      const techniqueNoNumber = { ...mockGroundingTechnique, duration: 'quick' };
      mockGetTechniqueById.mockReturnValue(techniqueNoNumber as any);

      const activity = createGroundingActivity('5-4-3-2-1');

      expect(activity.duration).toBe(180);
    });

    it('calls getTechniqueById with the provided ID', () => {
      mockGetTechniqueById.mockReturnValue(mockGroundingTechnique as any);

      createGroundingActivity('5-4-3-2-1');

      expect(mockGetTechniqueById).toHaveBeenCalledTimes(1);
      expect(mockGetTechniqueById).toHaveBeenCalledWith('5-4-3-2-1');
    });

    it('always sets tone to "calm"', () => {
      mockGetTechniqueById.mockReturnValue(mockGroundingTechnique as any);

      const activity = createGroundingActivity('5-4-3-2-1');

      expect(activity.tone).toBe('calm');
    });
  });

  // ---------------------------------------------------------------------------
  // createJournalActivity
  // ---------------------------------------------------------------------------
  describe('createJournalActivity', () => {
    it('returns a correctly structured Activity with journal config', () => {
      const activity = createJournalActivity('What are you grateful for?', 'gratitude-1');

      expect(activity.id).toBe('journal-gratitude-1');
      expect(activity.type).toBe('journal');
      expect(activity.name).toBe('Journal');
      expect(activity.description).toBe('What are you grateful for?');
      expect(activity.tone).toBe('warm');
      expect(activity.config).toEqual({
        type: 'journal',
        promptId: 'gratitude-1',
        prompt: 'What are you grateful for?',
        showTextInput: true,
      });
    });

    it('uses "freeform" as id suffix when no promptId provided', () => {
      const activity = createJournalActivity('Write freely');

      expect(activity.id).toBe('journal-freeform');
    });

    it('sets promptId to undefined when not provided', () => {
      const activity = createJournalActivity('Write freely');

      expect((activity.config as any).promptId).toBeUndefined();
    });

    it('sets duration to 300 seconds (5 minutes)', () => {
      const activity = createJournalActivity('Any prompt');

      expect(activity.duration).toBe(300);
    });

    it('sets showTextInput to true in config', () => {
      const activity = createJournalActivity('Prompt text', 'p1');

      expect((activity.config as any).showTextInput).toBe(true);
    });

    it('stores the prompt in both description and config.prompt', () => {
      const prompt = 'How do you feel right now?';
      const activity = createJournalActivity(prompt, 'feel-1');

      expect(activity.description).toBe(prompt);
      expect((activity.config as any).prompt).toBe(prompt);
    });
  });

  // ---------------------------------------------------------------------------
  // createResetActivity
  // ---------------------------------------------------------------------------
  describe('createResetActivity', () => {
    const mockSteps = [
      { instruction: 'Shake your hands', duration: 15 },
      { instruction: 'Roll your shoulders', duration: 20 },
      { instruction: 'Take a deep breath', duration: 10 },
    ];

    it('returns a correctly structured Activity with reset config', () => {
      const activity = createResetActivity('Quick Reset', mockSteps);

      expect(activity.id).toBe('reset-quick-reset');
      expect(activity.type).toBe('reset');
      expect(activity.name).toBe('Quick Reset');
      expect(activity.tone).toBe('neutral');
      expect(activity.config).toEqual({
        type: 'reset',
        exerciseId: 'quick-reset',
        steps: mockSteps,
      });
    });

    it('calculates totalDuration as sum of step durations', () => {
      const activity = createResetActivity('Quick Reset', mockSteps);

      // 15 + 20 + 10 = 45
      expect(activity.duration).toBe(45);
    });

    it('includes steps in the config', () => {
      const activity = createResetActivity('Quick Reset', mockSteps);

      expect((activity.config as any).steps).toHaveLength(3);
      expect((activity.config as any).steps[0]).toEqual({
        instruction: 'Shake your hands',
        duration: 15,
      });
    });

    it('handles single-step activities', () => {
      const singleStep = [{ instruction: 'Breathe deeply', duration: 30 }];
      const activity = createResetActivity('Simple Reset', singleStep);

      expect(activity.duration).toBe(30);
      expect((activity.config as any).steps).toHaveLength(1);
    });

    it('handles empty steps array with 0 duration', () => {
      const activity = createResetActivity('Empty Reset', []);

      expect(activity.duration).toBe(0);
      expect((activity.config as any).steps).toHaveLength(0);
    });

    it('normalizes name to lowercase-kebab for id and exerciseId', () => {
      const activity = createResetActivity('Full Body Shake', mockSteps);

      expect(activity.id).toBe('reset-full-body-shake');
      expect((activity.config as any).exerciseId).toBe('full-body-shake');
    });

    it('collapses multiple spaces in name for id generation', () => {
      const activity = createResetActivity('Two  Spaces', mockSteps);

      expect(activity.id).toBe('reset-two-spaces');
    });
  });
});
