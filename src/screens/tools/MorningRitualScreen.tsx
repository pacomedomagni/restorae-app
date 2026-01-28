/**
 * MorningRitualScreen
 * 
 * Mood-adaptive morning ritual flow
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  PremiumButton,
} from '../../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { MORNING_RITUALS, getMorningRitualForMood } from '../../data';
import { MoodType } from '../../types';
import { navigationHelpers } from '../../services/navigationHelpers';

// =============================================================================
// TYPES
// =============================================================================
type RitualPhase = 'mood-select' | 'ritual' | 'complete';

// =============================================================================
// MOOD SELECTOR
// =============================================================================
const MOOD_OPTIONS: { id: MoodType; label: string; icon: string }[] = [
  { id: 'energized', label: 'Energetic', icon: '⚡' },
  { id: 'calm', label: 'Calm', icon: '🌊' },
  { id: 'anxious', label: 'Anxious', icon: '😰' },
  { id: 'low', label: 'Tired', icon: '😴' },
  { id: 'good', label: 'Motivated', icon: '🔥' },
  { id: 'tough', label: 'Neutral', icon: '😐' },
];

interface MoodSelectorProps {
  onSelect: (mood: MoodType) => void;
}

function MoodSelector({ onSelect }: MoodSelectorProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();

  const handleSelect = async (mood: MoodType) => {
    await impactLight();
    onSelect(mood);
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(400)}
      style={styles.moodSelectorContainer}
    >
      <Text variant="displaySmall" color="ink" align="center">
        Good morning
      </Text>
      <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.moodSelectorSubtitle}>
        How are you feeling right now?
      </Text>

      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((mood, index) => (
          <Animated.View
            key={mood.id}
            entering={reduceMotion ? undefined : FadeInUp.delay(100 + index * 50).duration(300)}
          >
            <Pressable
              onPress={() => handleSelect(mood.id)}
              style={[
                styles.moodOption,
                { backgroundColor: withAlpha(colors.accentWarm, 0.08) },
              ]}
            >
              <Text style={styles.moodIcon}>{mood.icon}</Text>
              <Text variant="labelMedium" color="ink">
                {mood.label}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// SUN ANIMATION
// =============================================================================
function SunAnimation() {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 3000 }),
          withTiming(0.6, { duration: 3000 })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sunAnimation,
        animatedStyle,
        { backgroundColor: withAlpha(colors.accentWarm, 0.3) },
      ]}
    />
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function MorningRitualScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const navigation = useNavigation();

  const [phase, setPhase] = useState<RitualPhase>('mood-select');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [ritual, setRitual] = useState(MORNING_RITUALS[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = ritual.steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Step timer
  useEffect(() => {
    if (phase !== 'ritual') return;

    // Use the step's own duration
    const currentStepData = ritual.steps[currentStep];
    const stepDuration = currentStepData?.duration || 30;

    setCountdown(stepDuration);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentStep, ritual.steps]);

  const handleMoodSelect = useCallback(async (mood: MoodType) => {
    await impactMedium();
    setSelectedMood(mood);
    const selectedRitual = getMorningRitualForMood(mood);
    setRitual(selectedRitual);
    setSessionStartTime(Date.now());
    setPhase('ritual');
  }, [impactMedium]);

  const handleNext = useCallback(async () => {
    await impactLight();

    if (isLastStep) {
      if (timerRef.current) clearInterval(timerRef.current);
      const duration = sessionStartTime 
        ? navigationHelpers.calculateSessionDuration(sessionStartTime)
        : totalSteps * 30; // fallback: ~30s per step

      navigationHelpers.navigateToSessionComplete(navigation as any, {
        sessionType: 'ritual',
        sessionName: `Morning Ritual: ${ritual.name}`,
        duration,
        steps: totalSteps,
      });
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, impactLight, sessionStartTime, totalSteps, ritual.name, navigation]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  }, [navigation]);

  const handleRestart = useCallback(async () => {
    await impactMedium();
    setPhase('mood-select');
    setSelectedMood(null);
    setCurrentStep(0);
  }, [impactMedium]);

  return (
    <View style={styles.container}>
      <AmbientBackground variant="morning" intensity="normal" />

      {/* Sun Animation Background */}
      {phase === 'ritual' && (
        <View style={styles.sunContainer}>
          <SunAnimation />
        </View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(400)}
          style={styles.header}
        >
          <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
            <Text variant="bodyMedium" color="ink">Close</Text>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text variant="headlineSmall" color="ink">
              Morning Ritual
            </Text>
            {phase === 'ritual' && (
              <Text variant="labelSmall" color="inkMuted">
                {ritual.name}
              </Text>
            )}
          </View>

          <View style={styles.closeButton} />
        </Animated.View>

        {/* Progress */}
        {phase === 'ritual' && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(400)}
            style={styles.progressContainer}
          >
            <View style={styles.progressBar}>
              {ritual.steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep
                        ? colors.accentWarm
                        : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Text variant="labelSmall" color="inkFaint">
              Step {currentStep + 1} of {totalSteps}
            </Text>
          </Animated.View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {phase === 'mood-select' ? (
            <MoodSelector onSelect={handleMoodSelect} />
          ) : phase === 'ritual' ? (
            <Animated.View
              key={currentStep}
              entering={reduceMotion ? undefined : SlideInRight.duration(400)}
              exiting={reduceMotion ? undefined : SlideOutLeft.duration(300)}
              style={styles.stepContainer}
            >
              <View style={styles.stepHeader}>
                <Text variant="labelLarge" style={{ color: colors.accentWarm }}>
                  {ritual.steps[currentStep].title}
                </Text>
              </View>
              <GlassCard variant="elevated" padding="xl" glow="warm">
                <Text variant="displaySmall" color="ink" align="center">
                  {ritual.steps[currentStep].instruction}
                </Text>
              </GlassCard>

              {countdown > 0 && (
                <View style={styles.countdownContainer}>
                  <Text variant="bodyLarge" color="inkMuted">
                    Take your time... {countdown}s
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.duration(400)}
              style={styles.completeContainer}
            >
              <Text variant="displaySmall" color="ink" align="center">
                Your day awaits
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
                You've completed your {ritual.name}. Carry this energy with you today.
              </Text>

              {/* Focus message */}
              <View style={[styles.intentionContainer, { backgroundColor: withAlpha(colors.accentWarm, 0.1) }]}>
                <Text variant="labelMedium" color="inkMuted" align="center">
                  Today's focus:
                </Text>
                <Text variant="bodyLarge" style={{ color: colors.accentWarm }} align="center">
                  "{ritual.focus}"
                </Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {phase === 'mood-select' ? (
            <View /> // Empty - mood selection handles navigation
          ) : phase === 'ritual' ? (
            <PremiumButton
              variant="glow"
              size="lg"
              fullWidth
              tone="warm"
              onPress={handleNext}
            >
              {isLastStep ? 'Complete' : 'Next Step'}
            </PremiumButton>
          ) : (
            <>
              <PremiumButton
                variant="glow"
                size="lg"
                fullWidth
                tone="warm"
                onPress={handleClose}
              >
                Begin my day
              </PremiumButton>
              <Pressable
                onPress={handleRestart}
                style={styles.againButton}
                hitSlop={8}
              >
                <Text variant="labelLarge" color="inkMuted">
                  Try a different ritual
                </Text>
              </Pressable>
            </>
          )}
        </View>
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
  sunContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  sunAnimation: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[3],
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing[2],
  },
  progressBar: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  moodSelectorContainer: {
    alignItems: 'center',
  },
  moodSelectorSubtitle: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[3],
    maxWidth: 320,
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    minWidth: 100,
    gap: spacing[2],
  },
  moodIcon: {
    fontSize: 28,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepHeader: {
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  countdownContainer: {
    marginTop: spacing[6],
  },
  completeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  completeText: {
    marginTop: spacing[4],
    lineHeight: 24,
  },
  intentionContainer: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[4],
    minHeight: 80,
  },
  againButton: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
});

export default MorningRitualScreen;
