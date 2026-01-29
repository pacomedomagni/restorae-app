/**
 * ResetPlayer
 * 
 * Body reset/movement exercise player for the unified session system.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, Button } from '../ui';
import { spacing, withAlpha } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { getExerciseById, RESET_EXERCISES, ResetExercise } from '../../data';

export interface ResetPlayerProps {
  exerciseId?: string;
  exercise?: ResetExercise;
  onComplete?: () => void;
  onStepChange?: (step: number, total: number) => void;
}

export function ResetPlayer({
  exerciseId = 'neck-release',
  exercise: customExercise,
  onComplete,
  onStepChange,
}: ResetPlayerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, notificationSuccess } = useHaptics();

  const exercise = customExercise || getExerciseById(exerciseId) || RESET_EXERCISES[0];
  const steps = exercise.steps || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(15); // 15 seconds per step
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    onStepChange?.(currentStep + 1, steps.length);
  }, [currentStep, steps.length, onStepChange]);

  useEffect(() => {
    // Start countdown for each step
    setCountdown(15);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep]);

  const handleNext = useCallback(() => {
    impactLight();
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
      notificationSuccess();
      onComplete?.();
    }
  }, [currentStep, steps.length, impactLight, notificationSuccess, onComplete]);

  if (isComplete) {
    return (
      <View style={styles.container}>
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(400)} style={styles.completeContainer}>
          <Text style={styles.completeIcon}>🧘</Text>
          <Text variant="displaySmall" color="ink" align="center">Body reset complete</Text>
          <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
            Feel the tension melt away.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" color="ink" align="center">{exercise.name}</Text>
      <Text variant="labelMedium" color="inkMuted" align="center" style={styles.subtitle}>
        Step {currentStep + 1} of {steps.length}
      </Text>

      <View style={styles.progressContainer}>
        {steps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              { backgroundColor: idx <= currentStep ? colors.accentWarm : withAlpha(colors.ink, 0.2) },
            ]}
          />
        ))}
      </View>

      <Animated.View
        key={currentStep}
        entering={reduceMotion ? undefined : FadeInRight.duration(400)}
        exiting={reduceMotion ? undefined : FadeOutLeft.duration(300)}
        style={styles.stepCard}
      >
        <GlassCard variant="elevated" padding="xl" glow="warm">
          <Text variant="bodyLarge" color="ink" align="center">
            {steps[currentStep]}
          </Text>
        </GlassCard>
      </Animated.View>

      <Text variant="labelSmall" color="inkMuted" align="center" style={styles.timer}>
        {countdown > 0 ? `${countdown}s` : 'Ready for next'}
      </Text>

      <View style={styles.footer}>
        <Button variant="glow" size="lg" tone="warm" fullWidth onPress={handleNext}>
          {currentStep < steps.length - 1 ? 'Next Movement' : 'Complete'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing[5], justifyContent: 'center' },
  subtitle: { marginTop: spacing[2], marginBottom: spacing[3] },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2], marginBottom: spacing[6] },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  stepCard: { marginBottom: spacing[4] },
  timer: { marginBottom: spacing[4] },
  footer: { marginTop: spacing[2] },
  completeContainer: { alignItems: 'center' },
  completeIcon: { fontSize: 64, marginBottom: spacing[4] },
  completeText: { marginTop: spacing[3] },
});

export default ResetPlayer;
