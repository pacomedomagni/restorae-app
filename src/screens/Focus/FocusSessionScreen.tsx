/**
 * FocusSessionScreen - Countdown timer with ambient sound
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useFocusAudio, AMBIENT_SOUNDS_DATA } from '../../contexts/AudioContext';
import { Text, GlassCard, AmbientBackground, ExitConfirmationModal } from '../../components/ui';
import { getSessionById, getSoundById, AMBIENT_SOUNDS } from '../../data/focusSessions';
import { spacing, borderRadius, withAlpha, layout } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_SIZE = SCREEN_WIDTH * 0.65;

// =============================================================================
// CIRCULAR TIMER
// =============================================================================

interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
}

function CircularTimer({ remainingSeconds, totalSeconds, isRunning }: CircularTimerProps) {
  const { colors } = useTheme();

  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withTiming(progress, { duration: 1000, easing: Easing.linear });
  }, [progress]);

  return (
    <View style={timerStyles.container}>
      {/* Outer ring */}
      <View
        style={[
          timerStyles.ring,
          { borderColor: withAlpha(colors.border, 0.2) },
        ]}
      >
        {/* Progress arc (simplified as a colored ring segment using borderWidth) */}
        <View
          style={[
            timerStyles.progressRing,
            {
              borderColor: colors.accentPrimary,
              borderTopColor: progress > 0.25 ? colors.accentPrimary : 'transparent',
              borderRightColor: progress > 0.5 ? colors.accentPrimary : 'transparent',
              borderBottomColor: progress > 0.75 ? colors.accentPrimary : 'transparent',
              borderLeftColor: progress > 0 ? colors.accentPrimary : 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />

        {/* Inner content */}
        <View style={timerStyles.inner}>
          <Text variant="displayLarge" style={{ color: colors.ink, fontSize: 48 }}>
            {timeDisplay}
          </Text>
          <Text variant="labelSmall" color="inkFaint" style={timerStyles.statusLabel}>
            {isRunning ? 'Focusing' : 'Paused'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderRadius: TIMER_SIZE / 2,
  },
  inner: {
    alignItems: 'center',
  },
  statusLabel: {
    marginTop: spacing[2],
  },
});

// =============================================================================
// SOUND PICKER
// =============================================================================

interface SoundPickerProps {
  selectedId: string | undefined;
  onSelect: (soundId: string) => void;
}

function SoundPicker({ selectedId, onSelect }: SoundPickerProps) {
  const { colors } = useTheme();
  const { selectionLight } = useHaptics();

  // Only show sounds that have real audio in AudioContext
  const availableSounds = AMBIENT_SOUNDS.filter(s =>
    AMBIENT_SOUNDS_DATA.some(d => d.id === s.id)
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={pickerStyles.container}
    >
      {/* None option */}
      <Pressable
        onPress={async () => {
          await selectionLight();
          onSelect('');
        }}
        style={[
          pickerStyles.soundChip,
          {
            backgroundColor: !selectedId
              ? colors.accentPrimary
              : withAlpha(colors.canvasElevated, 0.6),
          },
        ]}
      >
        <Ionicons
          name="volume-mute-outline"
          size={16}
          color={!selectedId ? colors.inkInverse : colors.inkMuted}
        />
        <Text
          variant="labelSmall"
          style={{ color: !selectedId ? colors.inkInverse : colors.inkMuted }}
        >
          Silent
        </Text>
      </Pressable>

      {availableSounds.map((sound) => {
        const isActive = selectedId === sound.id;
        return (
          <Pressable
            key={sound.id}
            onPress={async () => {
              await selectionLight();
              onSelect(sound.id);
            }}
            style={[
              pickerStyles.soundChip,
              {
                backgroundColor: isActive
                  ? colors.accentPrimary
                  : withAlpha(colors.canvasElevated, 0.6),
              },
            ]}
          >
            <Text style={pickerStyles.soundEmoji}>{sound.icon}</Text>
            <Text
              variant="labelSmall"
              style={{ color: isActive ? colors.inkInverse : colors.inkMuted }}
              numberOfLines={1}
            >
              {sound.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    gap: spacing[2],
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  soundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  soundEmoji: {
    fontSize: 14,
  },
});

// =============================================================================
// MAIN SCREEN
// =============================================================================

export function FocusSessionScreen() {
  useKeepAwake();

  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ FocusSession: { sessionId: string } }, 'FocusSession'>>();

  const sessionId = route.params.sessionId;
  const session = getSessionById(sessionId);

  const [selectedSound, setSelectedSound] = useState<string | undefined>(session?.defaultSound);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState((session?.duration ?? 10) * 60);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number>(0);

  const totalSeconds = (session?.duration ?? 10) * 60;
  const isOpenEnded = session?.duration === 0;

  // Audio
  const { startAudio, stopAudio } = useFocusAudio(selectedSound);

  // Stop audio when session completes (Bug fix: audio was playing through completion)
  useEffect(() => {
    if (isComplete) {
      stopAudio();
    }
  }, [isComplete, stopAudio]);

  // Restart audio when sound changes mid-session
  useEffect(() => {
    if (isRunning && selectedSound && startTimeRef.current > 0) {
      startAudio();
    }
  }, [selectedSound]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Timer
  useEffect(() => {
    if (!isRunning || isOpenEnded) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsComplete(true);
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isOpenEnded]);

  // Open-ended timer (counts up)
  useEffect(() => {
    if (!isRunning || !isOpenEnded) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isOpenEnded]);

  const handleStart = useCallback(async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setIsRunning(true);
    startTimeRef.current = Date.now();
    if (selectedSound) {
      await startAudio();
    }
  }, [selectedSound, startAudio]);

  const handlePause = useCallback(async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setIsRunning(false);
  }, []);

  const handleResume = useCallback(async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setIsRunning(false);
    setIsComplete(true);
    await stopAudio();
  }, [stopAudio]);

  const handleSoundChange = useCallback(async (soundId: string) => {
    setSelectedSound(soundId || undefined);
    if (isRunning) {
      await stopAudio();
      // New sound will be started by useFocusAudio effect
    }
  }, [isRunning, stopAudio]);

  const handleExit = useCallback(async () => {
    await stopAudio();
    navigation.goBack();
  }, [stopAudio, navigation]);

  const handleExitRequest = useCallback(() => {
    if (isRunning || (startTimeRef.current > 0 && !isComplete)) {
      setShowExitConfirm(true);
    } else {
      handleExit();
    }
  }, [isRunning, isComplete, handleExit]);

  const elapsedSeconds = isOpenEnded
    ? remainingSeconds
    : totalSeconds - remainingSeconds;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <SafeAreaView style={styles.centered}>
          <Text variant="bodyLarge" color="inkMuted">Session not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  // Completion view
  if (isComplete) {
    return (
      <View style={styles.container}>
        <AmbientBackground variant="calm" intensity="subtle" />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.completeContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.statusSuccess} />
            <Text variant="displaySmall" color="ink" align="center" style={styles.completeTitle}>
              Focus complete
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeSubtitle}>
              {session.name}
            </Text>

            <GlassCard variant="elevated" padding="lg" style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text variant="labelSmall" color="inkFaint">Duration</Text>
                <Text variant="headlineSmall" color="ink">
                  {elapsedMinutes} {elapsedMinutes === 1 ? 'minute' : 'minutes'}
                </Text>
              </View>
              {selectedSound && (
                <View style={[styles.statRow, { marginTop: spacing[3] }]}>
                  <Text variant="labelSmall" color="inkFaint">Ambient sound</Text>
                  <Text variant="bodyMedium" color="ink">
                    {getSoundById(selectedSound)?.name ?? 'Custom'}
                  </Text>
                </View>
              )}
            </GlassCard>

            <Pressable
              onPress={handleExit}
              style={[styles.doneButton, { backgroundColor: colors.accentPrimary }]}
            >
              <Text variant="labelMedium" style={{ color: colors.inkInverse }}>Done</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AmbientBackground variant="focus" intensity="subtle" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(300)}
          style={styles.header}
        >
          <Pressable onPress={handleExitRequest} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <Text variant="labelMedium" color="inkMuted">{session.name}</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}>
            {isOpenEnded ? (
              <View style={styles.openTimerContainer}>
                <Text variant="displayLarge" style={{ color: colors.ink, fontSize: 48 }}>
                  {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
                </Text>
                <Text variant="labelSmall" color="inkFaint" style={{ marginTop: spacing[2] }}>
                  {isRunning ? 'Focusing' : startTimeRef.current > 0 ? 'Paused' : 'Ready'}
                </Text>
              </View>
            ) : (
              <CircularTimer
                remainingSeconds={remainingSeconds}
                totalSeconds={totalSeconds}
                isRunning={isRunning}
              />
            )}
          </Animated.View>

          <Text variant="bodySmall" color="inkMuted" align="center" style={styles.purpose}>
            {session.purpose}
          </Text>
        </View>

        {/* Sound picker */}
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}>
          <Text variant="labelSmall" color="inkFaint" style={styles.soundLabel}>
            Ambient sound
          </Text>
          <SoundPicker selectedId={selectedSound} onSelect={handleSoundChange} />
        </Animated.View>

        {/* Controls */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.delay(300).duration(400)}
          style={styles.controls}
        >
          {!isRunning && startTimeRef.current === 0 ? (
            <Pressable
              onPress={handleStart}
              style={[styles.primaryButton, { backgroundColor: colors.accentPrimary }]}
              accessibilityRole="button"
              accessibilityLabel="Start focus session"
            >
              <Ionicons name="play" size={28} color={colors.inkInverse} />
              <Text variant="labelMedium" style={{ color: colors.inkInverse, marginLeft: spacing[2] }}>
                Start Focus
              </Text>
            </Pressable>
          ) : (
            <View style={styles.controlRow}>
              {isRunning ? (
                <Pressable
                  onPress={handlePause}
                  style={[styles.controlButton, { backgroundColor: withAlpha(colors.canvasElevated, 0.8) }]}
                  accessibilityRole="button"
                  accessibilityLabel="Pause"
                >
                  <Ionicons name="pause" size={28} color={colors.ink} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleResume}
                  style={[styles.controlButton, { backgroundColor: colors.accentPrimary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Resume"
                >
                  <Ionicons name="play" size={28} color={colors.inkInverse} />
                </Pressable>
              )}

              <Pressable
                onPress={handleStop}
                style={[styles.controlButton, { backgroundColor: withAlpha(colors.canvasElevated, 0.8) }]}
                accessibilityRole="button"
                accessibilityLabel="Stop focus session"
              >
                <Ionicons name="stop" size={24} color={colors.ink} />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>

      <ExitConfirmationModal
        visible={showExitConfirm}
        title="End focus session?"
        message="Your progress won't be saved."
        confirmText="End Session"
        cancelText="Continue"
        onConfirm={() => {
          setShowExitConfirm(false);
          handleExit();
        }}
        onCancel={() => setShowExitConfirm(false)}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[3],
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  openTimerContainer: {
    alignItems: 'center',
  },
  purpose: {
    marginTop: spacing[4],
    maxWidth: 260,
  },
  soundLabel: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[2],
  },
  controls: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Complete view
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  completeTitle: {
    marginTop: spacing[4],
  },
  completeSubtitle: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  statsCard: {
    width: '100%',
    marginBottom: spacing[6],
  },
  statRow: {
    alignItems: 'center',
  },
  doneButton: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
});

export default FocusSessionScreen;
