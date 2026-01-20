/**
 * OnboardingScreen
 * 
 * First-time user onboarding with welcome flow,
 * breathing preview, and personalization.
 */
import React, { useState, useRef } from 'react';
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
  FadeIn,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
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
// ANIMATED LOGO
// =============================================================================
function AnimatedLogo() {
  const { colors, reduceMotion } = useTheme();
  const breathe = useSharedValue(1);
  const glow = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (reduceMotion) return;

    breathe.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );
  }, [reduceMotion, breathe, glow, rotation]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.logoContainer}>
      {/* Outer glow */}
      <Animated.View style={[styles.logoGlow, glowStyle]}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accentPrimary} stopOpacity={0.4} />
              <Stop offset="70%" stopColor={colors.accentPrimary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <SvgCircle cx="100" cy="100" r="100" fill="url(#logoGlow)" />
        </Svg>
      </Animated.View>

      {/* Rotating particles */}
      <Animated.View style={[styles.logoParticles, rotatingStyle]}>
        <Svg width={160} height={160} viewBox="0 0 160 160">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 80 + 70 * Math.cos(rad);
            const y = 80 + 70 * Math.sin(rad);
            return (
              <SvgCircle
                key={i}
                cx={x}
                cy={y}
                r={2}
                fill={withAlpha(colors.accentPrimary, 0.3 + (i % 3) * 0.1)}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Main logo */}
      <Animated.View style={[styles.logoInner, containerStyle]}>
        <View
          style={[
            styles.logoBackground,
            { backgroundColor: withAlpha(colors.canvasElevated, 0.95) },
          ]}
        >
          <Icon name="logo" size={80} />
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// INTENT OPTION
// =============================================================================
interface IntentOption {
  id: string;
  label: string;
  icon: 'calm' | 'focus' | 'breathe' | 'ground';
}

const INTENTS: IntentOption[] = [
  { id: 'calm', label: 'Find calm', icon: 'calm' },
  { id: 'focus', label: 'Improve focus', icon: 'focus' },
  { id: 'sleep', label: 'Sleep better', icon: 'breathe' },
  { id: 'stress', label: 'Manage stress', icon: 'ground' },
];

interface IntentCardProps {
  intent: IntentOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

function IntentCard({ intent, isSelected, onPress, index }: IntentCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInUp.delay(200 + index * 100)
              .duration(400)
              .easing(Easing.out(Easing.ease))
      }
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard
            variant={isSelected ? 'elevated' : 'subtle'}
            padding="md"
            glow={isSelected ? 'primary' : 'none'}
          >
            <View style={styles.intentContent}>
              <View
                style={[
                  styles.intentIcon,
                  {
                    backgroundColor: withAlpha(
                      colors.accentPrimary,
                      isSelected ? 0.2 : 0.1
                    ),
                  },
                ]}
              >
                <Icon
                  name={intent.icon}
                  size={24}
                  color={isSelected ? colors.accentPrimary : colors.inkMuted}
                />
              </View>
              <Text
                variant="headlineSmall"
                color={isSelected ? 'ink' : 'inkMuted'}
              >
                {intent.label}
              </Text>
              {isSelected && (
                <View
                  style={[
                    styles.intentCheck,
                    { backgroundColor: colors.accentPrimary },
                  ]}
                >
                  <Text variant="labelSmall" color="inkInverse">
                    ✓
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// ONBOARDING SCREEN
// =============================================================================
export function OnboardingScreen() {
  const { colors, isDark, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium, notificationSuccess } = useHaptics();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const handleNext = async () => {
    await impactMedium();
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Save preferences
      if (name.trim()) {
        await AsyncStorage.setItem('@restorae/user_name', name.trim());
      }
      if (selectedIntent) {
        await AsyncStorage.setItem('@restorae/primary_intent', selectedIntent);
      }
      await AsyncStorage.setItem('@restorae/onboarding_complete', 'true');
      await notificationSuccess();
      navigation.navigate('Main');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('@restorae/onboarding_complete', 'true');
    navigation.navigate('Main');
  };

  const canProceed = step === 0 || step === 1 || (step === 2 && selectedIntent);

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="vivid" />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    i <= step
                      ? colors.accentPrimary
                      : withAlpha(colors.ink, 0.2),
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 0 && (
            <Animated.View
              key="step0"
              entering={FadeIn.duration(600)}
              exiting={FadeOut.duration(300)}
              style={styles.stepContent}
            >
              <AnimatedLogo />

              <Animated.View
                entering={FadeInUp.delay(300).duration(500)}
                style={styles.welcomeText}
              >
                <Text variant="displayLarge" color="ink" align="center">
                  Restorae
                </Text>
                <Text
                  variant="bodyLarge"
                  color="inkMuted"
                  align="center"
                  style={styles.tagline}
                >
                  Your sanctuary for calm,{'\n'}one breath at a time
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(500).duration(400)}
                style={styles.features}
              >
                {[
                  '112 wellness experiences',
                  '100% private, on-device',
                  'Never overwhelming',
                ].map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View
                      style={[
                        styles.featureCheck,
                        { backgroundColor: withAlpha(colors.accentPrimary, 0.15) },
                      ]}
                    >
                      <Text
                        variant="labelSmall"
                        style={{ color: colors.accentPrimary }}
                      >
                        ✓
                      </Text>
                    </View>
                    <Text variant="bodyMedium" color="ink">
                      {feature}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View
              key="step1"
              entering={SlideInRight.duration(400)}
              exiting={SlideOutLeft.duration(300)}
              style={styles.stepContent}
            >
              <Text variant="displaySmall" color="ink" align="center">
                What should we call you?
              </Text>
              <Text
                variant="bodyLarge"
                color="inkMuted"
                align="center"
                style={styles.stepSubtitle}
              >
                This helps personalize your experience
              </Text>

              <GlassCard variant="elevated" padding="lg" style={styles.inputCard}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name (optional)"
                  placeholderTextColor={colors.inkFaint}
                  style={[
                    styles.textInput,
                    {
                      color: colors.ink,
                      borderColor: withAlpha(colors.accentPrimary, 0.3),
                    },
                  ]}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </GlassCard>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View
              key="step2"
              entering={SlideInRight.duration(400)}
              exiting={SlideOutLeft.duration(300)}
              style={styles.stepContent}
            >
              <Text variant="displaySmall" color="ink" align="center">
                What brings you here?
              </Text>
              <Text
                variant="bodyLarge"
                color="inkMuted"
                align="center"
                style={styles.stepSubtitle}
              >
                We'll tailor your experience
              </Text>

              <View style={styles.intentsGrid}>
                {INTENTS.map((intent, index) => (
                  <IntentCard
                    key={intent.id}
                    intent={intent}
                    isSelected={selectedIntent === intent.id}
                    onPress={() => setSelectedIntent(intent.id)}
                    index={index}
                  />
                ))}
              </View>
            </Animated.View>
          )}
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <PremiumButton
            variant="glow"
            size="xl"
            fullWidth
            onPress={handleNext}
            disabled={!canProceed}
          >
            {step === 0 ? 'Get Started' : step === 1 ? 'Continue' : 'Begin Journey'}
          </PremiumButton>

          {step > 0 && (
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text variant="labelMedium" color="inkMuted">
                Skip for now
              </Text>
            </Pressable>
          )}

          <Text
            variant="labelSmall"
            color="inkFaint"
            align="center"
            style={styles.privacyNote}
          >
            No account needed. Your data never leaves your device.
          </Text>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[4],
    gap: spacing[2],
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  stepContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  logoGlow: {
    position: 'absolute',
  },
  logoParticles: {
    position: 'absolute',
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeText: {
    alignItems: 'center',
  },
  tagline: {
    marginTop: spacing[3],
  },
  features: {
    marginTop: spacing[10],
    gap: spacing[4],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  featureCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSubtitle: {
    marginTop: spacing[2],
    marginBottom: spacing[8],
  },
  inputCard: {
    width: '100%',
    marginTop: spacing[4],
  },
  textInput: {
    fontSize: 18,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
  },
  intentsGrid: {
    width: '100%',
    gap: spacing[3],
  },
  intentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  intentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentCheck: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContainer: {
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
