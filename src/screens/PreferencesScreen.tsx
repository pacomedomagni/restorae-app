/**
 * PreferencesScreen
 * Preference categories - Consistent UI
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';
import { useHaptics } from '../hooks/useHaptics';

type PreferenceChoice = {
  id: 'appearance' | 'sound' | 'notifications';
  title: string;
  description: string;
  icon: 'home' | 'focus' | 'journal-tab';
  route: keyof RootStackParamList;
};

const choices: PreferenceChoice[] = [
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Light, dark, or system theme.',
    icon: 'home',
    route: 'Appearance',
  },
  {
    id: 'sound',
    title: 'Sounds & Haptics',
    description: 'Control tactile and audio feedback.',
    icon: 'focus',
    route: 'SoundHaptics',
  },
  {
    id: 'notifications',
    title: 'Reminders',
    description: 'Set gentle ritual reminders.',
    icon: 'journal-tab',
    route: 'Reminders',
  },
];

export function PreferencesScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactLight } = useHaptics();

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Preferences"
              subtitle="Fine-tune your experience"
              compact
            />
          </Animated.View>

          <View style={styles.choiceList}>
            {choices.map((choice, index) => (
              <Animated.View
                key={choice.id}
                entering={reduceMotion ? undefined : FadeInDown.delay(200 + index * 120).duration(400)}
              >
                <GlassCard
                  variant="default"
                  padding="md"
                  onPress={async () => {
                    await impactLight();
                    navigation.navigate(choice.route as any);
                  }}
                >
                  <View style={styles.choiceContent}>
                    <View style={[styles.choiceIcon, { backgroundColor: withAlpha(colors.accentPrimary, 0.12) }]}>
                      <Icon name={choice.icon} size={24} color={colors.accentPrimary} />
                    </View>
                    <View style={styles.choiceText}>
                      <Text variant="headlineSmall" color="ink" style={styles.choiceTitle}>
                        {choice.title}
                      </Text>
                      <Text variant="bodySmall" color="inkMuted">
                        {choice.description}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </View>

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
  choiceList: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  choiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  choiceText: {
    flex: 1,
  },
  choiceTitle: {
    marginBottom: spacing[1],
  },
});
