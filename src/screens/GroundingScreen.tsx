/**
 * GroundingScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, VideoBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

export function GroundingScreen({ route }: any) {
  const { reduceMotion } = useTheme();
  const { notificationSuccess } = useHaptics();
  const [isActive, setIsActive] = useState(false);
  
  // Use passed videoUrl or fallback to hardcoded nature loop for "Premium Feel" demo
  const videoUrl = route?.params?.videoUrl ?? 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4';


  const handleStart = () => {
    setIsActive(true);
  };

  const handleFinish = async () => {
    await notificationSuccess();
    setIsActive(false);
  };

  return (
    <View style={styles.container}>
      {videoUrl ? (
        <VideoBackground source={{ uri: videoUrl }} />
      ) : (
        <AmbientBackground />
      )}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Grounding"
              subtitle="Anchor your senses in the present"
              compact
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              <Text variant="headlineSmall" color="ink">
                {isActive ? 'Notice and name' : '5-4-3-2-1 Method'}
              </Text>
              <Text variant="bodyMedium" color="inkMuted" style={styles.cardText}>
                {isActive
                  ? 'Take 60 seconds to list each sense quietly to yourself.'
                  : 'Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.'}
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
