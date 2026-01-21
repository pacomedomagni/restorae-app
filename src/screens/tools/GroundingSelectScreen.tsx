/**
 * GroundingSelectScreen
 * 
 * Selection grid for all 12 grounding techniques
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
  GROUNDING_TECHNIQUES,
  GROUNDING_CATEGORIES,
  getTechniquesByCategory,
  type GroundingCategory,
} from '../../data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// CATEGORY PILL
// =============================================================================
interface CategoryPillProps {
  category: typeof GROUNDING_CATEGORIES[number];
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
              ? colors.accentPrimary
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
// TECHNIQUE CARD
// =============================================================================
interface TechniqueCardProps {
  technique: typeof GROUNDING_TECHNIQUES[number];
  index: number;
  onPress: () => void;
}

function TechniqueCard({ technique, index, onPress }: TechniqueCardProps) {
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
    sensory: colors.accentCalm,
    body: colors.accentWarm,
    mental: colors.accentPrimary,
  };

  const accentColor = categoryColors[technique.category] || colors.accentPrimary;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 50).duration(400)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <GlassCard variant="default" padding="md">
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
              <Text variant="labelSmall" color="inkFaint">
                {technique.duration}
              </Text>
            </View>
            <Text variant="headlineSmall" color="ink">
              {technique.name}
            </Text>
            <Text variant="bodySmall" color="inkMuted" numberOfLines={2} style={styles.cardDescription}>
              {technique.description}
            </Text>
            <Text variant="labelSmall" color="inkFaint" style={styles.bestFor}>
              Best for: {technique.bestFor}
            </Text>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function GroundingSelectScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<GroundingCategory>('all');

  const techniques = getTechniquesByCategory(selectedCategory);

  const handleTechniqueSelect = (techniqueId: string) => {
    navigation.navigate('GroundingSession', { techniqueId });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
          <ScreenHeader
            title="Ground"
            subtitle="12 techniques to anchor you"
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
          {GROUNDING_CATEGORIES.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>

        {/* Technique List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {techniques.map((technique, index) => (
            <TechniqueCard
              key={technique.id}
              technique={technique}
              index={index}
              onPress={() => handleTechniqueSelect(technique.id)}
            />
          ))}
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
    gap: spacing[3],
  },
  cardContent: {
    gap: spacing[1],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardDescription: {
    marginTop: spacing[1],
    lineHeight: 18,
  },
  bestFor: {
    marginTop: spacing[2],
  },
});

export default GroundingSelectScreen;
