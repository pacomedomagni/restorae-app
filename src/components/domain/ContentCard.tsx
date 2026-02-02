/**
 * ContentCard Component - Domain
 * 
 * Card for displaying wellness content in the Library.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ImageBackground } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../core/Text';
import { Badge } from '../core/Badge';
import { spacing, radius, withAlpha } from '../../theme/tokens';

interface ContentCardProps {
  title: string;
  subtitle?: string;
  duration?: string;
  type: 'breathing' | 'grounding' | 'focus' | 'body' | 'story' | 'sos';
  imageUrl?: string;
  isPremium?: boolean;
  isFavorite?: boolean;
  progress?: number; // 0-1 for continue watching
  onPress?: () => void;
  onFavoriteToggle?: () => void;
  size?: 'sm' | 'md' | 'lg';
  colors: {
    surface: string;
    surfaceElevated: string;
    textPrimary: string;
    textSecondary: string;
    textInverse: string;
    actionPrimary: string;
    actionSecondary: string;
    actionDestructive: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
  isDark?: boolean;
}

const typeIcons: Record<ContentCardProps['type'], keyof typeof Ionicons.glyphMap> = {
  breathing: 'leaf',
  grounding: 'earth',
  focus: 'eye',
  body: 'body',
  story: 'moon',
  sos: 'alert-circle',
};

const typeColors = {
  breathing: '#4F7F6A',
  grounding: '#8B7355',
  focus: '#5A7BA3',
  body: '#9B6B8B',
  story: '#6B5B95',
  sos: '#B65A4A',
};

const cardSizes = {
  sm: { width: 140, height: 100 },
  md: { width: 160, height: 120 },
  lg: { width: '100%' as const, height: 140 },
};

export function ContentCard({
  title,
  subtitle,
  duration,
  type,
  imageUrl,
  isPremium,
  isFavorite,
  progress,
  onPress,
  onFavoriteToggle,
  size = 'md',
  colors,
  isDark,
}: ContentCardProps) {
  const scale = useSharedValue(1);
  const dimensions = cardSizes[size];
  const accentColor = typeColors[type];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleFavoritePress = async (e: any) => {
    e.stopPropagation();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavoriteToggle?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${duration ? `, ${duration}` : ''}`}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            withAlpha(accentColor, isDark ? 0.3 : 0.15),
            withAlpha(accentColor, isDark ? 0.1 : 0.05),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Progress indicator for "Continue" items */}
        {progress !== undefined && progress > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: colors.actionPrimary,
                },
              ]}
            />
          </View>
        )}

        {/* Top row - icon and badges */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: withAlpha(accentColor, 0.2) },
            ]}
          >
            <Ionicons name={typeIcons[type]} size={16} color={accentColor} />
          </View>

          <View style={styles.badges}>
            {isPremium && (
              <Badge label="PRO" variant="warning" size="sm" colors={colors} />
            )}
            {onFavoriteToggle && (
              <Pressable
                onPress={handleFavoritePress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? colors.actionDestructive : colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Bottom - title and meta */}
        <View style={styles.bottomRow}>
          <Text
            variant="labelLarge"
            style={{ color: colors.textPrimary }}
            numberOfLines={size === 'lg' ? 2 : 1}
          >
            {title}
          </Text>
          {(subtitle || duration) && (
            <View style={styles.meta}>
              {duration && (
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {duration}
                </Text>
              )}
              {subtitle && size === 'lg' && (
                <Text
                  variant="bodySmall"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bottomRow: {
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
