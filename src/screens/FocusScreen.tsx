/**
 * FocusScreen
 */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

export function FocusScreen() {
  const { gradients, reduceMotion } = useTheme();
  const { notificationSuccess } = useHaptics();
  const [isActive, setIsActive] = useState(false);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleFinish = async () => {
    await notificationSuccess();
    setIsActive(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.calm}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Focus"
              subtitle="A short timer to help you reset attention"
              compact
            />
          </Animated.View>

          <Card style={styles.card} elevation="lift">
            <Text variant="headlineSmall" color="ink">
              {isActive ? 'Stay with one breath' : '5-Minute Focus'}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
              {isActive
                ? 'Keep your attention on inhale and exhale for a few minutes.'
                : 'Set a calm timer and breathe quietly until it ends.'}
            </Text>
          </Card>

          {isActive ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="calm"
              haptic="none"
              onPress={handleFinish}
              style={styles.primaryButton}
            >
              Finish Focus
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="calm"
              haptic="medium"
              onPress={handleStart}
              style={styles.primaryButton}
            >
              Start Focus
            </Button>
          )}

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
