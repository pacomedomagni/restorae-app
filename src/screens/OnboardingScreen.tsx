/**
 * OnboardingScreen
 * Premium first impression following RESTORAE_SPEC.md
 * 
 * Features:
 * - Gradient background (calm tones)
 * - Logo with subtle animation
 * - Value propositions with icons
 * - Premium CTA button
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, SpaBackdrop } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

// =============================================================================
// FEATURE ITEM
// =============================================================================
interface FeatureItemProps {
  icon: 'breathe' | 'sos' | 'calm';
  text: string;
  delay: number;
}

function FeatureItem({ icon, text, delay }: FeatureItemProps) {
  const { colors, isDark, reduceMotion } = useTheme();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}
      style={[
        styles.feature,
        { backgroundColor: withAlpha(colors.canvasElevated, isDark ? 0.12 : 0.22) },
      ]}
    >
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: withAlpha(colors.canvasElevated, isDark ? 0.9 : 0.95) },
        ]}
      >
        <Icon name={icon} size={24} color={colors.accentPrimary} />
      </View>
      <Text variant="bodyLarge" color="ink">
        {text}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// ONBOARDING SCREEN
// =============================================================================
export function OnboardingScreen() {
  const { colors, gradients, isDark, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium } = useHaptics();
  const titleColor = isDark ? colors.inkInverse : colors.ink;
  const taglineColor = withAlpha(titleColor, isDark ? 0.85 : 0.7);
  const noteColor = withAlpha(titleColor, isDark ? 0.6 : 0.55);

  const handleGetStarted = async () => {
    await impactMedium();
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      {/* Full screen gradient */}
      <LinearGradient
        colors={gradients.calm}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SpaBackdrop />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(200).duration(800)}
            style={styles.logoSection}
          >
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: withAlpha(colors.canvasElevated, 0.92),
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <Icon name="logo" size={80} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(600)}
            style={styles.titleSection}
          >
            <Text
              variant="displayLarge"
              style={[
                styles.title,
                {
                  color: titleColor,
                  textShadowColor: withAlpha(colors.canvasDeep, isDark ? 0.35 : 0.15),
                },
              ]}
            >
              Restorae
            </Text>
            <Text variant="bodyLarge" style={[styles.tagline, { color: taglineColor }]}>
              Your private daily ritual companion
            </Text>
          </Animated.View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem
              icon="breathe"
              text="112 wellness experiences"
              delay={600}
            />
            <FeatureItem
              icon="sos"
              text="100% private, on-device"
              delay={700}
            />
            <FeatureItem
              icon="calm"
              text="Never overwhelming"
              delay={800}
            />
          </View>
        </View>

        {/* CTA Section */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.delay(900).duration(500)}
          style={styles.ctaSection}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleGetStarted}
            style={styles.ctaButton}
          >
            Get Started
          </Button>
          <Text variant="labelSmall" style={[styles.privacyNote, { color: noteColor }]}>
            No account needed. No data leaves your device.
          </Text>
        </Animated.View>
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
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  title: {
    marginBottom: spacing[2],
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    textAlign: 'center',
  },
  features: {
    gap: spacing[4],
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    gap: spacing[4],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[6],
  },
  ctaButton: {
    marginBottom: spacing[4],
  },
  privacyNote: {
    textAlign: 'center',
  },
});
