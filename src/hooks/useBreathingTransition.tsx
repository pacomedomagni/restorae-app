/**
 * useBreathingTransition
 * 
 * A hook that provides organic, breath-like transitions throughout the app.
 * Instead of jarring screen changes, transitions feel like exhales.
 * 
 * The hook adjusts timing based on:
 * - User's current emotional state
 * - Reduce motion preferences
 * - Flow state (arriving, completing, etc.)
 */
import { useCallback, useRef } from 'react';
import { 
  useSharedValue, 
  withTiming, 
  withSequence, 
  withDelay,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useEmotionalFlow } from '../contexts/EmotionalFlowContext';
import { useHaptics } from './useHaptics';
import type { RootStackParamList } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type TransitionStyle = 
  | 'exhale'      // Gentle fade out, pause, fade in on new screen
  | 'dissolve'    // Cross-fade with slight scale
  | 'drift'       // Subtle drift in direction of navigation
  | 'breathe'     // Full breath cycle (for important moments)
  | 'instant';    // For when user needs speed (accessibility)

export interface TransitionConfig {
  style?: TransitionStyle;
  /** Override base duration in ms */
  duration?: number;
  /** Haptic at start of transition */
  hapticOnStart?: boolean;
  /** Haptic at end of transition */
  hapticOnEnd?: boolean;
  /** Callback before navigation */
  onBeforeNavigate?: () => void | Promise<void>;
  /** Callback after navigation complete */
  onAfterNavigate?: () => void;
}

export interface BreathingTransitionReturn {
  // Animation values that can be applied to screens
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  translateY: SharedValue<number>;
  
  // Trigger a transition
  transitionTo: (
    screen: keyof RootStackParamList,
    params?: any,
    config?: TransitionConfig
  ) => Promise<void>;
  
  // For going back with a transition
  transitionBack: (config?: TransitionConfig) => Promise<void>;
  
  // Prepare screen for incoming transition (call on mount)
  prepareEnter: () => void;
  
  // Run enter animation (call after prepareEnter)
  animateEnter: (onComplete?: () => void) => void;
  
  // Check if currently transitioning
  isTransitioning: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_DURATION = 400;

const STYLE_CONFIGS: Record<TransitionStyle, { 
  outDuration: number; 
  inDuration: number;
  pauseDuration: number;
  scaleOut: number;
  scaleIn: number;
  translateOut: number;
}> = {
  exhale: {
    outDuration: 0.8,
    inDuration: 0.6,
    pauseDuration: 0.15,
    scaleOut: 0.98,
    scaleIn: 1.02,
    translateOut: 10,
  },
  dissolve: {
    outDuration: 0.5,
    inDuration: 0.5,
    pauseDuration: 0.1,
    scaleOut: 0.95,
    scaleIn: 1.05,
    translateOut: 0,
  },
  drift: {
    outDuration: 0.6,
    inDuration: 0.5,
    pauseDuration: 0.1,
    scaleOut: 1,
    scaleIn: 1,
    translateOut: 30,
  },
  breathe: {
    outDuration: 1.2,
    inDuration: 0.8,
    pauseDuration: 0.3,
    scaleOut: 0.96,
    scaleIn: 1.04,
    translateOut: 15,
  },
  instant: {
    outDuration: 0.1,
    inDuration: 0.1,
    pauseDuration: 0,
    scaleOut: 1,
    scaleIn: 1,
    translateOut: 0,
  },
};

// =============================================================================
// HOOK
// =============================================================================

export function useBreathingTransition(): BreathingTransitionReturn {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { reduceMotion } = useTheme();
  const { temperature, needsGentleness, setFlowState } = useEmotionalFlow();
  const { impactLight, impactMedium } = useHaptics();

  // Animation values
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Transition state
  const isTransitioningRef = useRef(false);

  // Calculate duration based on emotional state and preferences
  const calculateDuration = useCallback((baseMultiplier: number): number => {
    if (reduceMotion) return 100;
    
    let duration = BASE_DURATION * baseMultiplier;
    
    // Apply emotional pacing
    duration *= temperature.pacing;
    
    // Extra time for those who need gentleness
    if (needsGentleness) {
      duration *= 1.2;
    }
    
    return Math.round(duration);
  }, [reduceMotion, temperature.pacing, needsGentleness]);

  // Get style config, defaulting to exhale
  const getStyleConfig = useCallback((style?: TransitionStyle) => {
    if (reduceMotion) return STYLE_CONFIGS.instant;
    return STYLE_CONFIGS[style || 'exhale'];
  }, [reduceMotion]);

  // Main transition function
  const transitionTo = useCallback(async (
    screen: keyof RootStackParamList,
    params?: any,
    config: TransitionConfig = {}
  ) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const {
      style = 'exhale',
      duration,
      hapticOnStart = true,
      hapticOnEnd = false,
      onBeforeNavigate,
      onAfterNavigate,
    } = config;

    const styleConfig = getStyleConfig(style);
    const baseDuration = duration || BASE_DURATION;

    // Update flow state
    setFlowState('transitioning');

    // Haptic at start
    if (hapticOnStart && !reduceMotion) {
      impactLight();
    }

    // Run before callback
    if (onBeforeNavigate) {
      await onBeforeNavigate();
    }

    // Animate out
    const outDuration = calculateDuration(styleConfig.outDuration);
    const pauseDuration = calculateDuration(styleConfig.pauseDuration);

    return new Promise<void>((resolve) => {
      opacity.value = withTiming(0, {
        duration: outDuration,
        easing: Easing.out(Easing.ease),
      });
      
      scale.value = withTiming(styleConfig.scaleOut, {
        duration: outDuration,
        easing: Easing.out(Easing.ease),
      });

      translateY.value = withTiming(styleConfig.translateOut, {
        duration: outDuration,
        easing: Easing.out(Easing.ease),
      });

      // Navigate after out animation + pause
      setTimeout(() => {
        // @ts-expect-error - dynamic navigation
        navigation.navigate(screen, params);

        // Haptic at end
        if (hapticOnEnd && !reduceMotion) {
          impactMedium();
        }

        // Run after callback
        if (onAfterNavigate) {
          onAfterNavigate();
        }

        isTransitioningRef.current = false;
        resolve();
      }, outDuration + pauseDuration);
    });
  }, [
    navigation, 
    getStyleConfig, 
    calculateDuration, 
    reduceMotion, 
    setFlowState,
    impactLight, 
    impactMedium, 
    opacity, 
    scale, 
    translateY
  ]);

