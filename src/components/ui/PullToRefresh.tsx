/**
 * PullToRefresh Component
 * 
 * A custom pull-to-refresh implementation with a breathing orb animation.
 * Since React Native's RefreshControl doesn't support custom indicators on iOS,
 * this component provides a custom implementation using gesture detection.
 */
import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, RefreshControl, ScrollView, ScrollViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { withAlpha } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REFRESH_THRESHOLD = 80;
const INDICATOR_SIZE = 50;

// =============================================================================
// TYPES
// =============================================================================

interface BreathingRefreshProps {
  refreshing: boolean;
  progress: number; // 0 to 1 during pull
}

interface PullToRefreshScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  onRefresh: () => Promise<void> | void;
  refreshing: boolean;
  children: React.ReactNode;
}

// =============================================================================
// BREATHING REFRESH INDICATOR
// =============================================================================

export function BreathingRefreshIndicator({ refreshing, progress }: BreathingRefreshProps) {
  const { colors, reduceMotion } = useTheme();
  const breatheScale = useSharedValue(1);
  const breatheOpacity = useSharedValue(0.6);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    if (refreshing && !reduceMotion) {
      // Breathing animation while refreshing
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      breatheOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(breatheScale);
      cancelAnimation(breatheOpacity);
      cancelAnimation(glowOpacity);
      cancelAnimation(rotation);
      breatheScale.value = withSpring(1);
      breatheOpacity.value = withTiming(0.6);
      glowOpacity.value = withTiming(0.3);
    }
  }, [refreshing, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: refreshing ? breatheScale.value : interpolate(progress, [0, 1], [0.5, 1], Extrapolate.CLAMP) },
    ],
    opacity: refreshing ? 1 : interpolate(progress, [0, 0.3, 1], [0, 0.5, 1], Extrapolate.CLAMP),
  }));

  const orbStyle = useAnimatedStyle(() => ({
    opacity: breatheOpacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value * 1.4 }],
    opacity: glowOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value * 1.6 }],
    opacity: interpolate(breatheScale.value, [1, 1.2], [0.3, 0], Extrapolate.CLAMP),
  }));

  return (
    <Animated.View style={[styles.refreshContainer, containerStyle]}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.refreshPulse,
          pulseStyle,
          { borderColor: colors.accentPrimary },
        ]}
      />
      
      {/* Glow */}
      <Animated.View
        style={[
          styles.refreshGlow,
          glowStyle,
          { backgroundColor: colors.accentPrimary },
        ]}
      />
      
      {/* Inner breathing orb */}
      <Animated.View
        style={[
          styles.refreshOrb,
          orbStyle,
          { backgroundColor: colors.accentPrimary },
        ]}
      >
        {/* Gradient overlay for depth */}
        <LinearGradient
          colors={[withAlpha('#fff', 0.4), 'transparent', withAlpha('#000', 0.1)]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: INDICATOR_SIZE / 2 }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

// =============================================================================
// PULL TO REFRESH SCROLL VIEW
// =============================================================================

export function PullToRefreshScrollView({
  onRefresh,
  refreshing,
  children,
  ...scrollViewProps
}: PullToRefreshScrollViewProps) {
  const { colors } = useTheme();
  const { impactMedium } = useHaptics();
  const [pullProgress, setPullProgress] = useState(0);
  const hasTriggeredRef = useRef(false);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    if (offsetY < 0) {
      const progress = Math.min(Math.abs(offsetY) / REFRESH_THRESHOLD, 1);
      setPullProgress(progress);
      
      // Trigger haptic when reaching threshold
      if (progress >= 1 && !hasTriggeredRef.current && !refreshing) {
        hasTriggeredRef.current = true;
        impactMedium();
      }
    } else {
      setPullProgress(0);
      hasTriggeredRef.current = false;
    }
    
    // Call original onScroll if provided
    scrollViewProps.onScroll?.(event);
  }, [impactMedium, refreshing, scrollViewProps.onScroll]);

  const handleRefresh = useCallback(async () => {
    hasTriggeredRef.current = false;
    await onRefresh();
  }, [onRefresh]);

  return (
    <View style={styles.scrollContainer}>
      {/* Custom refresh indicator */}
      <View style={styles.indicatorContainer}>
        <BreathingRefreshIndicator 
          refreshing={refreshing} 
          progress={pullProgress} 
        />
      </View>
      
      {/* Scroll View with native refresh control */}
      <ScrollView
        {...scrollViewProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="transparent" // Hide native indicator on iOS
            colors={['transparent']} // Hide on Android
            progressBackgroundColor="transparent"
            style={{ backgroundColor: 'transparent' }}
          />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// HOOK FOR CUSTOM REFRESH LOGIC
// =============================================================================

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const { impactMedium, notificationSuccess } = useHaptics();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await impactMedium();
    
    try {
      await onRefresh();
      await notificationSuccess();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, impactMedium, notificationSuccess]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: REFRESH_THRESHOLD,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  refreshContainer: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshPulse: {
    position: 'absolute',
    width: INDICATOR_SIZE - 10,
    height: INDICATOR_SIZE - 10,
    borderRadius: (INDICATOR_SIZE - 10) / 2,
    borderWidth: 2,
  },
  refreshGlow: {
    position: 'absolute',
    width: INDICATOR_SIZE - 10,
    height: INDICATOR_SIZE - 10,
    borderRadius: (INDICATOR_SIZE - 10) / 2,
  },
  refreshOrb: {
    width: INDICATOR_SIZE - 10,
    height: INDICATOR_SIZE - 10,
    borderRadius: (INDICATOR_SIZE - 10) / 2,
    overflow: 'hidden',
  },
});

export default PullToRefreshScrollView;
