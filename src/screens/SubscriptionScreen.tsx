/**
 * SubscriptionScreen
 * 
 * Displays current subscription status and upgrade options
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  ScreenHeader,
  PremiumButton,
} from '../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

// =============================================================================
// FEATURE LIST
// =============================================================================
const PREMIUM_FEATURES = [
  { icon: '🫁', title: '15 Breathing Patterns', description: 'Full library including sleep & energy' },
  { icon: '🌿', title: '12 Grounding Techniques', description: 'Sensory, body, and mental exercises' },
  { icon: '💪', title: '14 Body Reset Exercises', description: 'Release tension head to toe' },
  { icon: '🎯', title: '12 Focus Sessions', description: 'With 10 ambient soundscapes' },
  { icon: '🆘', title: '8 SOS Presets', description: 'Emergency relief protocols' },
  { icon: '📍', title: '10 Situational Guides', description: 'For life\'s challenging moments' },
  { icon: '📔', title: 'Encrypted Journal', description: 'Private, secure entries with prompts' },
  { icon: '☀️', title: 'Adaptive Rituals', description: '16 morning & evening routines' },
];

// =============================================================================
// PLAN CARD
// =============================================================================
interface PlanCardProps {
  title: string;
  price: string;
  period: string;
  savings?: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onPress: () => void;
}

function PlanCard({ title, price, period, savings, isPopular, isCurrentPlan, onPress }: PlanCardProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
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
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isCurrentPlan}
      accessibilityRole="button"
      accessibilityLabel={`${title} plan at ${price} per ${period}${savings ? `, ${savings}` : ''}${isCurrentPlan ? ', current plan' : ''}`}
      accessibilityState={{ selected: isCurrentPlan, disabled: isCurrentPlan }}
    >
      <Animated.View style={animatedStyle}>
        <GlassCard 
          variant={isPopular ? 'elevated' : 'default'} 
          padding="lg"
          glow={isPopular ? 'primary' : undefined}
        >
          {isPopular && (
            <View style={[styles.popularBadge, { backgroundColor: colors.accentPrimary }]}>
              <Text variant="labelSmall" style={{ color: colors.inkInverse }}>
                Most Popular
              </Text>
            </View>
          )}
          
          {isCurrentPlan && (
            <View style={[styles.currentBadge, { backgroundColor: colors.accentCalm }]}>
              <Text variant="labelSmall" style={{ color: colors.inkInverse }}>
                Current Plan
              </Text>
            </View>
          )}

          <Text variant="headlineSmall" color="ink">{title}</Text>
          
          <View style={styles.priceRow}>
            <Text variant="displaySmall" color="ink">{price}</Text>
            <Text variant="bodyMedium" color="inkMuted"> / {period}</Text>
          </View>
          
          {savings && (
            <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
              {savings}
            </Text>
          )}
        </GlassCard>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function SubscriptionScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation();
  const { impactMedium, notificationSuccess, notificationError } = useHaptics();
  const {
    tier,
    isPremium,
    isTrialing,
    trialEndsAt,
    expiresAt,
    startTrial,
    upgradeToPremium,
    upgradeToLifetime,
    restorePurchases,
  } = useSubscription();

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setIsLoading('trial');
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
      setIsLoading(null);
    }
  };

  const handleUpgradeMonthly = async () => {
    setIsLoading('monthly');
    setError(null);
    try {
      await impactMedium();
      await upgradeToPremium();
      await notificationSuccess();
      navigation.goBack();
    } catch (err: any) {
      await notificationError();
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleUpgradeLifetime = async () => {
    setIsLoading('lifetime');
    setError(null);
    try {
      await impactMedium();
      await upgradeToLifetime();
      await notificationSuccess();
      navigation.goBack();
    } catch (err: any) {
      await notificationError();
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleRestore = async () => {
    setIsLoading('restore');
    setError(null);
    try {
      await impactMedium();
      await restorePurchases();
      await notificationSuccess();
    } catch (err: any) {
      await notificationError();
      setError(err.message || 'Could not restore purchases. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
          <ScreenHeader
            title={isPremium ? 'Your Subscription' : 'Upgrade to Premium'}
            subtitle={isPremium ? 'Thank you for your support' : 'Unlock your full wellness journey'}
            showBack
          />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Error Banner */}
          {error && (
            <Animated.View 
              entering={reduceMotion ? undefined : FadeIn.duration(300)}
              style={[styles.errorBanner, { backgroundColor: withAlpha(colors.statusError, 0.1) }]}
            >
              <Text variant="bodyMedium" style={{ color: colors.statusError }} align="center">
                {error}
              </Text>
            </Animated.View>
          )}

          {/* Current Status */}
          {isPremium && (
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
              <GlassCard variant="elevated" padding="lg" glow="primary">
                <View style={styles.statusRow}>
                  <Text style={styles.statusIcon}>✨</Text>
                  <View style={styles.statusText}>
                    <Text variant="headlineSmall" color="ink">
                      {tier === 'lifetime' ? 'Lifetime Access' : 'Premium Member'}
                    </Text>
                    {tier === 'premium' && expiresAt && (
                      <Text variant="bodySmall" color="inkMuted">
                        Renews {formatDate(expiresAt)}
                      </Text>
                    )}
                    {isTrialing && trialEndsAt && (
                      <Text variant="bodySmall" color="inkMuted">
                        Trial ends {formatDate(trialEndsAt)}
                      </Text>
                    )}
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Trial Banner */}
          {!isPremium && !isTrialing && (
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
              <GlassCard variant="elevated" padding="lg" glow="warm">
                <View style={styles.trialContent}>
                  <Text variant="headlineSmall" color="ink" align="center">
                    Start your 7-day free trial
                  </Text>
                  <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.trialDescription}>
                    Try all premium features free. Cancel anytime.
                  </Text>
                  <PremiumButton
                    variant="glow"
                    size="lg"
                    fullWidth
                    tone="warm"
                    onPress={handleStartTrial}
                  >
                    Start Free Trial
                  </PremiumButton>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Plan Options */}
          {!isPremium && (
            <Animated.View 
              entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}
              style={styles.plansSection}
            >
              <Text variant="labelLarge" color="inkMuted" style={styles.sectionTitle}>
                Choose your plan
              </Text>

              <View style={styles.plansGrid}>
                <PlanCard
                  title="Monthly"
                  price="$4.99"
                  period="month"
                  onPress={handleUpgradeMonthly}
                />
                
                <PlanCard
                  title="Annual"
                  price="$29.99"
                  period="year"
                  savings="Save 50%"
                  isPopular
                  onPress={handleUpgradeMonthly}
                />
                
                <PlanCard
                  title="Lifetime"
                  price="$79.99"
                  period="once"
                  savings="Best value"
                  onPress={handleUpgradeLifetime}
                />
              </View>
            </Animated.View>
          )}

          {/* Features */}
          <Animated.View 
            entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}
            style={styles.featuresSection}
          >
            <Text variant="labelLarge" color="inkMuted" style={styles.sectionTitle}>
              {isPremium ? 'Your benefits' : 'What\'s included'}
            </Text>

            {PREMIUM_FEATURES.map((feature, index) => (
              <Animated.View 
                key={feature.title}
                entering={reduceMotion ? undefined : FadeInDown.delay(350 + index * 50).duration(400)}
              >
                <View style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureText}>
                    <Text variant="bodyMedium" color="ink">{feature.title}</Text>
                    <Text variant="bodySmall" color="inkMuted">{feature.description}</Text>
                  </View>
                  <Text style={[styles.checkmark, { color: colors.accentPrimary }]}>✓</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Restore */}
          <Animated.View 
            entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(400)}
            style={styles.restoreSection}
          >
            <Pressable 
              onPress={handleRestore}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              accessibilityHint="Restores any previous subscriptions you purchased"
            >
              <Text variant="labelMedium" color="inkMuted" align="center">
                Restore Purchases
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: layout.tabBarHeight + spacing[4] }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  statusIcon: {
    fontSize: 32,
  },
  statusText: {
    flex: 1,
  },
  trialContent: {
    alignItems: 'center',
    gap: spacing[3],
  },
  trialDescription: {
    marginBottom: spacing[2],
  },
  plansSection: {
    gap: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[2],
  },
  plansGrid: {
    gap: spacing[3],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing[2],
  },
  featuresSection: {
    gap: spacing[2],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  featureIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
  restoreSection: {
    paddingVertical: spacing[4],
  },
  errorBanner: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
});

export default SubscriptionScreen;
