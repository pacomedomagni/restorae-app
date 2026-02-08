/**
 * PrivacyScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';

const PRIVACY_SECTIONS = [
  {
    title: 'Data Collection',
    content: 'Restorae collects minimal data necessary to provide you with a personalized wellness experience. Your journal entries, mood data, and preferences are stored securely on your device.',
  },
  {
    title: 'Data Storage',
    content: 'All your personal data is stored locally on your device. We do not upload your journal entries or mood data to external servers unless you explicitly enable cloud sync.',
  },
  {
    title: 'Analytics',
    content: 'We collect anonymous usage analytics to improve the app experience. This data cannot be used to identify you personally.',
  },
  {
    title: 'Third Parties',
    content: 'We do not sell or share your personal information with third parties. Any integrations with external services are opt-in only.',
  },
  {
    title: 'Your Rights',
    content: 'You can export or delete all your data at any time from the app settings. We respect your right to privacy and data ownership.',
  },
];

export function PrivacyScreen() {
  const { reduceMotion } = useTheme();

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Privacy Policy"
              subtitle="How we protect your data"
              compact
            />
          </Animated.View>

          {PRIVACY_SECTIONS.map((section, index) => (
            <Animated.View 
              key={index} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
            >
              <GlassCard variant="default" padding="lg">
                <Text variant="headlineSmall" color="ink">{section.title}</Text>
                <Text variant="bodyMedium" color="inkMuted" style={styles.content}>
                  {section.content}
                </Text>
              </GlassCard>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(400)}>
            <Text variant="labelSmall" color="inkMuted" align="center" style={styles.footer}>
              Last updated: February 2025
            </Text>
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
  content: {
    marginTop: spacing[2],
    lineHeight: 24,
  },
  footer: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
});
