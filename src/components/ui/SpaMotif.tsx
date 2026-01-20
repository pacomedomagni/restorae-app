import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { withAlpha } from '../../theme';

interface SpaMotifProps {
  style?: ViewStyle;
}

export function SpaMotif({ style }: SpaMotifProps) {
  const { colors } = useTheme();
  const stroke = withAlpha(colors.accentWarm, 0.18);
  const fill = withAlpha(colors.accentPrimary, 0.12);

  return (
    <Svg width="100%" height="100%" style={[styles.motif, style]} pointerEvents="none">
      <Circle cx="82%" cy="22%" r="36" stroke={stroke} strokeWidth="1.2" fill="none" />
      <Circle cx="86%" cy="18%" r="12" fill={fill} />
      <Path
        d="M10 120 C 80 40, 160 40, 230 120"
        stroke={stroke}
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M-20 160 C 60 80, 160 80, 260 160"
        stroke={withAlpha(colors.accentCalm, 0.14)}
        strokeWidth="1"
        fill="none"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  motif: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.5,
  },
});
