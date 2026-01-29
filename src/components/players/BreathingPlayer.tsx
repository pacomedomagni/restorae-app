/**
 * BreathingPlayer
 * 
 * Breathing exercise player for the unified session system.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, BreathingOrb, GlassCard } from '../ui';
import { spacing, withAlpha } from '../../theme';
import { BreathingPattern } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getPatternById, BREATHING_PATTERNS } from '../../data';

export type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

export interface BreathingPlayerProps {
  patternId?: string;
  pattern?: BreathingPattern;
  onComplete?: () => void;
  onPhaseChange?: (phase: BreathingPhase) => void;
  autoStart?: boolean;
}

const phaseLabels: Record<BreathingPhase, string> = {
  idle: 'Tap to begin',
  inhale: 'Breathe in...',
  hold: 'Hold...',
  exhale: 'Breathe out...',
  complete: 'Complete',
};

export function BreathingPlayer({
  patternId = 'box-breathing',
  pattern: customPattern,
  onComplete,
  onPhaseChange,
  autoStart = false,
}: BreathingPlayerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, notificationSuccess } = useHaptics();

  const pattern = customPattern || getPatternById(patternId) || BREATHING_PATTERNS[0];

  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoStart && phase === 'idle') {
      const timer = setTimeout(() => handleStart(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const startCountdown = useCallback((seconds: number): Promise<void> => {
    return new Promise((resolve) => {
      setCountdown(seconds);
      let remaining = seconds;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (!mountedRef.current) return;
        setCountdown(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          resolve();
        }
      }, 1000);
    });
  }, []);

  const runBreathCycle = useCallback(async (cycleNum: number) => {
    if (!mountedRef.current) return;
    if (cycleNum > pattern.cycles) {
      setPhase('complete');
      setIsRunning(false);
      notificationSuccess();
      onComplete?.();
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

    if (mountedRef.current) runBreathCycle(cycleNum + 1);
  }, [pattern, startCountdown, impactLight, notificationSuccess, onComplete]);

  const handleStart = useCallback(() => {
    if (isRunning) return;
    impactLight();
    setIsRunning(true);
    runBreathCycle(1);
  }, [isRunning, impactLight, runBreathCycle]);

  const handleOrbPress = useCallback(() => {
    if (phase === 'idle') handleStart();
    else if (phase === 'complete') {
      setPhase('idle');
      setCurrentCycle(0);
      setCountdown(0);
    }
  }, [phase, handleStart]);

  return (
    <View style={styles.container}>
      <Pressable onPress={handleOrbPress} style={styles.orbContainer}>
        <BreathingOrb
          phase={phase === 'hold' ? 'hold' : phase === 'complete' ? 'idle' : phase}
          phaseLabel={phaseLabels[phase]}
          countdown={countdown}
        />
        <View style={styles.phaseOverlay}>
          <Text variant="headlineSmall" color="ink" align="center">
            {phaseLabels[phase]}
          </Text>
          {phase !== 'idle' && phase !== 'complete' && (
            <Text variant="displayLarge" color="accent" align="center" style={styles.countdown}>
              {countdown}
            </Text>
          )}
        </View>
      </Pressable>

      {isRunning && (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(300)} style={styles.cycleContainer}>
          <Text variant="labelMedium" color="inkMuted">
            Cycle {currentCycle} of {pattern.cycles}
          </Text>
          <View style={styles.cycleDotsContainer}>
            {Array.from({ length: pattern.cycles }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.cycleDot,
                  { backgroundColor: idx < currentCycle ? colors.accentCalm : withAlpha(colors.ink, 0.2) },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      )}

      {phase === 'idle' && (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(1000).duration(500)} style={styles.tapHint}>
          <Text variant="labelSmall" color="inkMuted">Tap the orb to begin</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[5] },
  orbContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing[6] },
  phaseOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  countdown: { marginTop: spacing[2] },
  cycleContainer: { alignItems: 'center', marginTop: spacing[5] },
  cycleDotsContainer: { flexDirection: 'row', marginTop: spacing[2], gap: spacing[1] },
  cycleDot: { width: 8, height: 8, borderRadius: 4 },
  tapHint: { position: 'absolute', bottom: spacing[6] },
});

export default BreathingPlayer;
