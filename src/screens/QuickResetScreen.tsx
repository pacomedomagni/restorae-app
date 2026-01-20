/**
 * QuickResetScreen
 * Fast tools for immediate relief
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

type QuickTool = {
  id: 'breathe' | 'ground' | 'reset';
  title: string;
  description: string;
  icon: 'breathe' | 'ground' | 'reset';
};

const quickTools: QuickTool[] = [
  { id: 'breathe', title: 'Breathe', description: 'Guided calm in 2-4 minutes.', icon: 'breathe' },
  { id: 'ground', title: 'Ground', description: 'Anchor your senses and reset.', icon: 'ground' },
  { id: 'reset', title: 'Reset', description: 'Release tension with gentle movement.', icon: 'reset' },
];

interface ToolCardProps {
  tool: QuickTool;
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

export function QuickResetScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleToolPress = (toolId: QuickTool['id']) => {
    if (toolId === 'breathe') {
      navigation.navigate('Breathing', { patternId: 'calm-breath' });
    }
    if (toolId === 'ground') {
      navigation.navigate('Grounding');
    }
    if (toolId === 'reset') {
      navigation.navigate('Reset');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.calm}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Quick Reset"
              subtitle="Fast tools for immediate relief"
              compact
            />
          </Animated.View>

          <View style={styles.cardList}>
            {quickTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                delay={200 + index * 100}
                onPress={() => handleToolPress(tool.id)}
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
