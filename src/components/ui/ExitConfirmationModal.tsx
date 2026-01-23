/**
 * ExitConfirmationModal
 * 
 * Modal dialog to confirm exiting from an active session.
 * Prevents accidental loss of progress.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { spacing, borderRadius, withAlpha } from '../../theme';

interface ExitConfirmationModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmationModal({
  visible,
  title = 'Leave session?',
  message = "Your progress won't be saved.",
  confirmText = 'Leave',
  cancelText = 'Continue',
  onConfirm,
  onCancel,
}: ExitConfirmationModalProps) {
  const { colors, reduceMotion } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel}>
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
            exiting={reduceMotion ? undefined : FadeOut.duration(150)}
            style={[styles.backdropFill, { backgroundColor: colors.overlay }]}
          />
        </Pressable>

        <Animated.View
          entering={reduceMotion ? undefined : SlideInDown.springify().damping(20)}
          exiting={reduceMotion ? undefined : SlideOutDown.duration(200)}
          style={styles.modalContainer}
        >
          <GlassCard variant="elevated" padding="lg">
            <View style={styles.content}>
              <Text variant="headlineMedium" color="ink" align="center">
                {title}
              </Text>
              <Text 
                variant="bodyMedium" 
                color="inkMuted" 
                align="center"
                style={styles.message}
              >
                {message}
              </Text>

              <View style={styles.actions}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={onCancel}
                  accessibilityLabel={cancelText}
                >
                  {cancelText}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={onConfirm}
                  accessibilityLabel={confirmText}
                  style={styles.leaveButton}
                >
                  {confirmText}
                </Button>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  modalContainer: {
    width: '85%',
    maxWidth: 340,
  },
  content: {
    alignItems: 'center',
  },
  message: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  actions: {
    width: '100%',
    gap: spacing[2],
  },
  leaveButton: {
    marginTop: spacing[1],
  },
});
