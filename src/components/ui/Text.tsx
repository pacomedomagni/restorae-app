/**
 * Text Component - Premium Typography
 * Following RESTORAE_SPEC.md with enhanced readability
 */
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, Platform } from 'react-native';
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

  // Enhanced text rendering
  const enhancedStyle = {
    ...textStyles[variant],
    color: textColor,
    textAlign: align,
    // Better text rendering on iOS
    ...(Platform.OS === 'ios' && {
      fontVariant: ['tabular-nums' as const],
    }),
  } as const;

  return (
    <RNText
      style={[enhancedStyle, style]}
      allowFontScaling={true}
      maxFontSizeMultiplier={1.3}
      {...props}
    >
      {children}
    </RNText>
  );
}
