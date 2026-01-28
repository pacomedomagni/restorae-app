/**
 * Recommendations Service
 * AI-powered personalized content recommendations
 * 
 * Exceeds industry standards with:
 * - Time-of-day awareness
 * - Mood pattern analysis
 * - Activity history learning
 * - Weather-based suggestions (future)
 * - Adaptive difficulty progression
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, getHours, isWeekend, differenceInDays, subDays } from 'date-fns';
import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface Recommendation {
  id: string;
  type: 'breathing' | 'grounding' | 'focus' | 'journal' | 'story' | 'ritual' | 'sos';
  title: string;
  subtitle: string;
  reason: string;
  priority: number; // 1-10, higher = more relevant
  duration: string;
  icon: string;
  route: string;
  routeParams?: Record<string, any>;
  tags: string[];
}

export interface UserContext {
  timeOfDay: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isWeekend: boolean;
  recentMoods: MoodType[];
  lastActivity?: string;
  streakDays: number;
  totalSessions: number;
  favoriteTools: string[];
  strugglingWith: string[];
}

export interface MoodPattern {
  mood: MoodType;
  frequency: number;
  timeOfDay: string[];
  triggers?: string[];
}

// =============================================================================
// CONTENT DATABASE
// =============================================================================

const RECOMMENDATIONS_DB: Omit<Recommendation, 'reason' | 'priority'>[] = [
  // Morning recommendations
  {
    id: 'morning-breathe',
    type: 'breathing',
    title: 'Energizing Breath',
    subtitle: 'Start your day with vitality',
    duration: '4 min',
    icon: '🌅',
    route: 'Breathing',
    routeParams: { patternId: 'breath-of-fire' },
    tags: ['morning', 'energy', 'wake-up'],
  },
  {
    id: 'morning-ritual',
    type: 'ritual',
    title: 'Morning Ritual',
    subtitle: 'Intentional start to your day',
    duration: '10 min',
    icon: '☀️',
    route: 'MorningRitual',
    tags: ['morning', 'routine', 'intention'],
  },
  {
    id: 'clarity-breath',
    type: 'breathing',
    title: 'Clarity Breath',
    subtitle: 'Mental sharpness for the day ahead',
    duration: '5 min',
    icon: '💎',
    route: 'Breathing',
    routeParams: { patternId: 'clarity-boost' },
    tags: ['morning', 'focus', 'clarity'],
  },

  // Daytime focus
  {
    id: 'deep-focus',
    type: 'focus',
    title: 'Deep Focus Session',
    subtitle: 'Distraction-free productivity',
    duration: '25 min',
    icon: '🎯',
    route: 'FocusSession',
    routeParams: { sessionId: 'pomodoro' },
    tags: ['afternoon', 'focus', 'work'],
  },
  {
    id: 'midday-reset',
    type: 'grounding',
    title: 'Midday Reset',
    subtitle: 'Re-center and refresh',
    duration: '5 min',
    icon: '🌿',
    route: 'Grounding',
    routeParams: { techniqueId: 'body-scan' },
    tags: ['afternoon', 'reset', 'refresh'],
  },
  {
    id: 'meeting-prep',
    type: 'breathing',
    title: 'Pre-Meeting Calm',
    subtitle: 'Confidence before important moments',
    duration: '3 min',
    icon: '💼',
    route: 'Breathing',
    routeParams: { patternId: 'meeting-reset' },
    tags: ['afternoon', 'confidence', 'work'],
  },

  // Evening wind-down
  {
    id: 'evening-unwind',
    type: 'breathing',
    title: 'Evening Unwind',
    subtitle: 'Release the day\'s tension',
    duration: '6 min',
    icon: '🌙',
    route: 'Breathing',
    routeParams: { patternId: '4-7-8-relaxing' },
    tags: ['evening', 'relax', 'wind-down'],
  },
  {
    id: 'evening-ritual',
    type: 'ritual',
    title: 'Evening Ritual',
    subtitle: 'Peaceful transition to rest',
    duration: '12 min',
    icon: '🌛',
    route: 'EveningRitual',
    tags: ['evening', 'routine', 'sleep-prep'],
  },
  {
    id: 'gratitude-journal',
    type: 'journal',
    title: 'Gratitude Reflection',
    subtitle: 'End the day with appreciation',
    duration: '5 min',
    icon: '🙏',
    route: 'JournalEntry',
    routeParams: { mode: 'prompt', prompt: 'What are three things you\'re grateful for today?' },
    tags: ['evening', 'gratitude', 'reflection'],
  },

  // Sleep
  {
    id: 'sleep-story',
    type: 'story',
    title: 'Bedtime Story',
    subtitle: 'Drift off to peaceful sleep',
    duration: '20 min',
    icon: '🌜',
    route: 'StoryPlayer',
    routeParams: { storyId: 'mountain-lake' },
    tags: ['night', 'sleep', 'story'],
  },
  {
    id: 'sleep-breath',
    type: 'breathing',
    title: 'Sleep Breath',
    subtitle: 'Prepare your body for rest',
    duration: '8 min',
    icon: '💤',
    route: 'Breathing',
    routeParams: { patternId: 'moon-breath' },
    tags: ['night', 'sleep', 'relax'],
  },

  // Anxiety support
  {
    id: 'anxiety-sos',
    type: 'breathing',
    title: 'Anxiety Relief',
    subtitle: 'Quick calm for anxious moments',
    duration: '3 min',
    icon: '🫂',
    route: 'Breathing',
    routeParams: { patternId: 'anxiety-reset' },
    tags: ['anxiety', 'calm', 'emergency'],
  },
  {
    id: 'grounding-54321',
    type: 'grounding',
    title: '5-4-3-2-1 Grounding',
    subtitle: 'Anchor yourself to the present',
    duration: '5 min',
    icon: '🌳',
    route: 'GroundingSession',
    routeParams: { techniqueId: '54321-senses' },
    tags: ['anxiety', 'grounding', 'present'],
  },

  // Low mood support
  {
    id: 'mood-lift',
    type: 'breathing',
    title: 'Mood Lifter',
    subtitle: 'Gentle energy when feeling low',
    duration: '5 min',
    icon: '🌻',
    route: 'Breathing',
    routeParams: { patternId: 'energizing-breath' },
    tags: ['low', 'energy', 'mood'],
  },
  {
    id: 'release-journal',
    type: 'journal',
    title: 'Release & Let Go',
    subtitle: 'Write out what\'s weighing on you',
    duration: '10 min',
    icon: '✍️',
    route: 'JournalEntry',
    routeParams: { mode: 'prompt', prompt: 'What do you need to let go of today?' },
    tags: ['low', 'release', 'journal'],
  },

  // Stress support
  {
    id: 'stress-release',
    type: 'grounding',
    title: 'Stress Release',
    subtitle: 'Physical tension relief',
    duration: '8 min',
    icon: '💆',
    route: 'ResetSession',
    routeParams: { exerciseId: 'progressive-relaxation' },
    tags: ['stress', 'body', 'tension'],
  },

  // Weekend specials
  {
    id: 'weekend-reflection',
    type: 'journal',
    title: 'Weekly Reflection',
    subtitle: 'Review and plan mindfully',
    duration: '15 min',
    icon: '📝',
    route: 'JournalEntry',
    routeParams: { mode: 'prompt', prompt: 'What went well this week? What would you like to improve?' },
    tags: ['weekend', 'reflection', 'planning'],
  },
  {
    id: 'long-focus',
    type: 'focus',
    title: 'Deep Work Session',
    subtitle: 'Extended focus for projects',
    duration: '45 min',
    icon: '🏔️',
    route: 'FocusSession',
    routeParams: { sessionId: 'deep-work' },
    tags: ['weekend', 'focus', 'project'],
  },

  // New user recommendations
  {
    id: 'first-breath',
    type: 'breathing',
    title: 'Your First Breath',
    subtitle: 'A gentle introduction to breathwork',
    duration: '4 min',
    icon: '🌱',
    route: 'Breathing',
    routeParams: { patternId: 'box-breathing' },
    tags: ['beginner', 'introduction', 'easy'],
  },
  {
    id: 'explore-grounding',
    type: 'grounding',
    title: 'Discover Grounding',
    subtitle: 'Learn to anchor in the present',
    duration: '5 min',
    icon: '🔍',
    route: 'GroundingSelect',
    tags: ['beginner', 'exploration', 'grounding'],
  },
];

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEYS = {
  MOOD_HISTORY: '@restorae:mood_history',
  ACTIVITY_HISTORY: '@restorae:activity_history',
  USER_PREFERENCES: '@restorae:user_preferences',
};

// =============================================================================
// RECOMMENDATIONS SERVICE
// =============================================================================

class RecommendationsService {
  private moodHistory: { mood: MoodType; timestamp: string }[] = [];
  private activityHistory: { type: string; timestamp: string; id: string }[] = [];

  async initialize(): Promise<void> {
    await this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    const [moodData, activityData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.MOOD_HISTORY),
      AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY),
    ]);

    if (moodData) {
      this.moodHistory = JSON.parse(moodData);
    }
    if (activityData) {
      this.activityHistory = JSON.parse(activityData);
    }
  }

  // Record mood for learning
  async recordMood(mood: MoodType): Promise<void> {
    this.moodHistory.push({
      mood,
      timestamp: new Date().toISOString(),
    });

    // Keep last 100 entries
    if (this.moodHistory.length > 100) {
      this.moodHistory = this.moodHistory.slice(-100);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MOOD_HISTORY, JSON.stringify(this.moodHistory));
  }

  // Record activity for learning
  async recordActivity(type: string, id: string): Promise<void> {
    this.activityHistory.push({
      type,
      id,
      timestamp: new Date().toISOString(),
    });

    // Keep last 200 entries
    if (this.activityHistory.length > 200) {
      this.activityHistory = this.activityHistory.slice(-200);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_HISTORY, JSON.stringify(this.activityHistory));
  }

  // Get current user context
  private getUserContext(): UserContext {
    const now = new Date();
    const hour = getHours(now);

    let timeOfDay: UserContext['timeOfDay'];
    if (hour < 6) timeOfDay = 'early_morning';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Get recent moods (last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    const recentMoods = this.moodHistory
      .filter(m => new Date(m.timestamp) >= sevenDaysAgo)
      .map(m => m.mood);

    // Get favorite tools (most used in last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentActivities = this.activityHistory.filter(
      a => new Date(a.timestamp) >= thirtyDaysAgo
    );
    const toolCounts: Record<string, number> = {};
    recentActivities.forEach(a => {
      toolCounts[a.type] = (toolCounts[a.type] || 0) + 1;
    });
    const favoriteTools = Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tool]) => tool);

    // Determine what user might be struggling with
    const moodCounts: Record<MoodType, number> = {} as Record<MoodType, number>;
    recentMoods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    const strugglingWith: string[] = [];
    if ((moodCounts.anxious || 0) > 3) strugglingWith.push('anxiety');
    if ((moodCounts.low || 0) > 3) strugglingWith.push('low-mood');
    if ((moodCounts.tough || 0) > 3) strugglingWith.push('stress');

    return {
      timeOfDay,
      dayOfWeek: format(now, 'EEEE'),
      isWeekend: isWeekend(now),
      recentMoods,
      lastActivity: this.activityHistory[this.activityHistory.length - 1]?.type,
      streakDays: 0, // Would come from gamification service
      totalSessions: this.activityHistory.length,
      favoriteTools,
      strugglingWith,
    };
  }

  // Main recommendation function
  getRecommendations(currentMood?: MoodType, limit: number = 5): Recommendation[] {
    const context = this.getUserContext();
    const scored: Recommendation[] = [];

    for (const rec of RECOMMENDATIONS_DB) {
      let priority = 5; // Base priority
      let reason = '';

      // Time-of-day scoring
      if (rec.tags.includes(context.timeOfDay)) {
        priority += 3;
        reason = `Perfect for ${context.timeOfDay.replace('_', ' ')}`;
      } else if (rec.tags.includes('morning') && context.timeOfDay === 'early_morning') {
        priority += 2;
        reason = 'Great way to start your day';
      } else if (rec.tags.includes('evening') && context.timeOfDay === 'night') {
        priority += 2;
        reason = 'Wind down before sleep';
      }

      // Mood-based scoring
      if (currentMood) {
        if (currentMood === 'anxious' && rec.tags.includes('anxiety')) {
          priority += 4;
          reason = 'Specially designed for anxious moments';
        } else if (currentMood === 'low' && rec.tags.includes('low')) {
          priority += 4;
          reason = 'A gentle lift when you need it';
        } else if (currentMood === 'energized' && rec.tags.includes('focus')) {
          priority += 2;
          reason = 'Channel your energy productively';
        } else if (currentMood === 'calm' && rec.tags.includes('relax')) {
          priority += 2;
          reason = 'Deepen your sense of calm';
        }
      }

      // Weekend scoring
      if (context.isWeekend && rec.tags.includes('weekend')) {
        priority += 2;
        reason = reason || 'Perfect for the weekend';
      }

      // Struggling-with scoring
      for (const struggle of context.strugglingWith) {
        if (rec.tags.includes(struggle.replace('-', ''))) {
          priority += 3;
          reason = `Based on your recent patterns`;
          break;
        }
      }

      // New user boost
      if (context.totalSessions < 10 && rec.tags.includes('beginner')) {
        priority += 3;
        reason = 'Great for getting started';
      }

      // Variety scoring (penalize recently done)
      const lastDone = this.activityHistory.findIndex(
        a => a.id === rec.id || a.type === rec.type
      );
      if (lastDone >= 0 && lastDone < 3) {
        priority -= 2;
      }

      // Avoid recently done same type
      if (context.lastActivity === rec.type) {
        priority -= 1;
      }

      scored.push({
        ...rec,
        priority,
        reason: reason || this.getDefaultReason(rec),
      });
    }

    // Sort by priority and return top N
    return scored
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  private getDefaultReason(rec: Omit<Recommendation, 'reason' | 'priority'>): string {
    switch (rec.type) {
      case 'breathing':
        return 'Breathing brings calm and clarity';
      case 'grounding':
        return 'Stay present and centered';
      case 'focus':
        return 'Enhance your productivity';
      case 'journal':
        return 'Reflection deepens self-awareness';
      case 'story':
        return 'Relax with a calming story';
      case 'ritual':
        return 'Build positive daily habits';
      default:
        return 'Recommended for you';
    }
  }

  // Get greeting based on time and context
  getGreeting(userName?: string): { greeting: string; subtitle: string } {
    const context = this.getUserContext();
    const name = userName ? `, ${userName}` : '';

    const greetings: Record<UserContext['timeOfDay'], { greeting: string; subtitle: string }> = {
      early_morning: {
        greeting: `Early riser${name}! ☕`,
        subtitle: 'The world is quiet. Perfect for centering.',
      },
      morning: {
        greeting: `Good morning${name}! ☀️`,
        subtitle: 'A new day, a new opportunity for peace.',
      },
      afternoon: {
        greeting: `Good afternoon${name}! 🌤️`,
        subtitle: 'Take a moment to reset and refocus.',
      },
      evening: {
        greeting: `Good evening${name}! 🌆`,
        subtitle: 'Time to unwind and release the day.',
      },
      night: {
        greeting: `Peaceful night${name}! 🌙`,
        subtitle: 'Let\'s prepare for restful sleep.',
      },
    };

    return greetings[context.timeOfDay];
  }

  // Get daily insight
  getDailyInsight(): { icon: string; title: string; body: string } {
    const context = this.getUserContext();
    
    // Personalized insights based on patterns
    if (context.strugglingWith.includes('anxiety') && context.recentMoods.length > 5) {
      const anxiousCount = context.recentMoods.filter(m => m === 'anxious').length;
      if (anxiousCount > 2) {
        return {
          icon: '💡',
          title: 'Insight for You',
          body: 'You\'ve been feeling anxious more often lately. Regular breathing practice can help reduce baseline anxiety. Try a 5-minute session each morning.',
        };
      }
    }

    if (context.totalSessions > 20) {
      return {
        icon: '🌟',
        title: 'You\'re Making Progress',
        body: 'With over 20 sessions, you\'re building a real wellness practice. Consistency is more powerful than intensity.',
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

    // Return random insight
    return insights[Math.floor(Math.random() * insights.length)];
  }

  // Get "For You" section items
  getForYouItems(mood?: MoodType): Recommendation[] {
    const recs = this.getRecommendations(mood, 4);
    return recs.map(rec => ({
      ...rec,
      reason: `✨ ${rec.reason}`,
    }));
  }

  // Get quick action based on current context
  getQuickAction(mood?: MoodType): Recommendation | null {
    const recs = this.getRecommendations(mood, 1);
    return recs[0] || null;
  }
}

// Singleton
export const recommendations = new RecommendationsService();
