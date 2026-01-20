/**
 * JournalEntriesScreen - Consistent UI
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import type { RootStackParamList } from '../types';

const SAMPLE_ENTRIES = [
  {
    id: '1',
    title: 'Morning Reflections',
    preview: 'Today I woke up feeling grateful for...',
    date: 'Today, 8:30 AM',
    mood: '😌',
  },
  {
    id: '2',
    title: 'Afternoon Thoughts',
    preview: 'Had a challenging meeting but I handled it by...',
    date: 'Yesterday, 2:15 PM',
    mood: '💪',
  },
  {
    id: '3',
    title: 'Evening Wind Down',
    preview: 'Three things I am thankful for today...',
    date: 'Dec 12, 9:00 PM',
    mood: '🙏',
  },
];

export function JournalEntriesScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Journal Entries"
              subtitle={`${SAMPLE_ENTRIES.length} entries`}
              compact
            />
          </Animated.View>

          {SAMPLE_ENTRIES.map((entry, index) => (
            <Animated.View 
              key={entry.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 100).duration(400)}
            >
              <Pressable onPress={() => {}}>
                <GlassCard variant="interactive" padding="lg">
                  <View style={styles.entryHeader}>
                    <Text variant="headlineSmall" color="ink">{entry.title}</Text>
                    <Text style={styles.mood}>{entry.mood}</Text>
                  </View>
                  <Text variant="bodyMedium" color="inkMuted" numberOfLines={2} style={styles.preview}>
                    {entry.preview}
                  </Text>
                  <Text variant="labelSmall" color="inkMuted" style={styles.date}>
                    {entry.date}
                  </Text>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('JournalEntry')}
              style={styles.newButton}
            >
              + New Entry
            </Button>
          </Animated.View>

          <View style={{ height: layout.tabBarHeight }} />
        </View>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mood: {
    fontSize: 24,
  },
  preview: {
    marginTop: spacing[2],
  },
  date: {
    marginTop: spacing[3],
  },
  newButton: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
});
