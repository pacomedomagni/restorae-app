/**
 * MoodResultScreen - Enhanced with gamification integration
 * 
 * UX Improvements:
 * - XP reward for mood check-in
 * - Streak tracking
 * - Celebration animations
 * - Personalized suggestions
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { useHaptics } from '../hooks/useHaptics';
import { Text, Button, GlassCard, AmbientBackground, MoodOrb, Confetti } from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
import { gamification, Achievement } from '../services/gamification';
import { recommendations } from '../services/smartRecommendations';
import { activityLogger } from '../services/activityLogger';
import { analytics, AnalyticsEvents } from '../services/analytics';
import type { RootStackParamList, MoodType } from '../types';

const MOOD_DATA: Record<MoodType, { message: string; suggestion: string; tool: string; toolRoute: keyof RootStackParamList }> = {
  energized: { 
    message: 'You\'re feeling energized!', 
    suggestion: 'Great time to tackle something meaningful',
    tool: 'Start a Focus Session',
    toolRoute: 'FocusSelect',
  },
  calm: { 
    message: 'You\'re feeling calm', 
    suggestion: 'A perfect state for reflection or intention-setting',
    tool: 'Journal Your Thoughts',
    toolRoute: 'JournalEntry',
  },
  good: { 
    message: 'You\'re feeling good', 
    suggestion: 'Capture this moment in your journal',
    tool: 'Journal Your Thoughts',
    toolRoute: 'JournalEntry',
  },
  anxious: { 
    message: 'You\'re feeling anxious', 
    suggestion: 'A breathing exercise can help you find calm',
    tool: 'Try Breathing Exercise',
    toolRoute: 'BreathingSelect',
  },
  low: { 
    message: 'You\'re feeling low', 
    suggestion: 'Be gentle with yourself. A grounding exercise may help',
    tool: 'Try Grounding Exercise',
    toolRoute: 'GroundingSelect',
  },
  tough: { 
    message: 'You\'re having a tough time', 
    suggestion: 'A quick reset can help release some tension',
    tool: 'Quick Reset',
    toolRoute: 'QuickReset',
  },
};

const MOOD_LABELS: Record<MoodType, string> = {
  energized: 'Energized',
  calm: 'Calm',
  good: 'Good',
  anxious: 'Anxious',
  low: 'Low',
  tough: 'Tough',
};

export function MoodResultScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodResult'>>();
  const { notificationSuccess } = useHaptics();

  const mood = (route.params?.mood || 'calm') as MoodType;
  const note = route.params?.note;
  const moodInfo = MOOD_DATA[mood] || MOOD_DATA.calm;

  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXP, setShowXP] = useState(false);

  // XP animation values
  const xpScale = useSharedValue(0);
  const xpOpacity = useSharedValue(0);

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
    opacity: xpOpacity.value,
  }));

  // Record mood check-in and award XP
  useEffect(() => {
    const processMoodCheckin = async () => {
      // Record the activity for gamification
      const result = await gamification.recordActivity('mood', 0, { mood, hasNote: !!note });
      
      // Record mood for recommendations
      recommendations.recordMood(mood);

      // Log activity to backend
      await activityLogger.logActivity({
        category: 'mood',
        activityId: 'mood-checkin',
        activityName: 'Mood Check-in',
        startedAt: Date.now(),
        durationSeconds: 0,
        completed: true,
        metadata: { mood, hasNote: !!note },
      });

      // Track analytics
      analytics.track(AnalyticsEvents.MOOD_CHECKIN_COMPLETED, {
        mood,
        hasNote: !!note,
        xpEarned: result.xpEarned,
      });

      setXpEarned(result.xpEarned);
      
      // Trigger celebration
      await notificationSuccess();
      setShowConfetti(true);
      
      // Show XP badge with animation
      setTimeout(() => {
        setShowXP(true);
        xpScale.value = withSpring(1, { damping: 12, stiffness: 200 });
        xpOpacity.value = withTiming(1, { duration: 300 });
      }, 400);
    };

    processMoodCheckin();
  }, []);

  const handleToolNavigation = () => {
    if (moodInfo.toolRoute === 'JournalEntry') {
      navigation.navigate('JournalEntry', { mode: 'new' });
    } else {
      navigation.navigate(moodInfo.toolRoute as any);
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" />
      
      {/* Celebration Confetti */}
      <Confetti 
        active={showConfetti} 
        intensity={reduceMotion ? 'low' : 'medium'}
        onComplete={() => setShowConfetti(false)}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          {/* Mood Orb - Visual continuity */}
          <Animated.View 
            entering={reduceMotion ? undefined : ZoomIn.duration(500).springify()}
            style={styles.moodOrbContainer}
          >
            <MoodOrb
              mood={mood}
              label={MOOD_LABELS[mood]}
              size="lg"
              selected
            />
          </Animated.View>

          {/* Success checkmark + XP reward */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}
            style={styles.checkContainer}
          >
            <View style={[styles.checkBadge, { backgroundColor: withAlpha(colors.accentPrimary, 0.15) }]}>
              <Text variant="bodyMedium" style={{ color: colors.accentPrimary }}>
                ✓ Check-in saved
              </Text>
            </View>
            
            {/* XP Reward Badge */}
            {showXP && (
              <Animated.View style={[styles.xpBadge, { backgroundColor: withAlpha(colors.accentWarm, 0.15) }, xpAnimatedStyle]}>
                <Text style={styles.xpEmoji}>✨</Text>
                <Text variant="labelMedium" style={{ color: colors.accentWarm }}>
                  +{xpEarned} XP
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <GlassCard variant="elevated" padding="lg" glow="calm">
              <Text variant="headlineLarge" color="ink" align="center">
                {moodInfo.message}
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.suggestion}>
                {moodInfo.suggestion}
              </Text>
              {note && (
                <View style={[styles.noteContainer, { backgroundColor: withAlpha(colors.canvasDeep, 0.5) }]}>
                  <Text variant="bodySmall" color="inkFaint" style={styles.noteLabel}>
                    Your note
                  </Text>
                  <Text variant="bodyMedium" color="inkMuted" numberOfLines={3}>
                    "{note}"
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Button
              variant="glow"
              size="lg"
              tone="primary"
              fullWidth
              onPress={handleToolNavigation}
              style={styles.primaryButton}
            >
              {moodInfo.tool}
            </Button>

            <Button
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('Main')}
            >
              Back to Home
            </Button>
          </Animated.View>

          <View style={{ height: layout.tabBarHeight }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  moodOrbContainer: {
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  checkContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
  },
  checkBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  xpBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  xpEmoji: {
    fontSize: 14,
  },
  suggestion: {
    marginTop: spacing[3],
  },
  noteContainer: {
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: 12,
  },
  noteLabel: {
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryButton: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
});
