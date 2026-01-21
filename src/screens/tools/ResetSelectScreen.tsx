/**
 * ResetSelectScreen
 * 
 * Selection grid for all 14 body reset exercises
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  ScreenHeader,
} from '../../components/ui';
import { spacing, borderRadius, layout, withAlpha } from '../../theme';
import { RootStackParamList } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import {
  RESET_EXERCISES,
  RESET_CATEGORIES,
  getExercisesByCategory,
  type ResetCategory,
} from '../../data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - layout.screenPaddingHorizontal * 2 - spacing[3]) / 2;

// =============================================================================
// CATEGORY PILL
// =============================================================================
interface CategoryPillProps {
  category: typeof RESET_CATEGORIES[number];
  isActive: boolean;
  onPress: () => void;
}

function CategoryPill({ category, isActive, onPress }: CategoryPillProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.categoryPill,
          animatedStyle,
          {
            backgroundColor: isActive
              ? colors.accentWarm
              : withAlpha(colors.ink, 0.06),
          },
        ]}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text
          variant="labelMedium"
          style={{ color: isActive ? colors.inkInverse : colors.ink }}
        >
          {category.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// EXERCISE CARD
// =============================================================================
interface ExerciseCardProps {
  exercise: typeof RESET_EXERCISES[number];
  index: number;
  onPress: () => void;
}

function ExerciseCard({ exercise, index, onPress }: ExerciseCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const categoryColors: Record<string, string> = {
    face: colors.accentCalm,
    upper: colors.accentPrimary,
    lower: colors.accentWarm,
    full: '#9B8E80',
  };

  const accentColor = categoryColors[exercise.category] || colors.accentWarm;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 50).duration(400)}
      style={[styles.cardWrapper, animatedStyle]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <GlassCard variant="default" padding="md">
          <View style={styles.cardContent}>
            <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
            <Text variant="headlineSmall" color="ink" numberOfLines={1}>
              {exercise.name}
            </Text>
            <Text variant="bodySmall" color="inkMuted" numberOfLines={2} style={styles.cardDescription}>
              {exercise.description}
            </Text>
            <View style={styles.cardMeta}>
              <Text variant="labelSmall" color="inkFaint">
                {exercise.duration}
              </Text>
              <Text variant="labelSmall" color="inkFaint">
                • {exercise.targetArea.split(',')[0]}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function ResetSelectScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<ResetCategory>('all');

  const exercises = getExercisesByCategory(selectedCategory);

  const handleExerciseSelect = (exerciseId: string) => {
    navigation.navigate('ResetSession', { exerciseId });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
          <ScreenHeader
            title="Body Reset"
            subtitle="14 exercises to release tension"
            showBack
          />
        </Animated.View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScroll}
        >
          {RESET_CATEGORIES.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>

        {/* Exercise Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                onPress={() => handleExerciseSelect(exercise.id)}
              />
            ))}
          </View>
          <View style={{ height: layout.tabBarHeight + spacing[4] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  categoriesScroll: {
    flexGrow: 0,
    marginBottom: spacing[4],
  },
  categoriesContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing[2],
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  categoryIcon: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardContent: {
    gap: spacing[1],
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing[1],
  },
  cardDescription: {
    marginTop: spacing[1],
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[2],
    flexWrap: 'wrap',
  },
});

export default ResetSelectScreen;
