/**
 * ActivityTransition
 * 
 * Transition screen between activities in a session.
 */
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button } from '../ui';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { Activity, ActivityType } from '../../types/session';

export interface ActivityTransitionProps {
  completedActivity: Activity;
  nextActivity: Activity | null;
  currentIndex: number;
  total: number;
  onContinue: () => void;
  onEnd: () => void;
  autoAdvanceDelay?: number;
}

function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'breathing': return '🌬️';
    case 'grounding': return '🌿';
    case 'reset': return '🔄';
    case 'focus': return '🎯';
    case 'journal': return '📝';
    default: return '✨';
  }
}

function getActivityTypeLabel(type: ActivityType): string {
  switch (type) {
    case 'breathing': return 'Breathing';
    case 'grounding': return 'Grounding';
    case 'reset': return 'Reset';
    case 'focus': return 'Focus';
    case 'journal': return 'Journal';
    default: return 'Activity';
  }
}

export function ActivityTransition({
  completedActivity,
  nextActivity,
  currentIndex,
  total,
  onContinue,
  onEnd,
  autoAdvanceDelay = 0,
}: ActivityTransitionProps) {
  const { colors, reduceMotion } = useTheme();

  useEffect(() => {
    if (autoAdvanceDelay > 0 && nextActivity) {
      const timer = setTimeout(onContinue, autoAdvanceDelay);
      return () => clearTimeout(timer);
    }
  }, [autoAdvanceDelay, nextActivity, onContinue]);

  const isComplete = !nextActivity;

  return (
    <Animated.View 
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View 
        entering={reduceMotion ? undefined : SlideInUp.duration(400).delay(200)}
        style={styles.content}
      >
        {/* Completed Activity */}
        <View style={[styles.completedBadge, { backgroundColor: withAlpha(colors.accentCalm, 0.15) }]}>
          <Text style={styles.checkmark}>✓</Text>
          <Text variant="labelMedium" color="ink">{completedActivity.name} complete</Text>
        </View>

        {/* Main Message */}
        {isComplete ? (
          <>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text variant="displaySmall" color="ink" align="center">
              Session Complete!
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.message}>
              You completed all {total} activities. Great work taking care of yourself today.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.upNextIcon}>{getActivityIcon(nextActivity.type)}</Text>
            <Text variant="labelLarge" color="inkMuted" align="center">
              Up Next
            </Text>
            <Text variant="headlineLarge" color="ink" align="center">
              {nextActivity.name}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.typeLabel}>
              {getActivityTypeLabel(nextActivity.type)}
            </Text>
            <Text variant="labelSmall" color="inkFaint" align="center" style={styles.progress}>
              Activity {currentIndex + 1} of {total}
            </Text>
          </>
        )}
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        {isComplete ? (
          <Button variant="glow" size="lg" fullWidth onPress={onEnd}>
            Finish Session
          </Button>
        ) : (
          <>
            <Button variant="glow" size="lg" fullWidth onPress={onContinue}>
              Continue
            </Button>
            <Pressable onPress={onEnd} style={styles.endButton}>
              <Text variant="labelMedium" color="inkMuted">End session early</Text>
            </Pressable>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing[5] },
  content: { alignItems: 'center', marginBottom: spacing[10] },
  completedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: borderRadius.full, gap: spacing[2], marginBottom: spacing[8] },
  checkmark: { fontSize: 16, color: '#22c55e' },
  celebrationIcon: { fontSize: 64, marginBottom: spacing[4] },
  upNextIcon: { fontSize: 48, marginBottom: spacing[4] },
  message: { marginTop: spacing[3], maxWidth: 280 },
  typeLabel: { marginTop: spacing[2] },
  progress: { marginTop: spacing[4] },
  actions: { gap: spacing[3] },
  endButton: { alignItems: 'center', padding: spacing[3] },
});

export default ActivityTransition;
