/**
 * CustomRitualSessionScreen
 * 
 * Execute a custom ritual step by step
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useRituals, RitualStep } from '../contexts/RitualsContext';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'CustomRitualSession'>;

export default function CustomRitualSessionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const { getRitualById, completeRitual } = useRituals();
  const { impactLight, notificationSuccess } = useHaptics();

  const { ritualId } = route.params;
  const ritual = getRitualById(ritualId);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [sessionStartTime] = useState(Date.now());

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = ritual?.steps[currentStepIndex];
  const totalSteps = ritual?.steps.length ?? 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  useEffect(() => {
    if (currentStep) {
      setTimeRemaining(currentStep.duration);
    }
  }, [currentStep]);

  useEffect(() => {
    // Pulse animation for timer
    if (isRunning && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleStepComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Update progress animation
  useEffect(() => {
    if (currentStep && currentStep.duration > 0) {
      const progress = 1 - timeRemaining / currentStep.duration;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [timeRemaining, currentStep]);

  const handleStepComplete = useCallback(async () => {
    await notificationSuccess();
    if (currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }

    if (isLastStep) {
      handleRitualComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      setIsRunning(false);
    }
  }, [currentStep, isLastStep, notificationSuccess]);

  const handleRitualComplete = useCallback(async () => {
    if (!ritual) return;

    await notificationSuccess();
    
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    
    await completeRitual({
      ritualId: ritual.id,
      duration,
      completedSteps: completedSteps.length + 1, // +1 for current step
      totalSteps,
    });

    navigation.replace('MoodResult', {
      moodId: 'great',
      moodLabel: 'Ritual Complete',
      factors: [],
      notes: '',
    });
  }, [ritual, completedSteps, totalSteps, sessionStartTime, navigation, notificationSuccess, completeRitual]);

  const startStep = useCallback(async () => {
    await impactLight();
    setIsRunning(true);
    setIsPaused(false);
  }, [impactLight]);

  const pauseStep = useCallback(async () => {
    await impactLight();
    setIsPaused(true);
  }, [impactLight]);

  const resumeStep = useCallback(async () => {
    await impactLight();
    setIsPaused(false);
  }, [impactLight]);

  const skipStep = useCallback(async () => {
    await impactLight();
    handleStepComplete();
  }, [impactLight, handleStepComplete]);

  const goBack = useCallback(async () => {
    if (currentStepIndex > 0) {
      await impactLight();
      setCurrentStepIndex(prev => prev - 1);
      setIsRunning(false);
      setIsPaused(false);
      setCompletedSteps(prev => prev.slice(0, -1));
    }
  }, [currentStepIndex, impactLight]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (): number => {
    if (!ritual) return 0;
    return ritual.steps.reduce((total, step) => total + step.duration, 0);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
      padding: 40,
      color: colors.ink,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.ink,
      textAlign: 'center',
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    progressText: {
      fontSize: 14,
      color: colors.inkMuted,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    stepIndicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 32,
    },
    stepDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    stepDotActive: {
      backgroundColor: colors.accentPrimary,
      width: 24,
    },
    stepDotCompleted: {
      backgroundColor: colors.success,
    },
    stepCard: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accentPrimary,
      marginBottom: 8,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.ink,
      textAlign: 'center',
      marginBottom: 12,
    },
    stepDescription: {
      fontSize: 16,
      color: colors.inkMuted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    timerContainer: {
      alignItems: 'center',
      marginVertical: 24,
    },
    timerCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: colors.canvasDeep,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    timerProgress: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surfaceSubtle,
    },
    timerText: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.ink,
      zIndex: 1,
    },
    timerLabel: {
      fontSize: 14,
      color: colors.inkMuted,
      marginTop: 4,
      zIndex: 1,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 32,
      gap: 16,
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.accentPrimary,
    },
    bottomActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    actionText: {
      fontSize: 16,
      color: colors.inkMuted,
      marginLeft: 8,
    },
    skipText: {
      color: colors.accentPrimary,
    },
  });

  if (!ritual) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Ritual not found
        </Text>
      </View>
    );
  }

  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{ritual.title}</Text>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {totalSteps} • {formatTime(getTotalDuration())} total
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {ritual.steps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.stepDot,
                index === currentStepIndex && styles.stepDotActive,
                completedSteps.includes(step.id) && styles.stepDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Current step card */}
        {currentStep && (
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>STEP {currentStepIndex + 1}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            {currentStep.description && (
              <Text style={styles.stepDescription}>{currentStep.description}</Text>
            )}

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Animated.View
                style={[
                  styles.timerCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Animated.View
                  style={[styles.timerProgress, { height: progressHeight }]}
                />
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.timerLabel}>
                  {isRunning ? (isPaused ? 'PAUSED' : 'REMAINING') : 'DURATION'}
                </Text>
              </Animated.View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              {currentStepIndex > 0 && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={goBack}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="skip-previous" size={28} color={colors.ink} />
                </TouchableOpacity>
              )}

              {!isRunning ? (
                <TouchableOpacity
                  style={[styles.controlButton, styles.playButton]}
                  onPress={startStep}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="play" size={36} color="#FFFFFF" />
                </TouchableOpacity>
              ) : isPaused ? (
                <TouchableOpacity
                  style={[styles.controlButton, styles.playButton]}
                  onPress={resumeStep}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="play" size={36} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.controlButton, styles.playButton]}
                  onPress={pauseStep}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="pause" size={36} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {!isLastStep && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipStep}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="skip-next" size={28} color={colors.ink} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.inkMuted} />
          <Text style={styles.actionText}>Exit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={skipStep}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, styles.skipText]}>
            {isLastStep ? 'Complete' : 'Skip Step'}
          </Text>
          <MaterialCommunityIcons
            name={isLastStep ? 'check' : 'chevron-right'}
            size={24}
            color={colors.accentPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
