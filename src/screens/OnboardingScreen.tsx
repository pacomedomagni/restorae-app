/**
 * OnboardingScreen
 * 
 * Premium immersive onboarding experience for Restorae.
 * A gentle, calming flow that introduces users to their sanctuary.
 * 
 * UX Improvements:
 * - "Skip for now" option on personalization step
 * - Allow users to experience first before committing
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle, Path } from 'react-native-svg';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  Text,
  AmbientBackground,
  PremiumButton,
  GlassCard,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WellnessGoal {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

const WELLNESS_GOALS: WellnessGoal[] = [
  { id: 'anxiety', emoji: '🌊', label: 'Ease anxiety', description: 'Find calm in the storm' },
  { id: 'sleep', emoji: '🌙', label: 'Sleep better', description: 'Drift off peacefully' },
  { id: 'focus', emoji: '🎯', label: 'Stay focused', description: 'Clear mind, sharp thinking' },
  { id: 'stress', emoji: '🍃', label: 'Release stress', description: 'Let tension melt away' },
  { id: 'mood', emoji: '☀️', label: 'Lift my mood', description: 'Brighten your day' },
  { id: 'presence', emoji: '🧘', label: 'Be present', description: 'Ground in the now' },
];

// =============================================================================
// FLOATING ORB - Hero visual element
// =============================================================================
function FloatingOrb({ isBreathing = false }: { isBreathing?: boolean }) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const innerScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    // Gentle ambient breathing
    if (!isBreathing) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Active breathing animation (4-7-8 simplified)
      const breathCycle = () => {
        // Inhale (grow)
        scale.value = withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        innerScale.value = withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        glowOpacity.value = withTiming(0.7, { duration: 4000 });
        
        // Hold & exhale
        setTimeout(() => {
          scale.value = withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) });
          innerScale.value = withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) });
          glowOpacity.value = withTiming(0.3, { duration: 6000 });
        }, 4500);
      };

      breathCycle();
      const interval = setInterval(breathCycle, 11000);
      return () => clearInterval(interval);
    }

    // Slow rotation for depth
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      cancelAnimation(rotation);
    };
  }, [isBreathing, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const orbSize = isBreathing ? 200 : 160;

  return (
    <View style={[styles.orbContainer, { width: orbSize + 80, height: orbSize + 80 }]}>
      {/* Outer glow */}
      <Animated.View style={[styles.orbGlow, glowStyle]}>
        <Svg width={orbSize + 80} height={orbSize + 80} viewBox="0 0 280 280">
          <Defs>
            <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accentPrimary} stopOpacity={0.6} />
              <Stop offset="50%" stopColor={colors.accentCalm} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={colors.accentPrimary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <SvgCircle cx="140" cy="140" r="140" fill="url(#orbGlow)" />
        </Svg>
      </Animated.View>

      {/* Rotating ring */}
      <Animated.View style={[styles.orbRing, rotatingStyle]}>
        <Svg width={orbSize + 40} height={orbSize + 40} viewBox="0 0 240 240">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 120 + 110 * Math.cos(rad);
            const y = 120 + 110 * Math.sin(rad);
            const opacity = 0.15 + (i % 4) * 0.1;
            return (
              <SvgCircle
                key={i}
                cx={x}
                cy={y}
                r={2 + (i % 3)}
                fill={withAlpha(colors.accentPrimary, opacity)}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Main orb */}
      <Animated.View style={[styles.orbMain, containerStyle]}>
        <Animated.View style={innerStyle}>
          <View
            style={[
              styles.orbInner,
              {
                width: orbSize,
                height: orbSize,
                borderRadius: orbSize / 2,
                backgroundColor: withAlpha(colors.canvasElevated, 0.95),
                borderColor: withAlpha(colors.accentPrimary, 0.2),
              },
            ]}
          >
            <Icon name="logo" size={orbSize * 0.45} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// STEP 1: WELCOME
// =============================================================================
function WelcomeStep() {
  const { colors, reduceMotion } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(800)}
        style={styles.orbWrapper}
      >
        <FloatingOrb />
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(600)}
        style={styles.welcomeContent}
      >
        <Text variant="displayLarge" color="ink" align="center">
          Restorae
        </Text>
        <Text
          variant="bodyLarge"
          color="inkMuted"
          align="center"
          style={styles.welcomeTagline}
        >
          Your sanctuary for calm
        </Text>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(700).duration(500)}
        style={styles.welcomeFeatures}
      >
        <View style={styles.featurePill}>
          <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
            ✨ 100+ mindful exercises
          </Text>
        </View>
        <View style={styles.featurePill}>
          <Text variant="labelSmall" style={{ color: colors.accentCalm }}>
            🔒 Completely private
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// STEP 2: BREATHING PREVIEW
// =============================================================================
function BreathingPreviewStep() {
  const { colors, reduceMotion } = useTheme();
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const phaseOpacity = useSharedValue(1);

  useEffect(() => {
    const phases: Array<'inhale' | 'hold' | 'exhale'> = ['inhale', 'hold', 'exhale'];
    let currentIndex = 0;
    
    const cyclePhases = () => {
      phaseOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % 3;
        setBreathPhase(phases[currentIndex]);
      }, 300);
    };

    const timings = { inhale: 4000, hold: 2000, exhale: 5000 };
    
    const runCycle = () => {
      cyclePhases();
      setTimeout(runCycle, timings[breathPhase]);
    };

    const timeout = setTimeout(runCycle, timings[breathPhase]);
    return () => clearTimeout(timeout);
  }, [breathPhase]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: phaseOpacity.value,
  }));

  const phaseText = {
    inhale: 'Breathe in...',
    hold: 'Hold gently...',
    exhale: 'Release slowly...',
  };

  return (
    <View style={styles.stepContainer}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(600)}
        style={styles.breathingHeader}
      >
        <Text variant="headlineMedium" color="ink" align="center">
          Take a moment
        </Text>
        <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.breathingSubtitle}>
          Let's try a calming breath together
        </Text>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.delay(300).duration(800)}
        style={styles.breathingOrbWrapper}
      >
        <FloatingOrb isBreathing />
        
        <Animated.View style={[styles.breathingPhase, textStyle]}>
          <Text variant="headlineMedium" color="accent" align="center">
            {phaseText[breathPhase]}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(600).duration(500)}
        style={styles.breathingHint}
      >
        <GlassCard variant="subtle" padding="md">
          <Text variant="bodySmall" color="inkMuted" align="center">
            💡 This is just a preview of what Restorae offers.{'\n'}
            You'll find many more breathing patterns inside.
          </Text>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// STEP 3: PERSONALIZATION
