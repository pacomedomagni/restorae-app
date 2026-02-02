/**
 * Text Component - Core
 * 
 * Unified text component with semantic variants.
 * Supports accessibility and dynamic type.
 */
import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { fontFamily, fontSize, lineHeight } from '../../theme/tokens';

export type TextVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'action'
  | 'error'
  | 'success';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, object> = {
  displayLarge: {
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    fontFamily: fontFamily.serifBold,
    fontWeight: '700',
  },
  displayMedium: {
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    fontFamily: fontFamily.serifBold,
    fontWeight: '700',
  },
  displaySmall: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
    fontFamily: fontFamily.serifMedium,
    fontWeight: '500',
  },
  headlineLarge: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.normal,
    fontFamily: fontFamily.sansSemiBold,
    fontWeight: '600',
  },
  headlineMedium: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    fontFamily: fontFamily.sansSemiBold,
    fontWeight: '600',
  },
  headlineSmall: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    fontFamily: fontFamily.sansSemiBold,
    fontWeight: '600',
  },
  bodyLarge: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    fontFamily: fontFamily.sans,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
    fontFamily: fontFamily.sans,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.relaxed,
    fontFamily: fontFamily.sans,
    fontWeight: '400',
  },
  labelLarge: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
  },
  labelMedium: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export function Text({
  variant = 'bodyMedium',
  color: _color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  // Note: colors will be injected via useTheme hook at usage site
  // This component just provides structure - color is passed via style
  
  return (
    <RNText
      style={[
        variantStyles[variant],
        { textAlign: align },
        style,
      ]}
      allowFontScaling={true}
      maxFontSizeMultiplier={1.3}
      {...props}
    >
      {children}
    </RNText>
  );
}
