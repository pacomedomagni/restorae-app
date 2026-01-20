/**
 * JournalPromptsScreen
 * Prompt choices
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Prompt = {
  id: string;
  text: string;
  category: 'gratitude' | 'release' | 'growth';
};

const prompts: Prompt[] = [
  { id: '1', text: 'What are you grateful for today?', category: 'gratitude' },
  { id: '2', text: 'What would you like to release?', category: 'release' },
  { id: '3', text: 'What small win can you celebrate?', category: 'growth' },
];

interface PromptCardProps {
  prompt: Prompt;
  delay: number;
  onPress: () => void;
}

function PromptCard({ prompt, delay, onPress }: PromptCardProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const categoryColor = {
    gratitude: colors.accentPrimary,
    release: colors.accentWarm,
    growth: colors.accentCalm,
  }[prompt.category];

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View
          style={[styles.promptCard, animatedStyle]}
        >
          <Card style={[styles.promptSurface, { borderLeftColor: categoryColor }]} elevation="lift">
            <Text variant="bodyLarge" color="ink" style={styles.promptText}>
              {prompt.text}
            </Text>
            <View style={[styles.promptCategory, { backgroundColor: withAlpha(categoryColor, 0.12) }]}>
              <Text variant="labelSmall" style={{ color: categoryColor }}>
                {prompt.category}
              </Text>
            </View>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function JournalPromptsScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLoading = false;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.morning}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Prompts"
              subtitle="Choose a gentle starting point"
              compact
            />
          </Animated.View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text variant="headlineSmall" color="ink">
                Loading prompts...
              </Text>
              <Text variant="bodySmall" color="inkMuted" style={styles.emptyText}>
                Gathering gentle starting points.
              </Text>
            </View>
          ) : prompts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="headlineSmall" color="ink">
                No prompts yet
              </Text>
              <Text variant="bodySmall" color="inkMuted" style={styles.emptyText}>
                Check back soon for guided prompts.
              </Text>
            </View>
          ) : (
            <View style={styles.promptList}>
              {prompts.map((prompt, index) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  delay={200 + index * 120}
                  onPress={() => navigation.navigate('JournalEntry', { mode: 'prompt', prompt: prompt.text })}
                />
              ))}
            </View>
          )}

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
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  promptList: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  emptyState: {
    padding: spacing[5],
  },
  emptyText: {
    marginTop: spacing[2],
  },
  promptCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
  },
  promptSurface: {
    borderLeftWidth: 3,
  },
  promptText: {
    marginBottom: spacing[3],
    lineHeight: 26,
  },
  promptCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
});
