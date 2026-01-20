import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { withAlpha } from '../../theme';

export function SpaCardTexture() {
  const { colors } = useTheme();
  const dot = withAlpha(colors.ink, 0.06);
  const line = withAlpha(colors.accentWarm, 0.12);

  return (
    <Svg width="100%" height="100%" style={styles.texture} pointerEvents="none">
      <Path
        d="M-10 40 C 40 10, 90 10, 140 40"
        stroke={line}
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M120 120 C 170 90, 220 90, 270 120"
        stroke={withAlpha(colors.accentCalm, 0.1)}
        strokeWidth="1"
        fill="none"
      />
      <Circle cx="32" cy="24" r="1.1" fill={dot} />
      <Circle cx="80" cy="52" r="0.9" fill={dot} />
      <Circle cx="140" cy="34" r="1" fill={dot} />
      <Circle cx="210" cy="78" r="0.8" fill={dot} />
      <Circle cx="60" cy="120" r="1" fill={dot} />
      <Circle cx="180" cy="150" r="0.9" fill={dot} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  texture: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.45,
  },
});
