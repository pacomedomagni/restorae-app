/**
 * SanctuaryScreen - Your Sanctuary
 *
 * A calm, guided experience. One question, one recommendation, one action.
 * Mood orbs always visible. Offering slides in below — never replaces.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useAmbient } from '../../contexts/AmbientContext';
import { useJourney } from '../../contexts/JourneyContext';

import { Text, Button, GlassCard } from '../../components/ui';
import { MoodOrb } from '../../components/domain/MoodOrb';
import { AmbientBackground } from '../../components/domain/AmbientBackground';

import { getProgramById } from '../../data';
import { programProgress, type ProgramProgress } from '../../services/programProgress';
import { MoodType, moodLabels, spacing, borderRadius, withAlpha, layout } from '../../theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AdaptiveOffering {
  title: string;
  description: string;
  sessionType: string;
  sessionId: string;
  duration: string;
}

const getAdaptiveOffering = (mood: MoodType, timeOfDay: string): AdaptiveOffering => {
  const offerings: Record<MoodType, AdaptiveOffering> = {
    anxious: {
      title: 'Ground yourself',
      description: 'A gentle body scan to bring you back to the present moment.',
      sessionType: 'grounding',
      sessionId: 'body-scan',
      duration: '3 min',
    },
    low: {
      title: 'Gentle breathing',
      description: "Let's start with some calming breaths. No pressure.",
      sessionType: 'breathing',
      sessionId: 'calm-breath',
      duration: '4 min',
    },
    calm: {
      title: timeOfDay === 'evening' ? 'Wind down' : 'Deepen your calm',
      description:
        timeOfDay === 'evening'
          ? 'A relaxing sequence to prepare for rest.'
          : 'Build on this feeling with focused breathing.',
      sessionType: 'breathing',
      sessionId: timeOfDay === 'evening' ? 'sleep-breath' : 'box-breathing',
      duration: '5 min',
    },
    good: {
      title: timeOfDay === 'morning' ? 'Energize your day' : 'Focus session',
      description:
        timeOfDay === 'morning'
          ? 'Start strong with an energizing breath pattern.'
          : 'Channel this energy into focused work.',
      sessionType: timeOfDay === 'morning' ? 'breathing' : 'focus',
      sessionId: timeOfDay === 'morning' ? 'energizing-breath' : 'pomodoro-25',
      duration: timeOfDay === 'morning' ? '3 min' : '25 min',
    },
  };

  return offerings[mood];
};

export function SanctuaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { greeting, timeOfDay, needsGentleness, setMood: setAmbientMood } = useAmbient();
  const { addMoodEntry } = useJourney();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [activeProgram, setActiveProgram] = useState<ProgramProgress | null>(null);

  useEffect(() => {
    const loadActiveProgram = async () => {
      const active = await programProgress.getActiveProgram();
      setActiveProgram(active);
    };
    loadActiveProgram();
  }, []);

  const activeProgDetails = activeProgram ? getProgramById(activeProgram.programId) : null;

  const moods: MoodType[] = ['calm', 'good', 'anxious', 'low'];

  const handleMoodSelect = useCallback(async (mood: MoodType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(mood);
    setAmbientMood(mood);
    addMoodEntry(mood);
  }, [setAmbientMood, addMoodEntry]);

  const handleStartSession = useCallback(async () => {
    if (!selectedMood) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const offering = getAdaptiveOffering(selectedMood, timeOfDay);
    navigation.navigate('Session', {
      type: offering.sessionType,
      id: offering.sessionId,
      mood: selectedMood,
    } as any);

    setSelectedMood(null);
  }, [selectedMood, timeOfDay, navigation]);

  const handleJustBreathe = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Session', {
      type: 'breathing',
      id: 'one-minute-calm',
    } as any);
    setSelectedMood(null);
  }, [navigation]);

  const handleSOS = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('SOSSelect' as any);
  }, [navigation]);

  const handleReset = useCallback(() => {
    setSelectedMood(null);
  }, []);

  const offering = selectedMood ? getAdaptiveOffering(selectedMood, timeOfDay) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground
        variant={timeOfDay === 'morning' ? 'morning' : timeOfDay === 'evening' ? 'evening' : 'calm'}
        isDark={isDark}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <Text variant="displaySmall" color="ink">
              {greeting}
            </Text>
            <Text variant="bodyLarge" color="inkMuted" style={styles.subtitle}>
              {needsGentleness
                ? 'Take all the time you need'
                : 'How are you feeling right now?'}
            </Text>
          </Animated.View>

          {/* Mood Orbs — always visible */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.moodSection}
          >
            <View style={styles.moodRow}>
              {moods.map((mood, index) => (
                <Animated.View
                  key={mood}
                  entering={FadeInUp.delay(250 + index * 60).duration(300)}
                >
                  <MoodOrb
                    mood={mood}
                    selected={selectedMood === mood}
                    onPress={() => handleMoodSelect(mood)}
                    size="md"
                    colors={colors}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Offering — slides in below orbs */}
          {selectedMood && offering && (
            <Animated.View
              entering={FadeInUp.delay(100).duration(400)}
              style={styles.offeringSection}
            >
              <GlassCard variant="hero" padding="lg" glow="calm">
                <View style={styles.offeringHeader}>
                  <Text variant="labelSmall" color="inkFaint">
                    Feeling {moodLabels[selectedMood].toLowerCase()}
                  </Text>
                  <Pressable onPress={handleReset} hitSlop={8}>
                    <Text variant="labelSmall" color="accent">
                      Change
                    </Text>
                  </Pressable>
                </View>

                <Text variant="headlineMedium" color="ink" style={styles.offeringTitle}>
                  {offering.title}
                </Text>
                <Text variant="bodyMedium" color="inkMuted" style={styles.offeringDesc}>
                  {offering.description}
                </Text>

                <View
                  style={[
                    styles.durationBadge,
                    { backgroundColor: withAlpha(colors.accentPrimary, 0.1) },
                  ]}
                >
                  <Ionicons name="time-outline" size={13} color={colors.accentPrimary} />
                  <Text variant="labelSmall" color="accent" style={{ marginLeft: 4 }}>
                    {offering.duration}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Button
                    variant="glow"
                    size="lg"
                    fullWidth
                    onPress={handleStartSession}
                  >
                    Begin
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onPress={handleJustBreathe}
                    style={styles.secondaryAction}
                  >
                    One minute of calm
                  </Button>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Active Program — subtle prompt */}
          {activeProgram && activeProgDetails && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.programSection}
            >
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('ProgramDetail' as any, {
                    programId: activeProgram.programId,
                  });
                }}
                style={[
                  styles.programCard,
                  { backgroundColor: withAlpha(colors.accentPrimary, 0.06) },
                ]}
              >
                <Ionicons
                  name={activeProgDetails.icon as any}
                  size={18}
                  color={colors.accentPrimary}
                />
                <View style={styles.programCardText}>
                  <Text variant="labelMedium" color="ink">
                    Continue {activeProgDetails.name}
                  </Text>
                  <Text variant="bodySmall" color="inkMuted">
                    Day {activeProgram.currentDay} of {activeProgDetails.totalDays}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
              </Pressable>
            </Animated.View>
          )}

          {/* SOS — in scroll flow */}
          <View style={styles.sosSection}>
            <Pressable
              onPress={handleSOS}
              style={[
                styles.sosButton,
                { backgroundColor: withAlpha(colors.accentDanger, 0.08) },
              ]}
              accessibilityRole="button"
              accessibilityLabel="SOS - I need help now"
            >
              <Ionicons name="alert-circle" size={16} color={colors.accentDanger} />
              <Text
                variant="labelMedium"
                style={{ color: colors.accentDanger, marginLeft: spacing[1] }}
              >
                I need help now
              </Text>
            </Pressable>
          </View>
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
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  moodSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
  },
  offeringSection: {
    marginBottom: spacing[6],
  },
  offeringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offeringTitle: {
    marginTop: spacing[3],
  },
  offeringDesc: {
    marginTop: spacing[1],
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.full,
    marginTop: spacing[3],
  },
  actions: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  secondaryAction: {
    marginTop: spacing[2],
  },
  programSection: {
    marginBottom: spacing[4],
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
  },
  programCardText: {
    flex: 1,
    marginLeft: spacing[3],
  },
  sosSection: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.full,
  },
});

export default SanctuaryScreen;
