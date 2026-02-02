/**
 * useSmartHaptics Hook
 * 
 * Intelligent haptic feedback that adapts to:
 * - Time of day (gentler at night)
 * - User preferences (intensity levels)
 * - Context (session type, user state)
 * 
 * Creates a more mindful, less jarring haptic experience.
 */
import { useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTimeAdaptiveTheme } from './useTimeAdaptiveTheme';

// =============================================================================
// TYPES
// =============================================================================

export type HapticIntensity = 'off' | 'gentle' | 'normal' | 'strong';
export type HapticContext = 'default' | 'session' | 'celebration' | 'alert' | 'ambient';

interface SmartHapticOptions {
  context?: HapticContext;
  forceIntensity?: HapticIntensity;
  bypassNightMode?: boolean;
}

// =============================================================================
// INTENSITY MAPPINGS
// =============================================================================

// How much to reduce haptics at night (percentage reduction)
const NIGHT_REDUCTION = 0.4; // 40% softer at night
const EVENING_REDUCTION = 0.2; // 20% softer in evening

// Map intensity setting to actual behavior
const INTENSITY_MAP: Record<HapticIntensity, number> = {
  off: 0,
  gentle: 0.5,
  normal: 1.0,
  strong: 1.5,
};

// =============================================================================
// HOOK
// =============================================================================

export function useSmartHaptics() {
  const { hapticsEnabled } = usePreferences();
  const { timeOfDay, isNightMode } = useTimeAdaptiveTheme();
  
  // Default to normal intensity (could be made configurable in settings)
  const hapticIntensity: HapticIntensity = 'normal';

  // Calculate effective intensity based on time and settings
  const getEffectiveIntensity = useCallback((options: SmartHapticOptions = {}): number => {
    if (!hapticsEnabled) return 0;
    
    const { context = 'default', forceIntensity, bypassNightMode } = options;
    
    // Get base intensity from setting or override
    const baseIntensity = INTENSITY_MAP[forceIntensity || hapticIntensity];
    if (baseIntensity === 0) return 0;

    // Apply time-based reduction unless bypassed
    let timeMultiplier = 1.0;
    if (!bypassNightMode) {
      if (isNightMode) {
        timeMultiplier = 1 - NIGHT_REDUCTION;
      } else if (timeOfDay === 'evening') {
        timeMultiplier = 1 - EVENING_REDUCTION;
      }
    }

    // Context-based adjustments
    let contextMultiplier = 1.0;
    switch (context) {
      case 'session':
        // Slightly softer during wellness sessions
        contextMultiplier = 0.85;
        break;
      case 'celebration':
        // Full intensity for celebrations
        contextMultiplier = 1.2;
        break;
      case 'alert':
        // Bypass reduction for important alerts
        contextMultiplier = 1.0;
        timeMultiplier = 1.0;
        break;
      case 'ambient':
        // Very gentle for ambient feedback
        contextMultiplier = 0.5;
        break;
    }

    return Math.min(baseIntensity * timeMultiplier * contextMultiplier, 1.5);
  }, [hapticsEnabled, hapticIntensity, timeOfDay, isNightMode]);

  // Determine which haptic style to use based on intensity
  const getHapticStyle = useCallback((
    targetIntensity: 'light' | 'medium' | 'heavy',
    effectiveIntensity: number
  ): Haptics.ImpactFeedbackStyle | null => {
    if (effectiveIntensity === 0) return null;

    // Scale down if needed
    if (effectiveIntensity < 0.5) {
      // Always use light when very gentle
      return Haptics.ImpactFeedbackStyle.Light;
    } else if (effectiveIntensity < 0.8) {
      // One step down
      if (targetIntensity === 'heavy') return Haptics.ImpactFeedbackStyle.Medium;
      return Haptics.ImpactFeedbackStyle.Light;
    } else if (effectiveIntensity <= 1.0) {
      // Normal - use as intended
      switch (targetIntensity) {
        case 'light': return Haptics.ImpactFeedbackStyle.Light;
        case 'medium': return Haptics.ImpactFeedbackStyle.Medium;
        case 'heavy': return Haptics.ImpactFeedbackStyle.Heavy;
      }
    } else {
      // Strong - one step up
      if (targetIntensity === 'light') return Haptics.ImpactFeedbackStyle.Medium;
      return Haptics.ImpactFeedbackStyle.Heavy;
    }
  }, []);

  // ==========================================================================
  // SMART HAPTIC METHODS
  // ==========================================================================

  const tap = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity(options);
    const style = getHapticStyle('light', intensity);
    if (style) {
      await Haptics.impactAsync(style);
    }
  }, [getEffectiveIntensity, getHapticStyle]);

  const press = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity(options);
    const style = getHapticStyle('medium', intensity);
    if (style) {
      await Haptics.impactAsync(style);
    }
  }, [getEffectiveIntensity, getHapticStyle]);

  const impact = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity(options);
    const style = getHapticStyle('heavy', intensity);
    if (style) {
      await Haptics.impactAsync(style);
    }
  }, [getEffectiveIntensity, getHapticStyle]);

  const selection = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity(options);
    if (intensity > 0) {
      await Haptics.selectionAsync();
    }
  }, [getEffectiveIntensity]);

  const success = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity({ ...options, context: options?.context || 'celebration' });
    if (intensity > 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [getEffectiveIntensity]);

  const warning = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity({ ...options, context: 'alert' });
    if (intensity > 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [getEffectiveIntensity]);

  const error = useCallback(async (options?: SmartHapticOptions) => {
    const intensity = getEffectiveIntensity({ ...options, context: 'alert' });
    if (intensity > 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [getEffectiveIntensity]);

  // Session-specific haptics (extra gentle)
  const sessionTap = useCallback(async () => {
    await tap({ context: 'session' });
  }, [tap]);

  const sessionPulse = useCallback(async () => {
    await press({ context: 'session' });
  }, [press]);

  // Ambient feedback (very subtle)
  const ambient = useCallback(async () => {
    await tap({ context: 'ambient' });
  }, [tap]);

  // Celebration pattern
  const celebrate = useCallback(async () => {
    const intensity = getEffectiveIntensity({ context: 'celebration' });
    if (intensity === 0) return;

    // Triple pulse celebration
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [getEffectiveIntensity]);

  return {
    // Basic smart haptics
    tap,
    press,
    impact,
    selection,
    success,
    warning,
    error,
    
    // Context-specific
    sessionTap,
    sessionPulse,
    ambient,
    celebrate,
    
    // Utility
    isEnabled: hapticsEnabled,
    intensity: hapticIntensity,
    isNightMode,
    getEffectiveIntensity,
  };
}
