/**
 * MoodSelectScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

const MOODS = [
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#7DD3C0' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#F9D56E' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#E6A4B4' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#9BB5CE' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#E07A5F' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#B8A9C9' },
];

export function MoodSelectScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { selectionLight } = useHaptics();

  const handleMoodSelect = async (moodId: string) => {
    await selectionLight();
    navigation.navigate('MoodCheckin', { mood: moodId });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="How are you feeling?"
              subtitle="Select the mood that best matches right now"
              compact
            />
          </Animated.View>

          <View style={styles.moodGrid}>
            {MOODS.map((mood, index) => (
              <Animated.View 
                key={mood.id} 
                entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 50).duration(400)}
                style={styles.moodItem}
              >
                <Pressable onPress={() => handleMoodSelect(mood.id)}>
                  <GlassCard variant="interactive" padding="md">
                    <View style={styles.moodContent}>
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text variant="labelLarge" color="ink">{mood.label}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View style={{ height: layout.tabBarHeight }} />
        </View>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  moodItem: {
    width: '48%',
  },
  moodContent: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: spacing[2],
  },
});
