/**
 * StoriesScreen
 * 
 * Bedtime stories hub with categories, featured stories,
 * and quick access to soundscapes.
 * 
 * Uses hybrid data approach: fetches from API when online,
 * falls back to local data when offline or on error.
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useStories, BedtimeStory as ApiStory } from '../hooks/useStories';
import {
  Text,
  GlassCard,
  AmbientBackground,
  TabSafeScrollView,
  EmptyState,
  Skeleton,
  SkeletonCard,
  OfflineBanner,
} from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';
import {
  BEDTIME_STORIES,
  STORY_CATEGORIES,
  formatDuration,
  BedtimeStory,
  StoryCategory,
} from '../data/bedtimeStories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH - layout.screenPaddingHorizontal * 2;
const STORY_CARD_WIDTH = (SCREEN_WIDTH - layout.screenPaddingHorizontal * 2 - spacing[4]) / 2;

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================
function SkeletonStoryCard() {
  return (
    <View style={{ width: STORY_CARD_WIDTH }}>
      <SkeletonCard style={{ height: 160, marginBottom: spacing[2] }} />
      <Skeleton width="80%" height={16} style={{ marginBottom: spacing[1] }} />
      <Skeleton width="50%" height={12} />
    </View>
  );
}

function SkeletonFeaturedCard() {
  return (
    <View style={{ width: FEATURED_CARD_WIDTH }}>
      <SkeletonCard style={{ height: 200, marginBottom: spacing[2] }} />
      <Skeleton width="70%" height={20} style={{ marginBottom: spacing[1] }} />
      <Skeleton width="40%" height={14} />
    </View>
  );
}

// =============================================================================
// CATEGORY PILL
// =============================================================================
interface CategoryPillProps {
  category: { id: string; label: string; icon: string };
  isActive: boolean;
  onPress: () => void;
}

function CategoryPill({ category, isActive, onPress }: CategoryPillProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={async () => {
        await impactLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${category.label}`}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.categoryPill,
          {
            backgroundColor: isActive
              ? colors.accentPrimary
              : withAlpha(colors.canvasElevated, 0.8),
            borderColor: isActive ? colors.accentPrimary : colors.border,
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text
          variant="labelSmall"
          style={{
            color: isActive ? colors.inkInverse : colors.ink,
            marginLeft: spacing[1],
          }}
        >
          {category.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// FEATURED STORY CARD
// =============================================================================
interface FeaturedCardProps {
  story: BedtimeStory;
  onPress: () => void;
}

function FeaturedStoryCard({ story, onPress }: FeaturedCardProps) {
  const { colors, isDark } = useTheme();
  const { impactLight } = useHaptics();
  const { isPremium } = useSubscription();
  const scale = useSharedValue(1);

  const isLocked = story.isPremium && !isPremium;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      onPress={async () => {
        await impactLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${story.title}. ${story.subtitle}. ${formatDuration(story.duration)}${isLocked ? '. Premium content' : ''}`}
      accessibilityHint={isLocked ? 'Opens subscription screen' : 'Plays this story'}
    >
      <Animated.View style={[styles.featuredCard, animatedStyle]}>
        <View style={styles.featuredImageContainer}>
          {story.artworkUrl ? (
            <Image
              source={{ uri: story.artworkUrl }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.featuredImage, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={{ fontSize: 48 }}>🌙</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.featuredGradient}
          />
          
          {/* Duration badge */}
          <View style={[styles.durationBadge, { backgroundColor: withAlpha(colors.canvas, 0.9) }]}>
            <Text variant="labelSmall" color="ink">
              {formatDuration(story.duration)}
            </Text>
          </View>

          {/* Lock badge */}
          {isLocked && (
            <View style={[styles.lockBadge, { backgroundColor: colors.accentWarm }]}>
              <Icon name="lock" size={12} color={colors.inkInverse} />
            </View>
          )}

          {/* Content overlay */}
          <View style={styles.featuredContent}>
            <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {story.narrator}
            </Text>
            <Text variant="headlineMedium" style={{ color: '#FFFFFF', marginTop: spacing[1] }}>
              {story.title}
            </Text>
            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)', marginTop: spacing[1] }}>
              {story.subtitle}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// STORY CARD
// =============================================================================
interface StoryCardProps {
  story: BedtimeStory;
  index: number;
  onPress: () => void;
}

