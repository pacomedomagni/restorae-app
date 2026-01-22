/**
 * ToolsMoreScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader, TabSafeScrollView } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, layout, withAlpha } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

type MoreTool = {
  id: string;
  title: string;
  description: string;
  icon: 'focus' | 'ground' | 'journal' | 'calm';
  tone: 'primary' | 'warm' | 'calm';
  duration: string;
};

const MORE_TOOLS: MoreTool[] = [
  {
    id: 'visualization',
    title: 'Guided Visualization',
    description: 'Mental imagery for calm and focus',
    icon: 'focus',
    tone: 'primary',
    duration: '10-15 min',
  },
  {
    id: 'bodyscan',
    title: 'Body Scan',
    description: 'Progressive relaxation technique',
    icon: 'ground',
    tone: 'warm',
    duration: '15-20 min',
  },
  {
    id: 'affirmations',
    title: 'Affirmations',
    description: 'Positive statements for self-compassion',
    icon: 'journal',
    tone: 'calm',
    duration: '5 min',
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    description: 'Cultivate appreciation and joy',
    icon: 'journal',
    tone: 'warm',
    duration: '5-10 min',
  },
  {
    id: 'sleep',
    title: 'Sleep Stories',
    description: 'Calming narratives for restful sleep',
    icon: 'calm',
    tone: 'calm',
    duration: '20-30 min',
  },
];

export function ToolsMoreScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { selectionLight } = useHaptics();

  const handleToolSelect = async (toolId: string) => {
    await selectionLight();
    // Navigate to specific tool screen
  };

  const toneColor = (tone: 'primary' | 'warm' | 'calm') =>
    tone === 'warm' ? colors.accentWarm : tone === 'calm' ? colors.accentCalm : colors.accentPrimary;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          noTabBar
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="More Tools"
              subtitle="Expand your wellness toolkit"
              compact
              showBack
            />
          </Animated.View>

          {MORE_TOOLS.map((tool, index) => {
            const color = toneColor(tool.tone);
            return (
              <Animated.View
                key={tool.id}
                entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
              >
                <Pressable
                  onPress={() => handleToolSelect(tool.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${tool.title}. ${tool.description}. ${tool.duration}`}
                  accessibilityHint="Opens the tool"
                >
                  <GlassCard variant="interactive" padding="lg">
                    <View style={styles.toolRow}>
                      <View style={[styles.iconContainer, { backgroundColor: withAlpha(color, 0.12) }]}
                      >
                        <Icon name={tool.icon} size={22} color={color} />
                      </View>
                      <View style={styles.toolInfo}>
                        <Text variant="headlineSmall" color="ink">{tool.title}</Text>
                        <Text variant="bodySmall" color="inkMuted">{tool.description}</Text>
                        <Text variant="labelSmall" style={[styles.duration, { color }] }>
                          {tool.duration}
                        </Text>
                      </View>
                      <Text variant="bodyLarge" color="inkMuted">→</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            );
          })}
        </TabSafeScrollView>
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
  scrollView: {
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  duration: {
    marginTop: spacing[1],
  },
});
