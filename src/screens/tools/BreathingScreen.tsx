/**
 * BreathingScreen
 * 
 * Guided breathing exercises with animated orb,
 * multiple patterns, and completion tracking.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { 
  Text, 
  AmbientBackground,
  BreathingOrb,
  GlassCard,
  PremiumButton,
} from '../../components/ui';
import { Icon } from '../../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../../theme';
import { RootStackParamList, BreathingPattern } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getPatternById, BREATHING_PATTERNS } from '../../data';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

const phaseLabels: Record<Phase, string> = {
  idle: 'Tap orb to begin',
  inhale: 'Breathe in...',
  hold: 'Hold gently...',
  exhale: 'Let it go...',
  complete: 'Beautifully done',
};

// =============================================================================
// BREATHING SCREEN
// =============================================================================
export function BreathingScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Breathing'>>();

  // Get pattern from data library, default to box-breathing
  const patternId = route.params?.patternId ?? 'box-breathing';
  const pattern = getPatternById(patternId) || BREATHING_PATTERNS[0];

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer for countdown
  const startCountdown = useCallback((seconds: number): Promise<void> => {
    return new Promise((resolve) => {
      setCountdown(seconds);
      let remaining = seconds;

      timerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          resolve();
        }
      }, 1000);
    });
  }, []);

  // Run a single breath cycle
  const runBreathCycle = useCallback(async (cycleNum: number) => {
    if (cycleNum > pattern.cycles) {
      setPhase('complete');
      setIsRunning(false);
      notificationSuccess();
      return;
    }

    setCurrentCycle(cycleNum);

    // INHALE
    setPhase('inhale');
    impactLight();
    await startCountdown(pattern.inhale);

    // HOLD 1
    if (pattern.hold1 && pattern.hold1 > 0) {
      setPhase('hold');
      await startCountdown(pattern.hold1);
    }

    // EXHALE
    setPhase('exhale');
    impactLight();
    await startCountdown(pattern.exhale);

    // HOLD 2
    if (pattern.hold2 && pattern.hold2 > 0) {
      setPhase('hold');
      await startCountdown(pattern.hold2);
    }

    // Next cycle
    runBreathCycle(cycleNum + 1);
  }, [pattern, startCountdown, impactLight, notificationSuccess]);

  const handleStart = async () => {
    if (isRunning) return;
    setIsRunning(true);
    await impactMedium();
    runBreathCycle(1);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.goBack();
  };

  const handleRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('idle');
    setCurrentCycle(0);
    setCountdown(0);
    setIsRunning(false);
  };

  // Map our phase to BreathingOrb's expected phase
  const orbPhase = phase === 'hold' ? 'hold' : phase;

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
            <Text variant="headlineSmall" color="ink">
              {pattern.name}
            </Text>
          </View>
          
          <View style={styles.closeButton} />
        </Animated.View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Progress indicator */}
          {phase !== 'idle' && phase !== 'complete' && (
            <Animated.View 
              entering={reduceMotion ? undefined : FadeIn.duration(300)}
              style={styles.progressContainer}
            >
              <GlassCard variant="subtle" padding="sm">
                <View style={styles.progressContent}>
                  <Text variant="labelSmall" color="inkFaint" style={styles.progressLabel}>
                    BREATH
                  </Text>
                  <Text variant="headlineSmall" style={{ color: colors.accentPrimary }}>
                    {currentCycle} / {pattern.cycles}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Breathing Orb */}
          <Pressable
            onPress={phase === 'idle' ? handleStart : undefined}
            style={styles.orbWrapper}
          >
            <BreathingOrb
              phase={orbPhase}
              phaseLabel={phaseLabels[phase]}
              countdown={countdown}
            />
          </Pressable>

          {/* Phase Label */}
          <Animated.View 
            key={phase}
            entering={reduceMotion ? undefined : FadeInDown.duration(400)}
            style={styles.labelContainer}
          >
            <Text variant="headlineLarge" color="ink" style={styles.phaseLabel}>
              {phaseLabels[phase]}
            </Text>

            {phase === 'idle' && (
              <Text variant="bodyLarge" color="inkMuted" style={styles.description}>
                {pattern.description}
              </Text>
            )}

            {phase === 'complete' && (
              <Text variant="bodyLarge" color="inkMuted" style={styles.description}>
                You've completed {pattern.cycles} breathing cycles
              </Text>
            )}
          </Animated.View>
        </View>

        {/* Footer */}
        {phase === 'complete' && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}
            style={styles.footer}
          >
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
                Breathe again
              </Text>
            </Pressable>
          </Animated.View>
        )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: spacing[4],
  },
  progressContent: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  progressLabel: {
    letterSpacing: 2,
    marginBottom: spacing[1],
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    marginTop: spacing[8],
  },
  phaseLabel: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: spacing[3],
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

export default BreathingScreen;
