/**
 * Restorae Design Tokens - Simplified
 * 
 * 20 semantic tokens for a cleaner, maintainable design system.
 * WCAG AA compliant.
 */

// =============================================================================
// SIMPLIFIED COLOR TOKENS
// =============================================================================

export interface ColorTokens {
  // Surfaces (3)
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text (4)
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Actions (3)
  actionPrimary: string;
  actionSecondary: string;
  actionDestructive: string;

  // Mood Colors (4)
  moodCalm: string;
  moodGood: string;
  moodAnxious: string;
  moodLow: string;

  // Feedback (3)
  success: string;
  warning: string;
  error: string;

  // Utility (3)
  border: string;
  borderStrong: string;
  overlay: string;
}

export const lightTokens: ColorTokens = {
  // Surfaces
  background: '#F2E7DB',
  surface: '#FFF7EF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#2B2018',
  textSecondary: '#5A4A3D',
  textTertiary: '#7A6B5E',
  textInverse: '#FFFFFF',

  // Actions
  actionPrimary: '#1F4D3A',
  actionSecondary: '#C8924A',
  actionDestructive: '#B65A4A',

  // Mood Colors
  moodCalm: '#7BA39F',
  moodGood: '#4F7F6A',
  moodAnxious: '#A58AB7',
  moodLow: '#9A8C80',

  // Feedback
  success: '#1F4D3A',
  warning: '#C8924A',
  error: '#B65A4A',

  // Utility
  border: '#E1D1C2',
  borderStrong: '#CBB8A7',
  overlay: 'rgba(43, 32, 24, 0.45)',
};

export const darkTokens: ColorTokens = {
  // Surfaces
  background: '#171310',
  surface: '#1F1A16',
  surfaceElevated: '#2A231E',

  // Text
  textPrimary: '#F7EDE3',
  textSecondary: '#D4C8BA',
  textTertiary: '#A89B8D',
  textInverse: '#171310',

  // Actions
  actionPrimary: '#6FA08B',
  actionSecondary: '#E0B27A',
  actionDestructive: '#D07A6A',

  // Mood Colors
  moodCalm: '#8C9E96',
  moodGood: '#7F9F8E',
  moodAnxious: '#BDA7CF',
  moodLow: '#9B8E80',

  // Feedback
  success: '#6FA08B',
  warning: '#E0B27A',
  error: '#D07A6A',

  // Utility
  border: '#2A231E',
  borderStrong: '#3A3029',
  overlay: 'rgba(0, 0, 0, 0.72)',
};

// =============================================================================
// SPACING (8-point grid — supports both numeric and named keys)
// =============================================================================
export const spacing = {
  0: 0,
  1: 4,   xs: 4,
  2: 8,   sm: 8,
  3: 12,
  4: 16,  md: 16,
  5: 20,
  6: 24,  lg: 24,
  8: 32,  xl: 32,
  10: 40,
  12: 48, '2xl': 48,
  16: 64, '3xl': 64,
  20: 80,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 30,
  full: 9999,
} as const;

// Named alias for compatibility
export const radius = borderRadius;

// =============================================================================
// TYPOGRAPHY
// =============================================================================
export const fontFamily = {
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  serif: 'Lora_400Regular',
  serifMedium: 'Lora_500Medium',
  serifBold: 'Lora_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 17,
  lg: 21,
  xl: 26,
  '2xl': 33,
  '3xl': 41,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// =============================================================================
// LAYOUT
// =============================================================================
export const layout = {
  screenPaddingHorizontal: 24,
  screenPadding: 24,
  cardPadding: 20,
  minTouchTarget: 44,
  tabBarHeight: 80,
  headerHeight: 56,
} as const;

// =============================================================================
// ANIMATION
// =============================================================================
export const animation = {
  fast: 200,
  normal: 300,
  slow: 400,
  easing: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0.0, 1, 1)',
    out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================
export const shadowLight = {
  sm: {
    shadowColor: '#2B2018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#2B2018',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2B2018',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const shadowDark = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
};

// =============================================================================
// GRADIENTS
// =============================================================================
export const gradientsLight = {
  calm: ['#F2EAE1', '#F7F1EA'] as const,
  morning: ['#F6EDE3', '#F1E3D5'] as const,
  evening: ['#EAD9C8', '#E2D1BF'] as const,
};

export const gradientsDark = {
  calm: ['#1B1915', '#171310'] as const,
  morning: ['#1C1713', '#171310'] as const,
  evening: ['#14110E', '#0E0B09'] as const,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
export const withAlpha = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// =============================================================================
// MOOD TYPE
// =============================================================================
export type MoodType = 'calm' | 'good' | 'anxious' | 'low';

export const moodLabels: Record<MoodType, string> = {
  calm: 'Calm',
  good: 'Good',
  anxious: 'Anxious',
  low: 'Low',
};

export const moodIcons: Record<MoodType, string> = {
  calm: '🌊',
  good: '☀️',
  anxious: '💨',
  low: '🌧️',
};
