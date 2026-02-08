/**
 * Practice Screen (formerly Library)
 *
 * Curated, not catalogued. Only real content.
 * Breathing, Grounding, Stories — each with a featured item and quick previews.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';

import { Text, ScreenHeader, GlassCard } from '../../components/ui';
import { FeaturedContentCard } from '../../components/domain/FeaturedContentCard';

import { BREATHING_PATTERNS } from '../../data';
import { GROUNDING_TECHNIQUES } from '../../data';
import { ALL_PROGRAMS, getProgramById, type WellnessProgram } from '../../data';
import { FOCUS_SESSIONS } from '../../data/focusSessions';
import { programProgress, type ProgramProgress } from '../../services/programProgress';
import { spacing, borderRadius, withAlpha, layout } from '../../theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Pick a few items to feature from each category
const featuredBreathing = BREATHING_PATTERNS.slice(0, 3);
const featuredGrounding = GROUNDING_TECHNIQUES.slice(0, 3);

export function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [activeProgram, setActiveProgram] = useState<ProgramProgress | null>(null);

  useEffect(() => {
    const loadActiveProgram = async () => {
      const active = await programProgress.getActiveProgram();
      setActiveProgram(active);
    };
    loadActiveProgram();
  }, []);

  // Featured program: show active, or first free program
  const featuredProgram = activeProgram
    ? getProgramById(activeProgram.programId)
    : ALL_PROGRAMS.find((p) => !p.isPremium) ?? ALL_PROGRAMS[0];

  const startSession = useCallback(
    async (type: string, id: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('Session', { type, id } as any);
    },
    [navigation],
  );

  const navigateToSelect = useCallback(
    async (screen: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(screen as any);
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
            title="Practice"
            subtitle="Choose what feels right"
          />

          {/* Programs Section */}
          {featuredProgram && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.section}
            >
              <Pressable
                style={styles.sectionHeader}
                onPress={() => navigation.navigate('ProgramList' as any)}
              >
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="map-outline" size={18} color={colors.accentPrimary} />
                  <Text variant="headlineSmall" color="ink" style={styles.sectionTitle}>
                    Programs
                  </Text>
                </View>
                <Text variant="labelMedium" color="accent">
                  See all
                </Text>
              </Pressable>

              <GlassCard
                variant="hero"
                padding="lg"
                onPress={() =>
                  navigation.navigate('ProgramDetail' as any, {
                    programId: featuredProgram.id,
                  })
                }
              >
                <View style={styles.programCardHeader}>
                  <View
                    style={[
                      styles.programIcon,
                      { backgroundColor: withAlpha(colors.accentPrimary, 0.12) },
                    ]}
                  >
                    <Ionicons
                      name={featuredProgram.icon as any}
                      size={20}
                      color={colors.accentPrimary}
                    />
                  </View>
                  {featuredProgram.isPremium && (
                    <View
                      style={[
                        styles.premiumBadge,
                        { backgroundColor: withAlpha(colors.accentWarm, 0.12) },
                      ]}
                    >
                      <Ionicons name="star" size={10} color={colors.accentWarm} />
                      <Text variant="labelSmall" style={{ color: colors.accentWarm, marginLeft: 3 }}>
                        Premium
                      </Text>
                    </View>
                  )}
                </View>
                <Text variant="headlineSmall" color="ink" style={styles.programTitle}>
                  {featuredProgram.name}
                </Text>
                <Text variant="bodySmall" color="inkMuted" numberOfLines={2}>
                  {featuredProgram.subtitle}
                </Text>
                <View style={styles.programMeta}>
                  <Text variant="labelSmall" color="inkFaint">
                    {featuredProgram.totalDays} days
                  </Text>
                  <Text variant="labelSmall" color="inkFaint" style={styles.programMetaDot}>
                    ·
                  </Text>
                  <Text variant="labelSmall" color="inkFaint">
                    {featuredProgram.estimatedDailyDuration}/day
                  </Text>
                  {activeProgram && activeProgram.programId === featuredProgram.id && (
                    <>
                      <Text variant="labelSmall" color="inkFaint" style={styles.programMetaDot}>
                        ·
                      </Text>
                      <Text variant="labelSmall" color="accent">
                        Day {activeProgram.currentDay}
                      </Text>
                    </>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Breathing Section */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <Pressable
              style={styles.sectionHeader}
              onPress={() => navigateToSelect('BreathingSelect')}
            >
              <View style={styles.sectionTitleRow}>
                <Ionicons name="leaf-outline" size={18} color={colors.accentPrimary} />
                <Text variant="headlineSmall" color="ink" style={styles.sectionTitle}>
                  Breathing
                </Text>
              </View>
              <Text variant="labelMedium" color="accent">
                See all {BREATHING_PATTERNS.length}
              </Text>
            </Pressable>

            {/* Featured breathing pattern */}
            <FeaturedContentCard
              title={featuredBreathing[0].name}
              description={featuredBreathing[0].description}
              duration={featuredBreathing[0].duration}
              category={featuredBreathing[0].bestFor}
              onPress={() => startSession('breathing', featuredBreathing[0].id)}
            />

            {/* Two more compact cards */}
            <View style={styles.compactRow}>
              {featuredBreathing.slice(1, 3).map((pattern) => (
                <GlassCard
                  key={pattern.id}
                  variant="subtle"
                  padding="md"
                  onPress={() => startSession('breathing', pattern.id)}
                  style={styles.compactCard}
                >
                  <Text variant="labelLarge" color="ink" numberOfLines={1}>
                    {pattern.name}
                  </Text>
                  <Text variant="bodySmall" color="inkFaint" style={styles.compactDuration}>
                    {pattern.duration}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          {/* Grounding Section */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.section}
          >
            <Pressable
              style={styles.sectionHeader}
              onPress={() => navigateToSelect('GroundingSelect')}
            >
              <View style={styles.sectionTitleRow}>
                <Ionicons name="earth-outline" size={18} color={colors.accentPrimary} />
                <Text variant="headlineSmall" color="ink" style={styles.sectionTitle}>
                  Grounding
                </Text>
              </View>
              <Text variant="labelMedium" color="accent">
                See all {GROUNDING_TECHNIQUES.length}
              </Text>
            </Pressable>

            <FeaturedContentCard
              title={featuredGrounding[0].name}
              description={featuredGrounding[0].description}
              duration={featuredGrounding[0].duration}
              category={featuredGrounding[0].bestFor}
              onPress={() => startSession('grounding', featuredGrounding[0].id)}
            />

            <View style={styles.compactRow}>
              {featuredGrounding.slice(1, 3).map((technique) => (
                <GlassCard
                  key={technique.id}
                  variant="subtle"
                  padding="md"
                  onPress={() => startSession('grounding', technique.id)}
                  style={styles.compactCard}
                >
                  <Text variant="labelLarge" color="ink" numberOfLines={1}>
                    {technique.name}
                  </Text>
                  <Text variant="bodySmall" color="inkFaint" style={styles.compactDuration}>
                    {technique.duration}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          {/* Focus Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.section}
          >
            <Pressable
              style={styles.sectionHeader}
              onPress={() => navigation.navigate('FocusSelect' as any)}
            >
              <View style={styles.sectionTitleRow}>
                <Ionicons name="timer-outline" size={18} color={colors.accentPrimary} />
                <Text variant="headlineSmall" color="ink" style={styles.sectionTitle}>
                  Focus
                </Text>
              </View>
              <Text variant="labelMedium" color="accent">
                See all {FOCUS_SESSIONS.length}
              </Text>
            </Pressable>

            <GlassCard
              variant="hero"
              padding="lg"
              onPress={() => navigation.navigate('FocusSession' as any, { sessionId: FOCUS_SESSIONS[0].id })}
            >
              <View style={styles.focusCardHeader}>
                <View
                  style={[
                    styles.focusIcon,
                    { backgroundColor: withAlpha(colors.accentPrimary, 0.12) },
                  ]}
                >
                  <Ionicons name="timer-outline" size={20} color={colors.accentPrimary} />
                </View>
                <View style={[styles.durationBadge, { backgroundColor: withAlpha(colors.border, 0.3) }]}>
                  <Text variant="labelSmall" color="inkFaint">
                    {FOCUS_SESSIONS[0].duration} min
                  </Text>
                </View>
              </View>
              <Text variant="headlineSmall" color="ink" style={{ marginBottom: spacing[1] }}>
                {FOCUS_SESSIONS[0].name}
              </Text>
              <Text variant="bodySmall" color="inkMuted" numberOfLines={2}>
                {FOCUS_SESSIONS[0].description}
              </Text>
            </GlassCard>

            <View style={styles.compactRow}>
              {FOCUS_SESSIONS.slice(1, 3).map((s) => (
                <GlassCard
                  key={s.id}
                  variant="subtle"
                  padding="md"
                  onPress={() => navigation.navigate('FocusSession' as any, { sessionId: s.id })}
                  style={styles.compactCard}
                >
                  <Text variant="labelLarge" color="ink" numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text variant="bodySmall" color="inkFaint" style={styles.compactDuration}>
                    {s.duration === 0 ? 'Open' : `${s.duration} min`}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          {/* Quick Reset */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            style={styles.section}
          >
            <GlassCard
              variant="subtle"
              padding="lg"
              onPress={() => startSession('breathing', 'one-minute-calm')}
            >
              <View style={styles.quickResetRow}>
                <View
                  style={[
                    styles.quickResetIcon,
                    { backgroundColor: withAlpha(colors.accentWarm, 0.12) },
                  ]}
                >
                  <Ionicons name="flash-outline" size={20} color={colors.accentWarm} />
                </View>
                <View style={styles.quickResetText}>
                  <Text variant="headlineSmall" color="ink">
                    Need a quick reset?
                  </Text>
                  <Text variant="bodySmall" color="inkMuted">
                    One minute of calm breathing
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </View>
            </GlassCard>
          </Animated.View>
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
    paddingBottom: spacing[12],
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: spacing[2],
  },
  compactRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  compactCard: {
    flex: 1,
  },
  compactDuration: {
    marginTop: spacing[1],
  },
  quickResetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickResetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  quickResetText: {
    flex: 1,
  },
  focusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  focusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  programCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.full,
  },
  programTitle: {
    marginBottom: spacing[1],
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  programMetaDot: {
    marginHorizontal: spacing[1],
  },
});

export default LibraryScreen;
