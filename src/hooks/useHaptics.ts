import * as Haptics from 'expo-haptics';
import { usePreferences } from '../contexts/PreferencesContext';

export function useHaptics() {
  const { hapticsEnabled } = usePreferences();

  const impactLight = async () => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const impactMedium = async () => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const notificationSuccess = async () => {
    if (!hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const notificationError = async () => {
    if (!hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return {
    impactLight,
    impactMedium,
    notificationSuccess,
    notificationError,
  };
}
