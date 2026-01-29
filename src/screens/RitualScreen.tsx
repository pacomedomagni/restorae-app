/**
 * RitualScreen - Premium Daily Rituals
 * 
 * Enhanced design with:
 * - Visual progress ring
 * - Quick-start action for each ritual
 * - Streak indicator
 * - Time-aware suggestions
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { 
  FadeIn, 
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, TabSafeScrollView, OfflineBanner } from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { RootStackParamList } from '../types';

interface Ritual {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  duration: string;
  steps: string[];
  completed: boolean;
  route: keyof RootStackParamList;
}

const RITUALS: Ritual[] = [
  { 
    id: 'morning', 
    title: 'Morning Rise', 
    subtitle: 'Start with intention',
    emoji: '🌅',
    duration: '5 min',
    steps: ['Gratitude', 'Breathwork', 'Set Intention'],
    completed: false,
    route: 'MorningRitual',
  },
  { 
    id: 'midday', 
    title: 'Midday Reset', 
    subtitle: 'Pause and recenter',
    emoji: '☀️',
    duration: '3 min',
    steps: ['Pause', 'Body Scan', 'Refocus'],
    completed: false,
    route: 'QuickReset',
  },
  { 
    id: 'evening', 
    title: 'Evening Unwind', 
    subtitle: 'Release the day',
    emoji: '🌙',
    duration: '7 min',
    steps: ['Reflect', 'Release', 'Rest'],
    completed: false,
    route: 'EveningRitual',
  },
];

// =============================================================================
// PROGRESS RING COMPONENT
// =============================================================================
function ProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
  const { colors } = useTheme();
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={withAlpha(colors.ink, 0.08)}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.accentPrimary}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// =============================================================================
// RITUAL CARD COMPONENT
// =============================================================================
interface RitualCardProps {
  ritual: Ritual;
  index: number;
  onToggle: () => void;
  onStart: () => void;
}

function RitualCard({ ritual, index, onToggle, onStart }: RitualCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, selectionLight } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handleStart = async () => {
    await impactLight();
    onStart();
  };

  const handleToggle = async () => {
    await selectionLight();
    onToggle();
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
    >
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={animatedStyle}>
          <GlassCard
            variant={ritual.completed ? 'elevated' : 'default'}
            padding="lg"
            glow={ritual.completed ? 'primary' : undefined}
          >
            <View style={styles.ritualContent}>
              {/* Left: Emoji + Info */}
              <View style={styles.ritualLeft}>
                <View style={[styles.ritualEmoji, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
                  <Text style={{ fontSize: 24 }}>{ritual.emoji}</Text>
                </View>
                <View style={styles.ritualInfo}>
                  <Text
                    variant="headlineSmall"
                    color={ritual.completed ? 'inkMuted' : 'ink'}
                    style={ritual.completed ? styles.completed : undefined}
                  >
                    {ritual.title}
                  </Text>
                  <Text variant="bodySmall" color="inkMuted">
                    {ritual.subtitle} • {ritual.duration}
                  </Text>
                </View>
              </View>

              {/* Right: Checkbox or Start button */}
              {ritual.completed ? (
                <Pressable onPress={handleToggle} hitSlop={12}>
                  <View style={[styles.checkboxChecked, { borderColor: colors.accentPrimary, backgroundColor: withAlpha(colors.accentPrimary, 0.15) }]}>
                    <Text style={{ color: colors.accentPrimary, fontSize: 14, fontWeight: '600' }}>✓</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleStart}
                  style={[styles.startButton, { backgroundColor: colors.accentPrimary }]}
                >
                  <Text variant="labelMedium" style={{ color: colors.inkInverse }}>Start</Text>
                </Pressable>
              )}
            </View>

            {/* Steps Row */}
            <View style={styles.stepsRow}>
              {ritual.steps.map((step, i) => (
                <View key={i} style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: ritual.completed ? colors.accentPrimary : withAlpha(colors.ink, 0.2) }]} />
                  <Text variant="labelSmall" color={ritual.completed ? 'inkMuted' : 'inkFaint'}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function RitualScreen() {
  const { colors, reduceMotion } = useTheme();
  const { notificationSuccess } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rituals, setRituals] = useState(RITUALS);

  const completedCount = rituals.filter(r => r.completed).length;
  const progress = completedCount / rituals.length;

  // Get time-aware suggestion
  const getTimeSuggestion = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'morning';
    if (hour < 15) return 'midday';
    return 'evening';
  };
  const suggestedRitual = getTimeSuggestion();

  const toggleRitual = (id: string) => {
    setRituals(prev => prev.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const handleStartRitual = async (ritual: Ritual) => {
    await notificationSuccess();
    navigation.navigate(ritual.route as any);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="morning" intensity="subtle" />
      
      {/* Offline indicator */}
      <OfflineBanner variant="floating" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
        >
          {/* Header with Progress Ring */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(600)}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text variant="displaySmall" color="ink">
                  Daily Rituals
                </Text>
                <Text variant="bodyMedium" color="inkMuted" style={{ marginTop: spacing[1] }}>
                  {completedCount === rituals.length
                    ? 'All rituals complete! 🎉'
                    : `${completedCount} of ${rituals.length} completed`}
                </Text>
              </View>
              <View style={styles.progressRingContainer}>
                <ProgressRing progress={progress} size={64} />
                <View style={styles.progressText}>
                  <Text variant="headlineSmall" color="ink">{completedCount}</Text>
                  <Text variant="labelSmall" color="inkFaint">/{rituals.length}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Ritual Cards */}
          <View style={styles.ritualsContainer}>
            {rituals.map((ritual, index) => (
              <View key={ritual.id}>
                {ritual.id === suggestedRitual && !ritual.completed && (
                  <Animated.View
                    entering={reduceMotion ? undefined : FadeIn.delay(50).duration(300)}
                    style={styles.suggestedBadge}
                  >
                    <Text variant="labelSmall" style={{ color: colors.accentWarm }}>
                      ✨ Suggested for now
                    </Text>
                  </Animated.View>
                )}
                <RitualCard
                  ritual={ritual}
                  index={index}
                  onToggle={() => toggleRitual(ritual.id)}
                  onStart={() => handleStartRitual(ritual)}
                />
              </View>
            ))}
          </View>

          {/* Create Custom Button */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(350).duration(400)}
            style={styles.createButtonContainer}
          >
            <Pressable
              onPress={() => navigation.navigate('CreateRitual')}
              style={[styles.createButton, { borderColor: withAlpha(colors.border, 0.5) }]}
            >
              <LuxeIcon name="breathe" size={20} color={colors.inkMuted} />
              <Text variant="bodyMedium" color="inkMuted" style={{ marginLeft: spacing[2] }}>
                Create Custom Ritual
              </Text>
            </Pressable>
          </Animated.View>
        </TabSafeScrollView>
      </SafeAreaView>
    </View>
  );
}

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
  },
  // Header
  header: {
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  // Rituals
  ritualsContainer: {
    gap: spacing[4],
  },
  suggestedBadge: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  // Ritual Card
  ritualContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ritualLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ritualEmoji: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualInfo: {
    marginLeft: spacing[3],
    flex: 1,
  },
  completed: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkboxChecked: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  stepsRow: {
    flexDirection: 'row',
    marginTop: spacing[4],
    gap: spacing[4],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Create button
  createButtonContainer: {
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
