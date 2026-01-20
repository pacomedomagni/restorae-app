/**
 * ToolsMoreScreen - Consistent UI
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

const MORE_TOOLS = [
  {
    id: 'visualization',
    title: 'Guided Visualization',
    description: 'Mental imagery for calm and focus',
    icon: '🌅',
    duration: '10-15 min',
  },
  {
    id: 'bodyscan',
    title: 'Body Scan',
    description: 'Progressive relaxation technique',
    icon: '🧘',
    duration: '15-20 min',
  },
  {
    id: 'affirmations',
    title: 'Affirmations',
    description: 'Positive statements for self-compassion',
    icon: '💫',
    duration: '5 min',
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    description: 'Cultivate appreciation and joy',
    icon: '🙏',
    duration: '5-10 min',
  },
  {
    id: 'sleep',
    title: 'Sleep Stories',
    description: 'Calming narratives for restful sleep',
    icon: '🌙',
    duration: '20-30 min',
  },
];

export function ToolsMoreScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { selectionLight } = useHaptics();

  const handleToolSelect = async (toolId: string) => {
    await selectionLight();
    // Navigate to specific tool screen
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="More Tools"
              subtitle="Expand your wellness toolkit"
              compact
            />
          </Animated.View>

          {MORE_TOOLS.map((tool, index) => (
            <Animated.View 
              key={tool.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
            >
              <Pressable onPress={() => handleToolSelect(tool.id)}>
                <GlassCard variant="interactive" padding="lg">
                  <View style={styles.toolRow}>
                    <Text style={styles.icon}>{tool.icon}</Text>
                    <View style={styles.toolInfo}>
                      <Text variant="headlineSmall" color="ink">{tool.title}</Text>
                      <Text variant="bodySmall" color="inkMuted">{tool.description}</Text>
                      <Text variant="labelSmall" color="accent" style={styles.duration}>
                        {tool.duration}
                      </Text>
                    </View>
                    <Text variant="bodyLarge" color="inkMuted">→</Text>
                  </View>
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
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  icon: {
    fontSize: 32,
  },
  toolInfo: {
    flex: 1,
  },
  duration: {
    marginTop: spacing[1],
  },
});
