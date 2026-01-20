/**
 * MoodSelectScreen
 * Mood choices per path
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { MoodType, RootStackParamList } from '../types';

type MoodGroup = 'positive' | 'challenging';

type MoodConfig = {
  id: MoodType;
  title: string;
  description: string;
};

const moodGroups: Record<MoodGroup, MoodConfig[]> = {
  positive: [
    { id: 'energized', title: 'Energized', description: 'Bright and ready to go.' },
    { id: 'calm', title: 'Calm', description: 'Steady and clear.' },
    { id: 'good', title: 'Good', description: 'Balanced and content.' },
  ],
  challenging: [
    { id: 'anxious', title: 'Anxious', description: 'On edge or restless.' },
    { id: 'low', title: 'Low', description: 'Heavy or drained.' },
    { id: 'tough', title: 'Tough', description: 'Stressed or tense.' },
  ],
};

interface MoodCardProps {
  mood: MoodConfig;
  delay: number;
  onPress: () => void;
}

function MoodCard({ mood, delay, onPress }: MoodCardProps) {
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
          style={[styles.card, animatedStyle]}
        >
          <Card elevation="lift">
            <View style={[styles.iconWrap, { backgroundColor: withAlpha(colors.accentPrimary, 0.12) }]}>
              <Icon name={mood.id} size={28} color={colors.accentPrimary} />
            </View>
            <Text variant="headlineSmall" color="ink" style={styles.cardTitle}>
              {mood.title}
            </Text>
            <Text variant="bodySmall" color="inkMuted">
              {mood.description}
            </Text>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function MoodSelectScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodSelect'>>();
  const group = route.params.group;
  const moods = moodGroups[group];
  const { impactLight } = useHaptics();

  const title = group === 'positive' ? 'Pick a light mood' : 'Pick a heavy mood';

  const handleSelect = async (mood: MoodType) => {
    await impactLight();
    await AsyncStorage.setItem('@restorae/last_mood', mood);
    navigation.navigate('MoodResult', { mood });
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
              title={title}
              subtitle="Choose what best matches the moment"
              compact
            />
          </Animated.View>

          <View style={styles.cardList}>
            {moods.map((mood, index) => (
              <MoodCard
                key={mood.id}
                mood={mood}
                delay={200 + index * 120}
                onPress={() => handleSelect(mood.id)}
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
