/**
 * SessionCompleteScreen
 *
 * Unified completion screen for all tool sessions.
 * Premium, reflective experience — no gamification.
 *
 * - Soft glow animation (replaces confetti)
 * - Reflective quote per session type
 * - Clean stats with icons (no emoji)
 * - Gentle next-action suggestion
 */
import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useHaptics } from '../hooks/useHaptics';
import {
  Text,
  Button,
  GlassCard,
  AmbientBackground,
  SoftGlow,
} from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
import { gamification, Achievement, ActivityType } from '../services/gamification';
import { recommendations } from '../services/smartRecommendations';
import { activityLogger, ActivityCategory } from '../services/activityLogger';
import { analytics, AnalyticsEvents } from '../services/analytics';
import { getReflection } from '../data/reflections';
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
  duration?: number;
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

// XP values kept for internal tracking only — never displayed to user
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

// Ionicons for each stat type — clean, no emoji
const STAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DURATION: 'time-outline',
  CYCLES: 'repeat-outline',
  STEPS: 'footsteps-outline',
  WORDS: 'create-outline',
};

// Suggestion icons per session type
const SUGGESTION_ICONS: Record<SessionType, keyof typeof Ionicons.glyphMap> = {
  breathing: 'book-outline',
  grounding: 'leaf-outline',
  reset: 'compass-outline',
  focus: 'book-outline',
  journal: 'body-outline',
  story: 'moon-outline',
  ritual: 'book-outline',
  mood: 'leaf-outline',
};

// =============================================================================
// ANIMATED CHECKMARK
// =============================================================================
function AnimatedCheckmark() {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = 1;
    }
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const circumference = 2 * Math.PI * 40;

  return (
    <Animated.View style={[styles.checkmarkContainer, containerStyle]}>
      <View style={[styles.checkmarkCircle, { backgroundColor: withAlpha(colors.success, 0.12) }]}>
        <Svg width={100} height={100} viewBox="0 0 100 100">
          <Circle
            cx={50}
            cy={50}
            r={40}
            stroke={colors.success}
            strokeWidth={3}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.checkmarkIconWrapper}>
          <Ionicons name="checkmark" size={40} color={colors.success} />
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// SESSION STAT
// =============================================================================
interface SessionStatProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  delay?: number;
}

function SessionStat({ iconName, label, value, delay = 0 }: SessionStatProps) {
  const { colors, reduceMotion } = useTheme();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.delay(delay).duration(400)}
      style={styles.statItem}
    >
      <Ionicons name={iconName} size={20} color={colors.inkFaint} style={styles.statIconStyle} />
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

  const suggestions: Record<SessionType, { label: string; description: string }> = {
    breathing: { label: 'Journal', description: 'Capture how you feel' },
    grounding: { label: 'Breathe', description: 'Continue your calm' },
    reset: { label: 'Focus', description: 'Channel your energy' },
    focus: { label: 'Reflect', description: 'Document your progress' },
    journal: { label: 'Ground', description: 'Be present now' },
    story: { label: 'Sleep Timer', description: 'Set a gentle alarm' },
    ritual: { label: 'Journal', description: 'Reflect on your practice' },
    mood: { label: 'Breathe', description: 'Support your mood' },
  };

  const suggestion = suggestions[sessionType];
  const iconName = SUGGESTION_ICONS[sessionType];

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
        accessibilityRole="button"
        accessibilityLabel={`${suggestion.label}: ${suggestion.description}`}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard variant="elevated" padding="md">
            <View style={styles.suggestionContent}>
              <View style={[styles.suggestionIconWrapper, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
                <Ionicons name={iconName} size={22} color={colors.accentPrimary} />
              </View>
              <View style={styles.suggestionText}>
                <Text variant="labelSmall" color="inkFaint">
                  CONTINUE WITH
                </Text>
                <Text variant="headlineSmall" color="ink">
                  {suggestion.label}
                </Text>
                <Text variant="bodySmall" color="inkMuted">
                  {suggestion.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
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

  const [showGlow, setShowGlow] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);

  const messages = SESSION_MESSAGES[sessionType];
  const reflection = useMemo(() => getReflection(sessionType), [sessionType]);
  const xpEarned = SESSION_XP[sessionType];

  // Process completion — track internally, never show XP/gamification to user
  useEffect(() => {
    const processCompletion = async () => {
      const activityMap: Record<SessionType, ActivityType> = {
        breathing: 'breathing',
        grounding: 'grounding',
        reset: 'breathing',
        focus: 'focus',
        journal: 'journal',
        story: 'story',
        ritual: 'ritual',
        mood: 'mood',
      };

      const activityType = activityMap[sessionType];
      const durationMinutes = duration ? Math.round(duration / 60) : 0;

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
        metadata: { cycles, steps, wordCount, mood },
      });

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

      // Record activity internally (XP, streaks, achievements — tracked but not displayed)
      const result = await gamification.recordActivity(
        activityType,
        durationMinutes,
        { sessionName: sessionName || sessionType }
      );

      await recommendations.recordActivity(sessionType, sessionName || sessionType);

      // Store pending celebrations for home screen (subtle acknowledgment only)
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
        // Show as a subtle milestone, not a trophy popup
        setMilestone(result.newAchievements[0].title);
      }

      // Gentle haptic and soft glow — the only celebration
      await notificationSuccess();
      setShowGlow(true);
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
  const stats = useMemo(() => {
    const result: { iconName: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
    if (duration) {
      result.push({ iconName: STAT_ICONS.DURATION, label: 'DURATION', value: formatDuration(duration) });
    }
    if (cycles) {
      result.push({ iconName: STAT_ICONS.CYCLES, label: 'CYCLES', value: cycles.toString() });
    }
    if (steps) {
      result.push({ iconName: STAT_ICONS.STEPS, label: 'STEPS', value: steps.toString() });
    }
    if (wordCount) {
      result.push({ iconName: STAT_ICONS.WORDS, label: 'WORDS', value: wordCount.toString() });
    }
    return result;
  }, [duration, cycles, steps, wordCount]);

  // Navigation
  const handleGoHome = () => {
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

      {/* Soft glow — replaces confetti */}
      <SoftGlow active={showGlow} variant="completion" size={250} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Checkmark */}
          <AnimatedCheckmark />

          {/* Title & Subtitle */}
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

          {/* Reflective Quote */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(400).duration(600)}
            style={styles.reflectionContainer}
          >
            <Text
              variant="bodyMedium"
              color="inkMuted"
              align="center"
              style={styles.reflectionText}
            >
              {reflection}
            </Text>
          </Animated.View>

          {/* Session Stats */}
          {stats.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(500).duration(400)}
              style={styles.statsContainer}
            >
              {stats.map((stat, index) => (
                <SessionStat
                  key={stat.label}
                  iconName={stat.iconName}
                  label={stat.label}
                  value={stat.value}
                  delay={500 + index * 100}
                />
              ))}
            </Animated.View>
          )}

          {/* Milestone acknowledgment — subtle, not a trophy popup */}
          {milestone && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(700).duration(400)}
              style={styles.milestoneContainer}
            >
              <Text variant="bodySmall" color="inkFaint" align="center">
                {milestone}
              </Text>
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
            Return to sanctuary
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
    marginBottom: spacing[4],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  reflectionContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  reflectionText: {
    fontStyle: 'italic',
    fontFamily: 'Lora_400Regular',
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
  statIconStyle: {
    marginBottom: spacing[1],
  },
  statLabel: {
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  milestoneContainer: {
    marginBottom: spacing[4],
  },
  spacer: {
    flex: 1,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  suggestionText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[4],
  },
});

export default SessionCompleteScreen;