  // Go back with transition
  const transitionBack = useCallback(async (config: TransitionConfig = {}) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const {
      style = 'exhale',
      hapticOnStart = true,
      onBeforeNavigate,
      onAfterNavigate,
    } = config;

    const styleConfig = getStyleConfig(style);

    setFlowState('transitioning');

    if (hapticOnStart && !reduceMotion) {
      impactLight();
    }

    if (onBeforeNavigate) {
      await onBeforeNavigate();
    }

    const outDuration = calculateDuration(styleConfig.outDuration);
    const pauseDuration = calculateDuration(styleConfig.pauseDuration);

    return new Promise<void>((resolve) => {
      opacity.value = withTiming(0, {
        duration: outDuration,
        easing: Easing.out(Easing.ease),
      });
      
      scale.value = withTiming(styleConfig.scaleOut, {
        duration: outDuration,
        easing: Easing.out(Easing.ease),
      });

      // Reverse direction for back
      translateY.value = withTiming(-styleConfig.translateOut, {
        duration: outDuration,
        easing: Easing.out(Easing.ease),
      });

      setTimeout(() => {
        navigation.goBack();

        if (onAfterNavigate) {
          onAfterNavigate();
        }

        isTransitioningRef.current = false;
        resolve();
      }, outDuration + pauseDuration);
    });
  }, [
    navigation, 
    getStyleConfig, 
    calculateDuration, 
    reduceMotion, 
    setFlowState,
    impactLight, 
    opacity, 
    scale, 
    translateY
  ]);

  // Prepare for enter animation (call immediately on mount)
  const prepareEnter = useCallback(() => {
    const styleConfig = getStyleConfig('exhale');
    opacity.value = 0;
    scale.value = styleConfig.scaleIn;
    translateY.value = -styleConfig.translateOut;
  }, [getStyleConfig, opacity, scale, translateY]);

  // Run enter animation
  const animateEnter = useCallback((onComplete?: () => void) => {
    const inDuration = calculateDuration(STYLE_CONFIGS.exhale.inDuration);

    opacity.value = withTiming(1, {
      duration: inDuration,
      easing: Easing.out(Easing.ease),
    });

    scale.value = withTiming(1, {
      duration: inDuration,
      easing: Easing.out(Easing.ease),
    });

    translateY.value = withTiming(0, {
      duration: inDuration,
      easing: Easing.out(Easing.ease),
    }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });

    // Update flow state after enter
    setTimeout(() => {
      setFlowState('present');
    }, inDuration);
  }, [calculateDuration, setFlowState, opacity, scale, translateY]);

  return {
    opacity,
    scale,
    translateY,
    transitionTo,
    transitionBack,
    prepareEnter,
    animateEnter,
    isTransitioning: isTransitioningRef.current,
  };
}

// =============================================================================
// ANIMATED CONTAINER COMPONENT
// =============================================================================

import React, { useEffect, ReactNode } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface BreathingContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Whether to run enter animation on mount */
  animateOnMount?: boolean;
  /** Callback when enter animation completes */
  onEnterComplete?: () => void;
}

export function BreathingContainer({ 
  children, 
  style,
  animateOnMount = true,
  onEnterComplete,
}: BreathingContainerProps) {
  const { opacity, scale, translateY, prepareEnter, animateEnter } = useBreathingTransition();

  useEffect(() => {
    if (animateOnMount) {
      prepareEnter();
      // Small delay to ensure layout is ready
      requestAnimationFrame(() => {
        animateEnter(onEnterComplete);
      });
    }
  }, [animateOnMount]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export default useBreathingTransition;
