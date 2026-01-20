import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Text } from './Text';
import { spacing, withAlpha } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  compact?: boolean;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  compact = false,
  showBack = false,
  rightAction,
  style,
}: ScreenHeaderProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const navigation = useNavigation();

  const handleBack = async () => {
    await impactLight();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      {/* Top row with back button and action */}
      {(showBack || rightAction) && (
        <View style={styles.topRow}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: withAlpha(colors.canvasElevated, pressed ? 0.9 : 0.7),
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Text variant="labelLarge" color="ink">
                ←
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          {rightAction}
        </View>
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.delay(100).duration(400)}
        >
          <Text
            variant="labelSmall"
            color="inkFaint"
            align={align}
            style={styles.eyebrow}
          >
            {eyebrow}
          </Text>
        </Animated.View>
      )}

      {/* Title */}
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.delay(150).duration(400)}
      >
        <Text variant="displayMedium" color="ink" align={align}>
          {title}
        </Text>
      </Animated.View>

      {/* Subtitle */}
      {subtitle && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}
        >
          <Text
            variant="bodyLarge"
            color="inkMuted"
            align={align}
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
  },
  compact: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    marginBottom: spacing[2],
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: spacing[2],
  },
});
