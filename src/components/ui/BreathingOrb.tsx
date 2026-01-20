/**
 * BreathingOrb Component
 * Beautiful animated breathing visualization with organic motion
 */
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle as SvgCircle,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { withAlpha } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ORB_SIZE = Math.min(SCREEN_WIDTH * 0.65, 280);

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
const AnimatedG = Animated.createAnimatedComponent(G);

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

interface BreathingOrbProps {
  phase: Phase;
  phaseLabel: string;
  countdown?: number;
  progress?: number; // 0-1 progress through the cycle
  onTap?: () => void;
}

export function BreathingOrb({
  phase,
  phaseLabel,
  countdown,
  progress = 0,
  onTap,
}: BreathingOrbProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();

  // Animation values
  const orbScale = useSharedValue(0.6);
  const orbOpacity = useSharedValue(0.5);
  const glowIntensity = useSharedValue(0.3);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const idlePulse = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Idle pulsing animation
  useEffect(() => {
    if (reduceMotion) return;
    
    if (phase === 'idle') {
      idlePulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      // Slow rotation
      rotation.value = withRepeat(
        withTiming(360, { duration: 60000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(idlePulse);
      idlePulse.value = 0;
    }
  }, [phase, reduceMotion, idlePulse, rotation]);

  // Phase-based animations
  useEffect(() => {
    const duration = 200;
    
    switch (phase) {
      case 'idle':
        orbScale.value = withTiming(0.6, { duration });
        orbOpacity.value = withTiming(0.5, { duration });
        glowIntensity.value = withTiming(0.3, { duration });
        break;
      case 'inhale':
        orbScale.value = withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        orbOpacity.value = withTiming(0.85, { duration: 2000 });
        glowIntensity.value = withTiming(0.7, { duration: 3000 });
        break;
      case 'hold':
        glowIntensity.value = withTiming(0.9, { duration: 1000 });
        // Subtle pulse during hold
        ringScale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          false
        );
        ringOpacity.value = withTiming(0.5, { duration: 500 });
        break;
      case 'exhale':
        cancelAnimation(ringScale);
        ringOpacity.value = withTiming(0, { duration: 300 });
        orbScale.value = withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) });
        orbOpacity.value = withTiming(0.5, { duration: 4000 });
        glowIntensity.value = withTiming(0.3, { duration: 4000 });
        break;
      case 'complete':
        orbScale.value = withTiming(0.8, { duration: 500 });
        orbOpacity.value = withTiming(1, { duration: 300 });
        glowIntensity.value = withTiming(1, { duration: 500 });
        // Success pulse
        ringScale.value = 1;
        ringOpacity.value = withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(0, { duration: 600 })
        );
        ringScale.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(1.5, { duration: 600 })
        );
        break;
    }
  }, [phase, orbScale, orbOpacity, glowIntensity, ringScale, ringOpacity]);

  const handlePress = useCallback(async () => {
    await impactLight();
    onTap?.();
  }, [impactLight, onTap]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const idleScale = interpolate(idlePulse.value, [0, 1], [0.95, 1.05]);
    return {
      transform: [
        { scale: phase === 'idle' ? idleScale : 1 },
      ],
    };
  });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: orbScale.value },
    ],
    opacity: orbOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
    transform: [
      { scale: interpolate(glowIntensity.value, [0.3, 1], [0.9, 1.15]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [
      { scale: ringScale.value },
    ],
  }));

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // Colors
  const primaryColor = colors.accentPrimary;
  const secondaryColor = colors.accentCalm;
  const glowColor = withAlpha(primaryColor, 0.4);

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.orbContainer, containerStyle]}>
          {/* Outer glow */}
          <Animated.View style={[styles.glowLayer, glowStyle]}>
            <Svg width={ORB_SIZE * 1.8} height={ORB_SIZE * 1.8} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={glowColor} stopOpacity={0.6} />
                  <Stop offset="50%" stopColor={glowColor} stopOpacity={0.2} />
                  <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <SvgCircle cx="50" cy="50" r="50" fill="url(#outerGlow)" />
            </Svg>
          </Animated.View>

          {/* Pulsing ring */}
          <Animated.View style={[styles.ringLayer, ringStyle]}>
            <Svg width={ORB_SIZE * 1.2} height={ORB_SIZE * 1.2} viewBox="0 0 100 100">
              <SvgCircle
                cx="50"
                cy="50"
                r="48"
                stroke={primaryColor}
                strokeWidth="1"
                fill="none"
                opacity={0.6}
              />
            </Svg>
          </Animated.View>

          {/* Main orb */}
          <Animated.View style={[styles.mainOrb, orbStyle]}>
            <Svg width={ORB_SIZE} height={ORB_SIZE} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="orbGradient" cx="35%" cy="35%" r="65%">
                  <Stop offset="0%" stopColor={withAlpha('#FFFFFF', 0.3)} />
                  <Stop offset="30%" stopColor={primaryColor} />
                  <Stop offset="70%" stopColor={secondaryColor} />
                  <Stop offset="100%" stopColor={withAlpha(secondaryColor, 0.8)} />
                </RadialGradient>
                <RadialGradient id="innerHighlight" cx="30%" cy="30%" r="40%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <SvgCircle cx="50" cy="50" r="48" fill="url(#orbGradient)" />
              <SvgCircle cx="50" cy="50" r="48" fill="url(#innerHighlight)" />
            </Svg>

            {/* Rotating particle ring */}
            <Animated.View style={[styles.particleRing, rotatingStyle]}>
              <Svg width={ORB_SIZE * 0.9} height={ORB_SIZE * 0.9} viewBox="0 0 100 100">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + 42 * Math.cos(rad);
                  const y = 50 + 42 * Math.sin(rad);
                  return (
                    <SvgCircle
                      key={i}
                      cx={x}
                      cy={y}
                      r={1.5}
                      fill={withAlpha('#FFFFFF', 0.3 + (i % 3) * 0.1)}
                    />
                  );
                })}
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Center content */}
          <View style={styles.centerContent}>
            {countdown !== undefined && phase !== 'idle' && phase !== 'complete' ? (
              <Text variant="displayLarge" color="inkInverse" align="center">
                {countdown}
              </Text>
            ) : phase === 'idle' ? (
              <Text variant="labelLarge" color="inkInverse" align="center" style={{ opacity: 0.8 }}>
                Tap to begin
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>

      {/* Phase label */}
      <View style={styles.labelContainer}>
        <Text variant="headlineMedium" color="ink" align="center">
          {phaseLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  orbContainer: {
    width: ORB_SIZE * 1.8,
    height: ORB_SIZE * 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainOrb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginTop: 24,
  },
});
