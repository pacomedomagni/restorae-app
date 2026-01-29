/**
 * Restorae Typography System
 * 
 * Re-exports from main theme index for module compatibility.
 */

export { typography, textStyles } from './index';

export type TextStyle = keyof typeof import('./index').textStyles;
