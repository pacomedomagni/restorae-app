/**
 * SessionHeader
 * 
 * Compact header for session screens showing progress and controls.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../ui';
import { spacing, withAlpha } from '../../theme';
import { SessionMode } from '../../types/session';

export interface SessionHeaderProps {
  mode?: SessionMode;
  activityName?: string;
  sessionName?: string;
  progress: number; // 0-1
  completedCount?: number;
  totalCount?: number;
  onClose?: () => void;
  onProgressTap?: () => void;
}

export function SessionHeader({
  mode,
  activityName,
  sessionName,
  progress,
  completedCount,
  totalCount,
  onClose,
  onProgressTap,
}: SessionHeaderProps) {
  const { colors, reduceMotion } = useTheme();
  
  const title = activityName || 'Activity';
  const subtitle = sessionName || (completedCount !== undefined && totalCount !== undefined 
    ? `${completedCount + 1} of ${totalCount}` 
    : undefined);

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      style={styles.container}
    >
      {/* Close Button */}
      {onClose && (
        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
          <Text variant="bodyMedium" color="ink">✕</Text>
        </Pressable>
      )}

      {/* Center Content */}
      <Pressable onPress={onProgressTap} style={styles.centerContent} disabled={!onProgressTap}>
        {title && <Text variant="labelMedium" color="ink">{title}</Text>}
        {subtitle && <Text variant="labelSmall" color="inkMuted">{subtitle}</Text>}
      </Pressable>

      {/* Progress Drawer Toggle */}
      {onProgressTap && (
        <Pressable onPress={onProgressTap} style={styles.drawerButton} hitSlop={12}>
          <Text variant="bodyMedium" color="ink">☰</Text>
        </Pressable>
      )}

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: withAlpha(colors.ink, 0.1) }]}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.accentPrimary, width: `${Math.min(progress * 100, 100)}%` },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  closeButton: { position: 'absolute', left: spacing[5], top: spacing[3], zIndex: 1 },
  centerContent: { alignItems: 'center' },
  drawerButton: { position: 'absolute', right: spacing[5], top: spacing[3], zIndex: 1 },
  progressContainer: { height: 3, borderRadius: 2, marginTop: spacing[3] },
  progressBar: { height: '100%', borderRadius: 2 },
});

export default SessionHeader;
