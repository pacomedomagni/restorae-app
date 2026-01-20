/**
 * Text Component
 * Typography following RESTORAE_SPEC.md
 */
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme';

type TextVariant = keyof typeof textStyles;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'ink' | 'inkMuted' | 'inkFaint' | 'inkInverse' | 'accent';
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'bodyMedium',
  color = 'ink',
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const { colors } = useTheme();

  const textColor = {
    ink: colors.ink,
    inkMuted: colors.inkMuted,
    inkFaint: colors.inkFaint,
    inkInverse: colors.inkInverse,
    accent: colors.accentPrimary,
  }[color];

  return (
    <RNText
      style={[
        textStyles[variant],
        { color: textColor, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
