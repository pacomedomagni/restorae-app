import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * Haptic Patterns for Restorae
 * 
 * Industry-standard haptic feedback patterns matching premium wellness apps:
 * - Light: Selections, minor interactions
 * - Medium: Primary actions, confirmations
 * - Heavy: Important actions, warnings
 * - Selection: Tab switches, toggles
 * - Success: Completions, achievements
 * - Error: Failures, destructive confirmations
 * - Breathing: Guided breathing sessions
 * - Celebration: Milestones, streaks
 * - Gentle: Subtle ambient feedback
 */

// Haptic pattern types for consistent usage across the app
export type HapticPattern = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'error'
  | 'celebration'
  | 'gentle'
  | 'breatheIn'
  | 'breatheOut'
  | 'breatheHold'
  | 'countdown'
  | 'milestone';

export function useHaptics() {
  const { hapticsEnabled } = usePreferences();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const celebrationRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // BASIC HAPTICS
  // ==========================================================================

  const impactLight = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, [hapticsEnabled]);

  const impactMedium = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  }, [hapticsEnabled]);

  const impactHeavy = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
  }, [hapticsEnabled]);

  const selectionLight = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.selectionAsync(); } catch {}
  }, [hapticsEnabled]);

  const notificationSuccess = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  }, [hapticsEnabled]);

  const notificationError = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
  }, [hapticsEnabled]);

  // ==========================================================================
  // PREMIUM BREATHING HAPTICS
  // ==========================================================================

  /**
   * Breathing in haptic - Medium pulse followed by gentle texture
   * Creates a "filling up" sensation
   */
  const breatheIn = useCallback(async (duration: number = 4000) => {
    if (!hapticsEnabled) return;

    try {
      // Initial medium cue to signal inhale start
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Subtle texture during inhale (every ~800ms)
      const steps = Math.floor(duration / 800);
      const stepTime = duration / steps;

      if (intervalRef.current) clearInterval(intervalRef.current);

      let count = 0;
      intervalRef.current = setInterval(async () => {
        count++;
        if (count >= steps) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }, stepTime);
    } catch {}
  }, [hapticsEnabled]);

  /**
   * Breathing hold haptic - Very gentle single pulse
   * Signals the hold phase without distraction
   */
  const breatheHold = useCallback(async () => {
    if (!hapticsEnabled) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, [hapticsEnabled]);

  /**
   * Breathing out haptic - Heavy pulse followed by fading texture
   * Creates a "releasing" sensation
   */
  const breatheOut = useCallback(async (duration: number = 4000) => {
    if (!hapticsEnabled) return;

    try {
      // Initial heavier cue for release
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Slower, fading texture for exhale
      const steps = Math.floor(duration / 1000);
      const stepTime = duration / steps;

      if (intervalRef.current) clearInterval(intervalRef.current);

      let count = 0;
      intervalRef.current = setInterval(async () => {
        count++;
        if (count >= steps) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }, stepTime);
    } catch {}
  }, [hapticsEnabled]);

  const stopHaptics = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (celebrationRef.current) clearInterval(celebrationRef.current);
  }, []);

  // ==========================================================================
  // CELEBRATION & MILESTONE HAPTICS
  // ==========================================================================

  /**
   * Celebration haptic pattern - Used for achievements, streaks, level ups
   * Creates an exciting, rewarding sensation
   */
  const celebration = useCallback(async () => {
    if (!hapticsEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      }, 150);

      setTimeout(async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
      }, 300);
    } catch {}
  }, [hapticsEnabled]);

  /**
   * Milestone haptic - Used for completing sessions, reaching goals
   * More subtle than celebration but still rewarding
   */
  const milestone = useCallback(async () => {
    if (!hapticsEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }, 200);
    } catch {}
  }, [hapticsEnabled]);

  /**
   * Countdown haptic - Used for session timers, countdowns
   * Single tick for each second/count
   */
  const countdown = useCallback(async (count: number) => {
    if (!hapticsEnabled) return;

    try {
      if (count <= 3) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  }, [hapticsEnabled]);

  /**
   * Gentle ambient haptic - Very subtle feedback for background events
   * Used for subtle UI confirmations without being intrusive
   */
  const gentle = useCallback(async () => {
    if (!hapticsEnabled) return;
    try { await Haptics.selectionAsync(); } catch {}
  }, [hapticsEnabled]);

  // ==========================================================================
  // UNIFIED HAPTIC TRIGGER
  // ==========================================================================

  /**
   * Trigger a haptic pattern by name
   * Useful for components that receive haptic type as a prop
   */
  const trigger = useCallback(async (pattern: HapticPattern) => {
    if (!hapticsEnabled) return;
    
    switch (pattern) {
      case 'light':
        await impactLight();
        break;
      case 'medium':
        await impactMedium();
        break;
      case 'heavy':
        await impactHeavy();
        break;
      case 'selection':
        await selectionLight();
        break;
      case 'success':
        await notificationSuccess();
        break;
      case 'error':
        await notificationError();
        break;
      case 'celebration':
        await celebration();
        break;
      case 'milestone':
        await milestone();
        break;
      case 'gentle':
        await gentle();
        break;
      case 'breatheIn':
        await breatheIn();
        break;
      case 'breatheOut':
        await breatheOut();
        break;
      case 'breatheHold':
        await breatheHold();
        break;
      case 'countdown':
        await countdown(3); // Default to 3-count
        break;
    }
  }, [
    hapticsEnabled,
    impactLight,
    impactMedium,
    impactHeavy,
    selectionLight,
    notificationSuccess,
    notificationError,
    celebration,
    milestone,
    gentle,
    breatheIn,
    breatheOut,
    breatheHold,
    countdown,
  ]);

  return {
    // Basic haptics
    impactLight,
    impactMedium,
    impactHeavy,
    selectionLight,
    notificationSuccess,
    notificationError,
    
    // Breathing haptics
    breatheIn,
    breatheOut,
    breatheHold,
    stopHaptics,
    
    // Premium haptics
    celebration,
    milestone,
    countdown,
    gentle,
    
    // Unified trigger
    trigger,
    
    // State
    isEnabled: hapticsEnabled,
  };
}
