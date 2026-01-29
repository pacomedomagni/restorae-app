/**
 * MorningRitualScreen
 * 
 * Mood-adaptive morning ritual selection
 * Uses the unified session system for playback
 */
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import {
  Text,
  AmbientBackground,
} from '../../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useStartActivity } from '../../hooks/useStartActivity';
import { getMorningRitualsForMood, MORNING_RITUAL_PRESETS } from '../../data/sessionPresets';
import { MoodType } from '../../types';

// =============================================================================
// MOOD OPTIONS
// =============================================================================
const MOOD_OPTIONS: { id: MoodType; label: string; icon: string }[] = [
  { id: 'energized', label: 'Energetic', icon: '⚡' },
  { id: 'calm', label: 'Calm', icon: '🌊' },
  { id: 'anxious', label: 'Anxious', icon: '😰' },
  { id: 'low', label: 'Tired', icon: '😴' },
  { id: 'good', label: 'Motivated', icon: '🔥' },
  { id: 'tough', label: 'Neutral', icon: '😐' },
];

// =============================================================================
// SUN ANIMATION
// =============================================================================
function SunAnimation() {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 3000 }),
          withTiming(0.6, { duration: 3000 })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sunAnimation,
        animatedStyle,
        { backgroundColor: withAlpha(colors.accentWarm, 0.3) },
      ]}
    />
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function MorningRitualScreen() {
  const { colors, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();
  const navigation = useNavigation();
  const { startCustomRitual } = useStartActivity();

  const handleMoodSelect = async (mood: MoodType) => {
    await impactMedium();
    
    // Get ritual(s) for this mood
    const ritualsForMood = getMorningRitualsForMood(mood);
    const ritual = ritualsForMood.length > 0 
      ? ritualsForMood[0] 
      : MORNING_RITUAL_PRESETS[0]; // Fallback to first morning ritual
    
    // Start the ritual using unified session system
    startCustomRitual(ritual);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="morning" intensity="normal" />

      {/* Sun Animation Background */}
      <View style={styles.sunContainer}>
        <SunAnimation />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(400)}
          style={styles.header}
        >
          <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
            <Text variant="bodyMedium" color="ink">Close</Text>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text variant="headlineSmall" color="ink">
              Morning Ritual
            </Text>
          </View>

          <View style={styles.closeButton} />
        </Animated.View>

        {/* Main Content - Mood Selector */}
        <View style={styles.content}>
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.duration(400)}
            style={styles.moodSelectorContainer}
          >
            <Text variant="displaySmall" color="ink" align="center">
              Good morning
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.moodSelectorSubtitle}>
              How are you feeling right now?
            </Text>

            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood, index) => (
                <Animated.View
                  key={mood.id}
                  entering={reduceMotion ? undefined : FadeInUp.delay(100 + index * 50).duration(300)}
                >
                  <Pressable
                    onPress={() => handleMoodSelect(mood.id)}
                    style={[
                      styles.moodOption,
                      { backgroundColor: withAlpha(colors.accentWarm, 0.08) },
                    ]}
                  >
                    <Text style={styles.moodIcon}>{mood.icon}</Text>
                    <Text variant="labelMedium" color="ink">
                      {mood.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
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
  sunContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  sunAnimation: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[3],
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  moodSelectorContainer: {
    alignItems: 'center',
  },
  moodSelectorSubtitle: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[3],
    maxWidth: 320,
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    minWidth: 100,
    gap: spacing[2],
  },
  moodIcon: {
    fontSize: 28,
  },
});

export default MorningRitualScreen;
