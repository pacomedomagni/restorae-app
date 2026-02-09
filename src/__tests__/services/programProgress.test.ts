/**
 * ProgramProgressService Tests
 *
 * Tests the program progress singleton: starting programs, completing days,
 * day unlock/completion checks, completion percentage, abandon, and reset.
 */

// ---------------------------------------------------------------------------
// Mocks — jest.mock calls are hoisted and persist across jest.resetModules()
// ---------------------------------------------------------------------------

const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('../../services/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The module exports a singleton. We need a fresh instance per test so
 * internal state (progressMap, activeProgramId, initialized) is clean.
 */
function getFreshProgramProgress() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { programProgress } = require('../../services/programProgress');
  return programProgress;
}

// Type alias for convenience inside tests
type DayCompletion = import('../../services/programProgress').DayCompletion;

const makeDayCompletion = (day: number): DayCompletion => ({
  day,
  completedAt: new Date().toISOString(),
  activitiesCompleted: [`activity-${day}`],
  totalDuration: 600,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ProgramProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Defaults
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(null);
    mockAsyncStorage.removeItem.mockResolvedValue(null);
  });

  // -------------------------------------------------------------------------
  // startProgram
  // -------------------------------------------------------------------------

  describe('startProgram', () => {
    it('creates progress with correct initial state', async () => {
      const programProgress = getFreshProgramProgress();

      const progress = await programProgress.startProgram('7-day-calm', 7);

      expect(progress).toMatchObject({
        programId: '7-day-calm',
        currentDay: 1,
        completedDays: [],
        status: 'active',
      });
      expect(typeof progress.startedAt).toBe('string');
      // Should be a valid ISO date
      expect(new Date(progress.startedAt).toISOString()).toBe(progress.startedAt);
    });

    it('sets the program as the active program', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('5-day-stress', 5);

      expect(programProgress.getActiveProgramId()).toBe('5-day-stress');
    });

    it('persists to AsyncStorage', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('3-day-sleep', 3);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@restorae:program_progress',
        expect.any(String),
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@restorae:active_program',
        '3-day-sleep',
      );
    });
  });

  // -------------------------------------------------------------------------
  // completeDay
  // -------------------------------------------------------------------------

  describe('completeDay', () => {
    it('advances currentDay after completing a day', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      const updated = await programProgress.completeDay(
        '7-day-calm',
        makeDayCompletion(1),
        7,
      );

      expect(updated.currentDay).toBe(2);
      expect(updated.completedDays).toHaveLength(1);
      expect(updated.status).toBe('active');
    });

    it('sets status to "completed" and clears activeProgramId on last day', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('3-day-sleep', 3);
      await programProgress.completeDay('3-day-sleep', makeDayCompletion(1), 3);
      await programProgress.completeDay('3-day-sleep', makeDayCompletion(2), 3);
      const final = await programProgress.completeDay(
        '3-day-sleep',
        makeDayCompletion(3),
        3,
      );

      expect(final.status).toBe('completed');
      expect(final.completedAt).toBeDefined();
      expect(final.currentDay).toBe(3);
      expect(programProgress.getActiveProgramId()).toBeNull();
    });

    it('throws when completing a day for an unknown program', async () => {
      const programProgress = getFreshProgramProgress();

      await expect(
        programProgress.completeDay('nonexistent', makeDayCompletion(1), 5),
      ).rejects.toThrow('No progress found for program: nonexistent');
    });

    it('accumulates completedDays entries', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.completeDay('7-day-calm', makeDayCompletion(1), 7);
      await programProgress.completeDay('7-day-calm', makeDayCompletion(2), 7);
      await programProgress.completeDay('7-day-calm', makeDayCompletion(3), 7);

      const progress = await programProgress.getProgress('7-day-calm');
      expect(progress.completedDays).toHaveLength(3);
      expect(progress.currentDay).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // getProgress
  // -------------------------------------------------------------------------

  describe('getProgress', () => {
    it('returns progress for a known program', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      const progress = await programProgress.getProgress('7-day-calm');

      expect(progress).not.toBeNull();
      expect(progress.programId).toBe('7-day-calm');
    });

    it('returns null for an unknown program', async () => {
      const programProgress = getFreshProgramProgress();

      const progress = await programProgress.getProgress('nonexistent');
      expect(progress).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getActiveProgram / getActiveProgramId
  // -------------------------------------------------------------------------

  describe('getActiveProgram', () => {
    it('returns the active program progress', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('5-day-stress', 5);
      const active = await programProgress.getActiveProgram();

      expect(active).not.toBeNull();
      expect(active.programId).toBe('5-day-stress');
    });

    it('returns null when no program is active', async () => {
      const programProgress = getFreshProgramProgress();

      const active = await programProgress.getActiveProgram();
      expect(active).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // isDayUnlocked
  // -------------------------------------------------------------------------

  describe('isDayUnlocked', () => {
    it('returns true for day <= currentDay', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      // currentDay is 1 after startProgram
      expect(programProgress.isDayUnlocked('7-day-calm', 1)).toBe(true);
    });

    it('returns false for day > currentDay', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      expect(programProgress.isDayUnlocked('7-day-calm', 2)).toBe(false);
      expect(programProgress.isDayUnlocked('7-day-calm', 7)).toBe(false);
    });

    it('unlocks subsequent days after completing earlier days', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.completeDay('7-day-calm', makeDayCompletion(1), 7);

      expect(programProgress.isDayUnlocked('7-day-calm', 1)).toBe(true);
      expect(programProgress.isDayUnlocked('7-day-calm', 2)).toBe(true);
      expect(programProgress.isDayUnlocked('7-day-calm', 3)).toBe(false);
    });

    it('returns true for day 1 when program has no progress', async () => {
      const programProgress = getFreshProgramProgress();

      // No program started — day 1 should be unlocked for new programs
      expect(programProgress.isDayUnlocked('unknown-program', 1)).toBe(true);
    });

    it('returns false for day > 1 when program has no progress', async () => {
      const programProgress = getFreshProgramProgress();

      expect(programProgress.isDayUnlocked('unknown-program', 2)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // isDayCompleted
  // -------------------------------------------------------------------------

  describe('isDayCompleted', () => {
    it('returns true for days that have been completed', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.completeDay('7-day-calm', makeDayCompletion(1), 7);

      expect(programProgress.isDayCompleted('7-day-calm', 1)).toBe(true);
    });

    it('returns false for days not yet completed', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      expect(programProgress.isDayCompleted('7-day-calm', 1)).toBe(false);
      expect(programProgress.isDayCompleted('7-day-calm', 2)).toBe(false);
    });

    it('returns false for an unknown program', async () => {
      const programProgress = getFreshProgramProgress();

      expect(programProgress.isDayCompleted('nonexistent', 1)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // getCompletionPercentage
  // -------------------------------------------------------------------------

  describe('getCompletionPercentage', () => {
    it('returns 0 for an unknown program', async () => {
      const programProgress = getFreshProgramProgress();

      expect(programProgress.getCompletionPercentage('nonexistent', 7)).toBe(0);
    });

    it('returns 0 for a freshly started program', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      expect(programProgress.getCompletionPercentage('7-day-calm', 7)).toBe(0);
    });

    it('calculates correct percentage after completing some days', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.completeDay('7-day-calm', makeDayCompletion(1), 7);

      // 1/7 = ~14%
      expect(programProgress.getCompletionPercentage('7-day-calm', 7)).toBe(14);
    });

    it('returns 100 when all days are completed', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('3-day-sleep', 3);
      for (let day = 1; day <= 3; day++) {
        await programProgress.completeDay('3-day-sleep', makeDayCompletion(day), 3);
      }

      expect(programProgress.getCompletionPercentage('3-day-sleep', 3)).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // abandonProgram
  // -------------------------------------------------------------------------

  describe('abandonProgram', () => {
    it('sets status to "abandoned"', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.abandonProgram('7-day-calm');

      const progress = await programProgress.getProgress('7-day-calm');
      expect(progress.status).toBe('abandoned');
    });

    it('clears activeProgramId', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      expect(programProgress.getActiveProgramId()).toBe('7-day-calm');

      await programProgress.abandonProgram('7-day-calm');
      expect(programProgress.getActiveProgramId()).toBeNull();
    });

    it('does nothing for an unknown program', async () => {
      const programProgress = getFreshProgramProgress();

      // Should not throw
      await programProgress.abandonProgram('nonexistent');
    });

    it('persists the change', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);

      // Clear mock call history so we only see calls from abandonProgram
      mockAsyncStorage.setItem.mockClear();
      mockAsyncStorage.removeItem.mockClear();

      await programProgress.abandonProgram('7-day-calm');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@restorae:program_progress',
        expect.any(String),
      );
    });
  });

  // -------------------------------------------------------------------------
  // resetProgram
  // -------------------------------------------------------------------------

  describe('resetProgram', () => {
    it('removes the program progress entirely', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.resetProgram('7-day-calm');

      const progress = await programProgress.getProgress('7-day-calm');
      expect(progress).toBeNull();
    });

    it('clears activeProgramId if the reset program was active', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.resetProgram('7-day-calm');

      expect(programProgress.getActiveProgramId()).toBeNull();
    });

    it('does not affect other programs', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.startProgram('7-day-calm', 7);
      await programProgress.startProgram('3-day-sleep', 3);
      await programProgress.resetProgram('7-day-calm');

      const calmProgress = await programProgress.getProgress('7-day-calm');
      const sleepProgress = await programProgress.getProgress('3-day-sleep');

      expect(calmProgress).toBeNull();
      expect(sleepProgress).not.toBeNull();
      expect(sleepProgress.programId).toBe('3-day-sleep');
    });
  });

  // -------------------------------------------------------------------------
  // Initialization / persistence
  // -------------------------------------------------------------------------

  describe('initialize', () => {
    it('loads progress from AsyncStorage', async () => {
      const storedProgress = {
        '7-day-calm': {
          programId: '7-day-calm',
          startedAt: '2025-01-15T10:00:00.000Z',
          currentDay: 3,
          completedDays: [
            {
              day: 1,
              completedAt: '2025-01-15T10:30:00.000Z',
              activitiesCompleted: ['a1'],
              totalDuration: 300,
            },
            {
              day: 2,
              completedAt: '2025-01-16T10:30:00.000Z',
              activitiesCompleted: ['a2'],
              totalDuration: 300,
            },
          ],
          status: 'active',
        },
      };

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@restorae:program_progress') {
          return Promise.resolve(JSON.stringify(storedProgress));
        }
        if (key === '@restorae:active_program') {
          return Promise.resolve('7-day-calm');
        }
        return Promise.resolve(null);
      });

      const programProgress = getFreshProgramProgress();
      await programProgress.initialize();

      const progress = await programProgress.getProgress('7-day-calm');
      expect(progress).not.toBeNull();
      expect(progress.currentDay).toBe(3);
      expect(progress.completedDays).toHaveLength(2);
      expect(programProgress.getActiveProgramId()).toBe('7-day-calm');
    });

    it('handles AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const programProgress = getFreshProgramProgress();
      // Should not throw
      await programProgress.initialize();

      const progress = await programProgress.getProgress('any');
      expect(progress).toBeNull();
    });

    it('is idempotent — double initialization reads storage only once', async () => {
      const programProgress = getFreshProgramProgress();

      await programProgress.initialize();
      await programProgress.initialize();

      // Two keys read per initialization; should only happen once
      const getItemCalls = mockAsyncStorage.getItem.mock.calls.filter(
        (c: string[]) =>
          c[0] === '@restorae:program_progress' || c[0] === '@restorae:active_program',
      );
      expect(getItemCalls).toHaveLength(2);
    });
  });
});
