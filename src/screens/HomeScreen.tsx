/**
 * HomeScreen
 * 
 * Main home experience with mood selection, daily ritual,
 * and personalized recommendations.
 * 
 * UX Features:
 * - Emotional flow system integration
 * - Contextual, journey-aware micro-copy
 * - Mood acknowledgment before navigation
 * - Personalized "For You" recommendations
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
import { useContextualCopy } from '../hooks/useContextualCopy';
import { useTheme } from '../contexts/ThemeContext';
import { useCoachMarks } from '../contexts/CoachMarkContext';
import { useEmotionalFlow } from '../contexts/EmotionalFlowContext';
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
  CoachMarkOverlay,
  OfflineBanner,
  ConnectionStatusIndicator,
  SkeletonMoodOrb,
  SkeletonRitualCard,
} from '../components/ui';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList, MoodType } from '../types';
import { gamification } from '../services/gamification';
import { recommendations } from '../services/smartRecommendations';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { SessionRecoveryModal } from '../components/session';

// =============================================================================
// TYPES & DATA
// =============================================================================

// Simplified mood options (4 only - reduced cognitive load for anxious users)
const MOODS: { id: MoodType; label: string }[] = [
  { id: 'good', label: 'Good' },
  { id: 'calm', label: 'Calm' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'low', label: 'Low' },
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
  
  // Emotional flow system
  const { 
    setMood: setEmotionalMood, 
    acknowledgeMood,
    setFlowState,
    hasRecentSession,
    temperature,
  } = useEmotionalFlow();
  
  // Contextual copy for dynamic, journey-aware text
  const { 
    getGreeting, 
    getMoodPrompt, 
    journeySubtitle,
    needsGentleness,
  } = useContextualCopy();

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
  const [isLoading, setIsLoading] = useState(true);
  const [ritualCompletedToday, setRitualCompletedToday] = useState(false);

  // Coach mark states
  const [showForYouCoachMark, setShowForYouCoachMark] = useState(false);
  const [showMoodCoachMark, setShowMoodCoachMark] = useState(false);

  // Simplified celebration state - only streak milestones
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);

  // Load user preferences and ritual status
  const loadUserData = useCallback(async () => {
    try {
      const name = await AsyncStorage.getItem('@restorae/user_name');
      if (name) setUserName(name);
      
      // Check if ritual was completed today
      const lastRitualDate = await AsyncStorage.getItem('@restorae/last_ritual_date');
      const today = new Date().toDateString();
      setRitualCompletedToday(lastRitualDate === today);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for pending streak celebrations when screen focuses
  useFocusEffect(
    useCallback(() => {
      const checkPendingCelebrations = async () => {
        const pendingStreak = await AsyncStorage.getItem('@restorae:pending_streak_celebration');

        // Show streak celebration only for milestone days
        if (pendingStreak) {
          const streakDays = parseInt(pendingStreak, 10);
          if (streakDays > 0 && [7, 14, 30, 60, 100, 365].includes(streakDays)) {
            setCelebrationStreak(streakDays);
            setShowStreakCelebration(true);
            await notificationSuccess();
          }
          await AsyncStorage.removeItem('@restorae:pending_streak_celebration');
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
  
  // Get contextual greeting and mood prompt
  const contextualGreeting = getGreeting({ userName });
  const moodPromptText = getMoodPrompt();

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
    
    // Set mood in emotional flow system - this influences the entire app
    setEmotionalMood(mood, 'medium', 'home_checkin');
    acknowledgeMood();
    
    // Record mood for personalization learning
    recommendations.recordMood(mood);
    
    // Save last mood
    await AsyncStorage.setItem('@restorae/last_mood', mood);
    
    // Navigate to acknowledgment screen for a moment of presence
    // This creates the "breathing pause" before moving forward
    playTransition();
    setTimeout(() => {
      navigation.navigate('MoodAcknowledgment', { mood });
    }, 300);
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

  // Handle streak celebration dismissal
  const handleStreakCelebrationDismiss = () => {
    setShowStreakCelebration(false);
    setCelebrationStreak(0);
  };

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
          {/* Header - Contextual, journey-aware greeting */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(500)}
            style={styles.header}
          >
            <View style={styles.greetingRow}>
              <View style={styles.greetingContent}>
                <View style={styles.greetingTitleRow}>
                  <Text variant="headlineLarge" color="ink">
                    {contextualGreeting}
                  </Text>
                  <ConnectionStatusIndicator variant="dot" size="sm" />
                </View>
                <Text variant="bodySmall" color="inkMuted" style={{ marginTop: 2 }}>
                  {journeySubtitle}
                </Text>
              </View>
              <Logo size="small" />
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
                {moodPromptText}
              </Text>
              <Text variant="bodyMedium" color="inkMuted" style={styles.moodSubtitle}>
                {needsGentleness ? "There's no rush" : "Take a moment to check in"}
              </Text>

              {isLoading ? (
                <View style={styles.moodGrid}>
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonMoodOrb key={i} />
                  ))}
                </View>
              ) : (
                <Animated.View 
                  style={styles.moodGrid}
                  layout={reduceMotion ? undefined : Layout.springify()}
                >
                  {MOODS.map((mood, index) => (
                    <MoodOrb
                      key={mood.id}
                      mood={mood.id}
                      label={mood.label}
                      size="sm"
                      selected={selectedMood === mood.id}
                      onPress={() => handleMoodSelect(mood.id)}
                      delay={300 + index * 80}
                    />
                  ))}
                </Animated.View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Daily Ritual Card - Secondary prominence */}
          {!ritualCompletedToday && (
            <Animated.View
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(200).duration(350).easing(Easing.out(Easing.ease))
              }
              style={styles.ritualSection}
            >
              {isLoading ? (
                <SkeletonRitualCard />
              ) : (
                <GlassCard variant="default" padding="md">
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
              )}
            </Animated.View>
          )}
            </Animated.View>
          )}

          {/* Personalized For You Section */}
          <ForYouSection currentMood={selectedMood ?? undefined} userName={userName} />

          {/* Streak Banner - Below recommendations to reduce pressure */}
          <View style={styles.streakBannerContainer}>
            <StreakBanner />
          </View>
        </TabSafeScrollView>
      </SafeAreaView>

      {/* Persistent SOS FAB */}
      <SOSFloatingButton />

      {/* Simple Streak Celebration Only */}
      <StreakCelebration
        visible={showStreakCelebration}
        streakCount={celebrationStreak}
        onClose={handleStreakCelebrationDismiss}
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
    marginTop: spacing[4],
    marginBottom: spacing[2],
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
    justifyContent: 'space-evenly',
    rowGap: spacing[4],
    columnGap: spacing[6],
    paddingHorizontal: spacing[2],
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
