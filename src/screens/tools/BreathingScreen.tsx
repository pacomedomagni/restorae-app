/**
 * BreathingScreen
 * Premium breathing exercise following RESTORAE_SPEC.md
 * 
 * Features:
 * - Calm gradient background
 * - Animated breathing orb with reanimated
 * - Haptic feedback at phase transitions
 * - Cycle progress indicator
 */
import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button, SpaBackdrop } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../../theme';
import { RootStackParamList, BreathingPattern } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ORB_SIZE = SCREEN_WIDTH * 0.55;

// =============================================================================
// BREATHING PATTERNS
// =============================================================================
const breathingPatterns: Record<string, BreathingPattern> = {
  'calm-breath': {
    id: 'calm-breath',
    name: 'Calm Breath',
    description: 'A gentle pattern to bring you back to center',
    inhale: 4,
    hold1: 4,
    exhale: 6,
    hold2: 0,
    cycles: 6,
    duration: 2,
  },
  'box-breathing': {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'Used by Navy SEALs to stay calm under pressure',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    duration: 2,
  },
  '478-sleep': {
    id: '478-sleep',
    name: '4-7-8 Sleep',
    description: "Dr. Andrew Weil's relaxation technique",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
    duration: 2,
  },
};

type Phase = 'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete';

const phaseLabels: Record<Phase, string> = {
  idle: 'Tap to begin',
  inhale: 'Breathe in',
  hold1: 'Hold',
  exhale: 'Breathe out',
  hold2: 'Hold',
  complete: 'Well done',
};

