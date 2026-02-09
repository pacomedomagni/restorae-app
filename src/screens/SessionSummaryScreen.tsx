/**
 * SessionSummaryScreen
 *
 * Completion screen for ritual/multi-activity sessions.
 * Clean, reflective — no gamification or party emoji.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, Button, AmbientBackground } from '../components/ui';
import { spacing, borderRadius, withAlpha } from '../theme';
import { RootStackParamList } from '../types';
import { SessionSummary, ActivityType, ActivityState } from '../types/session';
import { useHaptics } from '../hooks/useHaptics';

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
const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breathing: 'leaf-outline',
  grounding: 'earth-outline',
  reset: 'refresh-outline',
  focus: 'compass-outline',
  journal: 'book-outline',
};

function getActivityIconName(type: ActivityType): keyof typeof Ionicons.glyphMap {
  return ACTIVITY_ICONS[type] || 'sparkles-outline';
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'ritual': return 'Ritual complete';
    case 'sos': return 'You did it';
    default: return 'Session complete';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================
export function SessionSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: SessionSummaryRouteParams }, 'params'>>();
  const { colors, reduceMotion } = useTheme();
  const { notificationSuccess } = useHaptics();

  const { summary } = route.params;
  const {
    mode,
    ritualName,
    sosPresetName,
    activitiesCompleted,
    activitiesSkipped,
    totalDuration,
  } = summary;

  useEffect(() => {
    notificationSuccess();
  }, []);

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
          {/* Checkmark Icon */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}
            style={styles.iconContainer}
          >
            <View
              style={[styles.checkCircle, { backgroundColor: withAlpha(colors.success, 0.12) }]}
              accessible={false}
              importantForAccessibility="no"
            >
              <Ionicons name="checkmark" size={36} color={colors.success} />
            </View>
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

          {/* Stats Row */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(500)}
            style={styles.statsRow}
          >
            <View
              style={[styles.statItem, { backgroundColor: withAlpha(colors.accentPrimary, 0.08) }]}
              accessibilityLabel={`${activitiesCompleted.length} completed`}
            >
              <Text variant="headlineMedium" color="ink">{activitiesCompleted.length}</Text>
              <Text variant="labelSmall" color="inkMuted">completed</Text>
            </View>
            <View
              style={[styles.statItem, { backgroundColor: withAlpha(colors.accentCalm, 0.08) }]}
              accessibilityLabel={`Total time: ${formatDuration(totalDuration)}`}
            >
              <Text variant="headlineMedium" color="ink">{formatDuration(totalDuration)}</Text>
              <Text variant="labelSmall" color="inkMuted">total time</Text>
            </View>
          </Animated.View>

          {/* Activities List */}
          {activitiesCompleted.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.delay(500).duration(500)}
              style={styles.activitiesSection}
            >
              <Text
                variant="labelMedium"
                color="inkMuted"
                style={styles.sectionLabel}
                accessibilityRole="header"
              >
                COMPLETED
              </Text>

              {activitiesCompleted.map((actState: ActivityState, index: number) => (
                <Animated.View
                  key={`${actState.activity.id}-${index}`}
                  entering={reduceMotion ? undefined : FadeInUp.delay(600 + index * 80).duration(400)}
                  style={[
                    styles.activityItem,
                    { backgroundColor: withAlpha(colors.success, 0.06) },
                  ]}
                  accessibilityRole="summary"
                  accessibilityLabel={`${actState.activity.name}, ${actState.actualDuration ? `${Math.ceil(actState.actualDuration / 60)} minutes` : 'completed'}`}
                >
                  <Ionicons
                    name={getActivityIconName(actState.activity.type)}
                    size={18}
                    color={colors.success}
                    style={styles.activityIconStyle}
                  />
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
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Skipped Activities */}
          {activitiesSkipped.length > 0 && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.delay(700).duration(500)}
              style={styles.activitiesSection}
            >
              <Text
                variant="labelMedium"
                color="inkMuted"
                style={styles.sectionLabel}
                accessibilityRole="header"
              >
                SKIPPED
              </Text>

              {activitiesSkipped.map((actState: ActivityState, index: number) => (
                <View
                  key={`skipped-${actState.activity.id}-${index}`}
                  style={[
                    styles.activityItem,
                    { backgroundColor: withAlpha(colors.ink, 0.03) },
                  ]}
                  accessibilityRole="summary"
                  accessibilityLabel={`${actState.activity.name}, skipped`}
                >
                  <Ionicons
                    name={getActivityIconName(actState.activity.type)}
                    size={18}
                    color={colors.inkFaint}
                    style={styles.activityIconStyle}
                  />
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
            entering={reduceMotion ? undefined : FadeInUp.delay(800).duration(500)}
            style={styles.actions}
          >
            <Button variant="glow" size="lg" fullWidth onPress={handleDone}>
              Return to sanctuary
            </Button>
            <Pressable
              onPress={handleStartAnother}
              style={styles.secondaryButton}
              accessibilityRole="button"
              accessibilityLabel="Start another session"
              accessibilityHint="Returns to session selection"
            >
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
  iconContainer: { alignItems: 'center', marginBottom: spacing[4] },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainMessage: { alignItems: 'center', marginBottom: spacing[6] },
  sessionName: { marginTop: spacing[2] },
  statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[6] },
  statItem: { flex: 1, padding: spacing[4], borderRadius: borderRadius.lg, alignItems: 'center' },
  activitiesSection: { marginBottom: spacing[6] },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing[3] },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  activityIconStyle: { marginRight: spacing[3] },
  activityInfo: { flex: 1 },
  actions: { gap: spacing[3], marginTop: spacing[4], marginBottom: spacing[10] },
  secondaryButton: { alignItems: 'center', padding: spacing[3] },
});

export default SessionSummaryScreen;
