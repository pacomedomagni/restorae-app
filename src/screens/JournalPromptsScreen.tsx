/**
 * JournalPromptsScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

const PROMPTS = [
  {
    id: '1',
    category: 'Gratitude',
    prompt: 'What are three things you\'re grateful for today?',
    icon: '🙏',
  },
  {
    id: '2',
    category: 'Reflection',
    prompt: 'What did you learn about yourself this week?',
    icon: '🔮',
  },
  {
    id: '3',
    category: 'Growth',
    prompt: 'What challenge helped you grow recently?',
    icon: '🌱',
  },
  {
    id: '4',
    category: 'Dreams',
    prompt: 'If you could achieve anything, what would it be?',
    icon: '✨',
  },
  {
    id: '5',
    category: 'Self-Care',
    prompt: 'How did you take care of yourself today?',
    icon: '💝',
  },
];

export function JournalPromptsScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { selectionLight } = useHaptics();

  const handlePromptSelect = async (prompt: string) => {
    await selectionLight();
    // Navigate to entry with prompt pre-filled
    navigation.navigate('JournalEntry');
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Writing Prompts"
              subtitle="Choose a prompt to inspire your writing"
              compact
            />
          </Animated.View>

          {PROMPTS.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
            >
              <Pressable onPress={() => handlePromptSelect(item.prompt)}>
                <GlassCard variant="interactive" padding="lg">
                  <View style={styles.promptHeader}>
                    <Text style={styles.icon}>{item.icon}</Text>
                    <Text variant="labelMedium" color="inkMuted">{item.category}</Text>
                  </View>
                  <Text variant="bodyLarge" color="ink" style={styles.prompt}>
                    {item.prompt}
                  </Text>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}

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
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  icon: {
    fontSize: 20,
  },
  prompt: {
    lineHeight: 26,
  },
});
