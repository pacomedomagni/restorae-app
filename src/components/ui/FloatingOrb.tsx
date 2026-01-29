/**
 * FloatingOrb - Hero visual element
 * 
 * An animated orb with glow effects and optional breathing animation.
 * Used in onboarding and other premium experiences.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { withAlpha } from '../../theme';
import { Logo } from '../Logo';

interface FloatingOrbProps {
  isBreathing?: boolean;
  size?: 'default' | 'large';
  showLogo?: boolean;
}

export function FloatingOrb({ 
  isBreathing = false, 
  size = 'default',
  showLogo = true,
}: FloatingOrbProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const innerScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  const orbSize = size === 'large' ? 200 : 160;

  useEffect(() => {
    if (reduceMotion) return;

    // Gentle ambient breathing
    if (!isBreathing) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Active breathing animation (4-7-8 simplified)
      const breathCycle = () => {
        // Inhale (grow)
        scale.value = withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        innerScale.value = withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        glowOpacity.value = withTiming(0.7, { duration: 4000 });
        
        // Hold & exhale
        setTimeout(() => {
          scale.value = withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) });
          innerScale.value = withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) });
          glowOpacity.value = withTiming(0.3, { duration: 6000 });
        }, 4500);
      };

      breathCycle();
      const interval = setInterval(breathCycle, 11000);
      return () => clearInterval(interval);
    }

    // Slow rotation for depth
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      cancelAnimation(rotation);
    };
  }, [isBreathing, reduceMotion, scale, innerScale, glowOpacity, rotation]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.orbContainer, { width: orbSize + 80, height: orbSize + 80 }]}>
      {/* Outer glow */}
      <Animated.View style={[styles.orbGlow, glowStyle]}>
        <Svg width={orbSize + 80} height={orbSize + 80} viewBox="0 0 280 280">
          <Defs>
            <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accentPrimary} stopOpacity={0.6} />
              <Stop offset="50%" stopColor={colors.accentCalm} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={colors.accentPrimary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <SvgCircle cx="140" cy="140" r="140" fill="url(#orbGlow)" />
        </Svg>
      </Animated.View>

      {/* Rotating ring */}
      <Animated.View style={[styles.orbRing, rotatingStyle]}>
        <Svg width={orbSize + 40} height={orbSize + 40} viewBox="0 0 240 240">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 120 + 110 * Math.cos(rad);
            const y = 120 + 110 * Math.sin(rad);
            const opacity = 0.15 + (i % 4) * 0.1;
            return (
              <SvgCircle
                key={i}
                cx={x}
                cy={y}
                r={2 + (i % 3)}
                fill={withAlpha(colors.accentPrimary, opacity)}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Main orb */}
      <Animated.View style={[styles.orbMain, containerStyle]}>
        <Animated.View style={innerStyle}>
          <View style={{ width: orbSize, height: orbSize, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={orbSize} height={orbSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="mainOrbGradient" cx="35%" cy="35%" r="65%">
                  <Stop offset="0%" stopColor={withAlpha('#FFFFFF', 0.3)} />
                  <Stop offset="30%" stopColor={colors.accentPrimary} />
                  <Stop offset="70%" stopColor={colors.accentCalm} />
                  <Stop offset="100%" stopColor={withAlpha(colors.accentCalm, 0.8)} />
                </RadialGradient>
                <RadialGradient id="highlight" cx="30%" cy="30%" r="40%">
                   <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
                   <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <SvgCircle cx="50" cy="50" r="48" fill="url(#mainOrbGradient)" />
              <SvgCircle cx="50" cy="50" r="48" fill="url(#highlight)" />
            </Svg>
            
            {/* Logo centered in orb */}
            {showLogo && <Logo size="hero" />}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbMain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingOrb;
