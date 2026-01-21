/**
 * ToolsScreen
 * 
 * Wellness toolkit with categorized breathing exercises,
 * grounding techniques, and focus tools.
 */
import React, { useState, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
  Easing,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  PremiumButton,
} from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - layout.screenPaddingHorizontal * 2 - spacing[4]) / 2;

// =============================================================================
// TYPES & DATA
// =============================================================================
type ToolCategory = 'all' | 'breathe' | 'body' | 'mind' | 'emergency';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: 'breathe' | 'ground' | 'reset' | 'focus' | 'journal' | 'sos';
  duration: string;
  category: ToolCategory;
  tone: 'primary' | 'warm' | 'calm';
  featured?: boolean;
  route: keyof RootStackParamList;
  routeParams?: any;
}

const TOOLS: Tool[] = [
  {
    id: 'calm-breath',
    name: 'Breathing',
    description: '15 patterns to calm, energize, or focus',
    icon: 'breathe',
    duration: '2-10 min',
    category: 'breathe',
    tone: 'primary',
    featured: true,
    route: 'BreathingSelect',
  },
  {
    id: 'grounding',
    name: 'Grounding',
    description: '12 techniques to anchor in the present',
    icon: 'ground',
    duration: '3-8 min',
    category: 'body',
    tone: 'warm',
    route: 'GroundingSelect',
  },
  {
    id: 'body-reset',
    name: 'Body Reset',
    description: '14 exercises to release physical tension',
    icon: 'reset',
    duration: '2-5 min',
    category: 'body',
    tone: 'calm',
    route: 'ResetSelect',
  },
  {
    id: 'focus-session',
    name: 'Focus',
    description: '12 sessions with ambient soundscapes',
    icon: 'focus',
    duration: '15-45 min',
    category: 'mind',
    tone: 'primary',
    route: 'FocusSelect',
  },
  {
    id: 'situational',
    name: 'Situational',
    description: '10 guides for specific moments',
    icon: 'journal',
    duration: '3-5 min',
    category: 'mind',
    tone: 'calm',
    route: 'SituationalSelect',
  },
  {
    id: 'sos',
    name: 'SOS',
    description: '8 presets for immediate relief',
    icon: 'sos',
    duration: '3-5 min',
    category: 'emergency',
    tone: 'warm',
    route: 'SOSSelect',
  },
];

const CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'breathe', label: 'Breathe' },
  { id: 'body', label: 'Body' },
  { id: 'mind', label: 'Mind' },
  { id: 'emergency', label: 'SOS' },
];

// =============================================================================
// CATEGORY PILL
// =============================================================================
interface CategoryPillProps {
  category: { id: ToolCategory; label: string };
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
              : withAlpha(colors.canvasElevated, 0.6),
            borderColor: isActive
              ? colors.accentPrimary
              : withAlpha(colors.border, 0.5),
          },
        ]}
      >
        <Text
          variant="labelMedium"
          style={{ color: isActive ? colors.inkInverse : colors.inkMuted }}
        >
          {category.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// TOOL CARD
// =============================================================================
interface ToolCardProps {
  tool: Tool;
  index: number;
  onPress: () => void;
  compact?: boolean;
}

function ToolCard({ tool, index, onPress, compact = false }: ToolCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const toneColor =
    tool.tone === 'warm'
      ? colors.accentWarm
      : tool.tone === 'calm'
      ? colors.accentCalm
      : colors.accentPrimary;

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
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
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.delay(100 + index * 40)
              .duration(300)
              .easing(Easing.out(Easing.ease))
      }
      layout={Layout.springify().damping(18).stiffness(200)}
      style={compact ? styles.toolCardCompact : styles.toolCard}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard
            variant={compact ? 'default' : 'elevated'}
            padding={compact ? 'md' : 'lg'}
            glow={tool.tone}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: withAlpha(toneColor, 0.12) }]}>
              <LuxeIcon name={tool.icon} size={compact ? 22 : 28} color={toneColor} />
            </View>
            
            <Text
              variant={compact ? 'headlineSmall' : 'headlineMedium'}
              color="ink"
              style={styles.toolName}
            >
              {tool.name}
            </Text>
            
            {!compact && (
              <Text variant="bodySmall" color="inkMuted" style={styles.toolDescription}>
                {tool.description}
              </Text>
            )}
            
            <View style={styles.toolMeta}>
              <Text variant="labelSmall" style={{ color: toneColor }}>
                {tool.duration}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// FEATURED TOOL CARD
