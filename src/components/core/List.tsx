/**
 * List Component - Core
 * 
 * Unified list and list item for settings, menus, etc.
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
import { Text } from './Text';
import { spacing, radius, withAlpha } from '../../theme/tokens';

interface ListProps {
  children: React.ReactNode;
  header?: string;
  colors: {
    surface: string;
    textSecondary: string;
    border: string;
  };
  style?: object;
}

export function List({ children, header, colors, style }: ListProps) {
  return (
    <View style={[styles.listContainer, style]}>
      {header && (
        <Text
          variant="labelSmall"
          style={[styles.header, { color: colors.textSecondary }]}
        >
          {header}
        </Text>
      )}
      <View
        style={[
          styles.list,
          { backgroundColor: colors.surface, borderColor: colors.border },
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
  colors: {
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    actionDestructive: string;
    actionPrimary: string;
    border: string;
  };
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
  colors,
}: ListItemProps) {
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const textColor = destructive
    ? colors.actionDestructive
    : disabled
    ? colors.textTertiary
    : colors.textPrimary;

  const content = (
    <View
      style={[
        styles.itemContent,
        !isLast && { borderBottomColor: withAlpha(colors.border, 0.5), borderBottomWidth: 1 },
      ]}
    >
      {leftIcon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: withAlpha(colors.actionPrimary, 0.1) },
          ]}
        >
          {leftIcon}
        </View>
      )}

      <View style={styles.textContainer}>
        <Text variant="bodyMedium" style={{ color: textColor }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            variant="bodySmall"
            style={{ color: colors.textSecondary, marginTop: 2 }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement}
      
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
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
      >
        <Animated.View style={animatedStyle}>{content}</Animated.View>
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  listContainer: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  list: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});
