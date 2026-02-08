/**
 * UnifiedSessionScreen - Full Session Playback Engine
 *
 * Renders the active session using SessionContext.
 * Supports breathing, grounding, journal, reset, and generic activity types
 * with activity-specific renderers, transitions, pause/resume, and skip.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useSession } from '../contexts/SessionContext';
import {
  Text,
  Button,
  GlassCard,
  AmbientBackground,
  ExitConfirmationModal,
} from '../components/ui';
import { spacing, borderRadius, withAlpha, layout } from '../theme';
import type {
  Activity,
  BreathingConfig,
  GroundingConfig,
  JournalConfig,
  ResetConfig,
  ResetStep,
} from '../types/session';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// BREATHING RENDERER
// =============================================================================

interface BreathingRendererProps {
  activity: Activity;
  isPaused: boolean;
  onComplete: () => void;
}

function BreathingRenderer({ activity, isPaused, onComplete }: BreathingRendererProps) {
  const { colors } = useTheme();
  const config = activity.config as BreathingConfig | undefined;

  const inhale = config?.inhale ?? 4;
  const hold1 = config?.hold1 ?? 0;
  const exhale = config?.exhale ?? 4;
  const hold2 = config?.hold2 ?? 0;
  const totalCycles = config?.cycles ?? 4;

  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [cycle, setCycle] = useState(1);
  const [phaseTimer, setPhaseTimer] = useState(inhale);
  const phaseRef = useRef(phase);
  const cycleRef = useRef(cycle);
  phaseRef.current = phase;
  cycleRef.current = cycle;

  const orbScale = useSharedValue(0.6);
  const orbOpacity = useSharedValue(0.6);

  // Animate orb based on phase
  useEffect(() => {
    if (isPaused) return;
    switch (phase) {
      case 'inhale':
        orbScale.value = withTiming(1, { duration: inhale * 1000, easing: Easing.inOut(Easing.ease) });
        orbOpacity.value = withTiming(1, { duration: inhale * 1000 });
        break;
      case 'hold':
        orbScale.value = withTiming(1, { duration: 300 });
        break;
      case 'exhale':
        orbScale.value = withTiming(0.6, { duration: exhale * 1000, easing: Easing.inOut(Easing.ease) });
        orbOpacity.value = withTiming(0.6, { duration: exhale * 1000 });
        break;
      case 'rest':
        orbScale.value = withTiming(0.6, { duration: 300 });
        break;
    }
  }, [phase, isPaused]);

  // Phase timer countdown
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          // Move to next phase
          const currentPhase = phaseRef.current;
          const currentCycle = cycleRef.current;

          if (currentPhase === 'inhale' && hold1 > 0) {
            setPhase('hold');
            return hold1;
          } else if (currentPhase === 'inhale' || currentPhase === 'hold') {
            setPhase('exhale');
            return exhale;
          } else if (currentPhase === 'exhale' && hold2 > 0) {
            setPhase('rest');
            return hold2;
          } else {
            // Cycle complete
            if (currentCycle >= totalCycles) {
              onComplete();
              return 0;
            }
            setCycle(c => c + 1);
            setPhase('inhale');
            return inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, inhale, hold1, exhale, hold2, totalCycles, onComplete]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const phaseLabel =
    phase === 'inhale' ? 'Breathe in' :
    phase === 'hold' ? 'Hold' :
    phase === 'exhale' ? 'Breathe out' : 'Rest';

  return (
    <View style={rendererStyles.centered}>
      <Animated.View
        style={[
          rendererStyles.breathingOrb,
          { backgroundColor: withAlpha(colors.accentPrimary, 0.15), borderColor: withAlpha(colors.accentPrimary, 0.3) },
          orbStyle,
        ]}
      >
        <View style={[rendererStyles.breathingOrbInner, { backgroundColor: withAlpha(colors.accentPrimary, 0.2) }]}>
          <Text variant="displayLarge" style={{ color: colors.accentPrimary }}>
            {phaseTimer}
          </Text>
        </View>
      </Animated.View>

      <Text variant="headlineMedium" color="ink" style={rendererStyles.phaseLabel}>
        {phaseLabel}
      </Text>
      <Text variant="labelSmall" color="inkFaint" style={rendererStyles.cycleLabel}>
        Cycle {cycle} of {totalCycles}
      </Text>
    </View>
  );
}

// =============================================================================
// GROUNDING RENDERER
// =============================================================================

interface GroundingRendererProps {
  activity: Activity;
  isPaused: boolean;
  onComplete: () => void;
}

function GroundingRenderer({ activity, isPaused, onComplete }: GroundingRendererProps) {
  const { colors } = useTheme();
  const config = activity.config as GroundingConfig | undefined;
  const steps = config?.steps ?? ['Focus on your senses', 'Notice what you can see', 'Complete'];
  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep >= steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length, onComplete]);

  return (
    <View style={rendererStyles.centered}>
      {/* Progress dots */}
      <View style={rendererStyles.progressDots}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              rendererStyles.dot,
              {
                backgroundColor: i <= currentStep ? colors.accentPrimary : withAlpha(colors.border, 0.4),
              },
            ]}
          />
        ))}
      </View>

      <Animated.View key={currentStep} entering={FadeInUp.duration(300)}>
        <GlassCard variant="elevated" padding="lg" style={rendererStyles.stepCard}>
          <Text variant="labelSmall" color="inkFaint" style={rendererStyles.stepNumber}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <Text variant="headlineSmall" color="ink" align="center" style={rendererStyles.stepText}>
            {steps[currentStep]}
          </Text>
        </GlassCard>
      </Animated.View>

      <Button variant="primary" size="md" onPress={handleNextStep} style={rendererStyles.nextButton}>
        {currentStep >= steps.length - 1 ? 'Complete' : 'Next Step'}
      </Button>
    </View>
  );
}

