/**
 * FocusScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

export function FocusScreen() {
  const { reduceMotion } = useTheme();
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
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Focus"
              subtitle="A short timer to help you reset attention"
              compact
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              <Text variant="headlineSmall" color="ink">
                {isActive ? 'Stay with one breath' : '5-Minute Focus'}
              </Text>
              <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
                {isActive
                  ? 'Keep your attention on inhale and exhale for a few minutes.'
                  : 'Set a calm timer and breathe quietly until it ends.'}
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
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
  },
  cardText: {
    marginTop: spacing[3],
  },
  primaryButton: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
});
