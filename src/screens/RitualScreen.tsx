/**
 * RitualScreen
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
import { RootStackParamList } from '../types';

export function RitualScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Ritual'>>();

  const isMorning = route.params.type === 'morning';
  const title = isMorning ? 'Morning Ritual' : 'Evening Wind-Down';
  const description = isMorning
    ? 'A 5-minute sequence to set your day with intention.'
    : 'Release the day and prepare for restful sleep.';

  const handleStart = () => {
    navigation.navigate('Breathing', { patternId: 'calm-breath' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isMorning ? gradients.morning : gradients.evening}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader title={title} subtitle={description} compact />
          </Animated.View>

          <Card style={styles.card} elevation="lift">
            <Text variant="headlineSmall" color="ink">
              What to expect
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
              Breath, ground, and a short reflection to anchor you.
            </Text>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            tone={isMorning ? 'warm' : 'calm'}
            haptic="medium"
            onPress={handleStart}
            style={styles.primaryButton}
          >
            Begin Ritual
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
    marginBottom: spacing[6],
  },
});