// =============================================================================
// JOURNAL RENDERER
// =============================================================================

interface JournalRendererProps {
  activity: Activity;
  onComplete: () => void;
}

function JournalRenderer({ activity, onComplete }: JournalRendererProps) {
  const { colors } = useTheme();
  const config = activity.config as JournalConfig | undefined;
  const prompt = config?.prompt ?? 'Take a moment to reflect...';
  const [text, setText] = useState('');

  return (
    <View style={rendererStyles.journalContainer}>
      <GlassCard variant="elevated" padding="lg" style={rendererStyles.promptCard}>
        <Ionicons name="create-outline" size={24} color={colors.accentPrimary} style={rendererStyles.promptIcon} />
        <Text variant="bodyLarge" color="ink" align="center">
          {prompt}
        </Text>
      </GlassCard>

      <TextInput
        style={[
          rendererStyles.journalInput,
          {
            color: colors.ink,
            backgroundColor: withAlpha(colors.canvasElevated, 0.6),
            borderColor: withAlpha(colors.border, 0.3),
          },
        ]}
        placeholder="Write your thoughts..."
        placeholderTextColor={colors.inkFaint}
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
      />

      <Button variant="primary" size="md" onPress={onComplete} style={rendererStyles.nextButton}>
        {text.trim().length > 0 ? 'Save & Continue' : 'Skip'}
      </Button>
    </View>
  );
}

// =============================================================================
// RESET RENDERER
// =============================================================================

interface ResetRendererProps {
  activity: Activity;
  isPaused: boolean;
  onComplete: () => void;
}

function ResetRenderer({ activity, isPaused, onComplete }: ResetRendererProps) {
  const { colors } = useTheme();
  const config = activity.config as ResetConfig | undefined;
  const steps = config?.steps ?? [{ instruction: activity.description || 'Take a moment to reset', duration: 30 }];
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(steps[0]?.duration ?? 30);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (currentStep >= steps.length - 1) {
            onComplete();
            return 0;
          }
          setCurrentStep(s => s + 1);
          return steps[currentStep + 1]?.duration ?? 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, currentStep, steps, onComplete]);

  const step = steps[currentStep];

  return (
    <View style={rendererStyles.centered}>
      <GlassCard variant="elevated" padding="lg" style={rendererStyles.stepCard}>
        <Text variant="bodyLarge" color="ink" align="center">
          {step?.instruction ?? 'Reset'}
        </Text>
        <Text variant="displayMedium" color="accentPrimary" align="center" style={rendererStyles.resetTimer}>
          {timer}s
        </Text>
      </GlassCard>

      <Button variant="ghost" size="sm" onPress={onComplete} style={rendererStyles.nextButton}>
        Skip
      </Button>
    </View>
  );
}

// =============================================================================
// GENERIC RENDERER
// =============================================================================

interface GenericRendererProps {
  activity: Activity;
  onComplete: () => void;
}

