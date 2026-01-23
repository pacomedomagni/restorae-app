/**
 * GroundingSessionScreen
 * 
 * Guided grounding session with step-by-step instructions
 * 
 * UX Improvements:
 * - Exit confirmation when session is in progress
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  PremiumButton,
  ExitConfirmationModal,
} from '../../components/ui';
import { spacing, layout } from '../../theme';
import { RootStackParamList } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getTechniqueById, GROUNDING_TECHNIQUES } from '../../data';

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function GroundingSessionScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'GroundingSession'>>();

  const techniqueId = route.params?.techniqueId ?? '5-4-3-2-1';
  const technique = getTechniqueById(techniqueId) || GROUNDING_TECHNIQUES[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = technique.steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isSessionActive = currentStep > 0 && !isComplete;

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSessionActive) {
        setShowExitConfirm(true);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isSessionActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start countdown for current step (roughly 10-15 seconds per step)
  useEffect(() => {
    if (isComplete) return;
    
    const stepDuration = Math.ceil(parseInt(technique.duration) * 60 / totalSteps);
    setCountdown(stepDuration);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Don't auto-advance, let user control
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, isComplete, technique.duration, totalSteps]);

  const handleNext = async () => {
    await impactLight();
    
    if (isLastStep) {
      setIsComplete(true);
      await notificationSuccess();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleCloseAttempt = () => {
    if (isSessionActive) {
      setShowExitConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    handleClose();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
  };

  const handleRestart = async () => {
    await impactMedium();
    setCurrentStep(0);
    setIsComplete(false);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="focus" intensity="normal" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(400)}
          style={styles.header}
        >
          <Pressable onPress={handleCloseAttempt} style={styles.closeButton} hitSlop={12}>
            <Text variant="bodyMedium" color="ink">Close</Text>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text variant="headlineSmall" color="ink">
              {technique.name}
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
              {technique.steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep 
                        ? colors.accentPrimary 
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
              <GlassCard variant="elevated" padding="xl">
                <Text variant="displaySmall" color="ink" align="center">
                  {technique.steps[currentStep]}
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
                You're grounded
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
                You've completed the {technique.name} technique.
                Notice how you feel now.
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
                onPress={handleClose}
              >
                Done
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

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        visible={showExitConfirm}
        title="Leave grounding session?"
        message="Your progress won't be saved. You can always start again."
        confirmText="Leave"
        cancelText="Keep going"
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
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

export default GroundingSessionScreen;
