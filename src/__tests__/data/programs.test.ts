import {
  ALL_PROGRAMS,
  getProgramById,
  getAllPrograms,
  getProgramsByCategory,
  getFreePrograms,
} from '../../data/programs';
import type { WellnessProgram } from '../../data/programs';

// =============================================================================
// ALL_PROGRAMS array
// =============================================================================

describe('ALL_PROGRAMS', () => {
  it('contains exactly 3 programs', () => {
    expect(ALL_PROGRAMS).toHaveLength(3);
  });

  it('contains calm-foundations, stress-reset, and sleep-journey', () => {
    const ids = ALL_PROGRAMS.map((p) => p.id);
    expect(ids).toContain('calm-foundations');
    expect(ids).toContain('stress-reset');
    expect(ids).toContain('sleep-journey');
  });
});

// =============================================================================
// getProgramById
// =============================================================================

describe('getProgramById', () => {
  it('returns the calm-foundations program', () => {
    const program = getProgramById('calm-foundations');
    expect(program).toBeDefined();
    expect(program!.id).toBe('calm-foundations');
    expect(program!.name).toBe('7-Day Calm Foundations');
  });

  it('returns the stress-reset program', () => {
    const program = getProgramById('stress-reset');
    expect(program).toBeDefined();
    expect(program!.id).toBe('stress-reset');
    expect(program!.name).toBe('5-Day Stress Reset');
  });

  it('returns the sleep-journey program', () => {
    const program = getProgramById('sleep-journey');
    expect(program).toBeDefined();
    expect(program!.id).toBe('sleep-journey');
    expect(program!.name).toBe('3-Day Sleep Journey');
  });

  it('returns undefined for an unknown ID', () => {
    expect(getProgramById('nonexistent-program')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getProgramById('')).toBeUndefined();
  });
});

// =============================================================================
// getAllPrograms
// =============================================================================

describe('getAllPrograms', () => {
  it('returns all 3 programs', () => {
    const programs = getAllPrograms();
    expect(programs).toHaveLength(3);
  });

  it('returns the same programs as ALL_PROGRAMS', () => {
    const programs = getAllPrograms();
    expect(programs).toEqual(ALL_PROGRAMS);
  });
});

// =============================================================================
// getProgramsByCategory
// =============================================================================

describe('getProgramsByCategory', () => {
  it('returns 1 program for category calm', () => {
    const programs = getProgramsByCategory('calm');
    expect(programs).toHaveLength(1);
    expect(programs[0].id).toBe('calm-foundations');
  });

  it('returns 1 program for category stress', () => {
    const programs = getProgramsByCategory('stress');
    expect(programs).toHaveLength(1);
    expect(programs[0].id).toBe('stress-reset');
  });

  it('returns 1 program for category sleep', () => {
    const programs = getProgramsByCategory('sleep');
    expect(programs).toHaveLength(1);
    expect(programs[0].id).toBe('sleep-journey');
  });

  it('returns 0 programs for category resilience (no programs in that category)', () => {
    const programs = getProgramsByCategory('resilience');
    expect(programs).toHaveLength(0);
  });
});

// =============================================================================
// getFreePrograms
// =============================================================================

describe('getFreePrograms', () => {
  it('returns 2 free programs', () => {
    const freePrograms = getFreePrograms();
    expect(freePrograms).toHaveLength(2);
  });

  it('excludes the premium sleep-journey program', () => {
    const freePrograms = getFreePrograms();
    const ids = freePrograms.map((p) => p.id);
    expect(ids).toContain('calm-foundations');
    expect(ids).toContain('stress-reset');
    expect(ids).not.toContain('sleep-journey');
  });

  it('all returned programs have isPremium set to false', () => {
    const freePrograms = getFreePrograms();
    for (const program of freePrograms) {
      expect(program.isPremium).toBe(false);
    }
  });
});

// =============================================================================
// Program structure: totalDays matches days array length
// =============================================================================

describe('program totalDays matches days array', () => {
  it.each(ALL_PROGRAMS.map((p) => [p.id, p]))(
    '%s has totalDays matching its days array length',
    (_id, program) => {
      const p = program as WellnessProgram;
      expect(p.days).toHaveLength(p.totalDays);
    },
  );
});

