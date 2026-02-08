/**
 * ProgramDayCompleteScreen - Day/Program completion celebration
 *
 * Shown after completing a program day session.
 * Calm celebration with progress visualization.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground } from '../../components/ui';
import { Button } from '../../components/ui';
import { getProgramById } from '../../data/programs';
import { programProgress } from '../../services/programProgress';
import { spacing, withAlpha, layout } from '../../theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RouteParams = {
  ProgramDayComplete: {
    programId: string;
    dayNumber: number;
    duration: number;
  };
};

export function ProgramDayCompleteScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProgramDayComplete'>>();

  const { programId, dayNumber, duration } = route.params;
  const program = getProgramById(programId);
  const day = program?.days.find((d) => d.day === dayNumber);

  const isLastDay = program ? dayNumber >= program.totalDays : false;
  const [recorded, setRecorded] = useState(false);

  // Record day completion
  useEffect(() => {
    if (recorded || !program) return;

    const record = async () => {
      await programProgress.initialize();
      await programProgress.completeDay(
        programId,
        {
          day: dayNumber,
          completedAt: new Date().toISOString(),
          activitiesCompleted: day?.activities.map((a) => a.id) ?? [],
          totalDuration: duration,
        },
        program.totalDays,
      );
      setRecorded(true);

      // Celebration haptic
      if (isLastDay) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    };

    record();
  }, [programId, dayNumber, duration, program, day, isLastDay, recorded]);

  const handleBackToProgram = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProgramDetail' as any, { programId });
  }, [navigation, programId]);

  const handleGoHome = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main' as any);
  }, [navigation]);

  const minutes = Math.max(1, Math.round(duration / 60));

  if (!program || !day) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <SafeAreaView style={styles.safeArea}>
          <Text variant="bodyLarge" color="inkMuted" align="center" style={{ marginTop: 100 }}>
            Something went wrong
          </Text>
          <Button variant="ghost" onPress={handleGoHome} style={{ marginTop: spacing[4] }}>
            Go home
          </Button>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Celebration */}
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.celebration}>
            <View
              style={[
                styles.celebrationIcon,
                {
                  backgroundColor: withAlpha(
                    isLastDay ? colors.accentWarm : colors.accentPrimary,
                    0.12,
                  ),
                },
              ]}
            >
              <Ionicons
                name={isLastDay ? 'trophy-outline' : 'checkmark-circle-outline'}
                size={48}
                color={isLastDay ? colors.accentWarm : colors.accentPrimary}
              />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.titleSection}>
            <Text variant="displaySmall" color="ink" align="center">
              {isLastDay ? 'Program Complete' : `Day ${dayNumber} Complete`}
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.subtitle}>
              {isLastDay
                ? `You have finished ${program.name}. Well done.`
                : day.title}
            </Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.statsSection}>
            <GlassCard variant="subtle" padding="md">
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={18} color={colors.inkFaint} />
                  <Text variant="headlineSmall" color="ink" style={styles.statValue}>
                    {minutes}
                  </Text>
                  <Text variant="labelSmall" color="inkFaint">
                    {minutes === 1 ? 'minute' : 'minutes'}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Ionicons name="layers-outline" size={18} color={colors.inkFaint} />
                  <Text variant="headlineSmall" color="ink" style={styles.statValue}>
                    {day.activities.length}
                  </Text>
                  <Text variant="labelSmall" color="inkFaint">
                    {day.activities.length === 1 ? 'activity' : 'activities'}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Progress dots */}
          <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.dotsSection}>
            <Text variant="labelSmall" color="inkFaint" align="center" style={styles.dotsLabel}>
              {isLastDay
                ? `All ${program.totalDays} days completed`
                : `${dayNumber} of ${program.totalDays} days`}
            </Text>
            <View style={styles.dotsRow}>
              {program.days.map((d) => (
                <View
                  key={d.day}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        d.day <= dayNumber
                          ? colors.accentPrimary
                          : withAlpha(colors.inkFaint, 0.2),
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Footer CTA */}
        <Animated.View entering={FadeInDown.delay(1000).duration(500)} style={styles.footer}>
          {isLastDay ? (
            <Button variant="glow" size="lg" fullWidth onPress={handleGoHome}>
              Return to Sanctuary
            </Button>
          ) : (
            <>
              <Button variant="glow" size="lg" fullWidth onPress={handleBackToProgram}>
                Back to Program
              </Button>
              <Button variant="ghost" size="md" onPress={handleGoHome} style={styles.secondaryCta}>
                Go home
              </Button>
            </>
          )}
        </Animated.View>
      </SafeAreaView>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  celebration: {
    marginBottom: spacing[6],
  },
  celebrationIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: spacing[6],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  statsSection: {
    width: '100%',
    marginBottom: spacing[6],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  statValue: {
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  dotsSection: {
    alignItems: 'center',
  },
  dotsLabel: {
    marginBottom: spacing[2],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[4],
  },
  secondaryCta: {
    marginTop: spacing[2],
    alignSelf: 'center',
  },
});

export default ProgramDayCompleteScreen;
