/**
 * Program Progress Service
 *
 * Tracks user progress through multi-day wellness programs.
 * Singleton with AsyncStorage persistence, following activityLogger pattern.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

// =============================================================================
// TYPES
// =============================================================================

export interface DayCompletion {
  day: number;
  completedAt: string; // ISO date
  activitiesCompleted: string[]; // activity IDs
  totalDuration: number; // seconds
}

export interface ProgramProgress {
  programId: string;
  startedAt: string; // ISO date
  currentDay: number; // next day to complete (1-indexed)
  completedDays: DayCompletion[];
  status: 'active' | 'completed' | 'abandoned';
  completedAt?: string; // ISO date, set when status === 'completed'
}

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = '@restorae:program_progress';
const ACTIVE_KEY = '@restorae:active_program';

// =============================================================================
// SERVICE
// =============================================================================

class ProgramProgressService {
  private progressMap: Record<string, ProgramProgress> = {};
  private activeProgramId: string | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [progressData, activeData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_KEY),
      ]);

      if (progressData) {
        this.progressMap = JSON.parse(progressData);
      }
      this.activeProgramId = activeData;
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to load program progress:', error);
      this.initialized = true;
    }
  }

  private async persist(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.progressMap)),
        this.activeProgramId
          ? AsyncStorage.setItem(ACTIVE_KEY, this.activeProgramId)
          : AsyncStorage.removeItem(ACTIVE_KEY),
      ]);
    } catch (error) {
      logger.error('Failed to persist program progress:', error);
    }
  }

  async startProgram(programId: string, totalDays: number): Promise<ProgramProgress> {
    await this.initialize();

    const progress: ProgramProgress = {
      programId,
      startedAt: new Date().toISOString(),
      currentDay: 1,
      completedDays: [],
      status: 'active',
    };

    this.progressMap[programId] = progress;
    this.activeProgramId = programId;
    await this.persist();

    return progress;
  }

  async completeDay(
    programId: string,
    dayCompletion: DayCompletion,
    totalProgramDays: number,
  ): Promise<ProgramProgress> {
    await this.initialize();

    const progress = this.progressMap[programId];
    if (!progress) {
      throw new Error(`No progress found for program: ${programId}`);
    }

    // Add day completion
    progress.completedDays.push(dayCompletion);

    // Advance to next day
    if (dayCompletion.day >= totalProgramDays) {
      // Program complete
      progress.status = 'completed';
      progress.completedAt = new Date().toISOString();
      progress.currentDay = totalProgramDays;
      if (this.activeProgramId === programId) {
        this.activeProgramId = null;
      }
    } else {
      progress.currentDay = dayCompletion.day + 1;
    }

    await this.persist();
    return progress;
  }

  async getProgress(programId: string): Promise<ProgramProgress | null> {
    await this.initialize();
    return this.progressMap[programId] || null;
  }

  async getActiveProgram(): Promise<ProgramProgress | null> {
    await this.initialize();
    if (!this.activeProgramId) return null;
    return this.progressMap[this.activeProgramId] || null;
  }

  getActiveProgramId(): string | null {
    return this.activeProgramId;
  }

  isDayUnlocked(programId: string, day: number): boolean {
    const progress = this.progressMap[programId];
    if (!progress) return day === 1; // Day 1 always unlocked for new programs
    return day <= progress.currentDay;
  }

  isDayCompleted(programId: string, day: number): boolean {
    const progress = this.progressMap[programId];
    if (!progress) return false;
    return progress.completedDays.some((d) => d.day === day);
  }

  getCompletionPercentage(programId: string, totalDays: number): number {
    const progress = this.progressMap[programId];
    if (!progress) return 0;
    return Math.round((progress.completedDays.length / totalDays) * 100);
  }

  async abandonProgram(programId: string): Promise<void> {
    await this.initialize();
    const progress = this.progressMap[programId];
    if (progress) {
      progress.status = 'abandoned';
      if (this.activeProgramId === programId) {
        this.activeProgramId = null;
      }
      await this.persist();
    }
  }

  async resetProgram(programId: string): Promise<void> {
    await this.initialize();
    delete this.progressMap[programId];
    if (this.activeProgramId === programId) {
      this.activeProgramId = null;
    }
    await this.persist();
  }
}

export const programProgress = new ProgramProgressService();
