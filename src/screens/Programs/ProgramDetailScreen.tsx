/**
 * ProgramDetailScreen - Day-by-day program overview
 *
 * The centerpiece screen. Shows a vertical timeline of program days
 * with progress indicators, a hero header, and a primary CTA.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { usePremiumFeature } from '../../hooks/usePremiumFeature';
import { Text, GlassCard, ScreenHeader, AmbientBackground, AlertModal } from '../../components/ui';
import { Button } from '../../components/ui';
import { getProgramById, WellnessProgram, ProgramDay } from '../../data/programs';
import { getProgramDayRitual } from '../../data/programSessionPresets';
import { programProgress, ProgramProgress } from '../../services/programProgress';
import { spacing, borderRadius, withAlpha, layout } from '../../theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// =============================================================================
// DAY CARD COMPONENT
// =============================================================================

interface DayCardProps {
  program: WellnessProgram;
  day: ProgramDay;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  index: number;
  onPress: () => void;
}

function DayCard({ program, day, isUnlocked, isCompleted, isCurrent, index, onPress }: DayCardProps) {
  const { colors } = useTheme();

  const statusIcon = isCompleted
    ? 'checkmark-circle'
    : isCurrent
      ? 'radio-button-on'
      : 'lock-closed-outline';

  const statusColor = isCompleted
    ? colors.statusSuccess
    : isCurrent
      ? colors.accentPrimary
      : colors.inkFaint;

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 60).duration(400)}>
      <View style={styles.dayRow}>
        {/* Timeline connector */}
        <View style={styles.timelineColumn}>
          <Ionicons name={statusIcon as any} size={18} color={statusColor} />
          {index < program.totalDays - 1 && (
            <View
              style={[
                styles.timelineLine,
                {
                  backgroundColor: isCompleted
                    ? colors.statusSuccess
                    : withAlpha(colors.border, 0.5),
                },
              ]}
            />
          )}
        </View>

        {/* Day content */}
        <View style={styles.dayContent}>
          <Pressable
            onPress={isUnlocked ? onPress : undefined}
            disabled={!isUnlocked}
            style={{ opacity: isUnlocked ? 1 : 0.5 }}
          >
            <GlassCard
              variant={isCurrent ? 'elevated' : 'subtle'}
              padding="md"
              glow={isCurrent ? 'calm' : undefined}
            >
              <View style={styles.dayHeader}>
                <Text variant="labelSmall" color="inkFaint">
                  Day {day.day}
                </Text>
                <View
                  style={[
                    styles.themeBadge,
                    { backgroundColor: withAlpha(colors.accentPrimary, 0.08) },
                  ]}
                >
                  <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
                    {day.theme}
                  </Text>
                </View>
              </View>

              <Text variant="headlineSmall" color="ink" style={styles.dayTitle}>
                {day.title}
              </Text>
              <Text variant="bodySmall" color="inkMuted" numberOfLines={2}>
                {day.description}
              </Text>

              <View style={styles.dayMeta}>
                <Ionicons name="time-outline" size={12} color={colors.inkFaint} />
                <Text variant="labelSmall" color="inkFaint" style={{ marginLeft: 4 }}>
                  {day.estimatedDuration}
                </Text>
                <Text variant="labelSmall" color="inkFaint" style={{ marginLeft: spacing[2] }}>
                  {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                </Text>
              </View>

              {isCurrent && (
                <View style={styles.ctaRow}>
                  <Button variant="primary" size="sm" onPress={onPress}>
                    Begin Day {day.day}
                  </Button>
                </View>
              )}
            </GlassCard>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// PROGRAM DETAIL SCREEN
// =============================================================================

export function ProgramDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ ProgramDetail: { programId: string } }, 'ProgramDetail'>>();
  const session = useSession();
  const { checkAccessOrPaywall } = usePremiumFeature();

  const programId = route.params.programId;
  const program = getProgramById(programId);

  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [showStartAlert, setShowStartAlert] = useState(false);

  useEffect(() => {
    const load = async () => {
      await programProgress.initialize();
      const p = await programProgress.getProgress(programId);
      setProgress(p);
    };
    load();
  }, [programId]);

  // Reload progress when screen comes back into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const p = await programProgress.getProgress(programId);
      setProgress(p);
    });
    return unsubscribe;
  }, [navigation, programId]);

  const handleStartDay = useCallback(
    async (dayNumber: number) => {
      if (!program) return;

      // Premium programs require subscription
      if (program.isPremium) {
        const hasAccess = checkAccessOrPaywall(program.id, program.name);
        if (!hasAccess) return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start program if not already started
      if (!progress) {
        const newProgress = await programProgress.startProgram(programId, program.totalDays);
        setProgress(newProgress);
      }

      // Convert day to Ritual and start session
      const ritual = getProgramDayRitual(programId, dayNumber);
      if (ritual) {
        session.startProgramDay(ritual, programId, dayNumber);
      }
    },
    [program, progress, programId, session, checkAccessOrPaywall],
  );

  const handleMainCTA = useCallback(() => {
    if (!program) return;

    if (!progress) {
      // First time — show confirmation then start Day 1
      setShowStartAlert(true);
    } else if (progress.status === 'active') {
      // Continue to current day
      handleStartDay(progress.currentDay);
    } else if (progress.status === 'completed') {
      // Replay Day 1
      handleStartDay(1);
    }
  }, [program, progress, handleStartDay]);

  if (!program) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Text variant="bodyLarge" color="inkMuted" align="center" style={{ marginTop: 100 }}>
            Program not found
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const currentDay = progress?.currentDay ?? 1;
  const completedDays = progress?.completedDays.length ?? 0;
  const isCompleted = progress?.status === 'completed';

  const ctaLabel = !progress
    ? 'Begin Program'
    : isCompleted
      ? 'Replay Program'
      : `Continue Day ${currentDay}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant="focus" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </Pressable>

            <View
              style={[
                styles.heroIcon,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
              ]}
            >
              <Ionicons name={program.icon as any} size={32} color={colors.accentPrimary} />
            </View>

            <Text variant="displaySmall" color="ink" align="center" style={styles.heroTitle}>
              {program.name}
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.heroSubtitle}>
              {program.subtitle}
            </Text>

            {/* Progress summary */}
            {progress && (
              <View style={styles.progressSummary}>
                <Text variant="labelMedium" color="inkFaint">
                  {isCompleted
                    ? 'Completed'
                    : `${completedDays} of ${program.totalDays} days`}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Main CTA */}
          <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.ctaSection}>
            <Button variant="glow" size="lg" fullWidth onPress={handleMainCTA}>
              {ctaLabel}
            </Button>
          </Animated.View>

          {/* Day Timeline */}
          <View style={styles.timelineSection}>
            {program.days.map((day, index) => (
              <DayCard
                key={day.day}
                program={program}
                day={day}
                isUnlocked={programProgress.isDayUnlocked(programId, day.day)}
                isCompleted={programProgress.isDayCompleted(programId, day.day)}
                isCurrent={!isCompleted && day.day === currentDay}
                index={index}
                onPress={() => handleStartDay(day.day)}
              />
            ))}
          </View>

          {/* About Section */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.aboutSection}>
            <Text variant="labelSmall" color="inkFaint" style={styles.aboutLabel}>
              About this program
            </Text>
            <Text variant="bodyMedium" color="inkMuted">
              {program.description}
            </Text>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Start Confirmation */}
      <AlertModal
        visible={showStartAlert}
        type="confirm"
        title={`Start ${program.name}?`}
        message={`This ${program.totalDays}-day program takes about ${program.estimatedDailyDuration} each day. Complete at your own pace.`}
        onConfirm={() => {
          setShowStartAlert(false);
          handleStartDay(1);
        }}
        onCancel={() => setShowStartAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heroTitle: {
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    marginBottom: spacing[3],
  },
  progressSummary: {
    marginTop: spacing[1],
  },
  ctaSection: {
    marginBottom: spacing[6],
  },
  timelineSection: {
    marginBottom: spacing[6],
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  timelineColumn: {
    width: 30,
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: spacing[2],
  },
  dayContent: {
    flex: 1,
    marginLeft: spacing[2],
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  themeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  dayTitle: {
    marginBottom: spacing[1],
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  ctaRow: {
    marginTop: spacing[3],
  },
  aboutSection: {
    paddingBottom: spacing[4],
  },
  aboutLabel: {
    marginBottom: spacing[2],
  },
});

export default ProgramDetailScreen;
