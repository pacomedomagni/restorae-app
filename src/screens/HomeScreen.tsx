/**
 * HomeScreen
 * Premium home experience following RESTORAE_SPEC.md
 * 
 * Features:
 * - Warm gradient background (morning cream to off-white)
 * - Personalized greeting with time awareness
 * - Mood selector (6 choices in a 2x3 grid)
 * - Quick reset tools (3 options max)
 * - Daily ritual card with premium feel
 * - Proper shadows, spacing, and visual hierarchy
 */
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, Button, SpaBackdrop, SpaMotif, SpaCardTexture, ScreenHeader } from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';


// =============================================================================
// MENU ROW COMPONENT
// =============================================================================
interface MenuRowProps {
  title: string;
  description: string;
  icon: 'breathe' | 'journal' | 'focus' | 'ground' | 'reset' | 'sos';
  meta: string;
  tone?: 'primary' | 'warm' | 'calm';
  onPress: () => void;
  delay: number;
}

function MenuRow({ title, description, icon, meta, tone = 'primary', onPress, delay }: MenuRowProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();
  const toneColor =
    tone === 'warm' ? colors.accentWarm : tone === 'calm' ? colors.accentCalm : colors.accentPrimary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.menuRow,
            animatedStyle,
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: withAlpha(toneColor, 0.12) }]}>
            <LuxeIcon name={icon} size={22} color={toneColor} />
          </View>
          <View style={styles.menuText}>
            <Text variant="headlineSmall" color="ink" style={styles.menuTitle}>
              {title}
            </Text>
            <Text variant="bodySmall" color="inkMuted">
              {description}
            </Text>
          </View>
          <Text variant="labelSmall" style={{ color: withAlpha(toneColor, 0.85) }}>
            {meta}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// HOME SCREEN
// =============================================================================
export function HomeScreen() {
  const { colors, gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium } = useHaptics();

  // Time-based greeting
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Determine if it's morning or evening for gradient
  const isMorning = new Date().getHours() < 17;
  const backgroundGradient = gradients.morning;

  const handleStartRitual = async () => {
    await impactMedium();
    navigation.navigate('Ritual', { type: isMorning ? 'morning' : 'evening' });
  };

  const handleMoodCheckin = () => {
    navigation.navigate('MoodCheckin');
  };

  const handleQuickReset = () => {
    navigation.navigate('QuickReset');
  };

  const handleJournal = () => {
    navigation.navigate('Journal');
  };

  const handleGrounding = () => {
    navigation.navigate('Grounding');
  };

  const handleSos = () => {
    navigation.navigate('Sos');
  };

  const menuItems = [
    {
      title: 'Mood Check-in',
      description: 'Name how you feel and get a path.',
      icon: 'journal' as const,
      meta: '2 min',
      tone: 'calm' as const,
      onPress: handleMoodCheckin,
    },
    {
      title: 'Breathwork',
      description: 'Soft patterns for calm and clarity.',
      icon: 'breathe' as const,
      meta: '3-6 min',
      tone: 'primary' as const,
      onPress: handleQuickReset,
    },
    {
      title: 'Grounding',
      description: 'Anchor your senses in the present.',
      icon: 'ground' as const,
      meta: '4 min',
      tone: 'warm' as const,
      onPress: handleGrounding,
    },
    {
      title: 'Journal',
      description: 'Gentle prompts and free writing.',
      icon: 'journal' as const,
      meta: '5 min',
      tone: 'calm' as const,
      onPress: handleJournal,
    },
    {
      title: 'SOS',
      description: 'Fast support when you need it.',
      icon: 'sos' as const,
      meta: '1 min',
      tone: 'warm' as const,
      onPress: handleSos,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              eyebrow="RESTORAE"
              title={getGreeting()}
              subtitle="A quiet sanctuary to restore and reset."
            />
          </Animated.View>

          <Card style={styles.ritualCard} elevation="hero">
            <SpaMotif />
            <SpaCardTexture />
            <Text variant="labelSmall" color="inkFaint">
              TODAY'S RITUAL
            </Text>
            <Text variant="headlineLarge" color="ink" style={styles.ritualTitle}>
              {isMorning ? 'Morning Reset' : 'Evening Wind-Down'}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.ritualText}>
              {isMorning
                ? 'A gentle sequence to set your tone for the day.'
                : 'Release the day with softness and ease.'}
            </Text>
            <View style={styles.ritualMetaRow}>
              <View style={[styles.metaPill, { backgroundColor: withAlpha(colors.accentPrimary, 0.12) }]}>
                <Text variant="labelSmall" color="accent">
                  6 min
                </Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: withAlpha(colors.accentWarm, 0.12) }]}>
                <Text variant="labelSmall" color="inkMuted">
                  Breath + Movement
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone={isMorning ? 'warm' : 'calm'}
              haptic="medium"
              onPress={handleStartRitual}
              style={styles.ritualButton}
            >
              Begin Ritual
            </Button>
          </Card>

          <View style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              WELLNESS MENU
            </Text>
            {menuItems.map((item, index) => (
              <Card key={item.title} padding="none" style={styles.menuItemCard} elevation="soft">
                <MenuRow
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  meta={item.meta}
                  onPress={item.onPress}
                  delay={300 + index * 80}
                />
              </Card>
            ))}
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: layout.tabBarHeight }} />
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
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  ritualCard: {
    marginTop: spacing[3],
    padding: spacing[6],
  },
  ritualTitle: {
    marginTop: spacing[2],
  },
  ritualText: {
    marginTop: spacing[2],
  },
  ritualMetaRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  ritualButton: {
    marginTop: spacing[5],
  },
  metaPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  section: {
    marginTop: spacing[6],
  },
  sectionLabel: {
    marginBottom: spacing[3],
  },
  menuItemCard: {
    marginBottom: spacing[3],
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    marginBottom: spacing[1],
  },
});
