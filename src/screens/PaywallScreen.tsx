/**
 * PaywallScreen
 *
 * Premium subscription paywall — soft, inviting, never aggressive.
 * "Welcome to the full experience" not "PAY NOW".
 *
 * - Always dismissible (close button)
 * - Benefits-led copy
 * - Monthly/Annual toggle
 * - Free trial CTA
 * - Restore purchases link
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useHaptics } from '../hooks/useHaptics';
import { Text, Button, GlassCard, AmbientBackground } from '../components/ui';
import { spacing, layout, borderRadius, withAlpha } from '../theme';

// =============================================================================
// TYPES
// =============================================================================
type PlanInterval = 'monthly' | 'annual';

interface BenefitItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

// =============================================================================
// BENEFITS
// =============================================================================
const BENEFITS: BenefitItem[] = [
  {
    icon: 'infinite-outline',
    title: 'Unlimited sessions',
    description: 'Access every breathing pattern, grounding technique, and focus session',
  },
  {
    icon: 'cloud-download-outline',
    title: 'Offline access',
    description: 'Download sessions and stories for when you need them most',
  },
  {
    icon: 'sparkles-outline',
    title: 'Personalized for you',
    description: 'Smart recommendations that adapt to your mood and time of day',
  },
];

// =============================================================================
// BENEFIT ROW
// =============================================================================
function BenefitRow({ benefit, delay }: { benefit: BenefitItem; delay: number }) {
  const { colors, reduceMotion } = useTheme();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.delay(delay).duration(400)}
      style={styles.benefitRow}
    >
      <View style={[styles.benefitIcon, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
        <Ionicons name={benefit.icon} size={22} color={colors.accentPrimary} />
      </View>
      <View style={styles.benefitText}>
        <Text variant="headlineSmall" color="ink">
          {benefit.title}
        </Text>
        <Text variant="bodySmall" color="inkMuted">
          {benefit.description}
        </Text>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// PLAN TOGGLE
// =============================================================================
interface PlanToggleProps {
  selected: PlanInterval;
  onSelect: (plan: PlanInterval) => void;
}

function PlanToggle({ selected, onSelect }: PlanToggleProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();

  const handleSelect = async (plan: PlanInterval) => {
    await impactLight();
    onSelect(plan);
  };

  return (
    <View style={[styles.planToggle, { backgroundColor: withAlpha(colors.ink, 0.05) }]}>
      <Pressable
        onPress={() => handleSelect('monthly')}
        style={[
          styles.planOption,
          selected === 'monthly' && {
            backgroundColor: colors.canvasElevated,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        <Text
          variant="labelMedium"
          style={{ color: selected === 'monthly' ? colors.ink : colors.inkMuted }}
        >
          Monthly
        </Text>
        <Text
          variant="headlineSmall"
          style={{ color: selected === 'monthly' ? colors.ink : colors.inkMuted, marginTop: 2 }}
        >
          $9.99
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: colors.inkFaint }}
        >
          per month
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleSelect('annual')}
        style={[
          styles.planOption,
          selected === 'annual' && {
            backgroundColor: colors.canvasElevated,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        {selected === 'annual' && (
          <View style={[styles.saveBadge, { backgroundColor: withAlpha(colors.success, 0.15) }]}>
            <Text variant="labelSmall" style={{ color: colors.success, fontSize: 10 }}>
              SAVE 40%
            </Text>
          </View>
        )}
        <Text
          variant="labelMedium"
          style={{ color: selected === 'annual' ? colors.ink : colors.inkMuted }}
        >
          Annual
        </Text>
        <Text
          variant="headlineSmall"
          style={{ color: selected === 'annual' ? colors.ink : colors.inkMuted, marginTop: 2 }}
        >
          $59.99
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: colors.inkFaint }}
        >
          $5/month
        </Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function PaywallScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation();
  const { startTrial, restorePurchases } = useSubscription();
  const { impactLight, notificationSuccess } = useHaptics();

  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = useCallback(async () => {
    await impactLight();
    navigation.goBack();
  }, [navigation]);

  const handleStartTrial = useCallback(async () => {
    setIsLoading(true);
    try {
      await startTrial();
      await notificationSuccess();
      navigation.goBack();
    } catch {
      // Handle error — for now just dismiss loading
    } finally {
      setIsLoading(false);
    }
  }, [startTrial, navigation]);

  const handleRestore = useCallback(async () => {
    await impactLight();
    try {
      await restorePurchases();
      navigation.goBack();
    } catch {
      // Handle error
    }
  }, [restorePurchases, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Close Button */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.delay(100).duration(300)}
          style={styles.closeContainer}
        >
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: withAlpha(colors.ink, 0.08) }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.inkMuted} />
          </Pressable>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(500)}
            style={styles.headline}
          >
            <Text
              variant="displaySmall"
              color="ink"
              align="center"
              style={styles.headlineText}
            >
              Unlock your full sanctuary
            </Text>
            <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.headlineSubtext}>
              Everything you need for a calmer, more centered life
            </Text>
          </Animated.View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            {BENEFITS.map((benefit, index) => (
              <BenefitRow
                key={benefit.title}
                benefit={benefit}
                delay={300 + index * 100}
              />
            ))}
          </View>

          {/* Plan Toggle */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(600).duration(400)}
            style={styles.planContainer}
          >
            <PlanToggle selected={selectedPlan} onSelect={setSelectedPlan} />
          </Animated.View>

          {/* Trial CTA */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(700).duration(400)}
            style={styles.ctaContainer}
          >
            <Button
              variant="glow"
              size="lg"
              tone="primary"
              fullWidth
              onPress={handleStartTrial}
              loading={isLoading}
            >
              Start your 7-day free trial
            </Button>

            <Text
              variant="bodySmall"
              color="inkFaint"
              align="center"
              style={styles.finePrint}
            >
              Cancel anytime. No commitment.
            </Text>
          </Animated.View>

          {/* Restore */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(800).duration(300)}
            style={styles.restoreContainer}
          >
            <Pressable onPress={handleRestore} hitSlop={8}>
              <Text variant="labelMedium" color="inkFaint" align="center">
                Restore purchases
              </Text>
            </Pressable>
          </Animated.View>
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
  closeContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[2],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[10],
  },
  headline: {
    marginTop: spacing[6],
    marginBottom: spacing[8],
  },
  headlineText: {
    fontFamily: 'Lora_700Bold',
  },
  headlineSubtext: {
    marginTop: spacing[3],
  },
  benefitsContainer: {
    marginBottom: spacing[8],
    gap: spacing[5],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  benefitText: {
    flex: 1,
  },
  planContainer: {
    marginBottom: spacing[6],
  },
  planToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    gap: spacing[1],
  },
  planOption: {
    flex: 1,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing[1],
  },
  ctaContainer: {
    marginBottom: spacing[4],
  },
  finePrint: {
    marginTop: spacing[3],
  },
  restoreContainer: {
    paddingVertical: spacing[4],
  },
});

export default PaywallScreen;
