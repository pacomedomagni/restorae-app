/**
 * PaywallScreen
 * 
 * Modal paywall shown when users try to access premium content
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  PremiumButton,
  Button,
} from '../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

// =============================================================================
// TYPES
// =============================================================================
type PaywallRouteParams = {
  feature?: string;
  featureName?: string;
};

// =============================================================================
// ANIMATED ICON
// =============================================================================
function AnimatedLockIcon() {
  const { reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (reduceMotion) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400 })
      ),
      -1,
      false
    );
  }, [reduceMotion, scale, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Text style={styles.lockIcon}>🔐</Text>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function PaywallScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: PaywallRouteParams }, 'params'>>();
  const { impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { startTrial, upgradeToPremium, isTrialing } = useSubscription();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featureName = route.params?.featureName || 'this feature';

  const handleStartTrial = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await impactMedium();
      await startTrial();
      await notificationSuccess();
      navigation.goBack();
    } catch (err: any) {
      await notificationError();
      setError(err.message || 'Unable to start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    await impactMedium();
    navigation.navigate('Subscription');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Close Button */}
        <Animated.View 
          entering={reduceMotion ? undefined : FadeIn.delay(300).duration(400)}
          style={styles.closeButton}
        >
          <Pressable
            onPress={handleClose}
            style={[styles.closeCircle, { backgroundColor: withAlpha(colors.canvasElevated, 0.8) }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityHint="Returns to previous screen"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.content}>
          {/* Animated Icon */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(600)}>
            <AnimatedLockIcon />
          </Animated.View>

          {/* Title */}
          <Animated.View 
            entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(500)}
            style={styles.titleContainer}
          >
            <Text variant="displaySmall" color="ink" align="center">
              Premium Feature
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.subtitle}>
              Unlock {featureName} with Restorae Premium
            </Text>
          </Animated.View>

          {/* Benefits */}
          <Animated.View 
            entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(500)}
            style={styles.benefitsContainer}
          >
            <GlassCard variant="elevated" padding="lg">
              <View style={styles.benefitsList}>
                <BenefitItem icon="🫁" text="All 15 breathing patterns" />
                <BenefitItem icon="🌿" text="Complete grounding library" />
                <BenefitItem icon="🎯" text="12 focus sessions + ambient sounds" />
                <BenefitItem icon="🆘" text="Emergency SOS protocols" />
                <BenefitItem icon="📔" text="Encrypted journal with prompts" />
                <BenefitItem icon="☀️" text="Adaptive morning & evening rituals" />
              </View>
            </GlassCard>
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View 
            entering={reduceMotion ? undefined : SlideInDown.delay(400).duration(500)}
            style={styles.ctaContainer}
          >
            {/* Error Message */}
            {error && (
              <Animated.View 
                entering={FadeIn.duration(300)}
                style={[styles.errorBanner, { backgroundColor: withAlpha(colors.statusError, 0.1) }]}
              >
                <Text variant="bodyMedium" style={{ color: colors.statusError }} align="center">
                  {error}
                </Text>
              </Animated.View>
            )}

            {!isTrialing && (
              <PremiumButton
                variant="glow"
                size="lg"
                fullWidth
                tone="warm"
                onPress={handleStartTrial}
                disabled={isLoading}
              >
                {isLoading ? 'Starting Trial...' : 'Start 7-Day Free Trial'}
              </PremiumButton>
            )}
            
            <PremiumButton
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleUpgrade}
              disabled={isLoading}
            >
              {isTrialing ? 'Upgrade Now' : 'View Plans'}
            </PremiumButton>

            <Text variant="bodySmall" color="inkMuted" align="center" style={styles.termsText}>
              Cancel anytime. No commitment required.
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// BENEFIT ITEM
// =============================================================================
function BenefitItem({ icon, text }: { icon: string; text: string }) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <Text variant="bodyMedium" color="ink" style={styles.benefitText}>{text}</Text>
      <Text style={[styles.checkmark, { color: colors.accentPrimary }]}>✓</Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: spacing[12],
    right: spacing[4],
    zIndex: 10,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing[6],
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  lockIcon: {
    fontSize: 64,
  },
  titleContainer: {
    alignItems: 'center',
    gap: spacing[2],
  },
  subtitle: {
    maxWidth: 280,
  },
  benefitsContainer: {
    marginVertical: spacing[2],
  },
  benefitsList: {
    gap: spacing[3],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  benefitIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  benefitText: {
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaContainer: {
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  errorBanner: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  termsText: {
    marginTop: spacing[2],
  },
});

export default PaywallScreen;
