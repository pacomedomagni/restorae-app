/**
 * Restorae Theme System
 * Complete design tokens matching RESTORAE_SPEC.md
 */

export { light, dark, gradients, shadows, withAlpha } from './colors';
export type { ColorTokens, GradientTokens, ShadowTokens } from './colors';

// New simplified tokens (revamp)
export * from './tokens';

// Theme type for createStyles pattern (legacy compatibility)
export interface Theme {
  colors: import('./colors').ColorTokens;
  gradients: import('./colors').GradientTokens;
  shadows: import('./colors').ShadowTokens;
  isDark: boolean;
}

// Responsive utilities
export {
  breakpoints,
  device,
  responsive,
  getResponsivePadding,
  getMaxContentWidth,
  getGridColumns,
  getCardWidth,
  scaleFontSize,
  isAtLeast,
  isBelow,
  safeArea,
  createDimensionListener,
  getResponsiveOrbSize,
  getResponsiveCardHeight,
  getResponsiveTouchTarget,
  getModalMaxWidth,
  getResponsiveHeaderPadding,
} from './responsive';

// =============================================================================
// TYPOGRAPHY (matching spec: Plus Jakarta Sans for UI, Lora for display)
// =============================================================================
export const typography = {
  // Font families (wired to expo-google-fonts)
  fontFamily: {
    sansRegular: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemiBold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    serifRegular: 'Lora_400Regular',
    serifMedium: 'Lora_500Medium',
    serifSemiBold: 'Lora_600SemiBold',
    serifBold: 'Lora_700Bold',
  },
  
  // Scale ratio: 1.25 (Major Third)
  fontSize: {
    xs: 11,
    sm: 13,
    base: 17,
    lg: 21,
    xl: 26,
    '2xl': 33,
    '3xl': 41,
    '4xl': 52,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.7,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Pre-defined text styles for consistency
export const textStyles = {
  // Display - Large headlines (use sparingly, max 1 per screen)
  displayLarge: {
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: typography.fontFamily.serifBold,
  },
  displayMedium: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: typography.fontFamily.serifBold,
  },
  displaySmall: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.snug,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: typography.fontFamily.serifSemiBold,
  },
  
  // Headlines
  headlineLarge: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.snug,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.sansSemiBold,
  },
  headlineMedium: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.snug,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.sansSemiBold,
  },
  headlineSmall: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.snug,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.sansSemiBold,
  },
  
  // Body
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.sansRegular,
  },
  bodyMedium: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.sansRegular,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    fontWeight: typography.fontWeight.regular,
    fontFamily: typography.fontFamily.sansRegular,
  },
  
  // Labels
  labelLarge: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.sansMedium,
  },
  labelMedium: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.sansMedium,
  },
  labelSmall: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
    fontFamily: typography.fontFamily.sansMedium,
  },
};

// spacing, borderRadius, radius, layout, animation are all exported from tokens.ts via `export * from './tokens'` above
