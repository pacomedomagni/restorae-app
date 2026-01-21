/**
 * MoodResultScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground } from '../components/ui';
import { spacing, layout } from '../theme';
import type { RootStackParamList } from '../types';

const MOOD_DATA: Record<string, { emoji: string; message: string; suggestion: string }> = {
  calm: { 
    emoji: '😌', 
    message: 'You\'re feeling calm', 
    suggestion: 'Great time to journal or set intentions' 
  },
  happy: { 
    emoji: '😊', 
    message: 'You\'re feeling happy', 
    suggestion: 'Capture this moment in your journal' 
  },
  anxious: { 
    emoji: '😰', 
    message: 'You\'re feeling anxious', 
    suggestion: 'Try a breathing exercise to center yourself' 
  },
  sad: { 
    emoji: '😢', 
    message: 'You\'re feeling sad', 
    suggestion: 'Be gentle with yourself. A grounding exercise may help' 
  },
  angry: { 
    emoji: '😠', 
    message: 'You\'re feeling angry', 
    suggestion: 'A quick reset can help release some tension' 
  },
  tired: { 
    emoji: '😴', 
    message: 'You\'re feeling tired', 
    suggestion: 'Rest is important. Maybe a gentle focus session?' 
  },
};

export function MoodResultScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodResult'>>();

  const mood = route.params?.mood || 'calm';
  const moodInfo = MOOD_DATA[mood] || MOOD_DATA.calm;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View 
            entering={reduceMotion ? undefined : FadeIn.duration(600)}
            style={styles.emojiContainer}
          >
            <Text style={styles.emoji}>{moodInfo.emoji}</Text>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              <Text variant="headlineMedium" color="ink" align="center">
                {moodInfo.message}
              </Text>
              <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.suggestion}>
                {moodInfo.suggestion}
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Main')}
              style={styles.primaryButton}
            >
              Explore Tools
            </Button>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('Main')}
            >
              Back to Home
            </Button>
          </Animated.View>

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
    paddingTop: spacing[8],
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  emoji: {
    fontSize: 80,
  },
  suggestion: {
    marginTop: spacing[3],
  },
  primaryButton: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
});
