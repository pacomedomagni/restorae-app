/**
 * PreferencesScreen
 * Preference categories
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';
import { useHaptics } from '../hooks/useHaptics';

type PreferenceChoice = {
  id: 'appearance' | 'sound' | 'notifications';
  title: string;
  description: string;
  icon: 'home' | 'focus' | 'journal';
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
    icon: 'journal',
    route: 'Reminders',
  },
];

interface ChoiceCardProps {
  choice: PreferenceChoice;
  delay: number;
  onPress: () => void;
}

function ChoiceCard({ choice, delay, onPress }: ChoiceCardProps) {
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
          style={[styles.choiceCard, animatedStyle]}
        >
          <Card elevation="lift">
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
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function PreferencesScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
              title="Preferences"
              subtitle="Fine-tune your experience"
              compact
            />
          </Animated.View>

          <View style={styles.choiceList}>
            {choices.map((choice, index) => (
              <ChoiceCard
                key={choice.id}
                choice={choice}
                delay={200 + index * 120}
                onPress={() => navigation.navigate(choice.route)}
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
  choiceList: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  choiceCard: {
    borderRadius: borderRadius.xl,
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
