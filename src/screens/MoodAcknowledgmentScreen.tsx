/**
 * MoodAcknowledgmentScreen
 * 
 * The "Breathing Pause" - A moment of genuine acknowledgment between
 * mood selection and moving forward. This is where the app says:
 * "I see you. I hear what you're feeling."
 * 
 * This is NOT a loading screen. It's an intentional pause that:
 * 1. Honors the user's emotional disclosure
 * 2. Provides empathetic, contextual messaging
 * 3. Transitions organically (like an exhale) to the next step
 * 4. Adapts its pacing to the emotional state (slower for anxiety)
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';
import { useEmotionalFlow } from '../contexts/EmotionalFlowContext';
import { useHaptics } from '../hooks/useHaptics';
import { Text, MoodOrb } from '../components/ui';
import { spacing, withAlpha } from '../theme';
import type { RootStackParamList, MoodType } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mood-specific acknowledgment phrases - deeply empathetic
const ACKNOWLEDGMENT_PHRASES: Record<MoodType, string[]> = {
  good: [
    "That's wonderful",
    "What a gift",
    "Hold onto this",
  ],
  calm: [
    "Beautiful",
    "Peace is here",
    "Breathe into this",
  ],
  energized: [
    "Feel that energy",
    "What potential",
    "Let it flow",
  ],
  anxious: [
    "I'm here with you",
    "This will pass",
    "You're safe here",
  ],
  low: [
    "I see you",
    "This is valid",
    "You're not alone",
  ],
  tough: [
    "I hear you",
    "Stay with me",
    "We'll get through this",
  ],
};

// Duration multipliers based on emotional state
const PACING_MULTIPLIERS: Record<MoodType, number> = {
  good: 1,
  calm: 1.1,
  energized: 0.9,
  anxious: 1.4,  // Much slower for anxiety
  low: 1.3,
  tough: 1.2,
};

export function MoodAcknowledgmentScreen() {
  const { colors, isDark, reduceMotion } = useTheme();
  const { 
    currentMood, 
    temperature, 
    moodMessage, 
    completeAcknowledgment,
    transitionDuration,
  } = useEmotionalFlow();
  const { impactLight, notificationSuccess } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodAcknowledgment'>>();
  
  const mood = (route.params?.mood || currentMood || 'calm') as MoodType;
  const pacingMultiplier = PACING_MULTIPLIERS[mood];
  const baseDuration = reduceMotion ? 200 : 600 * pacingMultiplier;

  // Animation values
  const breatheScale = useSharedValue(0.8);
  const breatheOpacity = useSharedValue(0);
  const orbScale = useSharedValue(0);
  const orbGlow = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const waveProgress = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  // Track if we've started transitioning
  const hasStartedTransition = useRef(false);

  // Get a random acknowledgment phrase
  const acknowledgmentPhrase = useRef(
    ACKNOWLEDGMENT_PHRASES[mood][Math.floor(Math.random() * ACKNOWLEDGMENT_PHRASES[mood].length)]
  ).current;

  const handleTransitionComplete = useCallback(() => {
    if (hasStartedTransition.current) return;
    hasStartedTransition.current = true;

    completeAcknowledgment();
    
    // Navigate to the next screen (MoodCheckin for note, or suggestions)
    navigation.replace('MoodCheckin', { mood });
  }, [navigation, mood, completeAcknowledgment]);

  // Orchestrated animation sequence
  useEffect(() => {
    // Phase 1: Breathing background fade in
    breatheOpacity.value = withTiming(1, { duration: baseDuration });
    breatheScale.value = withSequence(
      withTiming(1, { duration: baseDuration, easing: Easing.out(Easing.ease) }),
      withTiming(1.05, { duration: baseDuration * 2, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: baseDuration * 2, easing: Easing.inOut(Easing.ease) }),
    );

    // Phase 2: Mood orb appears with gentle spring
    orbScale.value = withDelay(
      baseDuration * 0.5,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
    orbGlow.value = withDelay(
      baseDuration,
      withTiming(1, { duration: baseDuration, easing: Easing.out(Easing.ease) })
    );

    // Phase 3: Acknowledgment text fades in
    textOpacity.value = withDelay(
      baseDuration * 1.2,
      withTiming(1, { duration: baseDuration * 0.8 })
    );

    // Phase 4: Contextual message appears
    messageOpacity.value = withDelay(
      baseDuration * 2,
      withTiming(1, { duration: baseDuration })
    );

    // Phase 5: Wave animation (visual breathing cue)
    waveProgress.value = withDelay(
      baseDuration * 0.8,
      withSequence(
        withTiming(1, { duration: baseDuration * 3, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: baseDuration * 2, easing: Easing.inOut(Easing.ease) }),
      )
    );

    // Haptic at the right moment
    const hapticTimer = setTimeout(() => {
      impactLight();
    }, baseDuration * 1.5);

    // Success haptic before transition
    const successTimer = setTimeout(() => {
      notificationSuccess();
    }, baseDuration * 4);

    // Phase 6: Gentle fade out and transition
    const transitionTimer = setTimeout(() => {
      fadeOut.value = withTiming(0, { 
        duration: baseDuration * 1.2,
        easing: Easing.in(Easing.ease),
      }, (finished) => {
        if (finished) {
          runOnJS(handleTransitionComplete)();
        }
      });
    }, baseDuration * 4.5);

    return () => {
      clearTimeout(hapticTimer);
      clearTimeout(successTimer);
      clearTimeout(transitionTimer);
    };
  }, [baseDuration, reduceMotion]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: breatheOpacity.value,
  }));

  const orbContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbScale.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(orbGlow.value, [0, 1], [0, isDark ? 0.4 : 0.25]),
    transform: [{ scale: interpolate(orbGlow.value, [0, 1], [0.8, 1.3]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) },
    ],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [
      { translateY: interpolate(messageOpacity.value, [0, 1], [15, 0]) },
    ],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(waveProgress.value, [0, 0.5, 1], [0, 0.3, 0.15]),
    transform: [
      { scale: interpolate(waveProgress.value, [0, 1], [0.5, 2]) },
    ],
  }));

  // Get mood-specific gradient colors
  const getMoodGradient = (): readonly [string, string, string] => {
    const moodColors = {
      good: isDark 
        ? ['#1a2f1a', '#0f1f0f', '#0a150a'] as const
        : ['#e8f5e9', '#c8e6c9', '#a5d6a7'] as const,
      calm: isDark
        ? ['#1a1f2e', '#0f1420', '#0a0f18'] as const
        : ['#e3f2fd', '#bbdefb', '#90caf9'] as const,
      energized: isDark
        ? ['#2d2a1a', '#1f1c0f', '#15130a'] as const
        : ['#fff8e1', '#ffecb3', '#ffe082'] as const,
      anxious: isDark
        ? ['#2a1f2a', '#1c141c', '#140f14'] as const
        : ['#fce4ec', '#f8bbd9', '#f48fb1'] as const,
      low: isDark
        ? ['#1a1a2e', '#12121f', '#0a0a15'] as const
        : ['#ede7f6', '#d1c4e9', '#b39ddb'] as const,
      tough: isDark
        ? ['#2e1a1a', '#1f0f0f', '#150a0a'] as const
        : ['#ffebee', '#ffcdd2', '#ef9a9a'] as const,
    };
    return moodColors[mood];
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Breathing gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, breatheStyle]}>
        <LinearGradient
          colors={getMoodGradient()}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Expanding wave effect */}
      <Animated.View style={[styles.wave, waveStyle]}>
        <View 
          style={[
            styles.waveCircle, 
            { 
              borderColor: withAlpha(colors.accentPrimary, 0.3),
              backgroundColor: withAlpha(colors.accentPrimary, 0.05),
            }
          ]} 
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Glow effect behind orb */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <View 
              style={[
                styles.glowCircle,
                { backgroundColor: colors[`mood${mood.charAt(0).toUpperCase() + mood.slice(1)}` as keyof typeof colors] || colors.accentPrimary }
              ]} 
            />
          </Animated.View>

          {/* Mood Orb - larger, more present */}
          <Animated.View style={[styles.orbContainer, orbContainerStyle]}>
            <MoodOrb
              mood={mood}
              label=""
              size="lg"
              selected
            />
          </Animated.View>

          {/* Acknowledgment phrase */}
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text 
              variant="displaySmall" 
              color="ink" 
              align="center"
              style={styles.acknowledgment}
            >
              {acknowledgmentPhrase}
            </Text>
          </Animated.View>

          {/* Contextual message from emotional flow */}
          <Animated.View style={[styles.messageContainer, messageStyle]}>
            <Text 
              variant="bodyLarge" 
              color="inkMuted" 
              align="center"
              style={styles.message}
            >
              {moodMessage}
            </Text>
          </Animated.View>
        </View>

        {/* Subtle breathing indicator */}
        <View style={styles.breathingHint}>
          <Text variant="bodySmall" color="inkFaint" align="center">
            breathe
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  wave: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 150,
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  orbContainer: {
    marginBottom: spacing[8],
  },
  textContainer: {
    marginBottom: spacing[4],
  },
  acknowledgment: {
    fontWeight: '300',
    letterSpacing: 1,
  },
  messageContainer: {
    paddingHorizontal: spacing[4],
    maxWidth: 300,
  },
  message: {
    lineHeight: 26,
  },
  breathingHint: {
    position: 'absolute',
    bottom: spacing[8],
    left: 0,
    right: 0,
    opacity: 0.4,
  },
});

export default MoodAcknowledgmentScreen;