// =============================================================================
interface PersonalizationStepProps {
  name: string;
  onNameChange: (name: string) => void;
  selectedGoals: string[];
  onToggleGoal: (goalId: string) => void;
  onSkipGoals: () => void;
}

function PersonalizationStep({
  name,
  onNameChange,
  selectedGoals,
  onToggleGoal,
  onSkipGoals,
}: PersonalizationStepProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();

  const handleGoalPress = async (goalId: string) => {
    await impactLight();
    onToggleGoal(goalId);
  };

  return (
    <View style={styles.stepContainer}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(500)}
        style={styles.personalizationHeader}
      >
        <Text variant="headlineMedium" color="ink" align="center">
          Make it yours
        </Text>
        <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.personalizationSubtitle}>
          Help us personalize your sanctuary
        </Text>
      </Animated.View>

      {/* Name input */}
      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}
        style={styles.nameSection}
      >
        <Text variant="labelSmall" color="inkFaint" style={styles.nameLabel}>
          WHAT SHOULD WE CALL YOU?
        </Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="Your name (optional)"
          placeholderTextColor={colors.inkFaint}
          style={[
            styles.nameInput,
            {
              color: colors.ink,
              backgroundColor: withAlpha(colors.canvasElevated, 0.8),
              borderColor: name ? colors.accentPrimary : withAlpha(colors.border, 0.5),
            },
          ]}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </Animated.View>

      {/* Goals selection */}
      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(350).duration(400)}
        style={styles.goalsSection}
      >
        <View style={styles.goalsHeaderRow}>
          <Text variant="labelSmall" color="inkFaint" style={styles.goalsLabel}>
            WHAT BRINGS YOU HERE?
          </Text>
          <Pressable onPress={onSkipGoals} hitSlop={8}>
            <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
              Skip for now
            </Text>
          </Pressable>
        </View>
        <View style={styles.goalsGrid}>
          {WELLNESS_GOALS.map((goal, index) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <Animated.View
                key={goal.id}
                entering={reduceMotion ? undefined : FadeInUp.delay(400 + index * 50).duration(300)}
              >
                <Pressable
                  onPress={() => handleGoalPress(goal.id)}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: isSelected
                        ? withAlpha(colors.accentPrimary, 0.15)
                        : withAlpha(colors.canvasElevated, 0.6),
                      borderColor: isSelected
                        ? colors.accentPrimary
                        : withAlpha(colors.border, 0.3),
                    },
                  ]}
                >
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  <Text
                    variant="labelMedium"
                    style={{ color: isSelected ? colors.accentPrimary : colors.ink }}
                  >
                    {goal.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.goalCheck, { backgroundColor: colors.accentPrimary }]}>
                      <Text variant="labelSmall" color="inkInverse">✓</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// STEP 4: READY
