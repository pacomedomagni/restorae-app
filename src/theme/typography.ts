/**
 * Restorae Typography System
 * Plus Jakarta Sans (UI) + System fallbacks
 * Scale ratio: 1.25 (Major Third)
 */

export const fontFamily = {
  // UI Text - Clean, modern
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  
  // Display Text - Elegant serifs (will load custom fonts later)
  display: 'System',
  displayMedium: 'System',
};

export const fontSize = {
  // Base: 16px, Ratio: 1.25
  xs: 11,      // 16 / 1.25 / 1.25
  sm: 13,      // 16 / 1.25
  base: 16,    // Base
  lg: 20,      // 16 * 1.25
  xl: 25,      // 16 * 1.25^2
  '2xl': 31,   // 16 * 1.25^3
  '3xl': 39,   // 16 * 1.25^4
  '4xl': 49,   // 16 * 1.25^5
};

export const lineHeight = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Predefined text styles
export const textStyles = {
  // Display - Large headlines
  displayLarge: {
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },
  
  // Headlines
  headlineLarge: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  headlineMedium: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.snug,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  headlineSmall: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.snug,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  
  // Body text
  bodyLarge: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.relaxed,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.relaxed,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  
  // Labels
  labelLarge: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelMedium: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wider,
  },
  
  // Captions
  caption: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.wide,
  },
};

export type TextStyle = keyof typeof textStyles;