// =============================================================================
// Program structure: required fields
// =============================================================================

describe('each program has valid required fields', () => {
  it.each(ALL_PROGRAMS.map((p) => [p.id, p]))(
    '%s has all required top-level fields',
    (_id, program) => {
      const p = program as WellnessProgram;
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.subtitle).toBe('string');
      expect(p.subtitle.length).toBeGreaterThan(0);
      expect(typeof p.description).toBe('string');
      expect(p.description.length).toBeGreaterThan(0);
      expect(['calm', 'stress', 'sleep', 'resilience']).toContain(p.category);
      expect(typeof p.totalDays).toBe('number');
      expect(p.totalDays).toBeGreaterThan(0);
      expect(typeof p.estimatedDailyDuration).toBe('string');
      expect(typeof p.isPremium).toBe('boolean');
      expect(typeof p.icon).toBe('string');
      expect(['calm', 'warm', 'primary']).toContain(p.accentColor);
      expect(Array.isArray(p.days)).toBe(true);
    },
  );
});

// =============================================================================
// Program structure: day numbering
// =============================================================================

describe('day numbering is sequential', () => {
  it.each(ALL_PROGRAMS.map((p) => [p.id, p]))(
    '%s has sequential day numbers starting at 1',
    (_id, program) => {
      const p = program as WellnessProgram;
      p.days.forEach((day, index) => {
        expect(day.day).toBe(index + 1);
      });
    },
  );
});

// =============================================================================
// Program structure: each day has activities with valid types
// =============================================================================

describe('each day has at least 1 activity with a valid type', () => {
  const validActivityTypes = ['breathing', 'grounding', 'journal', 'reflection'];

  for (const program of ALL_PROGRAMS) {
    for (const day of program.days) {
      it(`${program.id} day ${day.day} has at least 1 activity`, () => {
        expect(day.activities.length).toBeGreaterThanOrEqual(1);
      });

      it(`${program.id} day ${day.day} activities all have valid types`, () => {
        for (const activity of day.activities) {
          expect(validActivityTypes).toContain(activity.type);
        }
      });
    }
  }
});

// =============================================================================
// Program structure: activity fields
// =============================================================================

describe('each activity has required fields', () => {
  for (const program of ALL_PROGRAMS) {
    for (const day of program.days) {
      for (const activity of day.activities) {
        it(`${program.id} day ${day.day} activity "${activity.id}" has valid fields`, () => {
          expect(typeof activity.id).toBe('string');
          expect(activity.id.length).toBeGreaterThan(0);
          expect(typeof activity.title).toBe('string');
          expect(activity.title.length).toBeGreaterThan(0);
          expect(typeof activity.description).toBe('string');
          expect(activity.description.length).toBeGreaterThan(0);
          expect(typeof activity.duration).toBe('number');
          expect(activity.duration).toBeGreaterThan(0);
        });
      }
    }
  }
});

// =============================================================================
// Specific program properties
// =============================================================================

describe('specific program properties', () => {
  it('calm-foundations is 7 days, category calm, free', () => {
    const program = getProgramById('calm-foundations')!;
    expect(program.totalDays).toBe(7);
    expect(program.category).toBe('calm');
    expect(program.isPremium).toBe(false);
  });

  it('stress-reset is 5 days, category stress, free', () => {
    const program = getProgramById('stress-reset')!;
    expect(program.totalDays).toBe(5);
    expect(program.category).toBe('stress');
    expect(program.isPremium).toBe(false);
  });

  it('sleep-journey is 3 days, category sleep, premium', () => {
    const program = getProgramById('sleep-journey')!;
    expect(program.totalDays).toBe(3);
    expect(program.category).toBe('sleep');
    expect(program.isPremium).toBe(true);
  });
});

// =============================================================================
// Activity IDs are unique across all programs
// =============================================================================

describe('activity IDs are unique', () => {
  it('no duplicate activity IDs exist across all programs', () => {
    const allActivityIds: string[] = [];
    for (const program of ALL_PROGRAMS) {
      for (const day of program.days) {
        for (const activity of day.activities) {
          allActivityIds.push(activity.id);
        }
      }
    }
    const uniqueIds = new Set(allActivityIds);
    expect(uniqueIds.size).toBe(allActivityIds.length);
  });
});
