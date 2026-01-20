/**
 * GroundingScreen
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

export function GroundingScreen() {
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
              title="Grounding"
              subtitle="Anchor your senses in the present"
              compact
            />
          </Animated.View>

          <Card style={styles.card} elevation="lift">
            <Text variant="headlineSmall" color="ink">
              {isActive ? 'Notice and name' : '5-4-3-2-1 Method'}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
              {isActive
                ? 'Take 60 seconds to list each sense quietly to yourself.'
                : 'Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.'}
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
              Finish Grounding
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
              Begin Grounding
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
