/**
 * FocusSessionScreen
 * 
 * Timer-based focus session with ambient sound and optional music
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
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { useAudio } from '../../contexts/AudioContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  PremiumButton,
} from '../../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../../theme';
import { RootStackParamList } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { getSessionById, FOCUS_SESSIONS, AMBIENT_SOUNDS } from '../../data';

// =============================================================================
// TYPES
// =============================================================================
type SessionPhase = 'ready' | 'focusing' | 'break' | 'complete';

// =============================================================================
// HELPER
// =============================================================================
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// AMBIENT INDICATOR
// =============================================================================
interface AmbientIndicatorProps {
  soundName: string;
  isPlaying: boolean;
}

function AmbientIndicator({ soundName, isPlaying }: AmbientIndicatorProps) {
  const { colors, reduceMotion } = useTheme();
  const sound = AMBIENT_SOUNDS.find(s => s.name === soundName);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion && isPlaying) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying, reduceMotion, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.ambientIndicator,
        animatedStyle,
        { backgroundColor: withAlpha(colors.accentCalm, 0.1) },
      ]}
    >
      <Text style={styles.ambientIcon}>{sound?.icon || '🔊'}</Text>
      <Text variant="labelMedium" color="inkMuted">
        {soundName}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// TIMER CIRCLE
// =============================================================================
interface TimerCircleProps {
  progress: number;
  timeRemaining: number;
  isPaused: boolean;
}

function TimerCircle({ progress, timeRemaining, isPaused }: TimerCircleProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion && !isPaused && timeRemaining > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isPaused, reduceMotion, timeRemaining, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.timerContainer, animatedStyle]}>
      <View
        style={[
          styles.timerCircle,
          { borderColor: withAlpha(colors.accentCalm, 0.2) },
        ]}
      >
        <View
          style={[
            styles.timerProgress,
            {
              borderColor: colors.accentCalm,
              transform: [{ rotate: `${progress * 360}deg` }],
            },
          ]}
        />
        <View style={styles.timerInner}>
          <Text variant="displayLarge" color="ink">
            {formatTime(timeRemaining)}
          </Text>
          {isPaused && (
            <Text variant="labelMedium" color="inkMuted">
              Paused
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function FocusSessionScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const { playSound, pauseSound, stopSound, isPlaying: audioIsPlaying } = useAudio();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'FocusSession'>>();

  const sessionId = route.params?.sessionId ?? 'deep-work';
  const session = getSessionById(sessionId) || FOCUS_SESSIONS[0];

  const [phase, setPhase] = useState<SessionPhase>('ready');
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session.duration * 60);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = session.duration * 60;
  const progress = 1 - (timeRemaining / totalTime);

  // Cleanup on unmount - stop audio
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSound();
    };
  }, [stopSound]);

  // Timer logic
  useEffect(() => {
    if (phase === 'focusing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setPhase('complete');
            notificationSuccess();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, notificationSuccess]);

  const handleStart = useCallback(async () => {
    await impactMedium();
    setPhase('focusing');
    setIsPlaying(true);
    // Start ambient audio if session has a default sound
    if (session.defaultSound) {
      await playSound(session.defaultSound);
    }
  }, [impactMedium, playSound, session.defaultSound]);

  const handlePause = useCallback(async () => {
    await impactLight();
    setIsPaused(prev => {
      const newPaused = !prev;
      // Pause or resume audio
      if (newPaused) {
        pauseSound();
      } else if (session.defaultSound) {
        playSound(session.defaultSound);
      }
      return newPaused;
    });
  }, [impactLight, pauseSound, playSound, session.defaultSound]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSound(); // Stop audio on close
    navigation.goBack();
  }, [navigation, stopSound]);

  const handleRestart = useCallback(async () => {
    await impactMedium();
    setPhase('ready');
    setIsPaused(false);
    setTimeRemaining(session.duration * 60);
    setIsPlaying(false);
    stopSound(); // Stop audio on restart
  }, [impactMedium, session.duration, stopSound]);

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
              {session.name}
            </Text>
          </View>

          <View style={styles.closeButton} />
        </Animated.View>

        {/* Ambient Sound Indicator */}
        {phase !== 'ready' && session.defaultSound && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.duration(400)}
            style={styles.ambientContainer}
          >
            <AmbientIndicator soundName={session.defaultSound} isPlaying={isPlaying && !isPaused} />
          </Animated.View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {phase === 'ready' ? (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.duration(400)}
              style={styles.readyContainer}
            >
              <GlassCard variant="elevated" padding="xl" glow="calm">
                <View style={styles.readyContent}>
                  <Text variant="displaySmall" color="ink" align="center">
                    Ready to focus?
                  </Text>
                  <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.readyDescription}>
                    {session.description}
                  </Text>
                  <View style={styles.sessionInfo}>
                    <Text variant="labelMedium" color="inkFaint">
                      {session.duration === 0 ? 'Open' : `${session.duration} min`}{session.defaultSound ? ` • ${session.defaultSound.replace(/-/g, ' ')}` : ''}
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {session.purpose && (
                <View style={styles.techniqueContainer}>
                  <Text variant="labelMedium" color="inkMuted">
                    {session.purpose}
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : phase === 'complete' ? (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.duration(400)}
              style={styles.completeContainer}
            >
              <Text variant="displaySmall" color="ink" align="center">
                Session complete
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
                You focused for {session.duration} minutes. Well done.
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.duration(400)}
              style={styles.focusContainer}
            >
              <TimerCircle
                progress={progress}
                timeRemaining={timeRemaining}
                isPaused={isPaused}
              />

              <Animated.View
                entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}
                style={styles.focusMessage}
              >
                <Text variant="bodyLarge" color="inkMuted" align="center">
                  {session.purpose}
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {phase === 'ready' ? (
            <PremiumButton
              variant="glow"
              size="lg"
              fullWidth
              tone="calm"
              onPress={handleStart}
            >
              Start Session
            </PremiumButton>
          ) : phase === 'complete' ? (
            <>
              <PremiumButton
                variant="glow"
                size="lg"
                fullWidth
                tone="calm"
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
                  Start another session
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.controlButtons}>
              <PremiumButton
                variant={isPaused ? 'glow' : 'secondary'}
                size="lg"
                fullWidth
                tone="calm"
                onPress={handlePause}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </PremiumButton>
            </View>
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
  ambientContainer: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[4],
  },
  ambientIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[2],
  },
  ambientIcon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyContent: {
    alignItems: 'center',
    gap: spacing[3],
  },
  readyDescription: {
    lineHeight: 24,
    paddingHorizontal: spacing[2],
  },
  sessionInfo: {
    marginTop: spacing[2],
  },
  techniqueContainer: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  focusContainer: {
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerProgress: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timerInner: {
    alignItems: 'center',
  },
  focusMessage: {
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
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
  controlButtons: {
    gap: spacing[3],
  },
  againButton: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
});

export default FocusSessionScreen;