function GenericRenderer({ activity, onComplete }: GenericRendererProps) {
  const { colors } = useTheme();
  const iconName =
    activity.type === 'focus' ? 'eye-outline' :
    activity.type === 'grounding' ? 'earth-outline' :
    'leaf-outline';

  return (
    <View style={rendererStyles.centered}>
      <Ionicons name={iconName as any} size={64} color={colors.accentPrimary} />
      <Text variant="headlineMedium" color="ink" align="center" style={rendererStyles.genericTitle}>
        {activity.name}
      </Text>
      {activity.description && (
        <Text variant="bodyMedium" color="inkMuted" align="center" style={rendererStyles.genericDesc}>
          {activity.description}
        </Text>
      )}
      <Button variant="primary" size="md" onPress={onComplete} style={rendererStyles.nextButton}>
        Complete
      </Button>
    </View>
  );
}

// =============================================================================
// TRANSITION OVERLAY
// =============================================================================

interface TransitionOverlayProps {
  nextActivity: Activity | null;
  onReady: () => void;
}

function TransitionOverlay({ nextActivity, onReady }: TransitionOverlayProps) {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onReady, 2000);
    return () => clearTimeout(timer);
  }, [onReady]);

  if (!nextActivity) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={[rendererStyles.transitionOverlay, { backgroundColor: withAlpha(colors.canvas, 0.95) }]}
    >
      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <Text variant="labelMedium" color="inkFaint" align="center">
          Up next
        </Text>
        <Text variant="headlineLarge" color="ink" align="center" style={rendererStyles.transitionTitle}>
          {nextActivity.name}
        </Text>
        {nextActivity.description && (
          <Text variant="bodyMedium" color="inkMuted" align="center" style={rendererStyles.transitionDesc}>
            {nextActivity.description}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

export function UnifiedSessionScreen() {
  useKeepAwake();
  const navigation = useNavigation();
  const { colors, reduceMotion } = useTheme();
  const session = useSession();

  const {
    status,
    currentActivity,
    progress,
    completedActivities,
    remainingActivities,
    isLastActivity,
    canSkip,
    isTransitioning,
    isActive,
    estimatedTimeRemaining,
  } = session;

  const isPaused = status === 'paused';
  const queueLength = completedActivities + remainingActivities + (currentActivity ? 1 : 0);
  const currentIndex = completedActivities + 1;

  // Activity completion handler
  const handleActivityComplete = useCallback(() => {
    session.completeCurrentActivity();
  }, [session]);

  // Transition handler
  const handleTransitionReady = useCallback(() => {
    session.completeTransition();
  }, [session]);

  // Pause/resume
  const handleTogglePause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      session.resumeSession();
    } else {
      session.pauseSession();
    }
  }, [isPaused, session]);

  // Skip
  const handleSkip = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    session.skipCurrentActivity();
  }, [session]);

  // Exit
  const handleExitRequest = useCallback(() => {
    session.setShowExitConfirmation(true);
  }, [session]);

  const handleExitConfirm = useCallback(() => {
    session.setShowExitConfirmation(false);
    session.exitSession(true);
  }, [session]);

  const handleExitCancel = useCallback(() => {
    session.setShowExitConfirmation(false);
  }, [session]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine ambient variant from activity type
  const ambientVariant =
    currentActivity?.type === 'breathing' ? 'calm' :
    currentActivity?.type === 'focus' ? 'focus' :
    currentActivity?.tone === 'warm' ? 'evening' : 'calm';

  // Render activity-specific content
  const renderActivity = () => {
    if (!currentActivity) return null;

    switch (currentActivity.type) {
      case 'breathing':
        return (
          <BreathingRenderer
            activity={currentActivity}
            isPaused={isPaused}
            onComplete={handleActivityComplete}
          />
        );
      case 'grounding':
        return (
          <GroundingRenderer
            activity={currentActivity}
            isPaused={isPaused}
            onComplete={handleActivityComplete}
          />
        );
      case 'journal':
        return (
          <JournalRenderer
            activity={currentActivity}
            onComplete={handleActivityComplete}
          />
        );
      case 'reset':
        return (
          <ResetRenderer
            activity={currentActivity}
            isPaused={isPaused}
            onComplete={handleActivityComplete}
          />
        );
      default:
        return (
          <GenericRenderer
            activity={currentActivity}
            onComplete={handleActivityComplete}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant={ambientVariant as any} intensity="subtle" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(300)}
          style={styles.header}
        >
          <Pressable onPress={handleExitRequest} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text variant="labelSmall" color="inkMuted">
              {currentActivity?.name ?? 'Session'}
            </Text>
            {queueLength > 1 && (
              <Text variant="labelSmall" color="inkFaint">
                {currentIndex} of {queueLength}
              </Text>
            )}
          </View>

          {canSkip ? (
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
                Skip
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </Animated.View>

        {/* Progress bar */}
        {queueLength > 1 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accentPrimary,
                  width: `${Math.min(progress * 100, 100)}%`,
                },
              ]}
            />
          </View>
        )}

        {/* Activity Content */}
        <View style={styles.content}>
          {isTransitioning ? (
            <TransitionOverlay
              nextActivity={session.transitionTo ?? null}
              onReady={handleTransitionReady}
            />
          ) : (
            renderActivity()
          )}
        </View>

        {/* Bottom controls */}
        {!isTransitioning && currentActivity && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(300)}
            style={styles.controls}
          >
            <View style={styles.controlRow}>
              <Text variant="labelSmall" color="inkFaint">
                {formatTime(estimatedTimeRemaining)} remaining
              </Text>
            </View>

            <Pressable
              onPress={handleTogglePause}
              style={[
                styles.pauseButton,
                { backgroundColor: withAlpha(colors.canvasElevated, 0.8) },
              ]}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={28}
                color={colors.ink}
              />
            </Pressable>
          </Animated.View>
        )}

        {/* Pause overlay */}
        {isPaused && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[styles.pauseOverlay, { backgroundColor: withAlpha(colors.canvas, 0.85) }]}
          >
            <Ionicons name="pause-circle-outline" size={64} color={colors.inkMuted} />
            <Text variant="headlineMedium" color="ink" style={styles.pausedText}>
              Paused
            </Text>
            <Button variant="primary" size="lg" onPress={handleTogglePause}>
              Resume
            </Button>
          </Animated.View>
        )}
      </SafeAreaView>

      {/* Exit confirmation */}
      <ExitConfirmationModal
        visible={session.showExitConfirmation}
        title="End session?"
        message={
          completedActivities > 0
            ? `You've completed ${completedActivities} ${completedActivities === 1 ? 'activity' : 'activities'}. Your progress will be saved.`
            : 'Your session will not be saved.'
        }
        confirmText="End Session"
        cancelText="Continue"
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
    </View>
  );
}

