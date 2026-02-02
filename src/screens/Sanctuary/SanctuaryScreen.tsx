/**
 * SanctuaryScreen - Main Hub
 * 
 * The heart of Restorae. One screen that asks "How can I help right now?"
 * 
 * Features:
 * - Centered mood orb selection
 * - Adaptive offerings based on mood
 * - SOS always accessible
 * - Inline journaling after selection
 * - Time-aware greetings
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useAmbient } from '../../contexts/AmbientContext';
import { useJourney } from '../../contexts/JourneyContext';

import { Text } from '../../components/core/Text';
import { Button } from '../../components/core/Button';
import { Card } from '../../components/core/Card';
import { Input } from '../../components/core/Input';
import { MoodOrb } from '../../components/domain/MoodOrb';
import { AmbientBackground } from '../../components/domain/AmbientBackground';

import { MoodType, moodLabels, spacing, radius, withAlpha, layout } from '../../theme/tokens';
import { RootStackParamList } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AdaptiveOffering {
  title: string;
  description: string;
  sessionType: string;
  sessionId: string;
  duration: string;
}

// =============================================================================
// ADAPTIVE OFFERINGS
// =============================================================================

const getAdaptiveOffering = (mood: MoodType, timeOfDay: string): AdaptiveOffering => {
  // Mood-specific recommendations
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

// =============================================================================
// SANCTUARY SCREEN
// =============================================================================

export function SanctuaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { greeting, timeOfDay, needsGentleness, setMood: setAmbientMood } = useAmbient();
  const { addMoodEntry } = useJourney();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [showOffering, setShowOffering] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const moods: MoodType[] = ['calm', 'good', 'anxious', 'low'];

  const handleMoodSelect = useCallback(async (mood: MoodType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(mood);
    setAmbientMood(mood);
    
    // Show offering after a brief pause
    setTimeout(() => {
      setShowOffering(true);
    }, 300);
  }, [setAmbientMood]);

  const handleStartSession = useCallback(async () => {
    if (!selectedMood) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Save mood entry with optional note
    await addMoodEntry(selectedMood, note || undefined);
    
    const offering = getAdaptiveOffering(selectedMood, timeOfDay);
    
    // Navigate to session
    navigation.navigate('Session', {
      type: offering.sessionType,
      id: offering.sessionId,
      mood: selectedMood,
    } as any);
    
    // Reset state
    setSelectedMood(null);
    setShowOffering(false);
    setNote('');
    setShowNoteInput(false);
  }, [selectedMood, note, timeOfDay, navigation, addMoodEntry]);

  const handleJustBreathe = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedMood) {
      await addMoodEntry(selectedMood, note || undefined);
    }
    
    navigation.navigate('Session', {
      type: 'breathing',
      id: 'one-minute-calm',
    } as any);
    
    setSelectedMood(null);
    setShowOffering(false);
  }, [selectedMood, note, navigation, addMoodEntry]);

  const handleShowOptions = useCallback(() => {
    if (selectedMood) {
      addMoodEntry(selectedMood, note || undefined);
    }
    navigation.navigate('Library' as any);
  }, [selectedMood, note, navigation, addMoodEntry]);

  const handleSOS = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('SOSSelect' as any);
  }, [navigation]);

  const handleReset = useCallback(() => {
    setSelectedMood(null);
    setShowOffering(false);
    setNote('');
    setShowNoteInput(false);
  }, []);

  const offering = selectedMood ? getAdaptiveOffering(selectedMood, timeOfDay) : null;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.header}
          >
            <Text variant="headlineLarge" style={{ color: colors.textPrimary }}>
              {greeting}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: colors.textSecondary, marginTop: spacing.xs }}
            >
              {needsGentleness
                ? "Take all the time you need"
                : "How are you feeling right now?"}
            </Text>
          </Animated.View>

          {/* Mood Selection */}
          {!showOffering && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              exiting={FadeOut.duration(200)}
              style={styles.moodSection}
            >
              <View style={styles.moodGrid}>
                {moods.map((mood, index) => (
                  <Animated.View
                    key={mood}
                    entering={FadeInUp.delay(150 + index * 50).duration(300)}
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
          )}

          {/* Adaptive Offering */}
          {showOffering && selectedMood && offering && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              exiting={FadeOut.duration(200)}
              style={styles.offeringSection}
            >
              <Card
                variant="elevated"
                padding="lg"
                colors={colors}
                isDark={isDark}
              >
                {/* Selected Mood Indicator */}
                <View style={styles.selectedMoodRow}>
                  <Text variant="labelSmall" style={{ color: colors.textTertiary }}>
                    FEELING {moodLabels[selectedMood].toUpperCase()}
                  </Text>
                  <Pressable onPress={handleReset} hitSlop={8}>
                    <Text variant="labelSmall" style={{ color: colors.actionPrimary }}>
                      Change
                    </Text>
                  </Pressable>
                </View>

                {/* Offering */}
                <Text
                  variant="headlineMedium"
                  style={{ color: colors.textPrimary, marginTop: spacing.md }}
                >
                  {offering.title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: colors.textSecondary, marginTop: spacing.xs }}
                >
                  {offering.description}
                </Text>

                {/* Duration Badge */}
                <View
                  style={[
                    styles.durationBadge,
                    { backgroundColor: withAlpha(colors.actionPrimary, 0.1) },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.actionPrimary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: colors.actionPrimary, marginLeft: 4 }}
                  >
                    {offering.duration}
                  </Text>
                </View>

                {/* Optional Note */}
                {showNoteInput ? (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.noteInput}>
                    <Input
                      placeholder="Add a note (optional)..."
                      value={note}
                      onChangeText={setNote}
                      multiline
                      maxLength={200}
                      showCharCount
                      colors={colors}
                    />
                  </Animated.View>
                ) : (
                  <Pressable
                    onPress={() => setShowNoteInput(true)}
                    style={styles.addNoteButton}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color={colors.textTertiary}
                    />
                    <Text
                      variant="labelMedium"
                      style={{ color: colors.textTertiary, marginLeft: 4 }}
                    >
                      Add a note
                    </Text>
                  </Pressable>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleStartSession}
                    colors={colors}
                  >
                    Yes, guide me
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={handleShowOptions}
                    colors={colors}
                    style={styles.actionSpacing}
                  >
                    Show me options
                  </Button>

                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onPress={handleJustBreathe}
                    colors={colors}
                    style={styles.actionSpacing}
                  >
                    Just breathe (1 min)
                  </Button>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* SOS Button - Always visible */}
        <View style={styles.sosContainer}>
          <Pressable
            onPress={handleSOS}
            style={[
              styles.sosButton,
              { backgroundColor: withAlpha(colors.actionDestructive, 0.1) },
            ]}
            accessibilityRole="button"
            accessibilityLabel="SOS - I need help now"
          >
            <Ionicons
              name="alert-circle"
              size={18}
              color={colors.actionDestructive}
            />
            <Text
              variant="labelMedium"
              style={{ color: colors.actionDestructive, marginLeft: spacing.xs }}
            >
              I need help now
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

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
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.xl,
  },
  moodSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  offeringSection: {
    marginTop: spacing.md,
  },
  selectedMoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  noteInput: {
    marginTop: spacing.md,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
  },
  actionSpacing: {
    marginTop: spacing.sm,
  },
  spacer: {
    height: spacing['2xl'],
  },
  sosContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: layout.screenPadding,
    right: layout.screenPadding,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});

export default SanctuaryScreen;
