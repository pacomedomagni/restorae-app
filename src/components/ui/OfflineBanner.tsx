/**
 * OfflineBanner Component
 * 
 * Global offline indicator that shows when network is unavailable.
 * Designed to be placed at the top of screens or in the app wrapper.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';
import { spacing, borderRadius } from '../../theme';

interface OfflineBannerProps {
  /** Position variant */
  variant?: 'top' | 'floating' | 'inline';
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom retry handler */
  onRetry?: () => void;
}

export function OfflineBanner({ 
  variant = 'floating',
  showRetry = true,
  onRetry 
}: OfflineBannerProps) {
  const { colors, reduceMotion } = useTheme();
  const { isOffline, checkConnection } = useNetworkStatus();
  const { impactLight, notificationError } = useHaptics();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Haptic feedback when going offline
  useEffect(() => {
    if (isOffline) {
      notificationError();
    }
  }, [isOffline, notificationError]);

  // Subtle pulse animation
  useEffect(() => {
    if (isOffline && !reduceMotion) {
      const interval = setInterval(() => {
        pulseOpacity.value = withTiming(0.7, { duration: 1000 }, () => {
          pulseOpacity.value = withTiming(1, { duration: 1000 });
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOffline, reduceMotion, pulseOpacity]);

  const handleRetry = async () => {
    await impactLight();
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    
    if (onRetry) {
      onRetry();
    } else {
      await checkConnection();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!isOffline) return null;

  const bannerStyle = [
    styles.banner,
    { backgroundColor: colors.statusError },
    variant === 'top' && { 
      borderRadius: 0,
      paddingTop: insets.top + spacing[2],
    },
    variant === 'floating' && {
      marginHorizontal: spacing[4],
      marginTop: insets.top + spacing[2],
      borderRadius: borderRadius.lg,
    },
    variant === 'inline' && {
      marginVertical: spacing[2],
      borderRadius: borderRadius.md,
    },
  ];

  return (
    <Animated.View
      entering={reduceMotion ? undefined : SlideInUp.duration(300)}
      exiting={reduceMotion ? undefined : SlideOutUp.duration(300)}
      style={[
        variant === 'floating' && styles.floatingContainer,
        variant === 'top' && styles.topContainer,
      ]}
    >
      <Animated.View style={[bannerStyle, animatedStyle, pulseStyle]}>
        <View style={styles.content}>
          <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
          <Text variant="labelMedium" style={styles.text}>
            No internet connection
          </Text>
        </View>
        
        {showRetry && (
          <Pressable
            onPress={handleRetry}
            style={styles.retryButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Retry connection"
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// =============================================================================
// CONNECTION STATUS INDICATOR
// =============================================================================
interface ConnectionStatusProps {
  /** Size variant */
  size?: 'sm' | 'md';
}

export function ConnectionStatus({ size = 'md' }: ConnectionStatusProps) {
  const { colors } = useTheme();
  const { isOffline, isConnected, isInternetReachable } = useNetworkStatus();

  const getStatus = () => {
    if (!isConnected) return { color: colors.statusError, label: 'Offline' };
    if (isInternetReachable === false) return { color: colors.accentWarm, label: 'Limited' };
    return { color: colors.success, label: 'Online' };
  };

  const status = getStatus();
  const dotSize = size === 'sm' ? 8 : 12;

  return (
    <View style={styles.statusContainer}>
      <View
        style={[
          styles.statusDot,
          { 
            width: dotSize, 
            height: dotSize, 
            borderRadius: dotSize / 2,
            backgroundColor: status.color,
          },
        ]}
      />
      <Text 
        variant={size === 'sm' ? 'labelSmall' : 'labelMedium'} 
        color="inkMuted"
      >
        {status.label}
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  text: {
    color: '#fff',
  },
  retryButton: {
    padding: spacing[1],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusDot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default OfflineBanner;