// =============================================================================
// RENDERER STYLES
// =============================================================================

const rendererStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  // Breathing
  breathingOrb: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    borderRadius: SCREEN_WIDTH * 0.275,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  breathingOrbInner: {
    width: '70%',
    height: '70%',
    borderRadius: SCREEN_WIDTH * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseLabel: {
    marginTop: spacing[6],
  },
  cycleLabel: {
    marginTop: spacing[2],
  },
  // Grounding
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing[6],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepCard: {
    width: SCREEN_WIDTH - spacing[8] * 2,
    alignItems: 'center',
  },
  stepNumber: {
    marginBottom: spacing[2],
  },
  stepText: {
    lineHeight: 28,
  },
  nextButton: {
    marginTop: spacing[6],
    minWidth: 160,
  },
  // Journal
  journalContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[4],
  },
  promptCard: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  promptIcon: {
    marginBottom: spacing[2],
  },
  journalInput: {
    flex: 1,
    maxHeight: 240,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    fontSize: 16,
    lineHeight: 24,
  },
  // Reset
  resetTimer: {
    marginTop: spacing[4],
  },
  // Generic
  genericTitle: {
    marginTop: spacing[4],
  },
  genericDesc: {
    marginTop: spacing[2],
    maxWidth: 280,
  },
  // Transition
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  transitionTitle: {
    marginTop: spacing[2],
  },
  transitionDesc: {
    marginTop: spacing[2],
    maxWidth: 280,
  },
});

// =============================================================================
// SCREEN STYLES
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[3],
  },
  headerCenter: {
    alignItems: 'center',
  },
  progressBar: {
    height: 3,
    marginHorizontal: layout.screenPaddingHorizontal,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
  },
  controls: {
    alignItems: 'center',
    paddingBottom: spacing[6],
    gap: spacing[3],
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
  },
  pausedText: {
    marginBottom: spacing[4],
  },
});

export default UnifiedSessionScreen;
