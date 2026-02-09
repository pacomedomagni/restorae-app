/**
 * List Component
 * Unified list and list item for settings, menus, etc.
 * 
 * Features:
 * - Section headers
 * - Press animations
 * - Chevron indicators
 * - Destructive variant
 * - Uses ThemeContext (no manual color passing)
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

interface ListProps {
  children: React.ReactNode;
  header?: string;
  style?: object;
}

export function List({ children, header, style }: ListProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.listContainer, style]}>
      {header && (
        <Text variant="labelSmall" color="inkMuted" style={styles.header}>
          {header}
        </Text>
      )}
      <View
        style={[
          styles.list,
          { 
            backgroundColor: withAlpha(colors.canvasElevated, 0.8),
            borderColor: colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  isLast?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = false,
  onPress,
  destructive = false,
  disabled = false,
  isLast = false,
}: ListItemProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    if (disabled) return;
    await impactLight();
    onPress?.();
  };

  const textColor = destructive ? colors.accentWarm : colors.ink;
  const iconColor = destructive ? colors.accentWarm : colors.accentPrimary;

  const content = (
    <View
      style={[
        styles.itemContent,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {leftIcon && (
        <View 
          style={[
            styles.iconContainer, 
            { backgroundColor: withAlpha(iconColor, 0.1) }
          ]}
        >
          {leftIcon}
        </View>
      )}

      <View style={styles.textContainer}>
        <Text
          variant="bodyMedium"
          style={{ color: textColor, opacity: disabled ? 0.5 : 1 }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" color="inkMuted">
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement}
      
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.inkFaint}
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        <Animated.View style={animatedStyle}>{content}</Animated.View>
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  listContainer: {
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});
