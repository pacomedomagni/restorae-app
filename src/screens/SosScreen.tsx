/**
 * SosScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

export function SosScreen() {
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
              title="SOS"
              subtitle="Rapid support when you need it most"
              compact
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="elevated" padding="lg" glow="warm">
              <Text variant="headlineSmall" color="ink">
                {isActive ? 'You are safe' : 'Panic Reset'}
              </Text>
              <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
                {isActive
                  ? 'Slow your breath. Let the edges soften.'
                  : 'Start a 4-minute guided sequence to slow everything down.'}
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
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
                Finish SOS
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
                Start SOS Sequence
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
