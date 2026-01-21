/**
 * Restorae Responsive Utilities
 * Breakpoints and responsive helpers for tablet/landscape support
 */
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// BREAKPOINTS
// =============================================================================
export const breakpoints = {
  /** iPhone SE, small phones */
  xs: 320,
  /** iPhone 8, standard phones */
  sm: 375,
  /** iPhone 14 Pro, large phones */
  md: 390,
  /** iPhone 14 Pro Max, phablets */
  lg: 428,
  /** iPad Mini, small tablets */
  xl: 744,
  /** iPad Pro 11", tablets */
  '2xl': 834,
  /** iPad Pro 12.9", large tablets */
  '3xl': 1024,
} as const;

// =============================================================================
// DEVICE DETECTION
// =============================================================================
export const device = {
  /** Current screen width */
  width: SCREEN_WIDTH,
  /** Current screen height */
  height: SCREEN_HEIGHT,
  /** Is the device in portrait orientation */
  isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
  /** Is the device in landscape orientation */
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  /** Is this a small phone (iPhone SE size) */
  isSmallPhone: SCREEN_WIDTH < breakpoints.sm,
  /** Is this a standard phone */
  isPhone: SCREEN_WIDTH < breakpoints.xl,
  /** Is this a tablet */
  isTablet: SCREEN_WIDTH >= breakpoints.xl,
  /** Is this a large tablet (iPad Pro) */
  isLargeTablet: SCREEN_WIDTH >= breakpoints['2xl'],
  /** Pixel ratio for high DPI calculations */
  pixelRatio: PixelRatio.get(),
  /** Font scale factor set by user accessibility settings */
  fontScale: PixelRatio.getFontScale(),
} as const;

// =============================================================================
// RESPONSIVE SPACING
// =============================================================================
/**
 * Get responsive horizontal padding based on screen size
 */
export const getResponsivePadding = (): number => {
  if (device.isLargeTablet) return 48;
  if (device.isTablet) return 40;
  if (device.isSmallPhone) return 20;
  return 28; // Default
};

/**
 * Get responsive screen max width for content
 */
export const getMaxContentWidth = (): number => {
  if (device.isLargeTablet) return 800;
  if (device.isTablet) return 680;
  return SCREEN_WIDTH;
};

// =============================================================================
// RESPONSIVE GRID
// =============================================================================
/**
 * Get number of columns for grid layouts
 */
export const getGridColumns = (
  itemMinWidth: number = 150,
  gap: number = 16
): number => {
  const availableWidth = Math.min(getMaxContentWidth(), SCREEN_WIDTH) - getResponsivePadding() * 2;
  const columns = Math.floor((availableWidth + gap) / (itemMinWidth + gap));
  return Math.max(1, Math.min(columns, 6)); // Between 1-6 columns
};

/**
 * Get card width for grid layouts
 */
export const getCardWidth = (
  columns: number,
  gap: number = 16
): number => {
  const availableWidth = Math.min(getMaxContentWidth(), SCREEN_WIDTH) - getResponsivePadding() * 2;
  return (availableWidth - gap * (columns - 1)) / columns;
};

// =============================================================================
// RESPONSIVE TYPOGRAPHY
// =============================================================================
/**
 * Scale font size based on screen width
 * Ensures text remains readable on all screen sizes
 */
export const scaleFontSize = (
  baseSize: number,
  options?: { min?: number; max?: number }
): number => {
  const { min = baseSize * 0.85, max = baseSize * 1.15 } = options || {};
  
  // Scale factor: 1.0 at 390px (iPhone 14 Pro), scales proportionally
  const scaleFactor = SCREEN_WIDTH / 390;
  const scaled = baseSize * scaleFactor;
  
  // Clamp between min and max
  return Math.round(Math.min(max, Math.max(min, scaled)));
};

// =============================================================================
// RESPONSIVE HELPERS
// =============================================================================
/**
 * Get a value based on current breakpoint
 */
export function responsive<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  '3xl'?: T;
  default: T;
}): T {
  const width = SCREEN_WIDTH;
  
  if (width >= breakpoints['3xl'] && values['3xl'] !== undefined) return values['3xl'];
  if (width >= breakpoints['2xl'] && values['2xl'] !== undefined) return values['2xl'];
  if (width >= breakpoints.xl && values.xl !== undefined) return values.xl;
  if (width >= breakpoints.lg && values.lg !== undefined) return values.lg;
  if (width >= breakpoints.md && values.md !== undefined) return values.md;
  if (width >= breakpoints.sm && values.sm !== undefined) return values.sm;
  if (width >= breakpoints.xs && values.xs !== undefined) return values.xs;
  
  return values.default;
}

/**
 * Check if current screen width is at least the given breakpoint
 */
export const isAtLeast = (breakpoint: keyof typeof breakpoints): boolean => {
  return SCREEN_WIDTH >= breakpoints[breakpoint];
};

/**
 * Check if current screen width is below the given breakpoint
 */
export const isBelow = (breakpoint: keyof typeof breakpoints): boolean => {
  return SCREEN_WIDTH < breakpoints[breakpoint];
};

// =============================================================================
// SAFE AREA HELPERS
// =============================================================================
export const safeArea = {
  /** Extra bottom padding for devices with home indicator */
  bottomInset: Platform.OS === 'ios' ? 34 : 0,
  /** Extra top padding for devices with notch/dynamic island */
  topInset: Platform.OS === 'ios' ? 47 : 0,
};

// =============================================================================
// HOOK HELPER (for dynamic updates)
// =============================================================================
/**
 * Creates a dimension change handler
 * Use with Dimensions.addEventListener for responsive layouts
 */
export const createDimensionListener = (
  callback: (dimensions: { width: number; height: number }) => void
) => {
  return Dimensions.addEventListener('change', ({ window }) => {
    callback({ width: window.width, height: window.height });
  });
};
