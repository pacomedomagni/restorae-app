/**
 * SessionRecoveryModal
 * 
 * Modal for recovering interrupted sessions.
 */
import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, Button } from '../ui';
import { spacing, withAlpha, borderRadius } from '../../theme';
import { PersistedSession, SessionMode } from '../../types/session';

export interface SessionRecoveryModalProps {
  visible: boolean;
  persistedSession: PersistedSession | null;
  onContinue: () => void;
  onDiscard: () => void;
}

function getModeLabel(mode: SessionMode): string {
  switch (mode) {
    case 'ritual': return 'Ritual';
    case 'sos': return 'SOS Session';
    case 'single': return 'Activity';
    default: return 'Session';
  }
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return 'Just now';
}

export function SessionRecoveryModal({
  visible,
  persistedSession,
  onContinue,
  onDiscard,
}: SessionRecoveryModalProps) {
  const { colors, reduceMotion } = useTheme();

  if (!persistedSession) return null;

  const { state, persistedAt } = persistedSession;
  const sessionName = state.mode === 'ritual' 
    ? state.ritualName 
    : state.mode === 'sos' 
      ? state.sosPresetName || 'SOS Session'
      : state.queue[0]?.activity.name || 'Session';

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onDiscard}>
        <Animated.View 
          entering={reduceMotion ? undefined : SlideInDown.duration(400)}
          style={styles.modalContent}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassCard variant="elevated" padding="xl">
              <Text style={styles.icon}>⏸️</Text>
              <Text variant="headlineMedium" color="ink" align="center">
                Continue where you left off?
              </Text>
              <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.description}>
                You have an unfinished {getModeLabel(state.mode).toLowerCase()} from {formatTimeAgo(persistedAt)}.
              </Text>
              
              <View style={[styles.sessionInfo, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
                <Text variant="labelMedium" color="ink">{sessionName}</Text>
                <Text variant="labelSmall" color="inkMuted">
                  {state.currentIndex + 1} of {state.queue.length} activities
                </Text>
              </View>

              <View style={styles.buttons}>
                <Button variant="glow" size="lg" fullWidth onPress={onContinue}>
                  Continue
                </Button>
                <Pressable onPress={onDiscard} style={styles.discardButton}>
                  <Text variant="labelMedium" color="inkMuted">Start fresh instead</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing[5] },
  modalContent: { width: '100%', maxWidth: 360 },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: spacing[4] },
  description: { marginTop: spacing[2], marginBottom: spacing[4] },
  sessionInfo: { padding: spacing[4], borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing[5] },
  buttons: { gap: spacing[3] },
  discardButton: { alignItems: 'center', padding: spacing[3] },
});

export default SessionRecoveryModal;
