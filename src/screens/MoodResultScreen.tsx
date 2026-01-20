/**
 * MoodResultScreen
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { MoodType, RootStackParamList } from '../types';

const moodCopy: Record<MoodType, { title: string; body: string }> = {
  energized: { title: 'Bright energy', body: 'Channel that spark with a focused ritual.' },
  calm: { title: 'Steady and calm', body: 'Hold this balance with a short breath.' },
  good: { title: 'Grounded and good', body: 'Keep it steady with a gentle reset.' },
  anxious: { title: 'A bit on edge', body: 'Slow down with a calming breath.' },
  low: { title: 'Feeling low', body: 'Let us lift you with a light reset.' },
  tough: { title: 'Carrying weight', body: 'We will soften it, one breath at a time.' },
};

export function MoodResultScreen() {
  const { gradients, reduceMotion } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodResult'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const mood = route.params.mood;
  const copy = moodCopy[mood];

  const handleStart = () => {
    navigation.navigate('QuickReset');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.morning}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader title={copy.title} subtitle={copy.body} compact />
          </Animated.View>

          <Card style={styles.card} elevation="lift">
            <Text variant="headlineSmall" color="ink">
              Suggested next step
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
              A quick reset sequence tailored to your mood.
            </Text>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            tone="calm"
            haptic="medium"
            onPress={handleStart}
            style={styles.primaryButton}
          >
            Start Quick Reset
          </Button>
          <Button variant="ghost" size="md" fullWidth onPress={() => navigation.navigate('Main')}>
            Back Home
          </Button>

          <View style={{ height: layout.tabBarHeight }} />
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
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  card: {
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  cardText: {
    marginTop: spacing[3],
  },
  primaryButton: {
    marginBottom: spacing[3],
  },
});
