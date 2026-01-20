/**
 * AppearanceScreen
 * Light / Dark / System choices (max 3)
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
import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, borderRadius, layout } from '../theme';
import { ThemeMode } from '../types';
import { useHaptics } from '../hooks/useHaptics';

const options: { id: ThemeMode; title: string; description: string }[] = [
  { id: 'light', title: 'Light', description: 'Warm, soft canvas for day.' },
  { id: 'dark', title: 'Dark', description: 'Deep charcoal for night.' },
  { id: 'system', title: 'System', description: 'Match your device setting.' },
];

interface ThemeOptionCardProps {
  option: typeof options[number];
  selected: boolean;
  delay: number;
  onPress: () => void;
}

function ThemeOptionCard({ option, selected, delay, onPress }: ThemeOptionCardProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View
          style={[styles.optionCard, animatedStyle]}
        >
          <Card
            elevation="lift"
            style={[
              styles.optionSurface,
              {
                borderColor: selected ? colors.accentPrimary : colors.border,
                borderWidth: selected ? 2 : 1,
              },
            ]}
          >
            <View style={[styles.optionDot, { backgroundColor: selected ? colors.accentPrimary : colors.borderMuted }]} />
            <View style={styles.optionText}>
              <Text variant="headlineSmall" color="ink" style={styles.optionTitle}>
                {option.title}
              </Text>
              <Text variant="bodySmall" color="inkMuted">
                {option.description}
              </Text>
            </View>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function AppearanceScreen() {
  const { gradients, mode, setMode, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();

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
              title="Appearance"
              subtitle="Choose how Restorae looks"
              compact
            />
          </Animated.View>

          <View style={styles.options}>
            {options.map((option, index) => (
              <ThemeOptionCard
                key={option.id}
                option={option}
                selected={mode === option.id}
                delay={200 + index * 120}
                onPress={async () => {
                  await impactLight();
                  setMode(option.id);
                }}
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
  options: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  optionCard: {
    borderRadius: borderRadius.xl,
  },
  optionSurface: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[4],
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    marginBottom: spacing[1],
  },
});
