/**
 * AmbientSoundPicker Component
 * 
 * Premium sound picker for selecting ambient audio during sessions.
 * Matches industry standards with preview capability and categorized sounds.
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Text } from './Text';
import { GlassCard } from './GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { AMBIENT_SOUNDS_DATA, AmbientSound } from '../../contexts/AudioContext';
import { spacing, borderRadius, withAlpha } from '../../theme';

interface AmbientSoundPickerProps {
  /** Currently selected sound ID */
  selectedSoundId?: string;
  /** Callback when a sound is selected */
  onSelect: (soundId: string) => void;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Filter by category */
  category?: 'nature' | 'ambient' | 'music' | 'all';
  /** Whether to show "None" option */
  showNoneOption?: boolean;
}

interface SoundOptionProps {
  sound: AmbientSound;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  compact?: boolean;
}

function SoundOption({ sound, isSelected, onSelect, index, compact }: SoundOptionProps) {
  const { colors, reduceMotion } = useTheme();
  const { selectionLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, []);

  const handlePress = useCallback(async () => {
    await selectionLight();
    onSelect();
  }, [selectionLight, onSelect]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(index * 50).duration(300)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${sound.name} ambient sound`}
      >
        <Animated.View style={animatedStyle}>
          <View
            style={[
              compact ? styles.compactOption : styles.option,
              {
                backgroundColor: isSelected
                  ? withAlpha(colors.accentPrimary, 0.15)
                  : withAlpha(colors.canvasElevated, 0.5),
                borderColor: isSelected ? colors.accentPrimary : 'transparent',
              },
            ]}
          >
            <Text style={styles.soundIcon}>{sound.icon}</Text>
            <Text
              variant={compact ? 'labelSmall' : 'labelMedium'}
              color={isSelected ? 'accent' : 'ink'}
              numberOfLines={1}
            >
              {sound.name}
            </Text>
            {isSelected && (
              <View style={[styles.checkmark, { backgroundColor: colors.accentPrimary }]}>
                <Text style={styles.checkmarkIcon}>✓</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function AmbientSoundPicker({
  selectedSoundId,
  onSelect,
  compact = false,
  category = 'all',
  showNoneOption = true,
}: AmbientSoundPickerProps) {
  const { colors, reduceMotion } = useTheme();
  const { selectionLight } = useHaptics();

  // Filter sounds by category
  const sounds = category === 'all'
    ? AMBIENT_SOUNDS_DATA
    : AMBIENT_SOUNDS_DATA.filter(s => s.category === category);

  // Group by category for better organization
  const groupedSounds = {
    nature: sounds.filter(s => s.category === 'nature'),
    ambient: sounds.filter(s => s.category === 'ambient'),
    music: sounds.filter(s => s.category === 'music'),
  };

  const handleNoneSelect = useCallback(async () => {
    await selectionLight();
    onSelect('');
  }, [selectionLight, onSelect]);

  if (compact) {
    // Compact horizontal scroll for session screens
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactContainer}
      >
        {showNoneOption && (
          <Pressable
            onPress={handleNoneSelect}
            accessibilityRole="radio"
            accessibilityState={{ selected: !selectedSoundId }}
            accessibilityLabel="No ambient sound"
          >
            <View
              style={[
                styles.compactOption,
                {
                  backgroundColor: !selectedSoundId
                    ? withAlpha(colors.accentPrimary, 0.15)
                    : withAlpha(colors.canvasElevated, 0.5),
                  borderColor: !selectedSoundId ? colors.accentPrimary : 'transparent',
                },
              ]}
            >
              <Text style={styles.soundIcon}>🔇</Text>
              <Text
                variant="labelSmall"
                color={!selectedSoundId ? 'accent' : 'ink'}
              >
                None
              </Text>
            </View>
          </Pressable>
        )}
        {sounds.map((sound, index) => (
          <SoundOption
            key={sound.id}
            sound={sound}
            isSelected={selectedSoundId === sound.id}
            onSelect={() => onSelect(sound.id)}
            index={index}
            compact
          />
        ))}
      </ScrollView>
    );
  }

  // Full picker with categories
  return (
    <View style={styles.container}>
      {showNoneOption && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(300)}
        >
          <Pressable
            onPress={handleNoneSelect}
            accessibilityRole="radio"
            accessibilityState={{ selected: !selectedSoundId }}
            accessibilityLabel="No ambient sound"
          >
            <View
              style={[
                styles.option,
                {
                  backgroundColor: !selectedSoundId
                    ? withAlpha(colors.accentPrimary, 0.15)
                    : withAlpha(colors.canvasElevated, 0.5),
                  borderColor: !selectedSoundId ? colors.accentPrimary : 'transparent',
                },
              ]}
            >
              <Text style={styles.soundIcon}>🔇</Text>
              <Text
                variant="labelMedium"
                color={!selectedSoundId ? 'accent' : 'ink'}
              >
                No Sound
              </Text>
              {!selectedSoundId && (
                <View style={[styles.checkmark, { backgroundColor: colors.accentPrimary }]}>
                  <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Nature Sounds */}
      {groupedSounds.nature.length > 0 && (
        <View style={styles.categorySection}>
          <Text variant="labelSmall" color="inkFaint" style={styles.categoryLabel}>
            🌿 NATURE
          </Text>
          {groupedSounds.nature.map((sound, index) => (
            <SoundOption
              key={sound.id}
              sound={sound}
              isSelected={selectedSoundId === sound.id}
              onSelect={() => onSelect(sound.id)}
              index={index}
            />
          ))}
        </View>
      )}

      {/* Ambient Sounds */}
      {groupedSounds.ambient.length > 0 && (
        <View style={styles.categorySection}>
          <Text variant="labelSmall" color="inkFaint" style={styles.categoryLabel}>
            🏠 AMBIENT
          </Text>
          {groupedSounds.ambient.map((sound, index) => (
            <SoundOption
              key={sound.id}
              sound={sound}
              isSelected={selectedSoundId === sound.id}
              onSelect={() => onSelect(sound.id)}
              index={index + groupedSounds.nature.length}
            />
          ))}
        </View>
      )}

      {/* Music */}
      {groupedSounds.music.length > 0 && (
        <View style={styles.categorySection}>
          <Text variant="labelSmall" color="inkFaint" style={styles.categoryLabel}>
            🎵 MUSIC
          </Text>
          {groupedSounds.music.map((sound, index) => (
            <SoundOption
              key={sound.id}
              sound={sound}
              isSelected={selectedSoundId === sound.id}
              onSelect={() => onSelect(sound.id)}
              index={index + groupedSounds.nature.length + groupedSounds.ambient.length}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  compactOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing[1],
    minWidth: 80,
  },
  soundIcon: {
    fontSize: 24,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categorySection: {
    marginTop: spacing[3],
  },
  categoryLabel: {
    marginBottom: spacing[2],
    paddingLeft: spacing[1],
  },
});

export default AmbientSoundPicker;
