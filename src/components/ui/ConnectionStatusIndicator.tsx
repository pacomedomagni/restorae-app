/**
 * ConnectionStatusIndicator
 * 
 * Small, subtle connection status indicator for headers.
 * Shows a dot or icon indicating online/offline/syncing state.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { spacing, withAlpha } from '../../theme';

type StatusVariant = 'dot' | 'icon' | 'badge';
type StatusSize = 'sm' | 'md' | 'lg';

interface ConnectionStatusIndicatorProps {
  /** Visual variant */
  variant?: StatusVariant;
  /** Size of the indicator */
  size?: StatusSize;
  /** Show syncing animation when online */
  showSyncing?: boolean;
  /** Custom syncing state */
  isSyncing?: boolean;
}

const SIZE_MAP: Record<StatusSize, number> = {
  sm: 8,
  md: 12,
  lg: 16,
};

const ICON_SIZE_MAP: Record<StatusSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
};

export function ConnectionStatusIndicator({
  variant = 'dot',
  size = 'sm',
  showSyncing = false,
  isSyncing = false,
}: ConnectionStatusIndicatorProps) {
  const { colors, reduceMotion } = useTheme();
  const { isOffline, isConnected } = useNetworkStatus();
  
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Pulse animation for offline state
  useEffect(() => {
    if (isOffline && !reduceMotion) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isOffline, reduceMotion]);

  // Rotation animation for syncing state
  useEffect(() => {
    if ((showSyncing && isSyncing) && !reduceMotion) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [showSyncing, isSyncing, reduceMotion]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dotSize = SIZE_MAP[size];
  const iconSize = ICON_SIZE_MAP[size];

  const getStatusColor = () => {
    if (isOffline) return colors.statusError;
    if (isSyncing) return colors.accentWarm;
    return colors.success;
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isOffline) return 'cloud-offline-outline';
    if (isSyncing) return 'sync-outline';
    return 'cloud-done-outline';
  };

  // Don't show when online and not syncing (everything is fine)
  if (isConnected && !isSyncing && variant === 'dot') {
    return null;
  }

  if (variant === 'dot') {
    return (
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: getStatusColor(),
          },
          dotAnimatedStyle,
        ]}
        accessibilityLabel={isOffline ? 'Offline' : isSyncing ? 'Syncing' : 'Online'}
        accessibilityRole="image"
      />
    );
  }

  if (variant === 'icon') {
    return (
      <Animated.View style={isSyncing ? iconAnimatedStyle : undefined}>
        <Ionicons
          name={getStatusIcon()}
          size={iconSize}
          color={getStatusColor()}
          accessibilityLabel={isOffline ? 'Offline' : isSyncing ? 'Syncing' : 'Online'}
        />
      </Animated.View>
    );
  }

  // Badge variant
  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: withAlpha(getStatusColor(), 0.15),
          borderColor: withAlpha(getStatusColor(), 0.3),
        },
        dotAnimatedStyle,
      ]}
      accessibilityLabel={isOffline ? 'Offline' : isSyncing ? 'Syncing' : 'Online'}
      accessibilityRole="text"
    >
      <Ionicons
        name={getStatusIcon()}
        size={iconSize - 4}
        color={getStatusColor()}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    borderWidth: 1,
  },
});
