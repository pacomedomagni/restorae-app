/**
 * ToolsMoreScreen
 * Secondary tools list (max 3 choices)
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

type MoreTool = {
  id: 'ground' | 'reset' | 'focus';
  title: string;
  description: string;
  icon: 'ground' | 'reset' | 'focus';
};

const tools: MoreTool[] = [
  { id: 'ground', title: 'Ground', description: 'Anchor and steady your senses.', icon: 'ground' },
  { id: 'reset', title: 'Reset', description: 'Gentle movement for release.', icon: 'reset' },
  { id: 'focus', title: 'Focus', description: 'Timers and ambient soundscapes.', icon: 'focus' },
];

interface ToolCardProps {
  tool: MoreTool;
  delay: number;
  onPress: () => void;
}

function ToolCard({ tool, delay, onPress }: ToolCardProps) {
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

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View
          style={[styles.toolCard, animatedStyle]}
        >
          <Card elevation="lift">
            <View style={[styles.toolIcon, { backgroundColor: withAlpha(colors.accentPrimary, 0.12) }]}>
              <Icon name={tool.icon} size={28} color={colors.accentPrimary} />
            </View>
            <Text variant="headlineSmall" color="ink" style={styles.toolTitle}>
              {tool.title}
            </Text>
            <Text variant="bodySmall" color="inkMuted">
              {tool.description}
            </Text>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function ToolsMoreScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = (toolId: MoreTool['id']) => {
    if (toolId === 'ground') {
      navigation.navigate('Grounding');
    }
    if (toolId === 'reset') {
      navigation.navigate('Reset');
    }
    if (toolId === 'focus') {
      navigation.navigate('Focus');
    }
  };

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
              title="More Tools"
              subtitle="Ground, reset, and focus"
              compact
            />
          </Animated.View>

          <View style={styles.cardList}>
            {tools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                delay={200 + index * 120}
                onPress={() => handlePress(tool.id)}
              />
            ))}
          </View>

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
  cardList: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  toolCard: {
    borderRadius: borderRadius.xl,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  toolTitle: {
    marginBottom: spacing[1],
  },
});
