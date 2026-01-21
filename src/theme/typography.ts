/**
 * Restorae Typography System
 * 
 * SINGLE SOURCE OF TRUTH - Re-exports from main theme index
 * Do not define typography values here, use theme/index.ts
 */

// Re-export everything from the main theme for backwards compatibility
export { typography, textStyles } from './index';

// Legacy aliases for backwards compatibility
import { typography as t, textStyles as ts } from './index';

export const fontFamily = t.fontFamily;
export const fontSize = t.fontSize;
export const lineHeight = t.lineHeight;
export const letterSpacing = t.letterSpacing;
export const fontWeight = t.fontWeight;

export type TextStyle = keyof typeof ts;
