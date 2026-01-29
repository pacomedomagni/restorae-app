/**
 * GroundingPlayer
 * 
 * Grounding exercise player for the unified session system.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, Button } from '../ui';
import { spacing, withAlpha } from '../../theme';
import { GroundingExercise } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getTechniqueById, GROUNDING_TECHNIQUES } from '../../data';

export interface GroundingPlayerProps {
  techniqueId?: string;
  technique?: GroundingExercise;
  onComplete?: () => void;
  onStepChange?: (step: number, total: number) => void;
  autoStart?: boolean;
}

export function GroundingPlayer({
  techniqueId = '5-4-3-2-1',
  technique: customTechnique,
  onComplete,
  onStepChange,
  autoStart = false,
}: GroundingPlayerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, notificationSuccess } = useHaptics();

  const technique = customTechnique || getTechniqueById(techniqueId) || GROUNDING_TECHNIQUES[0];
  const steps = technique.steps || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    onStepChange?.(currentStep + 1, steps.length);
  }, [currentStep, steps.length, onStepChange]);

  const handleNext = useCallback(() => {
    impactLight();
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
          <Text style={styles.completeIcon}>🌿</Text>
          <Text variant="displaySmall" color="ink" align="center">You are here</Text>
          <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
            You're grounded in the present moment.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" color="inkMuted" align="center">
        Step {currentStep + 1} of {steps.length}
      </Text>

      <View style={styles.progressContainer}>
        {steps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              { backgroundColor: idx <= currentStep ? colors.accentCalm : withAlpha(colors.ink, 0.2) },
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
        <GlassCard variant="elevated" padding="xl" glow="calm">
          <Text variant="displaySmall" color="ink" align="center">
            {steps[currentStep]}
          </Text>
        </GlassCard>
      </Animated.View>

      <View style={styles.footer}>
        <Button variant="glow" size="lg" tone="calm" fullWidth onPress={handleNext}>
          {currentStep < steps.length - 1 ? 'Continue' : 'Complete'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing[5], justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2], marginTop: spacing[3], marginBottom: spacing[6] },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  stepCard: { marginBottom: spacing[6] },
  footer: { marginTop: spacing[4] },
  completeContainer: { alignItems: 'center' },
  completeIcon: { fontSize: 64, marginBottom: spacing[4] },
  completeText: { marginTop: spacing[3] },
});

export default GroundingPlayer;
