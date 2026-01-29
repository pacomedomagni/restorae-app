/**
 * SessionSummaryScreen
 * 
 * Beautiful completion screen shown after finishing a session.
 * Shows XP earned, activities completed, and celebration animation.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, Button, AmbientBackground } from '../components/ui';
import { spacing, borderRadius, withAlpha } from '../theme';
import { RootStackParamList } from '../types';
import { SessionSummary, ActivityType, ActivityState } from '../types/session';
import { useHaptics } from '../hooks/useHaptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================
type SessionSummaryRouteParams = {
  summary: SessionSummary;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionSummary'>;

// =============================================================================
// HELPERS
// =============================================================================
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

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'ritual': return 'Ritual Complete!';
    case 'sos': return 'SOS Complete!';
    default: return 'Session Complete!';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================
export function SessionSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: SessionSummaryRouteParams }, 'params'>>();
  const { colors, reduceMotion } = useTheme();
  const { notificationSuccess, impactHeavy } = useHaptics();

  const { summary } = route.params;
  const {
    mode,
    ritualName,
    sosPresetName,
    activitiesCompleted,
    activitiesSkipped,
    totalDuration,
    xpEarned,
  } = summary;

  // Animation values
  const xpScale = useSharedValue(0);

  useEffect(() => {
    // Celebrate!
    notificationSuccess();
    setTimeout(() => impactHeavy(), 300);

    // Animate XP
    xpScale.value = withDelay(
      500,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      )
    );
  }, []);

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const sessionName = ritualName || sosPresetName || 'Session';

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleStartAnother = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
    // Could navigate to tools screen here if desired
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Celebration Icon */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}
            style={styles.celebrationIcon}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </Animated.View>

          {/* Main Message */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(500)}
            style={styles.mainMessage}
          >
            <Text variant="displaySmall" color="ink" align="center">
              {getModeLabel(mode)}
            </Text>
            {sessionName !== 'Session' && (
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.sessionName}>
                {sessionName}
              </Text>
            )}
          </Animated.View>

          {/* XP Earned */}
          {xpEarned > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(500)}
              style={[styles.xpContainer, xpAnimatedStyle]}
            >
              <GlassCard variant="elevated" padding="lg">
                <View style={styles.xpContent}>
                  <Text style={styles.xpIcon}>⭐</Text>
                  <Text variant="headlineLarge" color="ink">+{xpEarned} XP</Text>
                  <Text variant="labelSmall" color="inkMuted">earned</Text>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Stats Row */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(500).duration(500)}
            style={styles.statsRow}
          >
            <View style={[styles.statItem, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
              <Text variant="headlineMedium" color="ink">{activitiesCompleted.length}</Text>
              <Text variant="labelSmall" color="inkMuted">completed</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: withAlpha(colors.accentCalm, 0.1) }]}>
              <Text variant="headlineMedium" color="ink">{formatDuration(totalDuration)}</Text>
              <Text variant="labelSmall" color="inkMuted">total time</Text>
            </View>
          </Animated.View>

          {/* Activities List */}
          {activitiesCompleted.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.delay(600).duration(500)}
              style={styles.activitiesSection}
            >
              <Text variant="labelMedium" color="inkMuted" style={styles.sectionLabel}>
                COMPLETED
              </Text>
              
              {activitiesCompleted.map((actState: ActivityState, index: number) => (
                <Animated.View
                  key={`${actState.activity.id}-${index}`}
                  entering={reduceMotion ? undefined : FadeInUp.delay(700 + index * 100).duration(400)}
                  style={[
                    styles.activityItem,
                    { backgroundColor: withAlpha(colors.success, 0.08) },
                  ]}
                >
                  <Text style={styles.activityIcon}>
                    {getActivityIcon(actState.activity.type)}
                  </Text>
                  <View style={styles.activityInfo}>
                    <Text variant="labelMedium" color="ink">
                      {actState.activity.name}
                    </Text>
                    {actState.actualDuration && (
                      <Text variant="labelSmall" color="inkMuted">
                        {Math.ceil(actState.actualDuration / 60)} min
                      </Text>
                    )}
                  </View>
                  <Text style={styles.checkmark}>✓</Text>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Skipped Activities (if any) */}
          {activitiesSkipped.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.delay(800).duration(500)}
              style={styles.activitiesSection}
            >
              <Text variant="labelMedium" color="inkMuted" style={styles.sectionLabel}>
                SKIPPED
              </Text>
              
              {activitiesSkipped.map((actState: ActivityState, index: number) => (
                <View
                  key={`skipped-${actState.activity.id}-${index}`}
                  style={[
                    styles.activityItem,
                    { backgroundColor: withAlpha(colors.ink, 0.04) },
                  ]}
                >
                  <Text style={[styles.activityIcon, { opacity: 0.5 }]}>
                    {getActivityIcon(actState.activity.type)}
                  </Text>
                  <View style={styles.activityInfo}>
                    <Text variant="labelMedium" color="inkMuted">
                      {actState.activity.name}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(900).duration(500)}
            style={styles.actions}
          >
            <Button variant="glow" size="lg" fullWidth onPress={handleDone}>
              Done
            </Button>
            <Pressable onPress={handleStartAnother} style={styles.secondaryButton}>
              <Text variant="labelMedium" color="inkMuted">Start another session</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing[5], paddingTop: spacing[8] },
  celebrationIcon: { alignItems: 'center', marginBottom: spacing[4] },
  celebrationEmoji: { fontSize: 64 },
  mainMessage: { alignItems: 'center', marginBottom: spacing[6] },
  sessionName: { marginTop: spacing[2] },
  xpContainer: { alignItems: 'center', marginBottom: spacing[6] },
  xpContent: { alignItems: 'center', gap: spacing[1] },
  xpIcon: { fontSize: 32 },
  statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[6] },
  statItem: { flex: 1, padding: spacing[4], borderRadius: borderRadius.lg, alignItems: 'center' },
  activitiesSection: { marginBottom: spacing[6] },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing[3] },
  activityItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing[3], 
    borderRadius: borderRadius.md, 
    marginBottom: spacing[2] 
  },
  activityIcon: { fontSize: 20, marginRight: spacing[3] },
  activityInfo: { flex: 1 },
  checkmark: { fontSize: 16, color: '#22c55e' },
  actions: { gap: spacing[3], marginTop: spacing[4], marginBottom: spacing[10] },
  secondaryButton: { alignItems: 'center', padding: spacing[3] },
});

export default SessionSummaryScreen;