// =============================================================================
interface FeaturedToolCardProps {
  tool: Tool;
  onPress: () => void;
}

function FeaturedToolCard({ tool, onPress }: FeaturedToolCardProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactMedium();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard variant="hero" padding="xl" glow="primary">
            {/* Decorative elements */}
            <View style={styles.featuredDecoration}>
              <LinearGradient
                colors={[
                  withAlpha(colors.accentPrimary, 0.15),
                  'transparent',
                ]}
                style={styles.featuredGradient}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>

            <View style={styles.featuredContent}>
              <Text variant="labelSmall" color="inkFaint" style={styles.featuredLabel}>
                FEATURED
              </Text>
              
              <Text variant="displaySmall" color="ink" style={styles.featuredTitle}>
                {tool.name}
              </Text>
              
              <Text variant="bodyLarge" color="inkMuted" style={styles.featuredDescription}>
                {tool.description}
              </Text>

              <View style={styles.featuredFooter}>
                <View style={styles.featuredMeta}>
                  <View
                    style={[
                      styles.featuredMetaPill,
                      { backgroundColor: withAlpha(colors.accentPrimary, 0.12) },
                    ]}
                  >
                    <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
                      {tool.duration}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.featuredMetaPill,
                      { backgroundColor: withAlpha(colors.accentWarm, 0.12) },
                    ]}
                  >
                    <Text variant="labelSmall" color="inkMuted">
                      Breathing
                    </Text>
                  </View>
                </View>

                <PremiumButton
                  variant="primary"
                  size="md"
                  tone="primary"
                  onPress={handlePress}
                >
                  Start Now
                </PremiumButton>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// TOOLS SCREEN
// =============================================================================
export function ToolsScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

  const featuredTool = TOOLS.find((t) => t.featured);
  const filteredTools = TOOLS.filter(
    (t) =>
      !t.featured &&
      (activeCategory === 'all' || t.category === activeCategory)
  );

  const handleToolPress = useCallback(
    (tool: Tool) => {
      if (tool.routeParams) {
        navigation.navigate(tool.route as any, tool.routeParams);
      } else {
        navigation.navigate(tool.route as any);
      }
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View
          style={styles.scrollContent}
        >
          {/* Header */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(600)}
            style={styles.header}
          >
            <Text variant="labelSmall" color="inkFaint" style={styles.eyebrow}>
              WELLNESS TOOLKIT
            </Text>
            <Text variant="displayMedium" color="ink">
              Tools
            </Text>
            <Text variant="bodyLarge" color="inkMuted" style={styles.subtitle}>
              Curated practices for every moment
            </Text>
          </Animated.View>

          {/* Category Filter */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(100).duration(400)}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((category) => (
                <CategoryPill
                  key={category.id}
                  category={category}
                  isActive={activeCategory === category.id}
                  onPress={() => setActiveCategory(category.id)}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Featured Tool */}
          {featuredTool && activeCategory === 'all' && (
            <View style={styles.featuredSection}>
              <FeaturedToolCard
                tool={featuredTool}
                onPress={() => handleToolPress(featuredTool)}
              />
            </View>
          )}

          {/* Tools Grid */}
          <View style={styles.toolsGrid}>
            {filteredTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={index}
                compact
                onPress={() => handleToolPress(tool)}
              />
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: layout.tabBarHeight + spacing[4] }} />
        </View>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  eyebrow: {
    marginBottom: spacing[1],
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: spacing[2],
  },
  categoriesContainer: {
    paddingVertical: spacing[3],
    gap: spacing[2],
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  featuredSection: {
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  featuredDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: borderRadius['2xl'],
  },
  featuredGradient: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  featuredContent: {
    position: 'relative',
  },
  featuredLabel: {
    letterSpacing: 2,
    marginBottom: spacing[2],
  },
  featuredTitle: {
    marginBottom: spacing[2],
  },
  featuredDescription: {
    marginBottom: spacing[5],
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  featuredMetaPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  toolCard: {
    width: '100%',
  },
  toolCardCompact: {
    width: CARD_WIDTH,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  toolName: {
    marginBottom: spacing[1],
  },
  toolDescription: {
    marginBottom: spacing[3],
  },
  toolMeta: {
    marginTop: spacing[2],
  },
});