function StoryCard({ story, index, onPress }: StoryCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const { isPremium } = useSubscription();
  const scale = useSharedValue(1);

  const isLocked = story.isPremium && !isPremium;

  const moodColors = {
    calm: colors.accentCalm,
    dreamy: colors.accentPrimary,
    cozy: colors.accentWarm,
    magical: '#A58AB7',
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(index * 50).duration(300)}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }}
        onPress={async () => {
          await impactLight();
          onPress();
        }}
        style={styles.storyCard}
        accessibilityRole="button"
        accessibilityLabel={`${story.title} by ${story.narrator}. ${formatDuration(story.duration)}${isLocked ? '. Premium content' : ''}`}
        accessibilityHint={isLocked ? 'Opens subscription screen' : 'Plays this story'}
      >
        <Animated.View style={useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))}>
          <GlassCard variant="elevated" padding="none">
            <View style={styles.storyCardInner}>
              {/* Artwork */}
              <View style={styles.storyArtworkContainer}>
                {story.artworkUrl ? (
                  <Image
                    source={{ uri: story.artworkUrl }}
                    style={styles.storyArtwork}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.storyArtwork, { backgroundColor: moodColors[story.mood] }]}>
                    <Text style={{ fontSize: 32 }}>🌙</Text>
                  </View>
                )}
                
                {isLocked && (
                  <View style={[styles.miniLockBadge, { backgroundColor: colors.accentWarm }]}>
                    <Icon name="lock" size={10} color={colors.inkInverse} />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.storyInfo}>
                <Text variant="labelSmall" color="inkFaint" numberOfLines={1}>
                  {story.narrator}
                </Text>
                <Text variant="bodyMedium" color="ink" numberOfLines={2} style={{ marginTop: 2 }}>
                  {story.title}
                </Text>
                <View style={styles.storyMeta}>
                  <View style={[styles.moodDot, { backgroundColor: moodColors[story.mood] }]} />
                  <Text variant="labelSmall" color="inkMuted">
                    {formatDuration(story.duration)}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function StoriesScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isPremium } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the stories hook for API data with caching
  const { 
    stories: apiStories, 
    loading: apiLoading, 
    error: apiError,
    refresh: refreshStories 
  } = useStories();

  // Map API stories to local format for compatibility, fall back to local data
  const stories = useMemo(() => {
    if (apiStories && apiStories.length > 0) {
      // Map API format to local format
      return apiStories.map((s): BedtimeStory => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle || '',
        description: '',
        narrator: s.narrator || 'Unknown',
        duration: s.duration,
        audioUrl: s.audioUrl || '',
        artworkUrl: s.artworkUrl,
        category: (s.mood?.toLowerCase() || 'nature') as StoryCategory,
        tags: [],
        isPremium: s.isPremium,
        mood: (s.mood?.toLowerCase() || 'calm') as BedtimeStory['mood'],
      }));
    }
    // Fallback to local data
    return BEDTIME_STORIES;
  }, [apiStories]);

  const isLoading = apiLoading;

  // Filter stories based on selected category
  const filteredStories = useMemo(() => {
    if (selectedCategory === 'all') return stories;
    return stories.filter(s => s.category === selectedCategory);
  }, [stories, selectedCategory]);
  
  const featuredStory = stories[0]; // First story as featured

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshStories();
    setIsRefreshing(false);
  }, [refreshStories]);

  const handleStoryPress = useCallback((story: BedtimeStory) => {
    if (story.isPremium && !isPremium) {
      navigation.navigate('Paywall', { 
        feature: 'bedtime-stories',
        featureName: 'Bedtime Stories',
      });
    } else {
      navigation.navigate('StoryPlayer', { storyId: story.id });
    }
  }, [isPremium, navigation]);

  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {/* Header skeleton */}
      <View style={styles.header}>
        <Skeleton width="60%" height={32} style={{ marginBottom: spacing[2] }} />
        <Skeleton width="80%" height={16} />
      </View>

      {/* Categories skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton 
            key={i} 
            width={80} 
            height={36} 
            style={{ borderRadius: 18, marginRight: spacing[2] }} 
          />
        ))}
      </ScrollView>

      {/* Featured skeleton */}
      <View style={styles.featuredSection}>
        <Skeleton width={100} height={12} style={{ marginBottom: spacing[3] }} />
        <SkeletonFeaturedCard />
      </View>

      {/* Grid skeleton */}
      <View style={styles.storiesSection}>
        <Skeleton width={80} height={12} style={{ marginBottom: spacing[3] }} />
        <View style={styles.storiesGrid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStoryCard key={i} />
          ))}
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <AmbientBackground variant="evening" />

      {/* Offline indicator */}
      <OfflineBanner variant="floating" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accentPrimary}
              colors={[colors.accentPrimary]}
            />
          }
        >
          {isLoading ? (
            renderSkeletons()
          ) : (
            <>
              {/* Header */}
              <Animated.View
                entering={reduceMotion ? undefined : FadeIn.duration(400)}
                style={styles.header}
              >
                <Text variant="displaySmall" color="ink">
                  Sleep Stories
                </Text>
                <Text variant="bodyMedium" color="inkMuted" style={{ marginTop: spacing[2] }}>
                  Drift off with calming tales and soundscapes
                </Text>
              </Animated.View>

              {/* Categories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {STORY_CATEGORIES.map((category, index) => (
                  <Animated.View
                    key={category.id}
                    entering={reduceMotion ? undefined : FadeInRight.delay(index * 50).duration(300)}
                  >
                <CategoryPill
                  category={category}
                  isActive={selectedCategory === category.id}
                  onPress={() => setSelectedCategory(category.id as StoryCategory | 'all')}
                />
              </Animated.View>
            ))}
          </ScrollView>

          {/* Featured Story */}
          {selectedCategory === 'all' && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.delay(150).duration(400)}
              style={styles.featuredSection}
            >
              <Text variant="labelMedium" color="inkMuted" style={styles.sectionLabel}>
                TONIGHT'S PICK
              </Text>
              <FeaturedStoryCard
                story={featuredStory}
                onPress={() => handleStoryPress(featuredStory)}
              />
            </Animated.View>
          )}

          {/* Stories Grid */}
          <View style={styles.storiesSection}>
            <Text variant="labelMedium" color="inkMuted" style={styles.sectionLabel}>
              {selectedCategory === 'all' ? 'ALL STORIES' : selectedCategory.toUpperCase()}
            </Text>
            
            {filteredStories.length > 0 ? (
              <View style={styles.storiesGrid}>
                {filteredStories.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    index={index}
                    onPress={() => handleStoryPress(story)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="reset"
                title="No stories found"
                description="Try selecting a different category"
              />
            )}
          </View>

          {/* Free stories callout for non-premium */}
          {!isPremium && (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}
              style={styles.upgradeSection}
            >
              <GlassCard variant="hero" glow="warm" padding="lg">
                <View style={styles.upgradeContent}>
                  <Text variant="headlineSmall" color="ink">
                    Unlock All Stories
                  </Text>
                  <Text variant="bodySmall" color="inkMuted" style={{ marginTop: spacing[2] }}>
                    Get access to 20+ premium sleep stories, 8-hour soundscapes, and new stories every month.
                  </Text>
                  <Pressable
                    style={[styles.upgradeButton, { backgroundColor: colors.accentPrimary }]}
                    onPress={() => navigation.navigate('Paywall', { feature: 'stories' })}
                  >
                    <Text variant="labelMedium" style={{ color: colors.inkInverse }}>
                      Upgrade to Premium
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            </Animated.View>
          )}
            </>
          )}
        </TabSafeScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[12],
  },
  header: {
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  categoriesContainer: {
    paddingVertical: spacing[2],
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  categoryIcon: {
    fontSize: 14,
  },
  featuredSection: {
    marginBottom: spacing[8],
  },
  sectionLabel: {
    marginBottom: spacing[3],
    letterSpacing: 1,
  },
  featuredCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featuredImageContainer: {
    width: FEATURED_CARD_WIDTH,
    height: 200,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  featuredContent: {
    position: 'absolute',
    left: spacing[5],
    right: spacing[5],
    bottom: spacing[5],
  },
  durationBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  lockBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storiesSection: {
    marginBottom: spacing[6],
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  storyCard: {
    width: STORY_CARD_WIDTH,
  },
  storyCardInner: {
    overflow: 'hidden',
  },
  storyArtworkContainer: {
    position: 'relative',
  },
  storyArtwork: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLockBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInfo: {
    padding: spacing[3],
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upgradeSection: {
    marginTop: spacing[4],
  },
  upgradeContent: {
    alignItems: 'center',
  },
  upgradeButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
});
