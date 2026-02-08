/**
 * CoachMarkOverlay - Animated tooltip for first-time feature hints
 *
 * Appears with a fade animation, dismisses on tap.
 * Respects reduceMotion preference.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useCoachMarks, COACH_MARKS } from '../../contexts/CoachMarkContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

interface CoachMarkOverlayProps {
  markId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function CoachMarkOverlay({ markId, visible, onDismiss }: CoachMarkOverlayProps) {
  const { colors, reduceMotion } = useTheme();
  const mark = COACH_MARKS[markId];

  if (!visible || !mark) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={styles.container}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.ink,
              shadowColor: colors.ink,
            },
          ]}
        >
          <Text variant="labelLarge" style={{ color: colors.inkInverse, marginBottom: spacing[1] }}>
            {mark.title}
          </Text>
          <Text variant="bodySmall" style={{ color: withAlpha(colors.inkInverse, 0.8) }}>
            {mark.description}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: withAlpha(colors.inkInverse, 0.5), marginTop: spacing[2] }}
          >
            Tap to dismiss
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  tooltip: {
    maxWidth: 280,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default CoachMarkOverlay;
