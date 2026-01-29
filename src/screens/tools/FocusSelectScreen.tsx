/**
 * FocusSelectScreen
 * 
 * Selection grid for 12 focus sessions with ambient sound options
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
import { useStartActivity } from '../../hooks/useStartActivity';
import {
  FOCUS_SESSIONS,
  FOCUS_CATEGORIES,
  getSessionsByCategory,
  type FocusCategory,
} from '../../data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - layout.screenPaddingHorizontal * 2 - spacing[3]) / 2;

// =============================================================================
// CATEGORY PILL
// =============================================================================
interface CategoryPillProps {
  category: typeof FOCUS_CATEGORIES[number];
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
              ? colors.accentCalm
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
// SESSION CARD
// =============================================================================
interface SessionCardProps {
  session: typeof FOCUS_SESSIONS[number];
  index: number;
  onPress: () => void;
}

function SessionCard({ session, index, onPress }: SessionCardProps) {
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
    work: colors.accentCalm,
    creative: colors.accentPrimary,
    planning: colors.accentWarm,
    quick: '#9B8E80',
  };

  const accentColor = categoryColors[session.category] || colors.accentCalm;

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
              {session.name}
            </Text>
            <Text variant="bodySmall" color="inkMuted" numberOfLines={2} style={styles.cardDescription}>
              {session.description}
            </Text>
            <View style={styles.cardMeta}>
              <Text variant="labelSmall" color="inkFaint">
                {session.duration === 0 ? 'Open' : `${session.duration} min`}
              </Text>
              {session.defaultSound && (
                <Text variant="labelSmall" color="inkFaint">
                  • {session.defaultSound.replace(/-/g, ' ')}
                </Text>
              )}
            </View>
            <View style={styles.cardTags}>
              <View
                style={[styles.tag, { backgroundColor: withAlpha(accentColor, 0.1) }]}
              >
                <Text variant="labelSmall" style={{ color: accentColor }}>
                  {session.category}
                </Text>
              </View>
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
export function FocusSelectScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { startFocus } = useStartActivity();
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory>('all');

  const sessions = getSessionsByCategory(selectedCategory);

  const handleSessionSelect = (sessionId: string) => {
    // Use new unified session system
    startFocus(sessionId);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
          <ScreenHeader
            title="Focus Sessions"
            subtitle="12 sessions to deepen concentration"
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
          {FOCUS_CATEGORIES.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>

        {/* Session Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {sessions.map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                index={index}
                onPress={() => handleSessionSelect(session.id)}
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
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  tag: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
});

export default FocusSelectScreen;
