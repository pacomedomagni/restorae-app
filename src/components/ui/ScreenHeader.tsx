import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Text } from './Text';
import { Icon } from '../Icon';
import { spacing, layout, withAlpha } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  compact?: boolean;
  /** Display variant - 'hero' for main screens, 'page' for sub-screens */
  variant?: 'hero' | 'page';
  showBack?: boolean;
  rightAction?: React.ReactNode;
  /** Left action replaces back button when provided */
  leftAction?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  compact = false,
  variant = 'page',
  showBack = false,
  rightAction,
  leftAction,
  style,
}: ScreenHeaderProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const navigation = useNavigation();

  const handleBack = async () => {
    await impactLight();
    navigation.goBack();
  };

  const hasTopRow = showBack || rightAction || leftAction;
  const titleVariant = variant === 'hero' ? 'displayMedium' : 'headlineLarge';

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      {/* Top row with back button and action */}
      {hasTopRow && (
        <View style={styles.topRow}>
          {leftAction ? (
            leftAction
          ) : showBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: withAlpha(colors.canvasElevated, pressed ? 0.9 : 0.7),
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Icon name="home" size={20} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          {rightAction || <View />}
        </View>
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.delay(50).duration(300)}
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
        entering={reduceMotion ? undefined : FadeInDown.delay(75).duration(300)}
      >
        <Text variant={titleVariant} color="ink" align={align}>
          {title}
        </Text>
      </Animated.View>

      {/* Subtitle */}
      {subtitle && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(300)}
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
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: layout.minTouchTarget / 2,
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