// =============================================================================
// BREATHING SCREEN
// =============================================================================
export function BreathingScreen() {
  const { colors, gradients, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Breathing'>>();

  const pattern = breathingPatterns[route.params.patternId] || breathingPatterns['calm-breath'];

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Animation values
  const orbScale = useSharedValue(0.6);
  const orbOpacity = useSharedValue(0.4);
  const idlePulse = useSharedValue(0.6);
  const successPulse = useSharedValue(0);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const idlePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: idlePulse.value }],
    opacity: idlePulse.value,
  }));

  const successPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successPulse.value }],
    opacity: 1 - successPulse.value,
  }));

  React.useEffect(() => {
    if (reduceMotion) return;
    if (phase !== 'idle') {
      idlePulse.value = 0;
      return;
    }
    idlePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [phase, reduceMotion, idlePulse]);

  // Timer for countdown
  const startCountdown = useCallback((seconds: number, onComplete: () => void) => {
    setCountdown(seconds);
    let remaining = seconds;

    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);

    return interval;
  }, []);

  // Run a single breath cycle
  const runBreathCycle = useCallback(async (cycleNum: number) => {
    if (cycleNum > pattern.cycles) {
      setPhase('complete');
      setIsRunning(false);
      notificationSuccess();
      if (!reduceMotion) {
        successPulse.value = 0;
        successPulse.value = withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }),
        );
      }
      return;
    }

    // INHALE
    setPhase('inhale');
    setCurrentCycle(cycleNum);
    impactLight();

    orbScale.value = withTiming(1, {
      duration: pattern.inhale * 1000,
      easing: Easing.inOut(Easing.ease),
    });
    orbOpacity.value = withTiming(0.7, {
      duration: pattern.inhale * 1000,
    });

    await new Promise<void>((resolve) => {
      startCountdown(pattern.inhale, resolve);
    });

    // HOLD 1
    if (pattern.hold1 && pattern.hold1 > 0) {
      setPhase('hold1');
      await new Promise<void>((resolve) => {
        startCountdown(pattern.hold1!, resolve);
      });
    }

    // EXHALE
    setPhase('exhale');
    impactLight();

    orbScale.value = withTiming(0.6, {
      duration: pattern.exhale * 1000,
      easing: Easing.inOut(Easing.ease),
    });
    orbOpacity.value = withTiming(0.4, {
      duration: pattern.exhale * 1000,
    });

    await new Promise<void>((resolve) => {
      startCountdown(pattern.exhale, resolve);
    });

    // HOLD 2
    if (pattern.hold2 && pattern.hold2 > 0) {
      setPhase('hold2');
      await new Promise<void>((resolve) => {
        startCountdown(pattern.hold2!, resolve);
      });
    }

    // Next cycle
    runBreathCycle(cycleNum + 1);
  }, [pattern, orbScale, orbOpacity, startCountdown, impactLight, notificationSuccess, reduceMotion, successPulse]);

  const handleStart = async () => {
    if (isRunning) return;
    setIsRunning(true);
    await impactMedium();
    runBreathCycle(1);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleRestart = () => {
    setPhase('idle');
    setCurrentCycle(0);
    setCountdown(0);
    orbScale.value = 0.6;
    orbOpacity.value = 0.4;
  };

  return (
    <View style={styles.container}>
      {/* Calm gradient background */}
      <LinearGradient
        colors={gradients.calm}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SpaBackdrop />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(400)} style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text variant="bodyMedium" style={{ color: withAlpha(colors.ink, 0.8) }}>
              Close
            </Text>
          </Pressable>
          <View style={styles.titleContainer}>
            <Text variant="headlineSmall" style={{ color: colors.ink }}>
              {pattern.name}
            </Text>
            {phase !== 'idle' && phase !== 'complete' && (
              <Text variant="labelSmall" style={{ color: withAlpha(colors.ink, 0.6) }}>
                {currentCycle} of {pattern.cycles}
              </Text>
            )}
          </View>
          <View style={styles.closeButton} />
        </Animated.View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Breathing Orb */}
          <Pressable
            onPress={phase === 'idle' ? handleStart : undefined}
            style={styles.orbContainer}
          >
            {/* Outer glow */}
            <Animated.View
              style={[
                styles.orbOuter,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.2) },
                animatedOrbStyle,
              ]}
            />
            {/* Idle pulse */}
            {phase === 'idle' && !reduceMotion && (
              <Animated.View
                style={[
                  styles.orbOuter,
                  { backgroundColor: withAlpha(colors.accentPrimary, 0.12) },
                  idlePulseStyle,
                ]}
              />
            )}
            {/* Success pulse */}
            {phase === 'complete' && !reduceMotion && (
              <Animated.View
                style={[
                  styles.orbOuter,
                  { backgroundColor: withAlpha(colors.accentPrimary, 0.18) },
                  successPulseStyle,
                ]}
              />
            )}
            {/* Inner orb */}
            <Animated.View
              style={[
                styles.orbInner,
                {
                  backgroundColor: withAlpha(colors.accentPrimary, 0.7),
                  shadowColor: colors.shadow,
                },
                animatedInnerStyle,
              ]}
            />
            {/* Content */}
            <View style={styles.orbContent}>
              {phase !== 'idle' && phase !== 'complete' ? (
                <Text
                  variant="displayLarge"
                  style={{ color: colors.accentPrimary, fontSize: 64 }}
                >
                  {countdown}
                </Text>
              ) : (
                <Icon name="breathe" size={56} color={colors.accentPrimary} />
              )}
            </View>
          </Pressable>

          {/* Phase Label */}
          <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}>
            <Text variant="headlineLarge" color="ink" style={styles.phaseLabel}>
              {phaseLabels[phase]}
            </Text>

            {phase === 'idle' && (
              <Text variant="bodyLarge" color="inkMuted" style={styles.description}>
                {pattern.description}
              </Text>
            )}
          </Animated.View>
        </View>

        {/* Footer */}
        {phase === 'complete' && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.duration(400)}
            style={styles.footer}
          >
            <Button variant="primary" size="lg" fullWidth onPress={handleClose}>
              Done
            </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleRestart}
                style={styles.againButton}
              >
                <Text variant="labelLarge" style={{ color: withAlpha(colors.ink, 0.8) }}>
                  Do it again
                </Text>
              </Button>
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
    paddingVertical: spacing[4],
  },
  closeButton: {
    width: 60,
  },
  titleContainer: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  orbContainer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  orbOuter: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  orbInner: {
    position: 'absolute',
    width: ORB_SIZE * 0.7,
    height: ORB_SIZE * 0.7,
    borderRadius: (ORB_SIZE * 0.7) / 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  orbContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseLabel: {
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[6],
  },
  againButton: {
    marginTop: spacing[3],
  },
});
