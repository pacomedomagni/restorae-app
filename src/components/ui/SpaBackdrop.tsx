import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { withAlpha } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const textureDots = [
  { x: 32, y: 48, r: 1.1 },
  { x: 120, y: 90, r: 0.9 },
  { x: 220, y: 60, r: 1.2 },
  { x: 80, y: 180, r: 1.0 },
  { x: 260, y: 160, r: 0.8 },
  { x: 40, y: 320, r: 1.1 },
  { x: 180, y: 280, r: 0.9 },
  { x: 300, y: 260, r: 1.0 },
  { x: 120, y: 420, r: 1.1 },
  { x: 260, y: 440, r: 0.9 },
  { x: 60, y: 560, r: 1.0 },
  { x: 220, y: 620, r: 1.1 },
];

export function SpaBackdrop() {
  const { colors } = useTheme();

  return (
    <>
      <View pointerEvents="none" style={[styles.blobWarm, { backgroundColor: withAlpha(colors.accentWarm, 0.12) }]} />
      <View pointerEvents="none" style={[styles.blobCalm, { backgroundColor: withAlpha(colors.accentCalm, 0.12) }]} />
      <LinearGradient
        colors={[withAlpha(colors.accentWarm, 0.1), 'transparent']}
        style={styles.wash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[withAlpha(colors.accentPrimary, 0.08), 'transparent']}
        style={styles.washAlt}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      <Svg
        pointerEvents="none"
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={styles.texture}
      >
        {textureDots.map((dot, index) => (
          <Circle
            key={`dot-${index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={withAlpha(colors.ink, 0.06)}
          />
        ))}
      </Svg>
    </>
  );
}

const styles = StyleSheet.create({
  blobWarm: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -120,
    right: -140,
  },
  blobCalm: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: 140,
    left: -130,
  },
  wash: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: 220,
    right: -160,
    transform: [{ rotate: '12deg' }],
  },
  washAlt: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: -90,
    right: 60,
    transform: [{ rotate: '-10deg' }],
  },
  texture: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.25,
  },
});
