/**
 * FocusPlayer
 * 
 * Focus/timer session player for the unified session system.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, Button } from '../ui';
import { spacing, withAlpha } from '../../theme';
import { FocusSession } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getSessionById, FOCUS_SESSIONS } from '../../data';

export interface FocusPlayerProps {
  sessionId?: string;
  session?: FocusSession;
  duration?: number; // Override duration in minutes
  onComplete?: () => void;
  autoStart?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FocusPlayer({
  sessionId = 'deep-focus',
  session: customSession,
  duration,
  onComplete,
  autoStart = false,
}: FocusPlayerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, notificationSuccess } = useHaptics();

  const session = customSession || getSessionById(sessionId) || FOCUS_SESSIONS[0];
  const totalSeconds = (duration ?? session.duration) * 60;

  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
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
    if (autoStart && !isRunning && !isComplete) {
      const timer = setTimeout(() => handleStart(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isRunning, isComplete]);

  const handleStart = useCallback(() => {
    if (isRunning) return;
    impactLight();
    setIsRunning(true);

    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
          setIsComplete(true);
          notificationSuccess();
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isRunning, impactLight, notificationSuccess, onComplete]);

  const handlePause = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    impactLight();
  }, [impactLight]);

  const progress = 1 - timeRemaining / totalSeconds;

  if (isComplete) {
    return (
      <View style={styles.container}>
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(400)} style={styles.completeContainer}>
          <Text style={styles.completeIcon}>🎯</Text>
          <Text variant="displaySmall" color="ink" align="center">Focus complete</Text>
          <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
            Great job staying focused!
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" color="ink" align="center">{session.name}</Text>
      <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.subtitle}>
        {session.description}
      </Text>

      <View style={styles.timerContainer}>
        <View style={[styles.timerCircle, { borderColor: withAlpha(colors.accentPrimary, 0.3) }]}>
          <View
            style={[
              styles.timerProgress,
              { backgroundColor: colors.accentPrimary, transform: [{ scaleY: progress }] },
            ]}
          />
          <Text variant="displayLarge" color="ink" align="center">
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {!isRunning ? (
          <Button variant="glow" size="lg" tone="primary" fullWidth onPress={handleStart}>
            {timeRemaining === totalSeconds ? 'Start Focus' : 'Resume'}
          </Button>
        ) : (
          <Button variant="secondary" size="lg" fullWidth onPress={handlePause}>
            Pause
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing[5], justifyContent: 'center' },
  subtitle: { marginTop: spacing[2], marginBottom: spacing[6] },
  timerContainer: { alignItems: 'center', marginVertical: spacing[6] },
  timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  timerProgress: { position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.2 },
  footer: { marginTop: spacing[4] },
  completeContainer: { alignItems: 'center' },
  completeIcon: { fontSize: 64, marginBottom: spacing[4] },
  completeText: { marginTop: spacing[3] },
});

export default FocusPlayer;
