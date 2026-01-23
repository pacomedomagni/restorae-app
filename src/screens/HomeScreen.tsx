/**
 * HomeScreen
 * 
 * Main home experience with mood selection, quick actions,
 * and personalized greetings based on time of day.
 * 
 * UX Improvements:
 * - Progressive disclosure for mood selection (4 primary + expand)
 * - Improved visual hierarchy (mood selection more prominent)
 * - Reduced cognitive load for anxious users
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  Easing,
  Layout,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  MoodOrb,
  Button,
  ScreenHeader,
  TabSafeScrollView,
  SOSFloatingButton,
} from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList, MoodType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES & DATA
// =============================================================================
interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: 'breathe' | 'ground' | 'journal' | 'focus';
  duration: string;
  tone: 'primary' | 'warm' | 'calm';
  route: keyof RootStackParamList;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'breathe',
    label: 'Breathe',
    sublabel: 'Find calm',
    icon: 'breathe',
    duration: '3 min',
    tone: 'primary',
    route: 'QuickReset',
  },
  {
    id: 'ground',
    label: 'Ground',
    sublabel: 'Be present',
    icon: 'ground',
    duration: '4 min',
    tone: 'warm',
    route: 'Grounding',
  },
  {
    id: 'journal',
    label: 'Reflect',
    sublabel: 'Write freely',
    icon: 'journal',
    duration: '5 min',
    tone: 'calm',
    route: 'Journal',
  },
];

// Primary moods shown initially (reduced cognitive load for anxious users)
const PRIMARY_MOODS: { id: MoodType; label: string }[] = [
  { id: 'good', label: 'Good' },
  { id: 'calm', label: 'Calm' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'low', label: 'Low' },
];

// Secondary moods revealed on expansion
const SECONDARY_MOODS: { id: MoodType; label: string }[] = [
  { id: 'energized', label: 'Energized' },
  { id: 'tough', label: 'Tough' },
];

// All moods combined for reference
const ALL_MOODS: { id: MoodType; label: string }[] = [
  ...PRIMARY_MOODS,
  ...SECONDARY_MOODS,
];

// =============================================================================
// QUICK ACTION CARD
// =============================================================================
interface QuickActionCardProps {
  action: QuickAction;
  index: number;
  onPress: () => void;
}

function QuickActionCard({ action, index, onPress }: QuickActionCardProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();

  const toneColor =
    action.tone === 'warm'
      ? colors.accentWarm
      : action.tone === 'calm'
      ? colors.accentCalm
      : colors.accentPrimary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInUp.delay(200 + index * 50)
              .duration(350)
              .easing(Easing.out(Easing.ease))
      }
      style={styles.quickActionWrapper}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${action.label}, ${action.sublabel}, ${action.duration}`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard variant="elevated" padding="md" glow={action.tone}>
            <View style={styles.quickActionContent}>
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: withAlpha(toneColor, 0.15) },
                ]}
              >
                <LuxeIcon name={action.icon} size={24} color={toneColor} />
              </View>
              <Text variant="headlineSmall" color="ink" style={styles.quickActionLabel}>
                {action.label}
              </Text>
              <Text variant="bodySmall" color="inkMuted">
                {action.sublabel}
              </Text>
              <View style={styles.quickActionMeta}>
                <Text variant="labelSmall" style={{ color: toneColor }}>
                  {action.duration}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// HOME SCREEN
// =============================================================================
export function HomeScreen() {
  const { colors, isDark, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium, impactLight } = useHaptics();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllMoods, setShowAllMoods] = useState(false);

  // Load user preferences
  const loadUserData = useCallback(async () => {
    const name = await AsyncStorage.getItem('@restorae/user_name');
    if (name) setUserName(name);
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await impactLight();
    await loadUserData();
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  // Time-based greeting
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Time-based background variant
  const getBackgroundVariant = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning' as const;
    if (hour < 17) return 'calm' as const;
    return 'evening' as const;
  }, []);

  const handleMoodSelect = async (mood: MoodType) => {
    await impactMedium();
    setSelectedMood(mood);
    
    // Brief visual confirmation before navigation (user can see selection)
    await AsyncStorage.setItem('@restorae/last_mood', mood);
    // Allow user to see their selection before navigating
    setTimeout(() => {
      navigation.navigate('MoodCheckin', { mood });
    }, 400);
  };

  const handleToggleShowAllMoods = async () => {
    await impactLight();
    setShowAllMoods(!showAllMoods);
  };

  const handleQuickAction = (route: keyof RootStackParamList) => {
    navigation.navigate(route as any);
  };

  const handleStartRitual = async () => {
    await impactMedium();
    const hour = new Date().getHours();
    if (hour < 17) {
      navigation.navigate('MorningRitual');
    } else {
      navigation.navigate('EveningRitual');
    }
  };

  const handleSos = async () => {
    await impactMedium();
    navigation.navigate('SOSSelect');
  };

  // Moods to display based on expansion state
  const visibleMoods = showAllMoods ? ALL_MOODS : PRIMARY_MOODS;

  return (
    <View style={styles.container}>
      {/* Living ambient background */}
      <AmbientBackground variant={getBackgroundVariant()} intensity="normal" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {/* Header - Reduced size for better hierarchy */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(500)}
            style={styles.header}
          >
            <View style={styles.greetingRow}>
              <View>
                <Text variant="labelSmall" color="inkFaint" style={styles.eyebrow}>
                  RESTORAE
                </Text>
                <Text variant="headlineLarge" color="ink">
                  {getGreeting()}
                  {userName ? `, ${userName}` : ''}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Mood Selection - PRIMARY FOCUS */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(100).duration(400).easing(Easing.out(Easing.ease))
            }
            style={styles.moodSection}
          >
            <GlassCard variant="hero" padding="lg">
              <Text variant="headlineMedium" color="ink" style={styles.moodPrompt}>
                How are you feeling?
              </Text>
              <Text variant="bodyMedium" color="inkMuted" style={styles.moodSubtitle}>
                Take a moment to check in with yourself
              </Text>

              <Animated.View 
                style={styles.moodGrid}
                layout={reduceMotion ? undefined : Layout.springify()}
              >
                {visibleMoods.map((mood, index) => (
                  <MoodOrb
                    key={mood.id}
                    mood={mood.id}
                    label={mood.label}
                    size="md"
                    selected={selectedMood === mood.id}
                    onPress={() => handleMoodSelect(mood.id)}
                    delay={300 + index * 80}
                  />
                ))}
              </Animated.View>

              {/* Expand/Collapse button */}
              <Pressable
                onPress={handleToggleShowAllMoods}
                style={styles.expandButton}
                accessibilityRole="button"
                accessibilityLabel={showAllMoods ? 'Show fewer mood options' : 'Show more mood options'}
              >
                <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
                  {showAllMoods ? 'Show less' : 'More options'}
                </Text>
                <Icon 
                  name={showAllMoods ? 'chevronUp' : 'chevronDown'} 
                  size={16} 
                  color={colors.accentPrimary}
                />
              </Pressable>
            </GlassCard>
          </Animated.View>

          {/* Daily Ritual Card */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(250).duration(350).easing(Easing.out(Easing.ease))
            }
          >
            <GlassCard variant="elevated" padding="lg" glow="warm">
              <View style={styles.ritualHeader}>
                <View>
                  <Text variant="labelSmall" color="inkFaint">
                    TODAY'S RITUAL
                  </Text>
                  <Text variant="headlineMedium" color="ink" style={styles.ritualTitle}>
                    {new Date().getHours() < 17 ? 'Morning Reset' : 'Evening Wind-Down'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ritualBadge,
                    { backgroundColor: withAlpha(colors.accentPrimary, 0.15) },
                  ]}
                >
                  <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
                    6 min
                  </Text>
                </View>
              </View>
              
              <Text variant="bodyMedium" color="inkMuted" style={styles.ritualDescription}>
                {new Date().getHours() < 17
                  ? 'A gentle sequence to set your tone for the day ahead.'
                  : 'Release the day with softness, ease, and intention.'}
              </Text>

              <Button
                variant="glow"
                size="lg"
                tone={new Date().getHours() < 17 ? 'warm' : 'calm'}
                fullWidth
                onPress={handleStartRitual}
                style={styles.ritualButton}
              >
                Begin Ritual
              </Button>
            </GlassCard>
          </Animated.View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(350).duration(300)}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                QUICK TOOLS
              </Text>
            </Animated.View>
            
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <QuickActionCard
                  key={action.id}
                  action={action}
                  index={index}
                  onPress={() => handleQuickAction(action.route)}
                />
              ))}
            </View>
          </View>
        </TabSafeScrollView>
      </SafeAreaView>

      {/* Persistent SOS FAB */}
      <SOSFloatingButton />
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
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    marginBottom: spacing[1],
    letterSpacing: 2,
  },
  moodSection: {
    marginBottom: spacing[6],
  },
  moodPrompt: {
    marginBottom: spacing[1],
  },
  moodSubtitle: {
    marginBottom: spacing[5],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[4],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[5],
    paddingVertical: spacing[2],
  },
  ritualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ritualTitle: {
    marginTop: spacing[1],
  },
  ritualBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  ritualDescription: {
    marginTop: spacing[3],
    marginBottom: spacing[5],
  },
  ritualButton: {
    marginTop: spacing[2],
  },
  quickActionsSection: {
    marginTop: spacing[6],
  },
  sectionLabel: {
    marginBottom: spacing[4],
    letterSpacing: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  quickActionWrapper: {
    flex: 1,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  quickActionLabel: {
    marginBottom: spacing[1],
  },
  quickActionMeta: {
    marginTop: spacing[2],
  },
});
