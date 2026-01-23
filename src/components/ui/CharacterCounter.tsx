/**
 * CharacterCounter
 * 
 * Character count indicator with optional limit.
 * Shows auto-save status.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, withAlpha } from '../../theme';

interface CharacterCounterProps {
  current: number;
  max?: number;
  showAutoSave?: boolean;
  autoSaveStatus?: 'idle' | 'saving' | 'saved';
}

export function CharacterCounter({
  current,
  max,
  showAutoSave = false,
  autoSaveStatus = 'idle',
}: CharacterCounterProps) {
  const { colors, reduceMotion } = useTheme();

  const isNearLimit = max ? current >= max * 0.9 : false;
  const isAtLimit = max ? current >= max : false;

  const countColor = isAtLimit
    ? colors.accentDanger
    : isNearLimit
    ? colors.accentWarm
    : colors.inkFaint;

  const getSaveStatusText = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {showAutoSave && autoSaveStatus !== 'idle' && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(200)}
          exiting={reduceMotion ? undefined : FadeOut.duration(200)}
          style={styles.autoSave}
        >
          <View
            style={[
              styles.saveDot,
              {
                backgroundColor:
                  autoSaveStatus === 'saved'
                    ? colors.success
                    : colors.accentWarm,
              },
            ]}
          />
          <Text variant="labelSmall" color="inkFaint">
            {getSaveStatusText()}
          </Text>
        </Animated.View>
      )}

      <Text variant="labelSmall" style={{ color: countColor }}>
        {current}
        {max ? ` / ${max}` : ' characters'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingHorizontal: spacing[1],
  },
  autoSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  saveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
