/**
 * Celebration Animations Component
 * Premium celebration effects that exceed industry standards
 * 
 * Features:
 * - Confetti explosion with physics
 * - Particle burst effects
 * - Achievement unlock animation
 * - Streak milestone celebration
 * - Level up fanfare
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// CONFETTI COMPONENT
// =============================================================================

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

interface ConfettiProps {
  active: boolean;
  intensity?: 'low' | 'medium' | 'high';
  onComplete?: () => void;
}

function ConfettiPieceComponent({ piece }: { piece: ConfettiPiece }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(piece.x);
  const rotate = useSharedValue(piece.rotation);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Entry
    scale.value = withDelay(
      piece.delay,
      withSpring(1, { damping: 8, stiffness: 150 })
    );

    // Fall
    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Sway
    translateX.value = withDelay(
      piece.delay,
      withRepeat(
        withSequence(
          withTiming(piece.x + (Math.random() - 0.5) * 80, { duration: 500 }),
          withTiming(piece.x - (Math.random() - 0.5) * 80, { duration: 500 })
        ),
        -1,
        true
      )
    );

    // Spin
    rotate.value = withDelay(
      piece.delay,
      withRepeat(
        withTiming(piece.rotation + 360, { duration: 2000 }),
        -1,
        false
      )
    );

    // Fade out at end
    opacity.value = withDelay(
      piece.delay + 2500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: piece.size,
    height: piece.size,
    backgroundColor: piece.color,
    borderRadius: piece.size / 4,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={animatedStyle} />;
}

export function Confetti({ active, intensity = 'medium', onComplete }: ConfettiProps) {
  const { colors } = useTheme();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const confettiColors = [
    colors.accentPrimary,
    colors.accentWarm,
    colors.accentCalm,
    '#FFD700', // Gold
    '#FF69B4', // Pink
    '#00CED1', // Cyan
    '#FF6347', // Coral
    '#9370DB', // Purple
  ];

  const pieceCount = intensity === 'high' ? 60 : intensity === 'medium' ? 40 : 20;

  useEffect(() => {
    if (active) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * SCREEN_WIDTH,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          size: 8 + Math.random() * 8,
          rotation: Math.random() * 360,
          delay: Math.random() * 300,
        });
      }
      setPieces(newPieces);

      // Cleanup after animation
      const timeout = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(piece => (
        <ConfettiPieceComponent key={piece.id} piece={piece} />
      ))}
    </View>
  );
}

// =============================================================================
// PARTICLE BURST COMPONENT
// =============================================================================

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

interface ParticleBurstProps {
  active: boolean;
  centerX?: number;
  centerY?: number;
  color?: string;
  onComplete?: () => void;
}

function ParticleComponent({ particle, centerX, centerY }: { particle: Particle; centerX: number; centerY: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 100 }));
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const x = centerX + Math.cos(particle.angle) * particle.distance * progress.value;
    const y = centerY + Math.sin(particle.angle) * particle.distance * progress.value;
    const scale = interpolate(progress.value, [0, 0.5, 1], [0, 1.2, 0]);
    const op = interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return {
      position: 'absolute',
      width: particle.size,
      height: particle.size,
      borderRadius: particle.size / 2,
      backgroundColor: particle.color,
      left: x - particle.size / 2,
      top: y - particle.size / 2,
      opacity: op * opacity.value,
      transform: [{ scale }],
    };
  });

  return <Animated.View style={animatedStyle} />;
}

export function ParticleBurst({
  active,
  centerX = SCREEN_WIDTH / 2,
  centerY = SCREEN_HEIGHT / 2,
  color,
  onComplete,
}: ParticleBurstProps) {
  const { colors } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = [];
      const particleCount = 24;
      const baseColor = color || colors.accentPrimary;

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        newParticles.push({
          id: i,
          angle,
          distance: 80 + Math.random() * 60,
          size: 6 + Math.random() * 6,
          color: i % 3 === 0 ? baseColor : withAlpha(baseColor, 0.6),
          delay: Math.random() * 100,
        });
      }
      setParticles(newParticles);

      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(particle => (
        <ParticleComponent
          key={particle.id}
          particle={particle}
          centerX={centerX}
          centerY={centerY}
        />
      ))}
    </View>
  );
}

// =============================================================================
// STREAK CELEBRATION
// =============================================================================

interface StreakCelebrationProps {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
}

export function StreakCelebration({ visible, streakCount, onClose }: StreakCelebrationProps) {
  const { colors } = useTheme();
  const { notificationSuccess } = useHaptics();
  const scale = useSharedValue(0);
  const fireScale = useSharedValue(1);
  const numberScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      notificationSuccess();
      
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      numberScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 150 }));
      
      // Pulsing fire
      fireScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      // Auto close
      const timeout = setTimeout(onClose, 3500);
      return () => clearTimeout(timeout);
    } else {
      scale.value = withTiming(0);
      numberScale.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  if (!visible) return null;

  const getMilestoneMessage = () => {
    if (streakCount >= 365) return "LEGENDARY! One year strong! 👑";
    if (streakCount >= 100) return "UNSTOPPABLE! 100 days! ⚡";
    if (streakCount >= 30) return "INCREDIBLE! A full month! 💪";
    if (streakCount >= 14) return "AMAZING! Two weeks strong! 🌟";
    if (streakCount >= 7) return "FANTASTIC! Week streak! 🔥";
    if (streakCount >= 3) return "Great start! Keep going! ✨";
    return "You're building momentum! 🌱";
  };

  return (
    <Animated.View style={[styles.celebrationOverlay, containerStyle]}>
      <Confetti active={visible} intensity={streakCount >= 30 ? 'high' : 'medium'} />
      
      <View style={[styles.celebrationCard, { backgroundColor: colors.canvasElevated }]}>
        <Animated.View style={fireStyle}>
          <Text style={styles.fireEmoji}>🔥</Text>
        </Animated.View>
        
        <Animated.View style={numberStyle}>
          <Text 
            variant="displayLarge" 
            style={[styles.streakNumber, { color: colors.accentWarm }]}
          >
            {streakCount}
          </Text>
        </Animated.View>
        
        <Text variant="headlineMedium" style={{ color: colors.ink, textAlign: 'center' }}>
          Day Streak!
        </Text>
        
        <Text 
          variant="bodyMedium" 
          style={{ color: colors.inkMuted, textAlign: 'center', marginTop: spacing[2] }}
        >
          {getMilestoneMessage()}
        </Text>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// ACHIEVEMENT UNLOCK
// =============================================================================

interface AchievementUnlockProps {
  visible: boolean;
  achievement: {
    title: string;
    description: string;
    icon: string;
    tier: string;
  } | null;
  onClose: () => void;
}

export function AchievementUnlock({ visible, achievement, onClose }: AchievementUnlockProps) {
  const { colors } = useTheme();
  const { notificationSuccess } = useHaptics();
  const containerScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const tierColors: Record<string, readonly [string, string]> = {
    bronze: ['#CD7F32', '#8B4513'] as const,
    silver: ['#C0C0C0', '#808080'] as const,
    gold: ['#FFD700', '#FFA500'] as const,
    platinum: ['#E5E4E2', '#A9A9A9'] as const,
    diamond: ['#B9F2FF', '#89CFF0'] as const,
  };

  useEffect(() => {
    if (visible && achievement) {
      notificationSuccess();
      
      containerScale.value = withSpring(1, { damping: 10, stiffness: 150 });
      
      // Badge wobble
      badgeRotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      // Shimmer effect
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );

      const timeout = setTimeout(onClose, 4000);
      return () => clearTimeout(timeout);
    } else {
      containerScale.value = withTiming(0);
    }
  }, [visible, achievement]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerScale.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${badgeRotate.value}deg` }],
  }));

  if (!visible || !achievement) return null;

  const gradientColors = tierColors[achievement.tier] || tierColors.bronze;

  return (
    <Animated.View style={[styles.celebrationOverlay, containerStyle]}>
      <ParticleBurst active={visible} color={gradientColors[0]} />
      
      <View style={[styles.achievementCard, { backgroundColor: colors.canvasElevated }]}>
        <Text variant="labelSmall" style={{ color: colors.inkMuted, marginBottom: spacing[2] }}>
          ACHIEVEMENT UNLOCKED
        </Text>
        
        <Animated.View style={[styles.achievementBadge, badgeStyle]}>
          <LinearGradient
            colors={gradientColors}
            style={styles.badgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          </LinearGradient>
        </Animated.View>
        
        <Text variant="headlineMedium" style={{ color: colors.ink, textAlign: 'center', marginTop: spacing[4] }}>
          {achievement.title}
        </Text>
        
        <Text variant="bodySmall" style={{ color: colors.inkMuted, textAlign: 'center', marginTop: spacing[1] }}>
          {achievement.description}
        </Text>
        
        <View style={[styles.tierBadge, { backgroundColor: withAlpha(gradientColors[0], 0.2) }]}>
          <Text variant="labelSmall" style={{ color: gradientColors[0], textTransform: 'uppercase' }}>
            {achievement.tier}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// LEVEL UP CELEBRATION
// =============================================================================

interface LevelUpProps {
  visible: boolean;
  newLevel: {
    level: number;
    title: string;
  } | null;
  onClose: () => void;
}

export function LevelUp({ visible, newLevel, onClose }: LevelUpProps) {
  const { colors } = useTheme();
  const { notificationSuccess } = useHaptics();
  const scale = useSharedValue(0);
  const starRotate = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (visible && newLevel) {
      notificationSuccess();
      
      scale.value = withSpring(1, { damping: 8, stiffness: 120 });
      
      // Star rotation
      starRotate.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );

      // Glow pulse
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );

      const timeout = setTimeout(onClose, 4500);
      return () => clearTimeout(timeout);
    } else {
      scale.value = withTiming(0);
    }
  }, [visible, newLevel]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${starRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.2]) }],
  }));

  if (!visible || !newLevel) return null;

  return (
    <Animated.View style={[styles.celebrationOverlay, containerStyle]}>
      <Confetti active={visible} intensity="high" />
      
      <View style={[styles.levelUpCard, { backgroundColor: colors.canvasElevated }]}>
        <Text variant="labelSmall" style={{ color: colors.accentPrimary }}>
          LEVEL UP!
        </Text>
        
        <Animated.View style={[styles.levelCircle, glowStyle, { borderColor: colors.accentPrimary }]}>
          <Animated.View style={starStyle}>
            <Text style={styles.levelStar}>⭐</Text>
          </Animated.View>
        </Animated.View>
        
        <Text 
          variant="displayMedium" 
          style={{ color: colors.accentPrimary, marginTop: spacing[3] }}
        >
          Level {newLevel.level}
        </Text>
        
        <Text variant="headlineSmall" style={{ color: colors.ink, marginTop: spacing[1] }}>
          {newLevel.title}
        </Text>
        
        <Text 
          variant="bodySmall" 
          style={{ color: colors.inkMuted, textAlign: 'center', marginTop: spacing[3] }}
        >
          Keep up the amazing work on your wellness journey!
        </Text>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// SESSION COMPLETE CELEBRATION
// =============================================================================

interface SessionCompleteProps {
  visible: boolean;
  sessionType: string;
  duration: number;
  xpEarned: number;
  streakDay?: number;
  onClose: () => void;
}

export function SessionComplete({
  visible,
  sessionType,
  duration,
  xpEarned,
  streakDay,
  onClose,
}: SessionCompleteProps) {
  const { colors } = useTheme();
  const { notificationSuccess } = useHaptics();
  const scale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      notificationSuccess();
      
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      checkScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 150 }));
      statsOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

      const timeout = setTimeout(onClose, 3000);
      return () => clearTimeout(timeout);
    } else {
      scale.value = withTiming(0);
      checkScale.value = 0;
      statsOpacity.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.celebrationOverlay, containerStyle]}>
      <ParticleBurst active={visible} color={colors.accentPrimary} />
      
      <View style={[styles.sessionCard, { backgroundColor: colors.canvasElevated }]}>
        <Animated.View style={[styles.checkCircle, checkStyle, { backgroundColor: colors.accentPrimary }]}>
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>
        
        <Text variant="headlineMedium" style={{ color: colors.ink, marginTop: spacing[4] }}>
          Well Done!
        </Text>
        
        <Text variant="bodyMedium" style={{ color: colors.inkMuted }}>
          {sessionType} complete
        </Text>
        
        <Animated.View style={[styles.statsRow, statsStyle]}>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: colors.accentPrimary }}>
              {duration}
            </Text>
            <Text variant="labelSmall" style={{ color: colors.inkMuted }}>
              minutes
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: colors.accentWarm }}>
              +{xpEarned}
            </Text>
            <Text variant="labelSmall" style={{ color: colors.inkMuted }}>
              XP
            </Text>
          </View>
          
          {streakDay && (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: colors.accentCalm }}>
                  {streakDay}🔥
                </Text>
                <Text variant="labelSmall" style={{ color: colors.inkMuted }}>
                  streak
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
  },
  celebrationCard: {
    padding: spacing[8],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fireEmoji: {
    fontSize: 64,
    marginBottom: spacing[2],
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
  },
  achievementCard: {
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  achievementBadge: {
    marginTop: spacing[3],
  },
  badgeGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 48,
  },
  tierBadge: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  levelUpCard: {
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  levelCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  levelStar: {
    fontSize: 48,
  },
  sessionCard: {
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 40,
    color: 'white',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[5],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  statDivider: {
    width: 1,
    height: 40,
  },
});

export default {
  Confetti,
  ParticleBurst,
  StreakCelebration,
  AchievementUnlock,
  LevelUp,
  SessionComplete,
};
