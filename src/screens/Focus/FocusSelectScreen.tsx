/**
 * FocusSelectScreen - Browse focus sessions by category
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../../components/ui';
import {
  FOCUS_SESSIONS,
  FOCUS_CATEGORIES,
  getSessionsByCategory,
  getSoundById,
  type FocusCategory,
  type FocusSession,
} from '../../data/focusSessions';
import { spacing, borderRadius, withAlpha, layout } from '../../theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// =============================================================================
// CATEGORY CHIPS
// =============================================================================

interface CategoryChipsProps {
  selected: FocusCategory;
  onSelect: (category: FocusCategory) => void;
}

function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const { colors } = useTheme();
  const { selectionLight } = useHaptics();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {FOCUS_CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={async () => {
              await selectionLight();
              onSelect(cat.id as FocusCategory);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: isActive
                  ? colors.accentPrimary
                  : withAlpha(colors.canvasElevated, 0.6),
              },
            ]}
          >
            <Text
              variant="labelSmall"
              style={{
                color: isActive ? colors.inkInverse : colors.ink,
              }}
            >
              {cat.icon} {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// =============================================================================
// SESSION CARD
// =============================================================================

interface SessionCardProps {
  session: FocusSession;
  index: number;
  onPress: () => void;
}

function SessionCard({ session, index, onPress }: SessionCardProps) {
  const { colors, reduceMotion } = useTheme();
  const sound = session.defaultSound ? getSoundById(session.defaultSound) : null;

  const durationLabel = session.duration === 0 ? 'Open' : `${session.duration} min`;

  const categoryIcon =
    session.category === 'work' ? 'briefcase-outline' :
    session.category === 'creative' ? 'color-palette-outline' :
    session.category === 'planning' ? 'clipboard-outline' :
    'flash-outline';

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 60).duration(400)}>
      <Pressable onPress={onPress}>
        <GlassCard variant="interactive" padding="md">
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: withAlpha(colors.accentPrimary, 0.08) }]}>
              <Ionicons name={categoryIcon as any} size={14} color={colors.accentPrimary} />
            </View>
            <View style={[styles.durationBadge, { backgroundColor: withAlpha(colors.border, 0.3) }]}>
              <Text variant="labelSmall" color="inkFaint">{durationLabel}</Text>
            </View>
          </View>

          <Text variant="headlineSmall" color="ink" style={styles.cardTitle}>
            {session.name}
          </Text>
          <Text variant="bodySmall" color="inkMuted" numberOfLines={2}>
            {session.description}
          </Text>

          {sound && (
            <View style={styles.soundRow}>
              <Text style={styles.soundIcon}>{sound.icon}</Text>
              <Text variant="labelSmall" color="inkFaint">{sound.name}</Text>
            </View>
          )}
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// FOCUS SELECT SCREEN
// =============================================================================

export function FocusSelectScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { selectionLight } = useHaptics();
  const [category, setCategory] = useState<FocusCategory>('all');

  const sessions = useMemo(() => getSessionsByCategory(category), [category]);

  const handleSessionPress = async (session: FocusSession) => {
    await selectionLight();
    navigation.navigate('FocusSession' as any, { sessionId: session.id });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="focus" intensity="subtle" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Focus"
              subtitle="Choose your session"
              compact
            />
          </Animated.View>

          <CategoryChips selected={category} onSelect={setCategory} />

          {sessions.map((session, index) => (
            <SessionCard
              key={session.id}
              session={session}
              index={index}
              onPress={() => handleSessionPress(session)}
            />
          ))}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[4],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  cardTitle: {
    marginBottom: spacing[1],
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[1],
  },
  soundIcon: {
    fontSize: 14,
  },
});

export default FocusSelectScreen;
