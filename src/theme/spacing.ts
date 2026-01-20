/**
 * Restorae Spacing System
 * 8-point grid for consistent rhythm
 */

export const spacing = {
  0: 0,
  0.5: 2,   // Micro adjustments
  1: 4,     // Tight
  2: 8,     // Small
  3: 12,    // Compact
  4: 16,    // Base
  5: 20,    // Medium
  6: 24,    // Comfortable
  8: 32,    // Large
  10: 40,   // Spacious
  12: 48,   // Extra large
  16: 64,   // Section
  20: 80,   // Hero
  24: 96,   // Feature
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
};

// Screen padding
export const screenPadding = {
  horizontal: spacing[5],  // 20px
  vertical: spacing[6],    // 24px
};

// Component-specific spacing
export const componentSpacing = {
  // Cards
  card: {
    padding: spacing[5],
    gap: spacing[3],
  },
  
  // Buttons
  button: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  
  // Input fields
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  
  // Lists
  list: {
    gap: spacing[3],
    itemPadding: spacing[4],
  },
  
  // Sections
  section: {
    gap: spacing[6],
    headerGap: spacing[4],
  },
};

// Layout measurements
export const layout = {
  maxContentWidth: 428,  // iPhone 14 Pro Max width
  tabBarHeight: 80,
  headerHeight: 56,
  bottomSheetHandle: 24,
};
