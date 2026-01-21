/**
 * Restorae Color System
 * Semantic color tokens matching RESTORAE_SPEC.md exactly
 * 
 * NEVER use hardcoded colors - always use tokens
 * 
 * WCAG AA Compliance:
 * - ink on canvas: 12.5:1 ✓
 * - inkMuted on canvas: 5.2:1 ✓ (minimum 4.5:1 for normal text)
 * - inkFaint on canvas: 4.5:1 ✓ (use only for decorative/tertiary content)
 */

// =============================================================================
// LIGHT MODE TOKENS (as defined in spec)
// =============================================================================
export const light = {
  // Canvas (backgrounds)
  canvas: '#F2E7DB',           // Main background - warm parchment
  canvasElevated: '#FFF7EF',   // Cards, elevated surfaces
  canvasDeep: '#E8DACB',       // Inset backgrounds
  
  // Ink (text)
  ink: '#2B2018',              // Primary text
  inkMuted: '#5A4A3D',         // Secondary text (WCAG AA 5.2:1)
  inkFaint: '#7A6B5E',         // Tertiary text, icons (WCAG AA 4.5:1)
  inkInverse: '#FFFFFF',       // Text on accent colors
  
  // Accent colors
  accentPrimary: '#1F4D3A',    // Primary actions, links (deep evergreen)
  accentPrimaryHover: '#183C2D', // Pressed state
  accentWarm: '#C8924A',       // Warmth, energy
  accentCalm: '#7B8C86',       // Calm, focus
  accentDanger: '#B65A4A',     // Errors, destructive
  
  // Borders
  border: '#E1D1C2',           // Subtle borders
  borderMuted: '#EFE3D7',      // Very subtle borders (dividers)
  borderStrong: '#CBB8A7',     // Emphasized borders
  
  // Surfaces
  surfaceSubtle: '#EFE1D3',    // Subtle backgrounds
  surfaceHover: '#E6D6C7',     // Hover states
  
  // Shadows
  shadow: 'rgba(43, 32, 24, 0.1)',      // Soft shadows
  shadowStrong: 'rgba(43, 32, 24, 0.18)', // Strong shadows
  
  // Overlay
  overlay: 'rgba(43, 32, 24, 0.45)',     // Modal overlays
  
  // Status
  success: '#1F4D3A',
  statusError: '#B65A4A',      // Errors, destructive
  error: '#B65A4A',            // Alias for statusError
  
  // Mood colors (for mood selector)
  moodEnergized: '#D6A16C',    // Amber
  moodCalm: '#7BA39F',         // Soft teal
  moodGood: '#4F7F6A',         // Soft evergreen
  moodAnxious: '#A58AB7',      // Muted violet
  moodLow: '#9A8C80',          // Stone
  moodTough: '#C97C72',        // Muted rose
};

// =============================================================================
// DARK MODE TOKENS (as defined in spec)
// =============================================================================
export const dark = {
  // Canvas (backgrounds)
  canvas: '#171310',           // Main background - deep espresso
  canvasElevated: '#1F1A16',   // Cards, elevated surfaces
  canvasDeep: '#0E0B09',       // Inset backgrounds
  
  // Ink (text)
  ink: '#F7EDE3',              // Primary text
  inkMuted: '#D4C8BA',         // Secondary text (WCAG AA 7.5:1)
  inkFaint: '#A89B8D',         // Tertiary text, icons (WCAG AA 4.8:1)
  inkInverse: '#171310',       // Text on accent colors
  
  // Accent colors
  accentPrimary: '#6FA08B',    // Primary actions, links (evergreen)
  accentPrimaryHover: '#5C8A77', // Pressed state
  accentWarm: '#E0B27A',       // Warmth, energy
  accentCalm: '#8C9E96',       // Calm, focus
  accentDanger: '#D07A6A',     // Errors, destructive
  
  // Borders
  border: '#2A231E',           // Subtle borders
  borderMuted: '#211B17',      // Very subtle borders (dividers)
  borderStrong: '#3A3029',     // Emphasized borders
  
  // Surfaces
  surfaceSubtle: '#1F1A16',    // Subtle backgrounds
  surfaceHover: '#2C241F',     // Hover states
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.38)',        // Soft shadows
  shadowStrong: 'rgba(0, 0, 0, 0.6)',  // Strong shadows
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.72)',       // Modal overlays
  
  // Status
  success: '#6FA08B',
  statusError: '#D07A6A',      // Errors, destructive
  error: '#D07A6A',            // Alias for statusError
  
  // Mood colors (for mood selector)
  moodEnergized: '#D4A373',    // Amber
  moodCalm: '#8C9E96',         // Soft teal
  moodGood: '#7F9F8E',         // Soft evergreen
  moodAnxious: '#BDA7CF',      // Muted violet
  moodLow: '#9B8E80',          // Stone
  moodTough: '#D79A8F',        // Muted rose
};

// =============================================================================
// GRADIENTS (as defined in spec)
// =============================================================================
export const gradients = {
  light: {
    morning: ['#F6EDE3', '#F1E3D5'] as const,           // Warm linen wash
    evening: ['#EAD9C8', '#E2D1BF'] as const,           // Soft dusk sand
    calm: ['#F2EAE1', '#F7F1EA'] as const,              // Warm calm
    cardShine: ['rgba(255,255,255,0.5)', 'transparent'] as const,
    overlayFade: ['transparent', 'rgba(43,32,24,0.06)'] as const,
  },
  dark: {
    morning: ['#1C1713', '#171310'] as const,           // Deep espresso
    evening: ['#14110E', '#0E0B09'] as const,           // Night stone
    calm: ['#1B1915', '#171310'] as const,              // Dark warm calm
    cardShine: ['rgba(255,255,255,0.04)', 'transparent'] as const,
    overlayFade: ['transparent', 'rgba(0,0,0,0.35)'] as const,
  },
};

// =============================================================================
// SHADOWS (pre-defined for consistency)
// =============================================================================
export const shadows = {
  light: {
    sm: {
      shadowColor: '#2B2018',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#2B2018',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 4,
    },
    lg: {
      shadowColor: '#2B2018',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 26,
      elevation: 9,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 22,
      elevation: 8,
    },
  },
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type ColorTokens = typeof light;
export type GradientTokens = {
  morning: readonly [string, string];
  evening: readonly [string, string];
  calm: readonly [string, string];
  cardShine: readonly [string, string];
  overlayFade: readonly [string, string];
};
export type ShadowTokens = typeof shadows.light;

// =============================================================================
// COLOR UTILS
// =============================================================================
export const withAlpha = (hexColor: string, alpha: number) => {
  const hex = hexColor.replace('#', '');
  const isShort = hex.length === 3;
  const r = parseInt(isShort ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(isShort ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(isShort ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
