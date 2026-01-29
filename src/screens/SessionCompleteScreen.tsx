/**
 * SessionCompleteScreen
 * 
 * Unified completion screen for all tool sessions.
 * Provides consistent UX with:
 * - Celebration animation
 * - XP reward
 * - Session stats
 * - Next action suggestions
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import { useHaptics } from '../hooks/useHaptics';
import {
  Text,
  Button,
  GlassCard,
  AmbientBackground,
  Confetti,
  ParticleBurst,
} from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { gamification, Achievement, ActivityType } from '../services/gamification';
import { recommendations } from '../services/smartRecommendations';
import { activityLogger, ActivityCategory } from '../services/activityLogger';
import { analytics, AnalyticsEvents } from '../services/analytics';
import { RootStackParamList, MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================
type SessionType = 
  | 'breathing'
  | 'grounding'
  | 'reset'
  | 'focus'
  | 'journal'
  | 'story'
  | 'ritual'
  | 'mood';

interface SessionCompleteParams {
  sessionType: SessionType;
  sessionName?: string;
  duration?: number; // in seconds
  cycles?: number;
  steps?: number;
  wordCount?: number;
  mood?: MoodType;
}

const SESSION_MESSAGES: Record<SessionType, { title: string; subtitle: string }> = {
  breathing: {
    title: 'Beautiful breath',
    subtitle: 'You\'ve found your calm',
  },
  grounding: {
    title: 'Grounded',
    subtitle: 'Present in this moment',
  },
  reset: {
    title: 'Reset complete',
    subtitle: 'Tension released',
  },
  focus: {
    title: 'Deep focus achieved',
    subtitle: 'Your mind is clear',
  },
  journal: {
    title: 'Thoughts captured',
    subtitle: 'Reflection is growth',
  },
  story: {
    title: 'Sweet dreams await',
    subtitle: 'Rest well tonight',
  },
  ritual: {
    title: 'Ritual complete',
    subtitle: 'A beautiful practice',
  },
  mood: {
    title: 'Check-in saved',
    subtitle: 'Self-awareness is strength',
  },
};

const SESSION_XP: Record<SessionType, number> = {
  breathing: 15,
  grounding: 15,
  reset: 10,
  focus: 25,
  journal: 20,
  story: 15,
  ritual: 30,
  mood: 10,
};

// =============================================================================
// ANIMATED CHECKMARK
// =============================================================================
function AnimatedCheckmark() {
  const { colors, reduceMotion } = useTheme();
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      progress.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    } else {
      scale.value = 1;
      progress.value = 1;
    }
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const circumference = 2 * Math.PI * 40;

  return (
    <Animated.View style={[styles.checkmarkContainer, containerStyle]}>
      <View style={[styles.checkmarkCircle, { backgroundColor: withAlpha(colors.success, 0.15) }]}>
        <Svg width={100} height={100} viewBox="0 0 100 100">
          <Circle
            cx={50}
            cy={50}
            r={40}
            stroke={colors.success}
            strokeWidth={4}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.checkmarkIconWrapper}>
          <Text style={[styles.checkmarkEmoji]}>✓</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// XP COUNTER
// =============================================================================
interface XPCounterProps {
  xp: number;
  onComplete?: () => void;
}

function XPCounter({ xp, onComplete }: XPCounterProps) {
  const { colors, reduceMotion } = useTheme();
  const displayValue = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      displayValue.value = withDelay(
        400,
        withTiming(xp, { 
          duration: 1000, 
          easing: Easing.out(Easing.ease),
        })
      );
    } else {
      scale.value = 1;
      setDisplayXP(xp);
    }
  }, [xp]);

  // Update display value
  useEffect(() => {
    if (reduceMotion) return;
    
    const interval = setInterval(() => {
      const current = Math.round(displayValue.value);
      setDisplayXP(current);
      if (current >= xp) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [xp]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.xpContainer, containerStyle]}>
      <GlassCard variant="subtle" padding="md">
        <View style={styles.xpContent}>
          <View style={[styles.xpIconWrapper, { backgroundColor: withAlpha(colors.accentWarm, 0.15) }]}>
            <Text style={styles.xpIcon}>✨</Text>
          </View>
          <View style={styles.xpTextContainer}>
            <Text variant="labelSmall" color="inkFaint">
              XP EARNED
            </Text>
            <Text variant="headlineLarge" style={{ color: colors.accentWarm }}>
              +{displayXP}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// SESSION STAT
// =============================================================================
interface SessionStatProps {
  icon: string;
  label: string;
  value: string;
  delay?: number;
}

function SessionStat({ icon, label, value, delay = 0 }: SessionStatProps) {
  const { colors, reduceMotion } = useTheme();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.delay(delay).duration(400)}
      style={styles.statItem}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text variant="labelSmall" color="inkFaint" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="headlineSmall" color="ink">
        {value}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// NEXT ACTION SUGGESTION
// =============================================================================
interface NextActionProps {
  sessionType: SessionType;
  onPress: () => void;
}

function NextActionSuggestion({ sessionType, onPress }: NextActionProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const suggestions: Record<SessionType, { icon: string; label: string; description: string }> = {
    breathing: { icon: '📓', label: 'Journal', description: 'Capture how you feel' },
    grounding: { icon: '🌬️', label: 'Breathe', description: 'Continue your calm' },
    reset: { icon: '🎯', label: 'Focus', description: 'Channel your energy' },
    focus: { icon: '📓', label: 'Reflect', description: 'Document your progress' },
    journal: { icon: '🧘', label: 'Ground', description: 'Be present now' },
    story: { icon: '😴', label: 'Sleep Timer', description: 'Set a gentle alarm' },
    ritual: { icon: '📓', label: 'Journal', description: 'Reflect on your practice' },
    mood: { icon: '🌬️', label: 'Breathe', description: 'Support your mood' },
  };

  const suggestion = suggestions[sessionType];

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(800).duration(400)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard variant="elevated" padding="md">
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <View style={styles.suggestionText}>
                <Text variant="labelSmall" color="inkFaint">
                  SUGGESTED NEXT
                </Text>
                <Text variant="headlineSmall" color="ink">
                  {suggestion.label}
                </Text>
                <Text variant="bodySmall" color="inkMuted">
                  {suggestion.description}
                </Text>
              </View>
              <Text style={styles.chevronEmoji}>›</Text>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function SessionCompleteScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: SessionCompleteParams }, 'params'>>();
  const { notificationSuccess } = useHaptics();

  const {
    sessionType = 'breathing',
    sessionName,
    duration,
    cycles,
    steps,
    wordCount,
    mood,
  } = route.params || {};

  const [showConfetti, setShowConfetti] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const messages = SESSION_MESSAGES[sessionType];
  const xpEarned = SESSION_XP[sessionType];

  // Process completion and rewards
  useEffect(() => {
    const processCompletion = async () => {
      // Map session type to activity type
      const activityMap: Record<SessionType, ActivityType> = {
        breathing: 'breathing',
        grounding: 'grounding',
        reset: 'breathing', // Reset uses breathing as activity type
        focus: 'focus',
        journal: 'journal',
        story: 'story',
        ritual: 'ritual',
        mood: 'mood',
      };

      const activityType = activityMap[sessionType];
      const durationMinutes = duration ? Math.round(duration / 60) : 0;

      // Log activity to backend
      const categoryMap: Record<SessionType, ActivityCategory> = {
        breathing: 'breathing',
        grounding: 'grounding',
        reset: 'reset',
        focus: 'focus',
        journal: 'journal',
        story: 'story',
        ritual: 'ritual',
        mood: 'mood',
      };

      await activityLogger.logActivity({
        category: categoryMap[sessionType],
        activityId: sessionName || sessionType,
        activityName: sessionName || sessionType,
        startedAt: Date.now() - (duration || 0) * 1000,
        durationSeconds: duration || 0,
        completed: true,
        metadata: {
          cycles,
          steps,
          wordCount,
          mood,
        },
      });

      // Track analytics event for session completion
      analytics.track(AnalyticsEvents.TOOL_COMPLETED, {
        sessionType,
        sessionName: sessionName || sessionType,
        durationSeconds: duration || 0,
        durationMinutes,
        cycles,
        steps,
        wordCount,
        mood,
        xpEarned,
      });

      // Record activity (awards XP, updates streaks, checks achievements)
      const result = await gamification.recordActivity(
        activityType,
        durationMinutes,
        { sessionName: sessionName || sessionType }
      );

      // Record activity for recommendations learning
      await recommendations.recordActivity(sessionType, sessionName || sessionType);

      // Store pending celebrations for home screen
      if (result.levelUp && result.newLevel) {
        await AsyncStorage.setItem(
          '@restorae:pending_levelup',
          JSON.stringify(result.newLevel)
        );
      }

      if (result.newAchievements.length > 0) {
        await AsyncStorage.setItem(
          '@restorae:pending_achievement',
          JSON.stringify(result.newAchievements[0])
        );
        setUnlockedAchievement(result.newAchievements[0]);
      }

      // Show celebration
      await notificationSuccess();
      setShowConfetti(true);
      setTimeout(() => setShowParticles(true), 300);
    };

    processCompletion();
  }, []);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // Get stats for session type
  const getStats = () => {
    const stats: { icon: string; label: string; value: string }[] = [];

    if (duration) {
      stats.push({ icon: '⏱️', label: 'DURATION', value: formatDuration(duration) });
    }
    if (cycles) {
      stats.push({ icon: '🔄', label: 'CYCLES', value: cycles.toString() });
    }
    if (steps) {
      stats.push({ icon: '👣', label: 'STEPS', value: steps.toString() });
    }
    if (wordCount) {
      stats.push({ icon: '✍️', label: 'WORDS', value: wordCount.toString() });
    }

    return stats;
  };

  const stats = getStats();

  // Navigation handlers
  const handleGoHome = () => {
    // Reset navigation stack to prevent back button from returning to session
    // This allows the user to start fresh on the Home screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleSuggestion = () => {
    const routes: Record<SessionType, keyof RootStackParamList> = {
      breathing: 'JournalEntry',
      grounding: 'BreathingSelect',
      reset: 'FocusSelect',
      focus: 'JournalEntry',
      journal: 'GroundingSelect',
      story: 'Main',
      ritual: 'JournalEntry',
      mood: 'BreathingSelect',
    };

    const targetRoute = routes[sessionType];
    
    if (targetRoute === 'JournalEntry') {
      navigation.navigate('JournalEntry', { mode: 'new' });
    } else {
      navigation.navigate(targetRoute as any);
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="normal" />

      {/* Celebration Effects */}
      <Confetti 
        active={showConfetti}
        intensity={reduceMotion ? 'low' : 'high'}
        onComplete={() => {}}
      />
      <ParticleBurst 
        active={showParticles}
        centerX={layout.screenPaddingHorizontal + 150} 
        centerY={200}
        onComplete={() => {}}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Checkmark Animation */}
          <AnimatedCheckmark />

          {/* Messages */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(500)}
            style={styles.messagesContainer}
          >
            <Text variant="displayMedium" color="ink" align="center">
              {messages.title}
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.subtitle}>
              {messages.subtitle}
            </Text>
          </Animated.View>

          {/* XP Reward */}
          <XPCounter xp={xpEarned} />

          {/* Session Stats */}
          {stats.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(600).duration(400)}
              style={styles.statsContainer}
            >
              {stats.map((stat, index) => (
                <SessionStat
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  delay={600 + index * 100}
                />
              ))}
            </Animated.View>
          )}

          {/* Achievement Unlock Preview */}
          {unlockedAchievement && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.delay(700).duration(400)}
              style={styles.achievementPreview}
            >
              <GlassCard variant="subtle" padding="sm">
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementIcon}>🏆</Text>
                  <View style={styles.achievementText}>
                    <Text variant="labelSmall" color="inkFaint">
                      NEW ACHIEVEMENT
                    </Text>
                    <Text variant="bodyMedium" color="ink">
                      {unlockedAchievement.title}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Next Action Suggestion */}
          <NextActionSuggestion sessionType={sessionType} onPress={handleSuggestion} />
        </View>

        {/* Footer */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(1000).duration(400)}
          style={styles.footer}
        >
          <Button
            variant="glow"
            size="lg"
            tone="primary"
            fullWidth
            onPress={handleGoHome}
          >
            Back to Home
          </Button>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[8],
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginBottom: spacing[6],
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIconWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  xpContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  xpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  xpIcon: {
    fontSize: 24,
  },
  xpTextContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    marginBottom: spacing[6],
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  statLabel: {
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  achievementPreview: {
    width: '100%',
    marginBottom: spacing[4],
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 28,
    marginRight: spacing[3],
  },
  achievementText: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 32,
    marginRight: spacing[4],
  },
  suggestionText: {
    flex: 1,
  },
  chevronEmoji: {
    fontSize: 24,
    color: '#999',
  },
  checkmarkEmoji: {
    fontSize: 40,
    color: '#6FA08B',
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[4],
  },
});

export default SessionCompleteScreen;
