/**
 * ResetScreen
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

export function ResetScreen() {
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
        colors={gradients.evening}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Reset"
              subtitle="Release tension with gentle movement"
              compact
            />
          </Animated.View>

          <Card style={styles.card} elevation="lift">
            <Text variant="headlineSmall" color="ink">
              {isActive ? 'Slow shoulder rolls' : 'Shoulder Release'}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
              {isActive
                ? 'Inhale as you lift, exhale as you roll back and down.'
                : 'Roll your shoulders back and down in slow circles for 60 seconds.'}
            </Text>
          </Card>

          {isActive ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="warm"
              haptic="none"
              onPress={handleFinish}
              style={styles.primaryButton}
            >
              Finish Reset
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="warm"
              haptic="medium"
              onPress={handleStart}
              style={styles.primaryButton}
            >
              Start Reset
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
