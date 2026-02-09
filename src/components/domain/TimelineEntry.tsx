/**
 * TimelineEntry Component - Domain
 * 
 * Displays a single entry in the Journey timeline.
 * Now uses ThemeContext instead of colors prop.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Text, Badge, GlassCard } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { MoodType, moodLabels, moodIcons, spacing, withAlpha } from '../../theme/tokens';
import { TimelineEntry as TimelineEntryType } from '../../contexts/JourneyContext';

interface TimelineEntryProps {
  entry: TimelineEntryType;
  onPress?: () => void;
}

export function TimelineEntry({ entry, onPress }: TimelineEntryProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getMoodColor = (mood: MoodType) => ({
    calm: colors.moodCalm,
    good: colors.moodGood,
    anxious: colors.moodAnxious,
    low: colors.moodLow,
  }[mood]);

  const renderContent = () => {
    switch (entry.type) {
      case 'mood':
        return (
          <View style={styles.entryContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: withAlpha(getMoodColor(entry.mood!), 0.15) },
              ]}
            >
              <Text style={styles.moodEmoji}>{moodIcons[entry.mood!]}</Text>
            </View>
            <View style={styles.textContent}>
              <Text variant="bodyMedium" color="ink">
                Feeling {moodLabels[entry.mood!].toLowerCase()}
              </Text>
              {entry.moodNote && (
                <Text
                  variant="bodySmall"
                  color="inkMuted"
                  style={{ marginTop: 2 }}
                  numberOfLines={2}
                >
                  "{entry.moodNote}"
                </Text>
              )}
            </View>
            <Text variant="labelSmall" color="inkFaint">
              {formatTime(entry.timestamp)}
            </Text>
          </View>
        );

      case 'session':
        const improved =
          entry.preSessionMood &&
          entry.postSessionMood &&
          getMoodValue(entry.postSessionMood) > getMoodValue(entry.preSessionMood);

        return (
          <View style={styles.entryContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: withAlpha(colors.accentPrimary, 0.15) },
              ]}
            >
              <Ionicons
                name={getSessionIcon(entry.sessionType)}
                size={18}
                color={colors.accentPrimary}
              />
            </View>
            <View style={styles.textContent}>
              <Text variant="bodyMedium" color="ink">
                {entry.sessionName}
              </Text>
              <View style={styles.sessionMeta}>
                <Text variant="bodySmall" color="inkMuted">
                  {formatDuration(entry.sessionDuration || 0)}
                </Text>
                {improved && (
                  <Badge label="Improved" variant="success" size="sm" />
                )}
              </View>
            </View>
            <Text variant="labelSmall" color="inkFaint">
              {formatTime(entry.timestamp)}
            </Text>
          </View>
        );

      case 'journal':
        return (
          <View style={styles.entryContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: withAlpha(colors.accentWarm, 0.15) },
              ]}
            >
              <Ionicons name="book-outline" size={18} color={colors.accentWarm} />
            </View>
            <View style={styles.textContent}>
              <Text
                variant="bodyMedium"
                color="ink"
                numberOfLines={2}
              >
                {entry.journalContent}
              </Text>
              {entry.journalPrompt && (
                <Text
                  variant="labelSmall"
                  color="inkFaint"
                  style={{ marginTop: 4 }}
                >
                  Prompt: {entry.journalPrompt}
                </Text>
              )}
            </View>
            <Text variant="labelSmall" color="inkFaint">
              {formatTime(entry.timestamp)}
            </Text>
          </View>
        );

      case 'milestone':
        return (
          <View style={[styles.entryContent, styles.milestoneContent]}>
            <Text style={styles.milestoneEmoji}>🎉</Text>
            <Text variant="bodyMedium" color="ink">
              {getMilestoneText(entry.milestoneType, entry.milestoneValue)}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const content = (
    <GlassCard variant="subtle" padding="md" style={styles.card}>
      {renderContent()}
    </GlassCard>
  );

  if (onPress) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
      >
        <Animated.View style={animatedStyle}>{content}</Animated.View>
      </Pressable>
    );
  }

  return content;
}

// Helpers
function getMoodValue(mood: MoodType): number {
  return { good: 4, calm: 3, anxious: 2, low: 1 }[mood];
}

function getSessionIcon(type?: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'breathing':
      return 'leaf-outline';
    case 'grounding':
      return 'earth-outline';
    case 'focus':
      return 'eye-outline';
    case 'body':
      return 'body-outline';
    case 'story':
      return 'moon-outline';
    default:
      return 'sparkles-outline';
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return `${seconds}s`;
  return `${mins} min`;
}

function getMilestoneText(type?: string, value?: number): string {
  switch (type) {
    case 'streak':
      return `${value} day streak! 🔥`;
    case 'sessions':
      return `${value} sessions completed!`;
    case 'first':
      return 'Completed your first session!';
    default:
      return 'Achievement unlocked!';
  }
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  moodEmoji: {
    fontSize: 18,
  },
  textContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  milestoneContent: {
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  milestoneEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
});
