/**
 * Header Component - Core
 * 
 * Simplified screen header with back button and optional actions.
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { spacing, layout } from '../../theme/tokens';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  transparent?: boolean;
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  leftAction,
  transparent = false,
  colors,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const backScale = useSharedValue(1);

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const handleBackPressIn = () => {
    backScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handleBackPressOut = () => {
    backScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handleBackPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: transparent ? 'transparent' : colors.background,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left Side */}
        <View style={styles.leftContainer}>
          {showBack && onBack ? (
            <Pressable
              onPressIn={handleBackPressIn}
              onPressOut={handleBackPressOut}
              onPress={handleBackPress}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Animated.View style={[styles.backButton, backAnimatedStyle]}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.textPrimary}
                />
              </Animated.View>
            </Pressable>
          ) : leftAction ? (
            leftAction
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.titleContainer}>
          {title && (
            <Text
              variant="headlineSmall"
              align="center"
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              variant="bodySmall"
              align="center"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Side */}
        <View style={styles.rightContainer}>
          {rightAction || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: layout.headerHeight,
    paddingHorizontal: spacing.md,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
});
