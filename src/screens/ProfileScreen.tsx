/**
 * ProfileScreen
 * Premium profile & settings following RESTORAE_SPEC.md
 * 
 * Features:
 * - Stats display with proper elevation
 * - Settings sections with clean grouping
 * - Theme toggle (light/dark/system)
 * - Premium visual hierarchy
 */
import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, SpaMotif, SpaCardTexture, ScreenHeader } from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// =============================================================================
// SETTINGS ROW COMPONENT
// =============================================================================
interface SettingsRowProps {
  title: string;
  description: string;
  icon: 'home' | 'journal' | 'profile';
  meta: string;
  tone?: 'primary' | 'warm' | 'calm';
  delay: number;
  onPress: () => void;
}

function SettingsRow({ title, description, icon, meta, tone = 'primary', delay, onPress }: SettingsRowProps) {
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
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View style={[styles.settingsRow, animatedStyle]}>
          <View style={[styles.settingsIcon, { backgroundColor: withAlpha(toneColor, 0.12) }]}>
            <LuxeIcon name={icon} size={22} color={toneColor} />
          </View>
          <View style={styles.settingsText}>
            <Text variant="headlineSmall" color="ink" style={styles.settingsTitle}>
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
// PROFILE SCREEN
// =============================================================================
export function ProfileScreen() {
  const { colors, gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const stats = [
    { label: 'Sessions', value: '47' },
    { label: 'Streak', value: '12' },
    { label: 'Minutes', value: '234' },
  ];

  const settingsCards = [
    {
      title: 'Preferences',
      description: 'Appearance, sounds, and reminders.',
      icon: 'home' as const,
      meta: 'Edit',
      tone: 'primary' as const,
      onPress: () => navigation.navigate('Preferences'),
    },
    {
      title: 'Privacy',
      description: 'App lock, export, and data tools.',
      icon: 'journal' as const,
      meta: 'Manage',
      tone: 'warm' as const,
      onPress: () => navigation.navigate('Privacy'),
    },
    {
      title: 'Support',
      description: 'Help, feedback, and about.',
      icon: 'profile' as const,
      meta: 'Help',
      tone: 'calm' as const,
      onPress: () => navigation.navigate('Support'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={gradients.evening}
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
              eyebrow="YOUR SPACE"
              title="Profile"
              subtitle="Track your rhythm and refine your rituals"
            />
          </Animated.View>

          {/* Stats Row */}
          <Card style={styles.statsCard} elevation="hero">
            <SpaMotif />
            <SpaCardTexture />
            <Text variant="labelSmall" color="inkFaint">
              THIS WEEK
            </Text>
            <Text variant="headlineLarge" color="ink" style={styles.statsTitle}>
              Your restorative rhythm
            </Text>
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View
                  key={stat.label}
                  style={[
                    styles.statItem,
                    index === stats.length - 1 ? null : [styles.statDivider, { borderRightColor: withAlpha(colors.borderMuted, 0.8) }],
                  ]}
                >
                  <Text variant="displaySmall" color="accent">
                    {stat.value}
                  </Text>
                  <Text variant="labelSmall" color="inkMuted" style={styles.statLabel}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.settingsList}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              SETTINGS
            </Text>
            {settingsCards.map((card, index) => (
              <Card key={card.title} padding="none" style={styles.settingsItemCard} elevation="soft">
                <SettingsRow
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  meta={card.meta}
                  delay={250 + index * 120}
                  onPress={card.onPress}
                />
              </Card>
            ))}
          </View>

          {/* App Version */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(600).duration(400)}
            style={styles.versionContainer}
          >
            <Text variant="labelSmall" color="inkFaint">
              Restorae v1.0.0
            </Text>
          </Animated.View>

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
  header: {
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing[4],
  },
  statsCard: {
    marginBottom: spacing[6],
  },
  statsTitle: {
    marginTop: spacing[2],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  statDivider: {
    borderRightWidth: 1,
  },
  statLabel: {
    marginTop: spacing[1],
  },
  settingsList: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    marginBottom: spacing[3],
  },
  settingsItemCard: {
    marginBottom: spacing[3],
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    marginBottom: spacing[1],
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
});
