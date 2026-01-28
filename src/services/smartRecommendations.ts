/**
 * Smart Recommendation Engine
 * 
 * A powerful personalization system that:
 * 1. Pulls from ALL content libraries dynamically
 * 2. Uses wellness goals from onboarding
 * 3. Learns from user behavior
 * 4. Considers time of day, mood patterns, and preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, getHours, isWeekend, subDays } from 'date-fns';
import { MoodType } from '../types';
import { BREATHING_PATTERNS } from '../data/breathingPatterns';
import { GROUNDING_TECHNIQUES } from '../data/groundingTechniques';
import { JOURNAL_PROMPTS } from '../data/journalPrompts';
import { FOCUS_SESSIONS } from '../data/focusSessions';
import { BEDTIME_STORIES } from '../data/bedtimeStories';
import {
  WellnessGoal,
  TimeOfDay,
  ContentTags,
  BREATHING_TAGS,
  GROUNDING_TAGS,
  JOURNAL_TAGS,
  FOCUS_TAGS,
  STORY_TAGS,
  matchesMood,
  matchesTime,
  matchesGoal,
} from './contentTags';

// =============================================================================
// TYPES
// =============================================================================

export interface Recommendation {
  id: string;
  type: 'breathing' | 'grounding' | 'focus' | 'journal' | 'story';
  title: string;
  subtitle: string;
  description?: string;
  duration: string;
  icon: string;
  route: string;
  routeParams?: Record<string, any>;
  score: number;
  reason: string;
  isPremium?: boolean;
  tags?: ContentTags;
}

export interface UserContext {
  timeOfDay: TimeOfDay;
  hour: number;
  dayOfWeek: string;
  isWeekend: boolean;
  currentMood?: MoodType;
  recentMoods: MoodType[];
  wellnessGoals: WellnessGoal[];
  favoriteTypes: string[];
  totalSessions: number;
  lastActivityType?: string;
  lastActivityId?: string;
  streakDays: number;
}

interface MoodHistoryEntry {
  mood: MoodType;
  timestamp: string;
}

interface ActivityHistoryEntry {
  type: string;
  id: string;
  timestamp: string;
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  WELLNESS_GOALS: '@restorae/wellness_goals',
  MOOD_HISTORY: '@restorae:mood_history',
  ACTIVITY_HISTORY: '@restorae:activity_history',
  USER_NAME: '@restorae/user_name',
};

// =============================================================================
// ICONS BY CONTENT TYPE
// =============================================================================

const TYPE_ICONS: Record<string, string> = {
  breathing: '🌬️',
  grounding: '🌿',
  focus: '🎯',
  journal: '📝',
  story: '🌙',
};

const CATEGORY_ICONS: Record<string, string> = {
  // Breathing
  calm: '🌊',
  focus: '🎯',
  energy: '⚡',
  sleep: '💤',
  emergency: '🆘',
  balance: '☯️',
  // Grounding
  sensory: '👁️',
  body: '🤲',
  mental: '🧠',
  // Journal
  gratitude: '🙏',
  reflection: '💭',
  growth: '🌱',
  release: '🍃',
  // Focus
  work: '💼',
  creative: '🎨',
  planning: '📋',
  quick: '⚡',
  // Story
  nature: '🌲',
  travel: '✈️',
  fantasy: '✨',
  meditation: '🧘',
};

// =============================================================================
// SMART RECOMMENDATIONS ENGINE
// =============================================================================

class SmartRecommendationsEngine {
  private moodHistory: MoodHistoryEntry[] = [];
  private activityHistory: ActivityHistoryEntry[] = [];
  private wellnessGoals: WellnessGoal[] = [];
  private initialized = false;

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await Promise.all([
      this.loadWellnessGoals(),
      this.loadMoodHistory(),
      this.loadActivityHistory(),
    ]);
    
    this.initialized = true;
  }

  private async loadWellnessGoals(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.WELLNESS_GOALS);
      if (stored) {
        this.wellnessGoals = JSON.parse(stored) as WellnessGoal[];
      }
    } catch (e) {
      console.warn('Failed to load wellness goals');
    }
  }

  private async loadMoodHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_HISTORY);
      if (stored) {
        this.moodHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load mood history');
    }
  }

  private async loadActivityHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY);
      if (stored) {
        this.activityHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load activity history');
    }
  }

  // ---------------------------------------------------------------------------
  // RECORDING USER BEHAVIOR
  // ---------------------------------------------------------------------------

  async recordMood(mood: MoodType): Promise<void> {
    this.moodHistory.unshift({
      mood,
      timestamp: new Date().toISOString(),
    });
    
    // Keep last 100 entries
    if (this.moodHistory.length > 100) {
      this.moodHistory = this.moodHistory.slice(0, 100);
    }
    
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.MOOD_HISTORY,
        JSON.stringify(this.moodHistory)
      );
    } catch (e) {
      console.warn('Failed to save mood history');
    }
  }

  async recordActivity(type: string, id: string): Promise<void> {
    this.activityHistory.unshift({
      type,
      id,
      timestamp: new Date().toISOString(),
    });
    
    // Keep last 200 entries
    if (this.activityHistory.length > 200) {
      this.activityHistory = this.activityHistory.slice(0, 200);
    }
    
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVITY_HISTORY,
        JSON.stringify(this.activityHistory)
      );
    } catch (e) {
      console.warn('Failed to save activity history');
    }
  }

  async setWellnessGoals(goals: WellnessGoal[]): Promise<void> {
    this.wellnessGoals = goals;
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.WELLNESS_GOALS,
        JSON.stringify(goals)
      );
    } catch (e) {
      console.warn('Failed to save wellness goals');
    }
  }

  // ---------------------------------------------------------------------------
  // USER CONTEXT
  // ---------------------------------------------------------------------------

  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getUserContext(currentMood?: MoodType): UserContext {
    const now = new Date();
    const hour = getHours(now);
    
    // Get recent moods (last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    const recentMoods = this.moodHistory
      .filter(m => new Date(m.timestamp) >= sevenDaysAgo)
      .map(m => m.mood);

    // Get favorite types (most used in last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentActivities = this.activityHistory.filter(
      a => new Date(a.timestamp) >= thirtyDaysAgo
    );
    const typeCounts: Record<string, number> = {};
    recentActivities.forEach(a => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });
    const favoriteTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    const lastActivity = this.activityHistory[0];

    return {
      timeOfDay: this.getTimeOfDay(hour),
      hour,
      dayOfWeek: format(now, 'EEEE'),
      isWeekend: isWeekend(now),
      currentMood,
      recentMoods,
      wellnessGoals: this.wellnessGoals,
      favoriteTypes,
      totalSessions: this.activityHistory.length,
      lastActivityType: lastActivity?.type,
      lastActivityId: lastActivity?.id,
      streakDays: this.calculateStreak(),
    };
  }

  private calculateStreak(): number {
    // Simplified streak calculation
    if (this.activityHistory.length === 0) return 0;
    
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(now, i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      
      const hasActivity = this.activityHistory.some(a => 
        a.timestamp.startsWith(dateStr)
      );
      
      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        // Allow current day to not have activity yet
        break;
      }
    }
    
    return streak;
  }

  // ---------------------------------------------------------------------------
  // CONTENT TO RECOMMENDATIONS
  // ---------------------------------------------------------------------------

  private breathingToRecommendation(
    pattern: typeof BREATHING_PATTERNS[0],
    context: UserContext
  ): Recommendation | null {
    const tags = BREATHING_TAGS[pattern.id];
    if (!tags) return null;

    const { score, reason } = this.scoreContent(tags, context, 'breathing');

    return {
      id: pattern.id,
      type: 'breathing',
      title: pattern.name,
      subtitle: pattern.bestFor || pattern.description,
      description: pattern.description,
      duration: pattern.duration,
      icon: CATEGORY_ICONS[pattern.category || 'calm'] || TYPE_ICONS.breathing,
      route: 'Breathing',
      routeParams: { patternId: pattern.id },
      score,
      reason,
      tags,
    };
  }

  private groundingToRecommendation(
    technique: typeof GROUNDING_TECHNIQUES[0],
    context: UserContext
  ): Recommendation | null {
    const tags = GROUNDING_TAGS[technique.id];
    if (!tags) return null;

    const { score, reason } = this.scoreContent(tags, context, 'grounding');

    return {
      id: technique.id,
      type: 'grounding',
      title: technique.name,
      subtitle: technique.bestFor || technique.description,
      description: technique.description,
      duration: technique.duration,
      icon: CATEGORY_ICONS[technique.category] || TYPE_ICONS.grounding,
      route: 'GroundingSession',
      routeParams: { techniqueId: technique.id },
      score,
      reason,
      tags,
    };
  }

  private journalToRecommendation(
    prompt: typeof JOURNAL_PROMPTS[0],
    context: UserContext
  ): Recommendation | null {
    const tags = JOURNAL_TAGS[prompt.id];
    if (!tags) return null;

    const { score, reason } = this.scoreContent(tags, context, 'journal');

    return {
      id: prompt.id,
      type: 'journal',
      title: prompt.description || 'Journal Prompt',
      subtitle: prompt.text,
      description: prompt.text,
      duration: tags.durationCategory === 'quick' ? '3 min' : tags.durationCategory === 'long' ? '15 min' : '5 min',
      icon: CATEGORY_ICONS[prompt.category] || TYPE_ICONS.journal,
      route: 'JournalEntry',
      routeParams: { mode: 'prompt', prompt: prompt.text },
      score,
      reason,
      tags,
    };
  }

  private focusToRecommendation(
    session: typeof FOCUS_SESSIONS[0],
    context: UserContext
  ): Recommendation | null {
    const tags = FOCUS_TAGS[session.id];
    if (!tags) return null;

    const { score, reason } = this.scoreContent(tags, context, 'focus');

    return {
      id: session.id,
      type: 'focus',
      title: session.name,
      subtitle: session.purpose || session.description,
      description: session.description,
      duration: session.duration === 0 ? 'Open' : `${session.duration} min`,
      icon: CATEGORY_ICONS[session.category] || TYPE_ICONS.focus,
      route: 'FocusSession',
      routeParams: { sessionId: session.id },
      score,
      reason,
      tags,
    };
  }

  private storyToRecommendation(
    story: typeof BEDTIME_STORIES[0],
    context: UserContext
  ): Recommendation | null {
    const tags = STORY_TAGS[story.id];
    if (!tags) return null;

    const { score, reason } = this.scoreContent(tags, context, 'story');

    return {
      id: story.id,
      type: 'story',
      title: story.title,
      subtitle: story.subtitle,
      description: story.description,
      duration: `${story.duration} min`,
      icon: CATEGORY_ICONS[story.category] || TYPE_ICONS.story,
      route: 'StoryPlayer',
      routeParams: { storyId: story.id },
      score,
      reason,
      isPremium: story.isPremium,
      tags,
    };
  }

  // ---------------------------------------------------------------------------
  // SCORING ALGORITHM
  // ---------------------------------------------------------------------------

  private scoreContent(
    tags: ContentTags,
    context: UserContext,
    type: string
  ): { score: number; reason: string } {
    let score = 50; // Base score
    let reasons: string[] = [];

    // 1. MOOD MATCH (+25 points)
    if (context.currentMood && matchesMood(tags, context.currentMood)) {
      score += 25;
      reasons.push(this.getMoodReason(context.currentMood));
    }

    // 2. TIME OF DAY MATCH (+20 points)
    if (matchesTime(tags, context.timeOfDay)) {
      score += 20;
      if (tags.times.includes(context.timeOfDay)) {
        reasons.push(this.getTimeReason(context.timeOfDay));
      }
    }

    // 3. WELLNESS GOALS MATCH (+15 points per goal, max 30)
    if (context.wellnessGoals.length > 0) {
      const matchingGoals = context.wellnessGoals.filter(g => matchesGoal(tags, g));
      if (matchingGoals.length > 0) {
        score += Math.min(matchingGoals.length * 15, 30);
        reasons.push(this.getGoalReason(matchingGoals[0]));
      }
    }

    // 4. RECENT MOOD PATTERNS (+10 points)
    if (context.recentMoods.length >= 3) {
      const anxiousCount = context.recentMoods.filter(m => m === 'anxious').length;
      const lowCount = context.recentMoods.filter(m => m === 'low').length;
      
      if (anxiousCount >= 2 && tags.goals.includes('anxiety')) {
        score += 10;
        reasons.push('Based on your recent patterns');
      } else if (lowCount >= 2 && tags.goals.includes('mood')) {
        score += 10;
        reasons.push('To help lift your spirits');
      }
    }

    // 5. BEGINNER BOOST (+5 points for new users)
    if (context.totalSessions < 10 && tags.difficulty === 'beginner') {
      score += 5;
      if (reasons.length === 0) {
        reasons.push('Great for getting started');
      }
    }

    // 6. VARIETY PENALTY (-15 points for recently done)
    if (context.lastActivityId === tags.keywords[0]) {
      score -= 15;
    }
    
    // Check if same type was done recently
    const recentOfType = this.activityHistory
      .slice(0, 5)
      .filter(a => a.type === type).length;
    if (recentOfType >= 2) {
      score -= 10;
    }

    // 7. FAVORITE TYPE BOOST (+5 points)
    if (context.favoriteTypes.includes(type)) {
      score += 5;
    }

    // 8. WEEKEND BONUS (+5 for longer content on weekends)
    if (context.isWeekend && tags.durationCategory === 'long') {
      score += 5;
    }

    // Default reason if none set
    if (reasons.length === 0) {
      reasons.push(this.getDefaultReason(type));
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reason: reasons[0],
    };
  }

  private getMoodReason(mood: MoodType): string {
    const reasons: Record<MoodType, string> = {
      anxious: 'Designed to calm your mind',
      low: 'A gentle lift when you need it',
      tough: 'Help you process difficult feelings',
      calm: 'Deepen your sense of peace',
      good: 'Build on your positive energy',
      energized: 'Channel your energy mindfully',
    };
    return reasons[mood] || 'Matches how you\'re feeling';
  }

  private getTimeReason(time: TimeOfDay): string {
    const reasons: Record<TimeOfDay, string> = {
      morning: 'Perfect way to start your day',
      afternoon: 'Ideal for a midday reset',
      evening: 'Wind down your evening',
      night: 'Prepare for restful sleep',
      anytime: 'Good for any moment',
    };
    return reasons[time];
  }

  private getGoalReason(goal: WellnessGoal): string {
    const reasons: Record<WellnessGoal, string> = {
      anxiety: 'Aligned with your anxiety relief goals',
      sleep: 'Supports your sleep improvement journey',
      focus: 'Helps sharpen your concentration',
      stress: 'Aids your stress management practice',
      mood: 'Supports emotional wellbeing',
      presence: 'Cultivates mindful presence',
    };
    return reasons[goal];
  }

  private getDefaultReason(type: string): string {
    const reasons: Record<string, string> = {
      breathing: 'Breathing brings calm and clarity',
      grounding: 'Stay present and centered',
      focus: 'Enhance your productivity',
      journal: 'Reflection deepens self-awareness',
      story: 'Drift off to peaceful sleep',
    };
    return reasons[type] || 'Recommended for you';
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Get personalized recommendations
   */
  getRecommendations(currentMood?: MoodType, limit: number = 8): Recommendation[] {
    const context = this.getUserContext(currentMood);
    const allRecommendations: Recommendation[] = [];

    // Convert all content to recommendations
    BREATHING_PATTERNS.forEach(pattern => {
      const rec = this.breathingToRecommendation(pattern, context);
      if (rec) allRecommendations.push(rec);
    });

    GROUNDING_TECHNIQUES.forEach(technique => {
      const rec = this.groundingToRecommendation(technique, context);
      if (rec) allRecommendations.push(rec);
    });

    JOURNAL_PROMPTS.forEach(prompt => {
      const rec = this.journalToRecommendation(prompt, context);
      if (rec) allRecommendations.push(rec);
    });

    FOCUS_SESSIONS.forEach(session => {
      const rec = this.focusToRecommendation(session, context);
      if (rec) allRecommendations.push(rec);
    });

    // Only add stories at night/evening
    if (context.timeOfDay === 'night' || context.timeOfDay === 'evening') {
      BEDTIME_STORIES.forEach(story => {
        const rec = this.storyToRecommendation(story, context);
        if (rec) allRecommendations.push(rec);
      });
    }

    // Sort by score and return top N
    return allRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get "For You" section items (curated mix)
   */
  getForYouItems(currentMood?: MoodType, limit: number = 4): Recommendation[] {
    const recs = this.getRecommendations(currentMood, 20);
    
    // Ensure variety - pick best from different types
    const byType: Record<string, Recommendation[]> = {};
    recs.forEach(rec => {
      if (!byType[rec.type]) byType[rec.type] = [];
      byType[rec.type].push(rec);
    });

    const selected: Recommendation[] = [];
    const types = Object.keys(byType);
    
    // Round-robin selection to ensure variety
    let typeIndex = 0;
    while (selected.length < limit && types.length > 0) {
      const type = types[typeIndex % types.length];
      const typeRecs = byType[type];
      
      if (typeRecs && typeRecs.length > 0) {
        selected.push(typeRecs.shift()!);
      } else {
        types.splice(typeIndex % types.length, 1);
      }
      
      typeIndex++;
    }

    return selected.sort((a, b) => b.score - a.score);
  }

  /**
   * Get quick action (single best recommendation)
   */
  getQuickAction(currentMood?: MoodType): Recommendation | null {
    const recs = this.getRecommendations(currentMood, 1);
    return recs[0] || null;
  }

  /**
   * Get recommendations by type
   */
  getByType(type: Recommendation['type'], currentMood?: MoodType, limit: number = 5): Recommendation[] {
    return this.getRecommendations(currentMood, 50)
      .filter(r => r.type === type)
      .slice(0, limit);
  }

  /**
   * Get recommendations for a specific goal
   */
  getByGoal(goal: WellnessGoal, limit: number = 5): Recommendation[] {
    const context = this.getUserContext();
    return this.getRecommendations(undefined, 50)
      .filter(r => r.tags?.goals.includes(goal))
      .slice(0, limit);
  }

  /**
   * Get greeting based on time and context
   */
  getGreeting(userName?: string): { greeting: string; subtitle: string } {
    const hour = getHours(new Date());
    let greeting = 'Hello';
    let subtitle = 'How can I help you today?';

    if (hour >= 5 && hour < 12) {
      greeting = userName ? `Good morning, ${userName}` : 'Good morning';
      subtitle = 'Start your day with intention';
    } else if (hour >= 12 && hour < 17) {
      greeting = userName ? `Good afternoon, ${userName}` : 'Good afternoon';
      subtitle = 'Time for a mindful reset?';
    } else if (hour >= 17 && hour < 21) {
      greeting = userName ? `Good evening, ${userName}` : 'Good evening';
      subtitle = 'Wind down and reflect';
    } else {
      greeting = userName ? `Hey ${userName}` : 'Hello';
      subtitle = 'Ready for restful sleep?';
    }

    return { greeting, subtitle };
  }

  /**
   * Get daily insight based on patterns
   */
  getDailyInsight(): { icon: string; title: string; body: string } {
    const context = this.getUserContext();

    // Personalized insights based on patterns
    if (context.recentMoods.length >= 5) {
      const anxiousCount = context.recentMoods.filter(m => m === 'anxious').length;
      if (anxiousCount >= 3) {
        return {
          icon: '💡',
          title: 'Insight for You',
          body: 'You\'ve been feeling anxious more often lately. Regular breathing practice can help reduce baseline anxiety. Try a 5-minute session each morning.',
        };
      }
    }

    if (context.totalSessions >= 20) {
      return {
        icon: '🌟',
        title: 'You\'re Making Progress',
        body: `With ${context.totalSessions} sessions, you're building a real wellness practice. Consistency is more powerful than intensity.`,
      };
    }

    if (context.streakDays >= 7) {
      return {
        icon: '🔥',
        title: `${context.streakDays}-Day Streak!`,
        body: 'You\'re on a roll! Keep showing up for yourself. Small daily actions create big transformations.',
      };
    }

    // Default insights
    const insights = [
      {
        icon: '🧠',
        title: 'Did You Know?',
        body: 'Just 5 minutes of breathwork can reduce cortisol levels by up to 20%. Your nervous system responds quickly to intentional breathing.',
      },
      {
        icon: '💜',
        title: 'Self-Compassion',
        body: 'You don\'t need to be perfect. Showing up, even on hard days, is what matters most.',
      },
      {
        icon: '🌱',
        title: 'Growth Mindset',
        body: 'Each practice session is planting a seed. Trust the process, even when you can\'t see immediate results.',
      },
      {
        icon: '⚡',
        title: 'Energy Flows',
        body: 'Your energy follows your attention. Where you focus, you flourish.',
      },
      {
        icon: '🎯',
        title: 'Micro-Moments Matter',
        body: 'Even 2 minutes of mindful breathing between tasks can reset your nervous system.',
      },
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Get stats
   */
  getStats(): {
    totalSessions: number;
    streakDays: number;
    favoriteType: string | null;
    goalsSet: boolean;
  } {
    const context = this.getUserContext();
    return {
      totalSessions: context.totalSessions,
      streakDays: context.streakDays,
      favoriteType: context.favoriteTypes[0] || null,
      goalsSet: context.wellnessGoals.length > 0,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const smartRecommendations = new SmartRecommendationsEngine();

// Backwards compatibility with old recommendations API
export const recommendations = {
  initialize: () => smartRecommendations.initialize(),
  recordMood: (mood: MoodType) => smartRecommendations.recordMood(mood),
  recordActivity: (type: string, id: string) => smartRecommendations.recordActivity(type, id),
  getRecommendations: (mood?: MoodType, limit?: number) => smartRecommendations.getRecommendations(mood, limit),
  getForYouItems: (mood?: MoodType) => smartRecommendations.getForYouItems(mood),
  getQuickAction: (mood?: MoodType) => smartRecommendations.getQuickAction(mood),
  getGreeting: (userName?: string) => smartRecommendations.getGreeting(userName),
  getDailyInsight: () => smartRecommendations.getDailyInsight(),
  getStats: () => smartRecommendations.getStats(),
  setWellnessGoals: (goals: WellnessGoal[]) => smartRecommendations.setWellnessGoals(goals),
  getByType: (type: Recommendation['type'], mood?: MoodType, limit?: number) => smartRecommendations.getByType(type, mood, limit),
  getByGoal: (goal: WellnessGoal, limit?: number) => smartRecommendations.getByGoal(goal, limit),
};
