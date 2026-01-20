/**
 * JournalEntriesScreen
 * Recent entries overview
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, borderRadius, layout } from '../theme';
import { MoodType, RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Entry = {
  id: string;
  date: string;
  preview: string;
  content: string;
  title?: string;
  mood?: MoodType;
};

const entries: Entry[] = [
  {
    id: '1',
    date: 'Today',
    preview: 'Feeling grateful for the quiet morning...',
    content: 'Feeling grateful for the quiet morning. I want to carry this calm into the day.',
    title: 'Quiet morning',
    mood: 'calm',
  },
  {
    id: '2',
    date: 'Yesterday',
    preview: 'Work was challenging but I managed to...',
    content: 'Work was challenging but I managed to take breaks and reset my focus.',
    title: 'Hard day',
    mood: 'tough',
  },
  {
    id: '3',
    date: '2 days ago',
    preview: 'Had a wonderful conversation with...',
    content: 'Had a wonderful conversation with a friend. It reminded me to slow down.',
    title: 'Good conversation',
    mood: 'good',
  },
];

interface EntryCardProps {
  entry: Entry;
  delay: number;
  onPress: () => void;
}

function EntryCard({ entry, delay, onPress }: EntryCardProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();

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

  const moodColorMap: Record<MoodType, string> = {
    energized: colors.moodEnergized,
    calm: colors.moodCalm,
    good: colors.moodGood,
    anxious: colors.moodAnxious,
    low: colors.moodLow,
    tough: colors.moodTough,
  };

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View
          style={[styles.entryCard, animatedStyle]}
        >
          <Card elevation="lift">
            <View style={styles.entryHeader}>
              <Text variant="labelMedium" color="inkMuted">
                {entry.date}
              </Text>
              {entry.mood && (
                <View style={[styles.moodDot, { backgroundColor: moodColorMap[entry.mood] }]} />
              )}
            </View>
            <Text variant="bodyMedium" color="ink" numberOfLines={2}>
              {entry.preview}
            </Text>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function JournalEntriesScreen() {
  const { gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLoading = false;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.morning}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Recent Entries"
              subtitle="Your latest reflections"
              compact
            />
          </Animated.View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text variant="headlineSmall" color="ink">
                Loading entries...
              </Text>
              <Text variant="bodySmall" color="inkMuted" style={styles.emptyText}>
                Preparing your recent reflections.
              </Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="headlineSmall" color="ink">
                No entries yet
              </Text>
              <Text variant="bodySmall" color="inkMuted" style={styles.emptyText}>
                Start your first entry from the Journal home.
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {entries.map((entry, index) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  delay={200 + index * 120}
                  onPress={() =>
                    navigation.navigate('JournalEntry', {
                      mode: 'view',
                      entry: { title: entry.title, content: entry.content },
                    })
                  }
                />
              ))}
            </View>
          )}

          <View style={{ height: layout.tabBarHeight }} />
        </ScrollView>
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
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  entriesList: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  emptyState: {
    padding: spacing[5],
  },
  emptyText: {
    marginTop: spacing[2],
  },
  entryCard: {
    borderRadius: borderRadius.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
