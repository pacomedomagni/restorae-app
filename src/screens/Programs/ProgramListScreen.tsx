/**
 * ProgramListScreen - Browse all guided programs
 *
 * Premium, calm browsing of multi-day wellness programs.
 * Each program card shows name, subtitle, duration, and progress.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, ScreenHeader } from '../../components/ui';
import { getAllPrograms, WellnessProgram } from '../../data/programs';
import { programProgress, ProgramProgress } from '../../services/programProgress';
import { spacing, borderRadius, withAlpha, layout } from '../../theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ProgramCard({
  program,
  progress,
  index,
  onPress,
}: {
  program: WellnessProgram;
  progress: ProgramProgress | null;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const completedDays = progress?.completedDays.length ?? 0;
  const isActive = progress?.status === 'active';
  const isCompleted = progress?.status === 'completed';

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(400)}>
      <GlassCard
        variant={isActive ? 'elevated' : 'default'}
        padding="lg"
        onPress={onPress}
        glow={isActive ? 'calm' : undefined}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
            ]}
          >
            <Ionicons
              name={program.icon as any}
              size={22}
              color={colors.accentPrimary}
            />
          </View>
          {program.isPremium && (
            <View
              style={[
                styles.premiumBadge,
                { backgroundColor: withAlpha(colors.accentWarm, 0.12) },
              ]}
            >
              <Text variant="labelSmall" style={{ color: colors.accentWarm }}>
                Premium
              </Text>
            </View>
          )}
          {isCompleted && (
            <Ionicons name="checkmark-circle" size={20} color={colors.statusSuccess} />
          )}
        </View>

        <Text variant="headlineMedium" color="ink" style={styles.cardTitle}>
          {program.name}
        </Text>
        <Text variant="bodySmall" color="inkMuted" style={styles.cardSubtitle}>
          {program.subtitle}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaPill}>
            <Ionicons name="calendar-outline" size={13} color={colors.inkFaint} />
            <Text variant="labelSmall" color="inkFaint" style={styles.metaText}>
              {program.totalDays} days
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={13} color={colors.inkFaint} />
            <Text variant="labelSmall" color="inkFaint" style={styles.metaText}>
              {program.estimatedDailyDuration} daily
            </Text>
          </View>
        </View>

        {/* Progress bar for active programs */}
        {isActive && completedDays > 0 && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.accentPrimary,
                    width: `${(completedDays / program.totalDays) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text variant="labelSmall" color="inkFaint" style={styles.progressText}>
              Day {progress!.currentDay} of {program.totalDays}
            </Text>
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

export function ProgramListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const programs = getAllPrograms();
  const [progressMap, setProgressMap] = useState<Record<string, ProgramProgress | null>>({});

  useEffect(() => {
    const loadProgress = async () => {
      await programProgress.initialize();
      const map: Record<string, ProgramProgress | null> = {};
      for (const program of programs) {
        map[program.id] = await programProgress.getProgress(program.id);
      }
      setProgressMap(map);
    };
    loadProgress();
  }, []);

  const handleProgramPress = useCallback(
    (programId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('ProgramDetail' as any, { programId });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            variant="hero"
            title="Programs"
            subtitle="Guided multi-day journeys"
          />

          {programs.map((program, index) => (
            <ProgramCard
              key={program.id}
              program={program}
              progress={progressMap[program.id] ?? null}
              index={index}
              onPress={() => handleProgramPress(program.id)}
            />
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  premiumBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
  },
  cardTitle: {
    marginBottom: spacing[1],
  },
  cardSubtitle: {
    marginBottom: spacing[3],
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    marginLeft: 2,
  },
  progressBarContainer: {
    marginTop: spacing[3],
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: spacing[1],
  },
});

export default ProgramListScreen;
