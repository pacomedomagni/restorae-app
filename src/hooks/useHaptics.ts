import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';

export function useHaptics() {
  const { hapticsEnabled } = usePreferences();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const impactLight = async () => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const impactMedium = async () => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const impactHeavy = async () => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const selectionLight = async () => {
    if (!hapticsEnabled) return;
    await Haptics.selectionAsync();
  };

  const notificationSuccess = async () => {
    if (!hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const notificationError = async () => {
    if (!hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  // Premium "Breathing" Haptics
  const breatheIn = useCallback(async (duration: number = 4000) => {
    if (!hapticsEnabled) return;
    
    // Initial strong cue
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Subtle "texture" during inhale (every ~800ms) to guide the user without annoyance
    const steps = 4;
    const stepTime = duration / steps;
    
    // Clear any existing pattern
    if (intervalRef.current) clearInterval(intervalRef.current);

    let count = 0;
    intervalRef.current = setInterval(async () => {
      count++;
      if (count >= steps) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, stepTime);
  }, [hapticsEnabled]);

  const breatheOut = useCallback(async (duration: number = 4000) => {
     if (!hapticsEnabled) return;
     
     // Initial strong cue for release
     await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
     
     // Slower texture for exhale
     if (intervalRef.current) clearInterval(intervalRef.current);
   }, [hapticsEnabled]);

   const stopHaptics = useCallback(() => {
     if (intervalRef.current) clearInterval(intervalRef.current);
   }, []);

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    selectionLight,
    notificationSuccess,
    notificationError,
    breatheIn,
    breatheOut,
    stopHaptics
  };
}
