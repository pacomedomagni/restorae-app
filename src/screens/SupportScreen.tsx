/**
 * SupportScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

const SUPPORT_OPTIONS = [
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions',
    icon: '❓',
    action: 'faq',
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Get help from our support team',
    icon: '✉️',
    action: 'email',
  },
  {
    id: 'feedback',
    title: 'Send Feedback',
    description: 'Help us improve Restorae',
    icon: '💬',
    action: 'feedback',
  },
  {
    id: 'rate',
    title: 'Rate the App',
    description: 'Share your experience',
    icon: '⭐',
    action: 'rate',
  },
];

export function SupportScreen() {
  const { reduceMotion } = useTheme();
  const { selectionLight } = useHaptics();

  const handleOption = async (action: string) => {
    await selectionLight();
    switch (action) {
      case 'email':
        Linking.openURL('mailto:support@restorae.app');
        break;
      case 'feedback':
        Linking.openURL('mailto:feedback@restorae.app?subject=App Feedback');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
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
                    <Text style={styles.icon}>{option.icon}</Text>
                    <View style={styles.optionText}>
                      <Text variant="headlineSmall" color="ink">{option.title}</Text>
                      <Text variant="bodySmall" color="inkMuted">{option.description}</Text>
                    </View>
                    <Text variant="bodyLarge" color="inkMuted">→</Text>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <GlassCard variant="subtle" padding="lg" style={styles.versionCard}>
              <Text variant="labelMedium" color="inkMuted" align="center">
                Restorae v1.0.0
              </Text>
              <Text variant="labelSmall" color="inkMuted" align="center" style={styles.versionSub}>
                Made with 💚 for your wellbeing
              </Text>
            </GlassCard>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  icon: {
    fontSize: 28,
  },
  optionText: {
    flex: 1,
  },
  versionCard: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
  versionSub: {
    marginTop: spacing[1],
  },
});
