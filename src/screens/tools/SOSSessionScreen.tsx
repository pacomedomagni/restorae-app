/**
 * SOSSessionScreen
 * 
 * 4-phase emergency intervention: Interrupt → Ground → Reassure → Next Step
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
  useSharedValue,
  useAnimatedStyle,
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
import { spacing, layout, withAlpha } from '../../theme';
import { RootStackParamList } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { SOS_PRESETS, type SOSPhase } from '../../data';
import { navigationHelpers } from '../../services/navigationHelpers';

// =============================================================================
// TYPES
// =============================================================================
const PHASE_TYPE_LABELS: Record<SOSPhase['type'], string> = {
  'interrupt': 'Interrupt',
  'ground': 'Ground',
  'reassure': 'Reassure',
  'next-step': 'Next Step',
};

// =============================================================================
// PHASE PROGRESS
// =============================================================================
interface PhaseProgressProps {
  phases: SOSPhase[];
  currentPhaseIndex: number;
}

function PhaseProgress({ phases, currentPhaseIndex }: PhaseProgressProps) {
  const { colors } = useTheme();

  return (
    <View
      style={styles.phaseProgress}
      accessible={true}
      accessibilityLabel={`Phase ${currentPhaseIndex + 1} of ${phases.length}`}
    >
      {phases.map((phase, index) => (
        <View key={phase.id} style={styles.phaseItem}>
          <View
            style={[
              styles.phaseDot,
              {
                backgroundColor: index <= currentPhaseIndex
                  ? colors.accentWarm
                  : colors.border,
              },
            ]}
          />
          <Text
            variant="labelSmall"
            color={index <= currentPhaseIndex ? 'ink' : 'inkFaint'}
          >
            {PHASE_TYPE_LABELS[phase.type]}
          </Text>
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// BREATHING ANIMATION
// =============================================================================
interface BreathingAnimationProps {
  isActive: boolean;
}

function BreathingAnimation({ isActive }: BreathingAnimationProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (!reduceMotion && isActive) {
      // 4 in, 7 hold, 8 out pattern
      const breathCycle = () => {
        scale.value = withSequence(
          // Inhale (4 sec)
          withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          // Hold (7 sec)
          withTiming(1.3, { duration: 7000 }),
          // Exhale (8 sec)
          withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        );
        opacity.value = withSequence(
          withTiming(0.8, { duration: 4000 }),
          withTiming(0.8, { duration: 7000 }),
          withTiming(0.5, { duration: 8000 })
        );
      };

      breathCycle();
      const interval = setInterval(breathCycle, 19000);
      return () => clearInterval(interval);
    } else {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0.5, { duration: 300 });
    }
  }, [isActive, reduceMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.breathingCircle,
        animatedStyle,
        { backgroundColor: withAlpha(colors.accentCalm, 0.3) },
      ]}
    />
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function SOSSessionScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SOSSession'>>();

  const presetId = route.params?.presetId ?? 'panic-attack';
  const preset = SOS_PRESETS.find(p => p.id === presetId) || SOS_PRESETS[0];
  const phases = preset.phases;

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = phases[currentPhaseIndex];
  const isLastPhase = currentPhaseIndex === phases.length - 1;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Phase timer
  useEffect(() => {
    if (isComplete || !currentPhase) return;

    setCountdown(currentPhase.duration);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPhaseIndex, isComplete, currentPhase]);

  const handleNext = useCallback(async () => {
    await impactLight();

    if (isLastPhase) {
      if (timerRef.current) clearInterval(timerRef.current);
      const duration = navigationHelpers.calculateSessionDuration(sessionStartTime);

      navigationHelpers.navigateToSessionComplete(navigation as any, {
        sessionType: 'breathing', // SOS maps to breathing for gamification
        sessionName: `SOS: ${preset.name}`,
        duration,
        steps: phases.length,
      });
    } else {
      setCurrentPhaseIndex(prev => prev + 1);
      await impactMedium();
    }
  }, [isLastPhase, impactLight, impactMedium, sessionStartTime, preset.name, phases.length, navigation]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  }, [navigation]);

  const handleRestart = useCallback(async () => {
    await impactMedium();
    setCurrentPhaseIndex(0);
    setIsComplete(false);
  }, [impactMedium]);

  // Show breathing animation during ground phase
  const showBreathing = currentPhase?.type === 'ground' && !isComplete;

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(400)}
          style={styles.header}
        >
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close SOS session"
            accessibilityHint="Returns to the previous screen"
          >
            <Text variant="bodyMedium" color="ink">Close</Text>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text variant="headlineSmall" color="ink">
              {preset.name}
            </Text>
          </View>

          <View style={styles.closeButton} />
        </Animated.View>

        {/* Phase Progress */}
        {!isComplete && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(400)}
            style={styles.progressContainer}
          >
            <PhaseProgress phases={phases} currentPhaseIndex={currentPhaseIndex} />
          </Animated.View>
        )}

        {/* Breathing Animation */}
        {showBreathing && (
          <View style={styles.breathingContainer} accessible={false} importantForAccessibility="no">
            <BreathingAnimation isActive={showBreathing} />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {!isComplete ? (
            <Animated.View
              key={`phase-${currentPhaseIndex}`}
              entering={reduceMotion ? undefined : SlideInRight.duration(400)}
              exiting={reduceMotion ? undefined : SlideOutLeft.duration(300)}
              style={styles.stepContainer}
            >
              <View style={styles.phaseLabel}>
                <Text variant="labelLarge" style={{ color: colors.accentWarm }}>
                  {currentPhase.title}
                </Text>
                <Text variant="labelSmall" color="inkFaint">
                  Phase {currentPhaseIndex + 1} of {phases.length}
                </Text>
              </View>

              <GlassCard variant="elevated" padding="xl" glow="warm">
                <Text variant="displaySmall" color="ink" align="center">
                  {currentPhase.instruction}
                </Text>
              </GlassCard>

              {countdown > 0 && (
                <View style={styles.countdownContainer} accessibilityLiveRegion="polite">
                  <Text variant="bodyLarge" color="inkMuted">
                    {countdown}s
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
                You did it
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
                The hardest part is over. You've taken back control.
                Remember: this feeling will pass.
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
              {isLastPhase ? 'Complete' : 'Next Phase'}
            </PremiumButton>
          ) : (
            <>
              <PremiumButton
                variant="glow"
                size="lg"
                fullWidth
                onPress={handleClose}
              >
                I'm feeling better
              </PremiumButton>
              <Pressable
                onPress={handleRestart}
                style={styles.againButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Restart SOS session"
                accessibilityHint="Starts the breathing exercise again"
              >
                <Text variant="labelLarge" color="inkMuted">
                  I need to go again
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
  },
  progressContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[4],
  },
  phaseProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseItem: {
    alignItems: 'center',
    gap: spacing[1],
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breathingContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  stepContainer: {
    alignItems: 'center',
  },
  phaseLabel: {
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[1],
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

export default SOSSessionScreen;
