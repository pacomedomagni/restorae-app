/**
 * ProgressDrawer
 * 
 * Bottom drawer showing session queue progress.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard } from '../ui';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { Activity, ActivityType } from '../../types/session';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ProgressDrawerProps {
  visible: boolean;
  queue: Activity[];
  currentIndex: number;
  onClose: () => void;
  onJumpTo?: (index: number) => void;
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

export function ProgressDrawer({
  visible,
  queue,
  currentIndex,
  onClose,
  onJumpTo,
}: ProgressDrawerProps) {
  const { colors, reduceMotion } = useTheme();

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Animated.View 
        entering={reduceMotion ? undefined : SlideInDown.duration(300)}
        exiting={reduceMotion ? undefined : SlideOutDown.duration(300)}
        style={styles.drawer}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <GlassCard variant="elevated" padding="lg">
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: withAlpha(colors.ink, 0.2) }]} />
            
            {/* Header */}
            <View style={styles.header}>
              <Text variant="headlineSmall" color="ink">Session Progress</Text>
              <Text variant="labelSmall" color="inkMuted">
                {currentIndex + 1} of {queue.length} activities
              </Text>
            </View>

            {/* Queue List */}
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {queue.map((activity, index) => {
                const isComplete = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isPending = index > currentIndex;

                return (
                  <Pressable
                    key={activity.id}
                    onPress={() => onJumpTo?.(index)}
                    disabled={!onJumpTo || isPending}
                    style={[
                      styles.item,
                      isCurrent && { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
                    ]}
                  >
                    {/* Status Indicator */}
                    <View style={[
                      styles.status,
                      isComplete && { backgroundColor: colors.accentCalm },
                      isCurrent && { backgroundColor: colors.accentPrimary },
                      isPending && { backgroundColor: withAlpha(colors.ink, 0.1) },
                    ]}>
                      {isComplete ? (
                        <Text style={styles.statusCheck}>✓</Text>
                      ) : (
                        <Text style={styles.statusNumber}>{index + 1}</Text>
                      )}
                    </View>

                    {/* Activity Info */}
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemIcon}>{getActivityIcon(activity.type)}</Text>
                        <Text 
                          variant="bodyMedium" 
                          color={isPending ? 'inkMuted' : 'ink'}
                        >
                          {activity.name}
                        </Text>
                      </View>
                      {activity.duration && (
                        <Text variant="labelSmall" color="inkFaint">
                          {Math.floor(activity.duration / 60)} min
                        </Text>
                      )}
                    </View>

                    {/* Current Indicator */}
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.accentPrimary }]}>
                        <Text variant="labelSmall" color="inkInverse">Now</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Close Button */}
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text variant="labelLarge" color="inkMuted">Close</Text>
            </Pressable>
          </GlassCard>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  drawer: { maxHeight: SCREEN_HEIGHT * 0.7 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing[4] },
  header: { marginBottom: spacing[4] },
  list: { maxHeight: 300 },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing[3], 
    borderRadius: borderRadius.md, 
    marginBottom: spacing[2] 
  },
  status: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing[3] 
  },
  statusCheck: { fontSize: 14, color: '#fff' },
  statusNumber: { fontSize: 12, color: '#fff', fontWeight: '600' },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  itemIcon: { fontSize: 16 },
  currentBadge: { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: borderRadius.sm },
  closeButton: { alignItems: 'center', paddingVertical: spacing[3], marginTop: spacing[3] },
});

export default ProgressDrawer;