// =============================================================================
function ReadyStep({ name }: { name: string }) {
  const { colors, reduceMotion } = useTheme();
  const greeting = name ? `Welcome, ${name}` : 'Welcome';

  return (
    <View style={styles.stepContainer}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(800)}
        style={styles.readyOrbWrapper}
      >
        <FloatingOrb />
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(600)}
        style={styles.readyContent}
      >
        <Text variant="displaySmall" color="ink" align="center">
          {greeting}
        </Text>
        <Text
          variant="bodyLarge"
          color="inkMuted"
          align="center"
          style={styles.readySubtitle}
        >
          Your sanctuary is ready
        </Text>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.delay(700).duration(500)}
        style={styles.readyPromises}
      >
        {[
          { icon: '🌿', text: 'Start with a 2-min breathing exercise' },
          { icon: '📝', text: 'Track your mood in seconds' },
          { icon: '✨', text: 'Discover tools that work for you' },
        ].map((item, index) => (
          <Animated.View
            key={index}
            entering={reduceMotion ? undefined : FadeInUp.delay(800 + index * 100).duration(400)}
            style={styles.promiseRow}
          >
            <Text style={styles.promiseIcon}>{item.icon}</Text>
            <Text variant="bodyMedium" color="ink">{item.text}</Text>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

// =============================================================================
// MAIN ONBOARDING SCREEN
// =============================================================================
export function OnboardingScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { impactMedium, notificationSuccess } = useHaptics();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const totalSteps = 4;

  const handleToggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSkipGoals = useCallback(async () => {
    // Skip goals selection but keep name if entered
    setSelectedGoals([]);
    await impactMedium();
    setStep(step + 1);
  }, [step, impactMedium]);

  const handleNext = useCallback(async () => {
    await impactMedium();
    
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Save preferences and complete onboarding
      try {
        if (name.trim()) {
          await AsyncStorage.setItem('@restorae/user_name', name.trim());
        }
        if (selectedGoals.length > 0) {
          await AsyncStorage.setItem('@restorae/wellness_goals', JSON.stringify(selectedGoals));
        }
        await AsyncStorage.setItem('@restorae/onboarding_complete', 'true');
        await notificationSuccess();
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } catch (error) {
        console.error('Error saving onboarding data:', error);
        navigation.navigate('Main');
      }
    }
  }, [step, name, selectedGoals, navigation, impactMedium, notificationSuccess]);

  const handleSkip = async () => {
    await AsyncStorage.setItem('@restorae/onboarding_complete', 'true');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const getButtonText = () => {
    switch (step) {
      case 0: return 'Begin';
      case 1: return 'I feel calmer';
      case 2: return 'Continue';
      case 3: return 'Enter my sanctuary';
      default: return 'Next';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant="calm" intensity="vivid" />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress indicator */}
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  backgroundColor: i <= step
                    ? colors.accentPrimary
                    : withAlpha(colors.ink, 0.15),
                  flex: i === step ? 2 : 1,
                },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 0 && <WelcomeStep />}
          {step === 1 && <BreathingPreviewStep />}
          {step === 2 && (
            <PersonalizationStep
              name={name}
              onNameChange={setName}
              selectedGoals={selectedGoals}
              onToggleGoal={handleToggleGoal}
              onSkipGoals={handleSkipGoals}
            />
          )}
          {step === 3 && <ReadyStep name={name} />}
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <PremiumButton
            variant="glow"
            size="xl"
            fullWidth
            onPress={handleNext}
          >
            {getButtonText()}
          </PremiumButton>

          {step > 0 && step < totalSteps - 1 && (
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text variant="labelMedium" color="inkMuted">
                Skip setup
              </Text>
            </Pressable>
          )}

          {step === 0 && (
            <Text variant="labelSmall" color="inkFaint" align="center" style={styles.privacyNote}>
              No account required • 100% private • Your data stays on device
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[2],
  },
  progressSegment: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Orb styles
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
  },
  orbRing: {
    position: 'absolute',
  },
  orbMain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  orbWrapper: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },

  // Welcome step
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTagline: {
    marginTop: spacing[2],
    opacity: 0.8,
  },
  welcomeFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginTop: spacing[8],
  },
  featurePill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Breathing step
  breathingHeader: {
    marginBottom: spacing[6],
  },
  breathingSubtitle: {
    marginTop: spacing[2],
  },
  breathingOrbWrapper: {
    alignItems: 'center',
    marginVertical: spacing[8],
  },
  breathingPhase: {
    marginTop: spacing[6],
  },
  breathingHint: {
    marginTop: spacing[4],
  },

  // Personalization step
  personalizationHeader: {
    marginBottom: spacing[6],
  },
  personalizationSubtitle: {
    marginTop: spacing[2],
  },
  nameSection: {
    marginBottom: spacing[6],
  },
  nameLabel: {
    letterSpacing: 1.5,
    marginBottom: spacing[2],
  },
  nameInput: {
    height: 52,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    fontSize: 17,
    borderWidth: 1.5,
  },
  goalsSection: {
    flex: 1,
  },
  goalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  goalsLabel: {
    letterSpacing: 1.5,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: spacing[2],
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[1],
  },

  // Ready step
  readyOrbWrapper: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  readyContent: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  readySubtitle: {
    marginTop: spacing[2],
    opacity: 0.8,
  },
  readyPromises: {
    gap: spacing[4],
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  promiseIcon: {
    fontSize: 20,
  },

  // Bottom actions
  bottomActions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    gap: spacing[3],
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  privacyNote: {
    marginTop: spacing[2],
  },
});

export default OnboardingScreen;
