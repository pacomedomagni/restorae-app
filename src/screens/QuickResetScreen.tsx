/**
 * QuickResetScreen - Consistent UI
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

export function QuickResetScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { notificationSuccess, impactMedium } = useHaptics();
  const [phase, setPhase] = useState<'ready' | 'inhale' | 'hold' | 'exhale' | 'complete'>('ready');
  const [cycles, setCycles] = useState(0);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const startBreathing = async () => {
    await impactMedium();
    setPhase('inhale');
    runBreathCycle();
  };

  const runBreathCycle = () => {
    // Inhale - 4 seconds
    scale.value = withTiming(1.4, { duration: 4000, easing: Easing.inOut(Easing.ease) });
    opacity.value = withTiming(1, { duration: 4000 });
    
    setTimeout(() => {
      setPhase('hold');
      // Hold - 4 seconds
      setTimeout(() => {
        setPhase('exhale');
        // Exhale - 4 seconds
        scale.value = withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(0.6, { duration: 4000 });
        
        setTimeout(() => {
          setCycles(c => {
            if (c < 2) {
              setPhase('inhale');
              runBreathCycle();
              return c + 1;
            } else {
              setPhase('complete');
              notificationSuccess();
              return 0;
            }
          });
        }, 4000);
      }, 4000);
    }, 4000);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'ready': return 'Ready when you are';
      case 'inhale': return 'Breathe in...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe out...';
      case 'complete': return 'Well done 💚';
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <Text variant="displaySmall" color="ink" align="center">
              Quick Reset
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.subtitle}>
              3 breath cycles • 2 minutes
            </Text>
          </Animated.View>

          <Animated.View 
            entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}
            style={styles.breathContainer}
          >
            <Animated.View style={[styles.breathCircle, breathingStyle]}>
              <View style={styles.innerCircle}>
                <Text variant="headlineMedium" color="ink" align="center">
                  {getPhaseText()}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            {phase === 'ready' && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={startBreathing}
              >
                Begin
              </Button>
            )}
            
            {phase === 'complete' && (
              <GlassCard variant="elevated" padding="lg" glow="cool">
                <Text variant="bodyLarge" color="ink" align="center">
                  You've completed your quick reset. Take a moment to notice how you feel.
                </Text>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => navigation.goBack()}
                  style={styles.doneButton}
                >
                  Done
                </Button>
              </GlassCard>
            )}
          </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing[2],
  },
  breathContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[10],
  },
  breathCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(125, 211, 192, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 192, 0.4)',
  },
  innerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(125, 211, 192, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  doneButton: {
    marginTop: spacing[4],
  },
});
