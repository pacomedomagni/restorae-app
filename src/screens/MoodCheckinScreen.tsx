/**
 * MoodCheckinScreen
 * Two-path entry, then 3 moods per path
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

type MoodPath = {
  id: 'positive' | 'challenging';
  title: string;
  description: string;
  icon: 'good' | 'tough';
};

const moodPaths: MoodPath[] = [
  {
    id: 'positive',
    title: 'Feeling steady or light',
    description: 'Choose a mood with calm, good, or energized energy.',
    icon: 'good',
  },
  {
    id: 'challenging',
    title: 'Feeling heavy or tense',
    description: 'Choose a mood with anxious, low, or tough energy.',
    icon: 'tough',
  },
];

interface PathCardProps {
  path: MoodPath;
  delay: number;
  onPress: () => void;
}

function PathCard({ path, delay, onPress }: PathCardProps) {
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
          style={[styles.card, animatedStyle]}
        >
          <Card elevation="lift">
            <View style={[styles.iconWrap, { backgroundColor: withAlpha(colors.accentPrimary, 0.12) }]}>
              <Icon name={path.icon} size={28} color={colors.accentPrimary} />
            </View>
            <Text variant="headlineSmall" color="ink" style={styles.cardTitle}>
              {path.title}
            </Text>
            <Text variant="bodySmall" color="inkMuted">
              {path.description}
            </Text>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function MoodCheckinScreen() {
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
              title="Mood Check-in"
              subtitle="Pick a path to guide the next step"
              compact
            />
          </Animated.View>

          <View style={styles.cardList}>
            {moodPaths.map((path, index) => (
              <PathCard
                key={path.id}
                path={path}
                delay={200 + index * 120}
                onPress={() => navigation.navigate('MoodSelect', { group: path.id })}
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
  card: {
    borderRadius: borderRadius.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  cardTitle: {
    marginBottom: spacing[1],
  },
});
