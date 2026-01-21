/**
 * SituationalSessionScreen
 * 
 * Step-by-step guide for specific life moments
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  PremiumButton,
} from '../../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../../theme';
import { RootStackParamList } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getGuideById as getSituationalGuideById, SITUATIONAL_GUIDES } from '../../data';

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function SituationalSessionScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SituationalSession'>>();

  const guideId = route.params?.guideId ?? 'before-meeting';
  const guide = getSituationalGuideById(guideId) || SITUATIONAL_GUIDES[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = guide.steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Step timer
  useEffect(() => {
    if (isComplete) return;

    // Use the step's own duration
    const currentStepData = guide.steps[currentStep];
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
  }, [currentStep, isComplete, guide.steps]);

  const handleNext = useCallback(async () => {
    await impactLight();

    if (isLastStep) {
      setIsComplete(true);
      await notificationSuccess();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, impactLight, notificationSuccess]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  }, [navigation]);

  const handleRestart = useCallback(async () => {
    await impactMedium();
    setCurrentStep(0);
    setIsComplete(false);
  }, [impactMedium]);

  // Category colors
  const categoryColors: Record<string, string> = {
    work: colors.accentCalm,
    emotional: colors.accentWarm,
    social: colors.accentPrimary,
    self: '#9B8E80',
  };
  const accentColor = categoryColors[guide.category] || colors.accentCalm;

  return (
    <View style={styles.container}>
      <AmbientBackground variant="focus" intensity="normal" />

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
            <Text style={styles.headerIcon}>{guide.icon}</Text>
            <Text variant="headlineSmall" color="ink">
              {guide.name}
            </Text>
          </View>

          <View style={styles.closeButton} />
        </Animated.View>

        {/* Progress */}
        {!isComplete && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(400)}
            style={styles.progressContainer}
          >
            <View style={styles.progressBar}>
              {guide.steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep
                        ? accentColor
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
          {!isComplete ? (
            <Animated.View
              key={currentStep}
              entering={reduceMotion ? undefined : SlideInRight.duration(400)}
              exiting={reduceMotion ? undefined : SlideOutLeft.duration(300)}
              style={styles.stepContainer}
            >
              <View style={styles.stepHeader}>
                <Text variant="labelLarge" style={{ color: accentColor }}>
                  {guide.steps[currentStep].title}
                </Text>
              </View>
              <GlassCard variant="elevated" padding="xl" glow="calm">
                <Text variant="displaySmall" color="ink" align="center">
                  {guide.steps[currentStep].instruction}
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
                You're ready
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
                You've prepared well for "{guide.name}". Trust yourself.
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!isComplete ? (
            <PremiumButton
              variant="glow"
              size="lg"
              fullWidth
              tone="calm"
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
                tone="calm"
                onPress={handleClose}
              >
                I'm ready
              </PremiumButton>
              <Pressable
                onPress={handleRestart}
                style={styles.againButton}
                hitSlop={8}
              >
                <Text variant="labelLarge" color="inkMuted">
                  Practice again
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
    gap: spacing[1],
  },
  headerIcon: {
    fontSize: 24,
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
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[4],
  },
  againButton: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
});

export default SituationalSessionScreen;
