/**
 * HomeScreen
 * 
 * Main home experience with mood selection, daily ritual,
 * personalized recommendations, and gamification.
 * 
 * Premium UX Features:
 * - Streak & level display (gamification)
 * - Personalized "For You" recommendations
 * - Progressive disclosure for mood selection
 * - Session completion celebrations
 * - Time-aware greetings and content
 * - State-aware ritual card
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  Easing,
  Layout,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../hooks/useHaptics';
import { useUISounds } from '../hooks/useUISounds';
import { useTimeAwareContent } from '../hooks/useTimeAwareContent';
import { useTheme } from '../contexts/ThemeContext';
import { useCoachMarks } from '../contexts/CoachMarkContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  MoodOrb,
  Button,
  TabSafeScrollView,
  SOSFloatingButton,
  ForYouSection,
  StreakBanner,
  StreakCelebration,
  AchievementUnlock,
  LevelUp,
  SessionComplete,
  CoachMarkOverlay,
  OfflineBanner,
  ConnectionStatusIndicator,
} from '../components/ui';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList, MoodType } from '../types';
import { gamification, Achievement, UserLevel } from '../services/gamification';
import { recommendations } from '../services/smartRecommendations';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { SessionRecoveryModal } from '../components/session';

// =============================================================================
// TYPES & DATA
// =============================================================================

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
// HOME SCREEN
// =============================================================================
export function HomeScreen() {
  const { colors, isDark, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium, impactLight, notificationSuccess } = useHaptics();
  const { playTap, playSuccess, playTransition } = useUISounds();
  const { shouldShowCoachMark, markAsShown } = useCoachMarks();

  // Session recovery hook
  const {
    showRecoveryModal,
    persistedSession,
    handleContinue: handleSessionContinue,
    handleDiscard: handleSessionDiscard,
  } = useSessionRecovery();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllMoods, setShowAllMoods] = useState(false);
  const [ritualCompletedToday, setRitualCompletedToday] = useState(false);

  // Coach mark states
  const [showForYouCoachMark, setShowForYouCoachMark] = useState(false);
  const [showMoodCoachMark, setShowMoodCoachMark] = useState(false);

  // Celebration states
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState<UserLevel | null>(null);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);

  // Load user preferences and ritual status
  const loadUserData = useCallback(async () => {
    const name = await AsyncStorage.getItem('@restorae/user_name');
    if (name) setUserName(name);
    
    // Check if ritual was completed today
    const lastRitualDate = await AsyncStorage.getItem('@restorae/last_ritual_date');
    const today = new Date().toDateString();
    setRitualCompletedToday(lastRitualDate === today);
  }, []);

  // Check for pending celebrations when screen focuses
  useFocusEffect(
    useCallback(() => {
      const checkPendingCelebrations = async () => {
        const pendingStreak = await AsyncStorage.getItem('@restorae:pending_streak_celebration');
        const pendingAchievement = await AsyncStorage.getItem('@restorae:pending_achievement');
        const pendingLevelUp = await AsyncStorage.getItem('@restorae:pending_levelup');
        const pendingSessionXP = await AsyncStorage.getItem('@restorae:pending_session_xp');

        // Show streak celebration
        if (pendingStreak) {
          const streakDays = parseInt(pendingStreak, 10);
          if (streakDays > 0 && [3, 7, 14, 30, 60, 100, 365].includes(streakDays)) {
            setCelebrationStreak(streakDays);
            setShowStreakCelebration(true);
            await notificationSuccess();
          }
          await AsyncStorage.removeItem('@restorae:pending_streak_celebration');
        }

        // Show achievement unlock
        if (pendingAchievement) {
          const achievement = JSON.parse(pendingAchievement) as Achievement;
          setUnlockedAchievement(achievement);
          setShowAchievement(true);
          await notificationSuccess();
          await AsyncStorage.removeItem('@restorae:pending_achievement');
        }

        // Show level up
        if (pendingLevelUp) {
          const level = JSON.parse(pendingLevelUp) as UserLevel;
          setNewLevel(level);
          setShowLevelUp(true);
          await notificationSuccess();
          await AsyncStorage.removeItem('@restorae:pending_levelup');
        }

        // Show session complete
        if (pendingSessionXP) {
          const xp = parseInt(pendingSessionXP, 10);
          if (xp > 0) {
            setSessionXP(xp);
            setShowSessionComplete(true);
          }
          await AsyncStorage.removeItem('@restorae:pending_session_xp');
        }
      };

      checkPendingCelebrations();
    }, [])
  );

  useEffect(() => {
    loadUserData();
    // Initialize services
    gamification.initialize();
    recommendations.initialize();

    // Check for coach marks after brief delay to let screen render
    const timer = setTimeout(() => {
      if (shouldShowCoachMark('home_mood_select')) {
        setShowMoodCoachMark(true);
      } else if (shouldShowCoachMark('home_for_you')) {
        setShowForYouCoachMark(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [loadUserData, shouldShowCoachMark]);

  // Use time-aware content for personalization
  const timeContent = useTimeAwareContent(userName);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await impactLight();
    await loadUserData();
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const handleMoodSelect = async (mood: MoodType) => {
    await impactMedium();
    playTap();
    setSelectedMood(mood);
    
    // Record mood for personalization learning
    recommendations.recordMood(mood);
    
    // Brief visual confirmation before navigation (user can see selection)
    await AsyncStorage.setItem('@restorae/last_mood', mood);
    // Allow user to see their selection before navigating
    playTransition();
    setTimeout(() => {
      navigation.navigate('MoodCheckin', { mood });
    }, 400);
  };

  const handleToggleShowAllMoods = async () => {
    await impactLight();
    playTap();
    setShowAllMoods(!showAllMoods);
  };

  const handleStartRitual = async () => {
    await impactMedium();
    playSuccess();
    // Mark ritual as started (completion will be tracked by the ritual screen)
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

  // Handle celebration dismissals
  const handleStreakCelebrationDismiss = () => {
    setShowStreakCelebration(false);
    setCelebrationStreak(0);
  };

  const handleAchievementDismiss = () => {
    setShowAchievement(false);
    setUnlockedAchievement(null);
  };

  const handleLevelUpDismiss = () => {
    setShowLevelUp(false);
    setNewLevel(null);
  };

  const handleSessionCompleteDismiss = () => {
    setShowSessionComplete(false);
    setSessionXP(0);
  };

  // Moods to display based on expansion state
  const visibleMoods = showAllMoods ? ALL_MOODS : PRIMARY_MOODS;

  return (
    <View style={styles.container}>
      {/* Living ambient background */}
      <AmbientBackground variant={timeContent.backgroundVariant} intensity="normal" />

      {/* Offline indicator */}
      <OfflineBanner variant="floating" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {/* Header - Clean with subtle branding */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(500)}
            style={styles.header}
          >
            <View style={styles.greetingRow}>
              <View style={styles.greetingContent}>
                <View style={styles.greetingTitleRow}>
                  <Text variant="headlineLarge" color="ink">
                    {timeContent.greeting}
                  </Text>
                  <ConnectionStatusIndicator variant="dot" size="sm" />
                </View>
                <Text variant="bodySmall" color="inkMuted" style={{ marginTop: 2 }}>
                  {timeContent.message.subheadline}
                </Text>
              </View>
              <Logo size="small" />
            </View>
          </Animated.View>

          {/* Streak & Level Banner */}
          <View style={styles.streakBannerContainer}>
            <StreakBanner />
          </View>

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

          {/* Daily Ritual Card - State aware */}
          {!ritualCompletedToday && (
            <Animated.View
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(200).duration(350).easing(Easing.out(Easing.ease))
              }
              style={styles.ritualSection}
            >
              <GlassCard variant="elevated" padding="md" glow="warm">
                <Pressable
                  onPress={handleStartRitual}
                  style={styles.ritualContent}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${new Date().getHours() < 17 ? 'morning' : 'evening'} ritual, 6 minutes`}
                >
                  <View style={styles.ritualInfo}>
                    <Text variant="labelSmall" color="inkFaint">
                      {new Date().getHours() < 17 ? 'MORNING' : 'EVENING'} RITUAL
                    </Text>
                    <Text variant="headlineSmall" color="ink" style={styles.ritualTitle}>
                      {new Date().getHours() < 17 ? 'Start Your Day Calm' : 'Wind Down Gently'}
                    </Text>
                  </View>
                  <View style={styles.ritualAction}>
                    <View
                      style={[
                        styles.ritualBadge,
                        { backgroundColor: withAlpha(colors.accentWarm, 0.15) },
                      ]}
                    >
                      <Text variant="labelSmall" style={{ color: colors.accentWarm }}>
                        6 min
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
                  </View>
                </Pressable>
              </GlassCard>
            </Animated.View>
          )}

          {/* Personalized For You Section */}
          <ForYouSection currentMood={selectedMood ?? undefined} userName={userName} />
        </TabSafeScrollView>
      </SafeAreaView>

      {/* Persistent SOS FAB */}
      <SOSFloatingButton />

      {/* Celebration Overlays */}
      <StreakCelebration
        visible={showStreakCelebration}
        streakCount={celebrationStreak}
        onClose={handleStreakCelebrationDismiss}
      />
      
      {unlockedAchievement && (
        <AchievementUnlock
          visible={showAchievement}
          achievement={unlockedAchievement}
          onClose={handleAchievementDismiss}
        />
      )}
      
      {newLevel && (
        <LevelUp
          visible={showLevelUp}
          newLevel={newLevel}
          onClose={handleLevelUpDismiss}
        />
      )}
      
      <SessionComplete
        visible={showSessionComplete}
        sessionType="general"
        duration={0}
        xpEarned={sessionXP}
        streakDay={gamification.getStreak().currentStreak}
        onClose={handleSessionCompleteDismiss}
      />

      {/* Coach Mark Overlays - First-time user guidance */}
      {showMoodCoachMark && (
        <CoachMarkOverlay
          markId="home_mood_select"
          visible={showMoodCoachMark}
          onDismiss={() => {
            markAsShown('home_mood_select');
            setShowMoodCoachMark(false);
            // Chain to next coach mark
            setTimeout(() => {
              if (shouldShowCoachMark('home_for_you')) {
                setShowForYouCoachMark(true);
              }
            }, 500);
          }}
        />
      )}

      {showForYouCoachMark && (
        <CoachMarkOverlay
          markId="home_for_you"
          visible={showForYouCoachMark}
          onDismiss={() => {
            markAsShown('home_for_you');
            setShowForYouCoachMark(false);
          }}
        />
      )}

      {/* Session Recovery Modal */}
      <SessionRecoveryModal
        visible={showRecoveryModal}
        persistedSession={persistedSession}
        onContinue={handleSessionContinue}
        onDiscard={handleSessionDiscard}
      />
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
    paddingBottom: spacing[6],
  },
  header: {
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContent: {
    flex: 1,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  streakBannerContainer: {
    marginBottom: spacing[4],
  },
  moodSection: {
    marginBottom: spacing[4],
  },
  moodPrompt: {
    marginBottom: spacing[1],
  },
  moodSubtitle: {
    marginBottom: spacing[4],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[3],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[4],
    paddingVertical: spacing[2],
  },
  ritualSection: {
    marginBottom: spacing[4],
  },
  ritualContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ritualInfo: {
    flex: 1,
  },
  ritualTitle: {
    marginTop: spacing[1],
  },
  ritualAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  ritualBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
});
