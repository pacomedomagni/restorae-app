/**
 * ForYouSection Component
 * 
 * Premium personalized recommendations section for the home screen.
 * Features AI-powered recommendations, daily insights, and contextual suggestions.
 * 
 * Exceeds industry standards with:
 * - Time-aware recommendations
 * - Mood-pattern learning
 * - Animated card interactions
 * - Smart reason display
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, GlassCard } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { recommendations, Recommendation } from '../../services/recommendations';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { RootStackParamList, MoodType } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface ForYouSectionProps {
  currentMood?: MoodType;
  userName?: string;
}

// =============================================================================
// RECOMMENDATION CARD
// =============================================================================

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
  onPress: () => void;
}

function RecommendationCard({ recommendation, index, onPress }: RecommendationCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      // Subtle shimmer animation
      shimmer.value = withDelay(
        index * 200,
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        )
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.3, 0], Extrapolate.CLAMP),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  // Get tone based on type
  const getToneColor = () => {
    switch (recommendation.type) {
      case 'breathing':
        return colors.accentPrimary;
      case 'grounding':
        return colors.accentCalm;
      case 'focus':
        return colors.accentWarm;
      case 'journal':
        return '#A78BFA'; // Purple
      case 'story':
        return colors.accentCalm;
      case 'ritual':
        return colors.accentWarm;
      default:
        return colors.accentPrimary;
    }
  };

  const toneColor = getToneColor();

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInRight.delay(100 + index * 100)
              .duration(400)
              .easing(Easing.out(Easing.ease))
      }
      style={styles.recommendationCardWrapper}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${recommendation.title}, ${recommendation.subtitle}, ${recommendation.duration}`}
      >
        <Animated.View style={animatedStyle}>
          <View style={[styles.recommendationCard, { backgroundColor: withAlpha(colors.canvasElevated, 0.7) }]}>
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                shimmerStyle,
                { backgroundColor: withAlpha(toneColor, 0.5) },
              ]}
            />

            {/* Icon */}
            <View
              style={[
                styles.recommendationIcon,
                { backgroundColor: withAlpha(toneColor, 0.15) },
              ]}
            >
              <Text style={styles.recommendationEmoji}>{recommendation.icon}</Text>
            </View>

            {/* Content */}
            <Text variant="headlineSmall" color="ink" numberOfLines={1}>
              {recommendation.title}
            </Text>
            <Text variant="bodySmall" color="inkMuted" numberOfLines={1} style={styles.subtitle}>
              {recommendation.subtitle}
            </Text>

            {/* Meta row */}
            <View style={styles.recommendationMeta}>
              <View style={[styles.durationBadge, { backgroundColor: withAlpha(toneColor, 0.1) }]}>
                <Text variant="labelSmall" style={{ color: toneColor }}>
                  {recommendation.duration}
                </Text>
              </View>
            </View>

            {/* Reason */}
            <Text variant="labelSmall" color="inkFaint" numberOfLines={2} style={styles.reason}>
              {recommendation.reason}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// DAILY INSIGHT CARD
// =============================================================================

function DailyInsightCard() {
  const { colors, reduceMotion } = useTheme();
  const [insight, setInsight] = useState<{ icon: string; title: string; body: string } | null>(null);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    setInsight(recommendations.getDailyInsight());

    if (!reduceMotion) {
      // Pulsing glow effect
      glowOpacity.value = withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!insight) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.delay(300).duration(500)}
      style={styles.insightWrapper}
    >
      <View style={[styles.insightCard, { backgroundColor: withAlpha(colors.canvasElevated, 0.6) }]}>
        {/* Ambient glow */}
        <Animated.View style={[styles.insightGlow, glowStyle]}>
          <LinearGradient
            colors={[withAlpha(colors.accentPrimary, 0.3), 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <View style={styles.insightContent}>
          <Text style={styles.insightIcon}>{insight.icon}</Text>
          <View style={styles.insightText}>
            <Text variant="labelMedium" color="ink">{insight.title}</Text>
            <Text variant="bodySmall" color="inkMuted" style={styles.insightBody}>
              {insight.body}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// FOR YOU SECTION
// =============================================================================

export function ForYouSection({ currentMood, userName }: ForYouSectionProps) {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [greeting, setGreeting] = useState<{ greeting: string; subtitle: string } | null>(null);

  useEffect(() => {
    // Initialize recommendations
    recommendations.initialize().then(() => {
      setRecs(recommendations.getForYouItems(currentMood));
      setGreeting(recommendations.getGreeting(userName));
    });
  }, [currentMood, userName]);

  const handleRecommendationPress = (rec: Recommendation) => {
    // Record activity for learning
    recommendations.recordActivity(rec.type, rec.id);
    
    // Navigate to the recommended content
    navigation.navigate(rec.route as any, rec.routeParams);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.delay(200).duration(400)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text variant="labelSmall" color="inkFaint" style={styles.sectionEyebrow}>
            PERSONALIZED FOR YOU
          </Text>
          <Text variant="headlineMedium" color="ink">
            Your Picks ✨
          </Text>
        </View>
      </Animated.View>

      {/* Daily Insight */}
      <DailyInsightCard />

      {/* Recommendations Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        decelerationRate="fast"
        snapToInterval={170}
        snapToAlignment="start"
      >
        {recs.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            index={index}
            onPress={() => handleRecommendationPress(rec)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing[4],
  },
  headerLeft: {},
  sectionEyebrow: {
    letterSpacing: 2,
    marginBottom: spacing[1],
  },
  carouselContent: {
    paddingRight: spacing[4],
    gap: spacing[3],
  },
  recommendationCardWrapper: {
    width: 160,
  },
  recommendationCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    overflow: 'hidden',
    minHeight: 180,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.xl,
  },
  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  recommendationEmoji: {
    fontSize: 22,
  },
  subtitle: {
    marginTop: spacing[1],
  },
  recommendationMeta: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
  durationBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  reason: {
    marginTop: spacing[2],
    lineHeight: 16,
  },
  insightWrapper: {
    marginBottom: spacing[4],
  },
  insightCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    overflow: 'hidden',
  },
  insightGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.xl,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  insightIcon: {
    fontSize: 28,
  },
  insightText: {
    flex: 1,
  },
  insightBody: {
    marginTop: spacing[1],
    lineHeight: 20,
  },
});

export default ForYouSection;
