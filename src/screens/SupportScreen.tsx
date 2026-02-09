/**
 * SupportScreen - FAQ, Email, Feedback, Rate App
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

let StoreReview: typeof import('expo-store-review') | null = null;
try {
  StoreReview = require('expo-store-review');
} catch {
  // Not installed
}

const FAQ_ITEMS = [
  {
    q: 'What is Restorae?',
    a: 'Restorae is a mindful wellness companion that offers breathing exercises, guided programs, grounding techniques, and journaling to help you build a daily calm practice.',
  },
  {
    q: 'How do guided programs work?',
    a: 'Programs are multi-day journeys that combine breathing, journaling, and grounding into a structured sequence. Complete each day to unlock the next.',
  },
  {
    q: 'Can I customize my reminders?',
    a: 'Yes! Go to You → Notifications to enable morning, evening, and mood check-in reminders. You can also create custom reminders for specific days and times.',
  },
  {
    q: 'What are breathing tones?',
    a: 'Breathing tones are gentle singing-bowl sounds that play at each phase transition during a breathing session. You can toggle them with the bell icon in the session header.',
  },
  {
    q: 'Is my journal data private?',
    a: 'Absolutely. All journal entries are stored locally on your device. We never upload or share your personal reflections.',
  },
  {
    q: 'How do I restore my subscription?',
    a: 'Go to You → Subscription and tap "Restore Purchases." This will sync any active subscriptions from your app store account.',
  },
  {
    q: 'What should I do if the app crashes?',
    a: 'Try closing and reopening the app. If the issue persists, email support@restorae.app with details about what you were doing when it happened.',
  },
];

const SUPPORT_OPTIONS = [
  {
    id: 'email',
    title: 'Email Support',
    description: 'Get help from our support team',
    icon: 'mail-outline' as const,
    action: 'email',
  },
  {
    id: 'feedback',
    title: 'Send Feedback',
    description: 'Help us improve Restorae',
    icon: 'chatbubble-outline' as const,
    action: 'feedback',
  },
  {
    id: 'rate',
    title: 'Rate the App',
    description: 'Share your experience',
    icon: 'star-outline' as const,
    action: 'rate',
  },
];

export function SupportScreen() {
  const { colors, reduceMotion } = useTheme();
  const { selectionLight } = useHaptics();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleOption = async (action: string) => {
    await selectionLight();
    switch (action) {
      case 'email':
        Linking.openURL('mailto:support@restorae.app');
        break;
      case 'feedback':
        Linking.openURL('mailto:feedback@restorae.app?subject=App Feedback');
        break;
      case 'rate':
        if (StoreReview) {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          } else {
            Linking.openURL('https://apps.apple.com/app/restorae');
          }
        }
        break;
    }
  };

  const toggleFaq = async (index: number) => {
    await selectionLight();
    setExpandedFaq(prev => (prev === index ? null : index));
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Support"
              subtitle="We're here to help"
              compact
            />
          </Animated.View>

          {SUPPORT_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
            >
              <Pressable onPress={() => handleOption(option.action)}>
                <GlassCard variant="interactive" padding="lg">
                  <View style={styles.optionRow}>
                    <Ionicons name={option.icon} size={24} color={colors.ink} />
                    <View style={styles.optionText}>
                      <Text variant="headlineSmall" color="ink">{option.title}</Text>
                      <Text variant="bodySmall" color="inkMuted">{option.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}

          {/* FAQ Section */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(380).duration(400)}>
            <Text variant="headlineMedium" color="ink" style={styles.faqTitle}>
              Frequently asked questions
            </Text>
          </Animated.View>

          {FAQ_ITEMS.map((item, index) => (
            <Animated.View
              key={index}
              entering={reduceMotion ? undefined : FadeInDown.delay(420 + index * 60).duration(400)}
            >
              <Pressable onPress={() => toggleFaq(index)}>
                <GlassCard variant="subtle" padding="md">
                  <View style={styles.faqHeader}>
                    <Text variant="bodyMedium" color="ink" style={styles.faqQuestion}>
                      {item.q}
                    </Text>
                    <Ionicons
                      name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.inkMuted}
                    />
                  </View>
                  {expandedFaq === index && (
                    <Text variant="bodySmall" color="inkMuted" style={styles.faqAnswer}>
                      {item.a}
                    </Text>
                  )}
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(800).duration(400)}>
            <GlassCard variant="subtle" padding="lg" style={styles.versionCard}>
              <Text variant="labelMedium" color="inkMuted" align="center">
                Restorae v1.0.0
              </Text>
              <Text variant="labelSmall" color="inkMuted" align="center" style={styles.versionSub}>
                Made with care for your wellbeing
              </Text>
            </GlassCard>
          </Animated.View>

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
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  optionText: {
    flex: 1,
  },
  faqTitle: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    marginRight: spacing[2],
  },
  faqAnswer: {
    marginTop: spacing[2],
    lineHeight: 22,
  },
  versionCard: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
  versionSub: {
    marginTop: spacing[1],
  },
});
