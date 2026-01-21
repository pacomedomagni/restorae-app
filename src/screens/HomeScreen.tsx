/**
 * HomeScreen
 * 
 * Main home experience with mood selection, quick actions,
 * and personalized greetings based on time of day.
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
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
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  MoodOrb,
  PremiumButton,
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

const MOODS: { id: MoodType; label: string }[] = [
  { id: 'energized', label: 'Energized' },
  { id: 'calm', label: 'Calm' },
  { id: 'good', label: 'Good' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'low', label: 'Low' },
  { id: 'tough', label: 'Tough' },
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

  // Load user preferences
  useEffect(() => {
    AsyncStorage.getItem('@restorae/user_name').then((name) => {
      if (name) setUserName(name);
    });
  }, []);

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
    
    // Save and navigate after a brief moment
    await AsyncStorage.setItem('@restorae/last_mood', mood);
    setTimeout(() => {
      navigation.navigate('MoodResult', { mood });
    }, 300);
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

  return (
    <View style={styles.container}>
      {/* Living ambient background */}
      <AmbientBackground variant={getBackgroundVariant()} intensity="normal" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Header */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(500)}
            style={styles.header}
          >
            <View style={styles.greetingRow}>
              <View>
                <Text variant="labelSmall" color="inkFaint" style={styles.eyebrow}>
                  RESTORAE
                </Text>
                <Text variant="displayMedium" color="ink">
                  {getGreeting()}
                  {userName ? `, ${userName}` : ''}
                </Text>
              </View>
              
              {/* SOS Button */}
              <Pressable
                onPress={handleSos}
                accessibilityRole="button"
                accessibilityLabel="SOS - Emergency relief tools"
                accessibilityHint="Open quick relief exercises for immediate support"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.sosButton,
                  {
                    backgroundColor: withAlpha(colors.accentWarm, pressed ? 0.2 : 0.12),
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <LuxeIcon name="sos" size={20} color={colors.accentWarm} />
              </Pressable>
            </View>
            
            <Text variant="bodyLarge" color="inkMuted" style={styles.subtitle}>>
              How are you feeling right now?
            </Text>
          </Animated.View>

          {/* Mood Selection - Direct on Home */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(100).duration(400).easing(Easing.out(Easing.ease))
            }
            style={styles.moodSection}
          >
            <View style={styles.moodGrid}>
              {MOODS.map((mood, index) => (
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
            </View>
          </Animated.View>

          {/* Daily Ritual Card */}
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.delay(250).duration(350).easing(Easing.out(Easing.ease))
            }
          >
            <GlassCard variant="hero" padding="lg" glow="warm">
              <View style={styles.ritualHeader}>
                <View>
                  <Text variant="labelSmall" color="inkFaint">
                    TODAY'S RITUAL
                  </Text>
                  <Text variant="headlineLarge" color="ink" style={styles.ritualTitle}>
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

              <PremiumButton
                variant="glow"
                size="lg"
                tone={new Date().getHours() < 17 ? 'warm' : 'calm'}
                fullWidth
                onPress={handleStartRitual}
                style={styles.ritualButton}
              >
                Begin Ritual
              </PremiumButton>
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

          {/* Bottom spacing for tab bar */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
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
  subtitle: {
    marginTop: spacing[3],
  },
  sosButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodSection: {
    marginBottom: spacing[8],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[4],
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
    marginTop: spacing[8],
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
