/**
 * Gamification Service
 * Premium engagement system with streaks, achievements, and rewards
 * 
 * Exceeds industry standards:
 * - Multi-dimensional streaks (daily, weekly, category-specific)
 * - Tiered achievements with unlockable rewards
 * - Progress tracking with visual milestones
 * - Smart notifications for streak protection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, differenceInHours, startOfDay, isToday, isYesterday, format, startOfWeek, isSameWeek } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalDaysActive: number;
  weeklyStreak: number;
  lastWeekActive: string | null;
  // Category-specific streaks
  categoryStreaks: {
    breathing: number;
    grounding: number;
    journal: number;
    focus: number;
    stories: number;
  };
  // Streak freeze (premium feature)
  freezesRemaining: number;
  freezesUsedThisMonth: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'activity' | 'exploration' | 'mastery' | 'social' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement: number;
  currentProgress: number;
  unlockedAt: string | null;
  reward?: {
    type: 'theme' | 'sound' | 'badge' | 'feature';
    id: string;
    name: string;
  };
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  totalBreaths: number;
  totalJournalEntries: number;
  totalMoodCheckins: number;
  favoriteTime: string; // "morning" | "afternoon" | "evening" | "night"
  favoriteTool: string;
  // Weekly breakdown
  weeklyActivity: {
    [key: string]: number; // "Mon": 3, "Tue": 5, etc.
  };
  // Monthly trend
  monthlyMinutes: number[];
  // Mood improvement tracking
  moodTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  xpForNext: number;
  progress: number; // 0-1
}

// Alias for backwards compatibility
export type UserLevel = LevelInfo;

export type ActivityType = 'breathing' | 'grounding' | 'focus' | 'journal' | 'mood' | 'story' | 'ritual';

// =============================================================================
// ACHIEVEMENTS DEFINITIONS
// =============================================================================

export const ACHIEVEMENTS: Omit<Achievement, 'currentProgress' | 'unlockedAt'>[] = [
  // Streak Achievements
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first session',
    icon: '🌱',
    category: 'streak',
    tier: 'bronze',
    requirement: 1,
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
    requirement: 7,
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    category: 'streak',
    tier: 'gold',
    requirement: 30,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Maintain a 100-day streak',
    icon: '⚡',
    category: 'streak',
    tier: 'platinum',
    requirement: 100,
    reward: {
      type: 'theme',
      id: 'aurora',
      name: 'Aurora Theme',
    },
  },
  {
    id: 'legendary',
    title: 'Legendary',
    description: 'Maintain a 365-day streak',
    icon: '👑',
    category: 'streak',
    tier: 'diamond',
    requirement: 365,
    reward: {
      type: 'badge',
      id: 'legendary-badge',
      name: 'Legendary Badge',
    },
  },

  // Activity Achievements
  {
    id: 'breath-beginner',
    title: 'Breath Beginner',
    description: 'Complete 10 breathing sessions',
    icon: '🌬️',
    category: 'activity',
    tier: 'bronze',
    requirement: 10,
  },
  {
    id: 'breath-master',
    title: 'Breath Master',
    description: 'Complete 100 breathing sessions',
    icon: '🧘',
    category: 'activity',
    tier: 'gold',
    requirement: 100,
  },
  {
    id: 'zen-master',
    title: 'Zen Master',
    description: 'Complete 500 breathing sessions',
    icon: '🏔️',
    category: 'activity',
    tier: 'diamond',
    requirement: 500,
    reward: {
      type: 'sound',
      id: 'tibetan-bells',
      name: 'Tibetan Bells Soundscape',
    },
  },
  {
    id: 'journal-starter',
    title: 'Journal Starter',
    description: 'Write 5 journal entries',
    icon: '📝',
    category: 'activity',
    tier: 'bronze',
    requirement: 5,
  },
  {
    id: 'thoughtful-writer',
    title: 'Thoughtful Writer',
    description: 'Write 50 journal entries',
    icon: '✍️',
    category: 'activity',
    tier: 'silver',
    requirement: 50,
  },
  {
    id: 'prolific-author',
    title: 'Prolific Author',
    description: 'Write 200 journal entries',
    icon: '📚',
    category: 'activity',
    tier: 'gold',
    requirement: 200,
  },
  {
    id: 'focus-finder',
    title: 'Focus Finder',
    description: 'Complete 10 focus sessions',
    icon: '🎯',
    category: 'activity',
    tier: 'bronze',
    requirement: 10,
  },
  {
    id: 'deep-focus',
    title: 'Deep Focus',
    description: 'Accumulate 1000 focus minutes',
    icon: '💎',
    category: 'activity',
    tier: 'platinum',
    requirement: 1000,
  },

  // Exploration Achievements
  {
    id: 'curious-mind',
    title: 'Curious Mind',
    description: 'Try all 6 tool categories',
    icon: '🔍',
    category: 'exploration',
    tier: 'silver',
    requirement: 6,
  },
  {
    id: 'pattern-explorer',
    title: 'Pattern Explorer',
    description: 'Try 15 different breathing patterns',
    icon: '🌈',
    category: 'exploration',
    tier: 'gold',
    requirement: 15,
  },
  {
    id: 'story-lover',
    title: 'Story Lover',
    description: 'Listen to 10 bedtime stories',
    icon: '🌙',
    category: 'exploration',
    tier: 'silver',
    requirement: 10,
  },
  {
    id: 'soundscape-collector',
    title: 'Soundscape Collector',
    description: 'Try all ambient soundscapes',
    icon: '🎵',
    category: 'exploration',
    tier: 'gold',
    requirement: 8,
  },

  // Mastery Achievements
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 20 morning sessions (before 9am)',
    icon: '🌅',
    category: 'mastery',
    tier: 'silver',
    requirement: 20,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 20 evening sessions (after 9pm)',
    icon: '🦉',
    category: 'mastery',
    tier: 'silver',
    requirement: 20,
  },
  {
    id: 'mood-tracker',
    title: 'Mood Tracker',
    description: 'Log your mood for 30 days',
    icon: '📊',
    category: 'mastery',
    tier: 'gold',
    requirement: 30,
  },
  {
    id: 'ritual-keeper',
    title: 'Ritual Keeper',
    description: 'Complete 50 daily rituals',
    icon: '🌿',
    category: 'mastery',
    tier: 'gold',
    requirement: 50,
  },
  {
    id: 'wellness-warrior',
    title: 'Wellness Warrior',
    description: 'Reach 10,000 total minutes of practice',
    icon: '🏆',
    category: 'mastery',
    tier: 'diamond',
    requirement: 10000,
    reward: {
      type: 'feature',
      id: 'custom-breathing',
      name: 'Custom Breathing Patterns',
    },
  },

  // Special Achievements
  {
    id: 'sos-survivor',
    title: 'SOS Survivor',
    description: 'Use SOS mode and find calm',
    icon: '🆘',
    category: 'special',
    tier: 'bronze',
    requirement: 1,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Practice on 10 weekends',
    icon: '🌴',
    category: 'special',
    tier: 'silver',
    requirement: 10,
  },
  {
    id: 'new-year-new-you',
    title: 'New Year, New You',
    description: 'Practice on January 1st',
    icon: '🎆',
    category: 'special',
    tier: 'gold',
    requirement: 1,
  },
];

// =============================================================================
// LEVEL TITLES
// =============================================================================

export const LEVEL_TITLES: { [key: number]: string } = {
  1: 'Newcomer',
  2: 'Seeker',
  3: 'Practitioner',
  4: 'Apprentice',
  5: 'Journeyer',
  6: 'Adept',
  7: 'Sage',
  8: 'Master',
  9: 'Enlightened',
  10: 'Transcendent',
  11: 'Zen Master',
  12: 'Luminary',
  13: 'Awakened',
  14: 'Ascended',
  15: 'Eternal',
};

// XP required for each level
export const LEVEL_XP: { [key: number]: number } = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 4000,
  8: 7500,
  9: 12500,
  10: 20000,
  11: 35000,
  12: 55000,
  13: 80000,
  14: 120000,
  15: 200000,
};

// XP rewards for activities
export const XP_REWARDS: { [key in ActivityType]: number } = {
  breathing: 20,
  grounding: 20,
  focus: 30,
  journal: 25,
  mood: 10,
  story: 15,
  ritual: 35,
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  STREAK: '@restorae:streak',
  ACHIEVEMENTS: '@restorae:achievements',
  STATS: '@restorae:stats',
  XP: '@restorae:xp',
  ACTIVITY_LOG: '@restorae:activity_log',
};

// =============================================================================
// GAMIFICATION SERVICE
// =============================================================================

class GamificationService {
  private streakData: StreakData | null = null;
  private achievements: Achievement[] = [];
  private stats: UserStats | null = null;
  private totalXP: number = 0;
  private listeners: Set<() => void> = new Set();

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadStreak(),
      this.loadAchievements(),
      this.loadStats(),
      this.loadXP(),
    ]);
  }

  private async loadStreak(): Promise<void> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
    if (data) {
      this.streakData = JSON.parse(data);
      // Check if streak needs to be reset
      this.checkStreakValidity();
    } else {
      this.streakData = this.getDefaultStreakData();
    }
  }

  private async loadAchievements(): Promise<void> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (data) {
      this.achievements = JSON.parse(data);
    } else {
      // Initialize with all achievements at 0 progress
      this.achievements = ACHIEVEMENTS.map(a => ({
        ...a,
        currentProgress: 0,
        unlockedAt: null,
      }));
    }
  }

  private async loadStats(): Promise<void> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
    if (data) {
      this.stats = JSON.parse(data);
    } else {
      this.stats = this.getDefaultStats();
    }
  }

  private async loadXP(): Promise<void> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.XP);
    if (data) {
      this.totalXP = parseInt(data, 10);
    }
  }

  private getDefaultStreakData(): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      totalDaysActive: 0,
      weeklyStreak: 0,
      lastWeekActive: null,
      categoryStreaks: {
        breathing: 0,
        grounding: 0,
        journal: 0,
        focus: 0,
        stories: 0,
      },
      freezesRemaining: 2,
      freezesUsedThisMonth: 0,
    };
  }

  private getDefaultStats(): UserStats {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      totalBreaths: 0,
      totalJournalEntries: 0,
      totalMoodCheckins: 0,
      favoriteTime: 'morning',
      favoriteTool: 'breathing',
      weeklyActivity: {
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0,
        Sun: 0,
      },
      monthlyMinutes: Array(12).fill(0),
      moodTrend: 'insufficient_data',
    };
  }

  // ---------------------------------------------------------------------------
  // STREAK MANAGEMENT
  // ---------------------------------------------------------------------------

  private checkStreakValidity(): void {
    if (!this.streakData?.lastActivityDate) return;

    const lastActive = new Date(this.streakData.lastActivityDate);
    const now = new Date();
    const daysDiff = differenceInDays(startOfDay(now), startOfDay(lastActive));

    if (daysDiff > 1) {
      // Streak broken - check for freeze
      if (this.streakData.freezesRemaining > 0 && daysDiff === 2) {
        // Auto-use freeze
        this.streakData.freezesRemaining--;
        this.streakData.freezesUsedThisMonth++;
      } else {
        // Reset streak
        this.streakData.currentStreak = 0;
      }
    }
  }

  async recordActivity(
    type: ActivityType,
    durationMinutes: number = 0,
    metadata?: Record<string, any>
  ): Promise<{
    xpEarned: number;
    newAchievements: Achievement[];
    streakUpdated: boolean;
    levelUp: boolean;
    newLevel?: LevelInfo;
  }> {
    const result = {
      xpEarned: 0,
      newAchievements: [] as Achievement[],
      streakUpdated: false,
      levelUp: false,
      newLevel: undefined as LevelInfo | undefined,
    };

    // 1. Update streak
    const streakResult = await this.updateStreak(type);
    result.streakUpdated = streakResult.updated;

    // 2. Award XP
    const baseXP = XP_REWARDS[type];
    const streakMultiplier = this.getStreakMultiplier();
    result.xpEarned = Math.round(baseXP * streakMultiplier);
    
    const previousLevel = this.getLevel();
    this.totalXP += result.xpEarned;
    await AsyncStorage.setItem(STORAGE_KEYS.XP, this.totalXP.toString());
    
    const newLevel = this.getLevel();
    if (newLevel.level > previousLevel.level) {
      result.levelUp = true;
      result.newLevel = newLevel;
    }

    // 3. Update stats
    await this.updateStats(type, durationMinutes, metadata);

    // 4. Check achievements
    result.newAchievements = await this.checkAchievements(type, metadata);

    // 5. Notify listeners
    this.notifyListeners();

    return result;
  }

  private async updateStreak(type: ActivityType): Promise<{ updated: boolean }> {
    if (!this.streakData) {
      this.streakData = this.getDefaultStreakData();
    }

    const now = new Date();
    const today = startOfDay(now).toISOString();
    
    let updated = false;

    if (!this.streakData.lastActivityDate || !isToday(new Date(this.streakData.lastActivityDate))) {
      // New day activity
      if (this.streakData.lastActivityDate && isYesterday(new Date(this.streakData.lastActivityDate))) {
        // Consecutive day - increase streak
        this.streakData.currentStreak++;
      } else if (!this.streakData.lastActivityDate) {
        // First ever activity
        this.streakData.currentStreak = 1;
      } else {
        // Streak broken (more than 1 day gap)
        this.streakData.currentStreak = 1;
      }

      this.streakData.lastActivityDate = today;
      this.streakData.totalDaysActive++;
      updated = true;

      // Update longest streak
      if (this.streakData.currentStreak > this.streakData.longestStreak) {
        this.streakData.longestStreak = this.streakData.currentStreak;
      }

      // Weekly streak
      const thisWeekStart = startOfWeek(now).toISOString();
      if (this.streakData.lastWeekActive !== thisWeekStart) {
        if (this.streakData.lastWeekActive && 
            isSameWeek(new Date(this.streakData.lastWeekActive), new Date(now), { weekStartsOn: 1 })) {
          this.streakData.weeklyStreak++;
        } else {
          this.streakData.weeklyStreak = 1;
        }
        this.streakData.lastWeekActive = thisWeekStart;
      }
    }

    // Update category streak
    const categoryMap: Record<ActivityType, keyof StreakData['categoryStreaks'] | null> = {
      breathing: 'breathing',
      grounding: 'grounding',
      focus: 'focus',
      journal: 'journal',
      story: 'stories',
      mood: null,
      ritual: null,
    };

    const category = categoryMap[type];
    if (category) {
      this.streakData.categoryStreaks[category]++;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(this.streakData));
    return { updated };
  }

  private async updateStats(
    type: ActivityType,
    durationMinutes: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.stats) {
      this.stats = this.getDefaultStats();
    }

    this.stats.totalSessions++;
    this.stats.totalMinutes += durationMinutes;

    // Type-specific updates
    switch (type) {
      case 'breathing':
        this.stats.totalBreaths += metadata?.breaths || 0;
        break;
      case 'journal':
        this.stats.totalJournalEntries++;
        break;
      case 'mood':
        this.stats.totalMoodCheckins++;
        break;
    }

    // Update time-of-day preference
    const hour = new Date().getHours();
    const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    // In a real implementation, you'd track all times and calculate most frequent

    // Update weekly activity
    const dayName = format(new Date(), 'EEE') as keyof typeof this.stats.weeklyActivity;
    this.stats.weeklyActivity[dayName]++;

    // Update monthly minutes
    const monthIndex = new Date().getMonth();
    this.stats.monthlyMinutes[monthIndex] += durationMinutes;

    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
  }

  private getStreakMultiplier(): number {
    if (!this.streakData) return 1;
    
    const streak = this.streakData.currentStreak;
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.5;
    if (streak >= 7) return 1.25;
    if (streak >= 3) return 1.1;
    return 1.0;
  }

  // ---------------------------------------------------------------------------
  // ACHIEVEMENTS
  // ---------------------------------------------------------------------------

  private async checkAchievements(
    type: ActivityType,
    metadata?: Record<string, any>
  ): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of this.achievements) {
      if (achievement.unlockedAt) continue; // Already unlocked

      let progress = achievement.currentProgress;
      let shouldCheck = false;

      // Update progress based on achievement category
      switch (achievement.id) {
        // Streak achievements
        case 'first-steps':
          progress = this.stats?.totalSessions || 0;
          shouldCheck = true;
          break;
        case 'week-warrior':
        case 'dedicated':
        case 'unstoppable':
        case 'legendary':
          progress = this.streakData?.currentStreak || 0;
          shouldCheck = true;
          break;

        // Activity achievements
        case 'breath-beginner':
        case 'breath-master':
        case 'zen-master':
          if (type === 'breathing') {
            progress++;
            shouldCheck = true;
          }
          break;
        case 'journal-starter':
        case 'thoughtful-writer':
        case 'prolific-author':
          progress = this.stats?.totalJournalEntries || 0;
          shouldCheck = true;
          break;
        case 'focus-finder':
          if (type === 'focus') {
            progress++;
            shouldCheck = true;
          }
          break;
        case 'deep-focus':
          if (type === 'focus') {
            progress += metadata?.durationMinutes || 0;
            shouldCheck = true;
          }
          break;

        // Exploration achievements
        case 'story-lover':
          if (type === 'story') {
            progress++;
            shouldCheck = true;
          }
          break;
        case 'mood-tracker':
          progress = this.stats?.totalMoodCheckins || 0;
          shouldCheck = true;
          break;

        // Special achievements
        case 'sos-survivor':
          if (metadata?.isSOS) {
            progress = 1;
            shouldCheck = true;
          }
          break;
        case 'new-year-new-you':
          const today = new Date();
          if (today.getMonth() === 0 && today.getDate() === 1) {
            progress = 1;
            shouldCheck = true;
          }
          break;
      }

      if (shouldCheck) {
        achievement.currentProgress = progress;
        
        if (progress >= achievement.requirement && !achievement.unlockedAt) {
          achievement.unlockedAt = new Date().toISOString();
          newlyUnlocked.push(achievement);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
    }

    return newlyUnlocked;
  }

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------

  getStreak(): StreakData {
    return this.streakData || this.getDefaultStreakData();
  }

  getAchievements(): Achievement[] {
    return this.achievements;
  }

  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlockedAt !== null);
  }

  getNextAchievements(limit: number = 3): Achievement[] {
    return this.achievements
      .filter(a => a.unlockedAt === null)
      .sort((a, b) => {
        const aProgress = a.currentProgress / a.requirement;
        const bProgress = b.currentProgress / b.requirement;
        return bProgress - aProgress;
      })
      .slice(0, limit);
  }

  getStats(): UserStats {
    return this.stats || this.getDefaultStats();
  }

  getLevel(): LevelInfo {
    let level = 1;
    for (const [lvl, xp] of Object.entries(LEVEL_XP)) {
      if (this.totalXP >= xp) {
        level = parseInt(lvl, 10);
      }
    }

    const currentLevelXP = LEVEL_XP[level] || 0;
    const nextLevelXP = LEVEL_XP[level + 1] || LEVEL_XP[15];
    const xpIntoLevel = this.totalXP - currentLevelXP;
    const xpForNext = nextLevelXP - currentLevelXP;

    return {
      level,
      title: LEVEL_TITLES[level] || 'Master',
      currentXP: xpIntoLevel,
      nextLevelXP: nextLevelXP,
      totalXP: this.totalXP,
      xpForNext: xpForNext,
      progress: xpForNext > 0 ? xpIntoLevel / xpForNext : 1,
    };
  }

  getTotalXP(): number {
    return this.totalXP;
  }

  // Streak at risk notification
  isStreakAtRisk(): boolean {
    if (!this.streakData?.lastActivityDate) return false;
    
    const lastActive = new Date(this.streakData.lastActivityDate);
    const hoursSince = differenceInHours(new Date(), lastActive);
    
    // Alert if more than 18 hours since last activity and not completed today
    return hoursSince >= 18 && !isToday(lastActive);
  }

  getStreakRiskHours(): number {
    if (!this.streakData?.lastActivityDate) return 0;
    
    const lastActive = new Date(this.streakData.lastActivityDate);
    const endOfStreakWindow = new Date(lastActive);
    endOfStreakWindow.setDate(endOfStreakWindow.getDate() + 2);
    endOfStreakWindow.setHours(0, 0, 0, 0);
    
    return Math.max(0, differenceInHours(endOfStreakWindow, new Date()));
  }

  // ---------------------------------------------------------------------------
  // OBSERVERS
  // ---------------------------------------------------------------------------

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
export const gamification = new GamificationService();

// Export types
export type { GamificationService };
