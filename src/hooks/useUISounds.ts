/**
 * UI Sound Effects Hook
 * 
 * Provides subtle, premium sound feedback for UI interactions.
 * All sounds respect the user's soundsEnabled preference.
 */
import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { usePreferences } from '../contexts/PreferencesContext';
import logger from '../services/logger';

// Sound effect types
export type UISoundType = 
  | 'tap'
  | 'success'
  | 'error'
  | 'transition'
  | 'toggle'
  | 'complete'
  | 'notification'
  | 'pop';

// Remote sound URLs (using royalty-free sounds from mixkit)
const SOUND_URLS: Record<UISoundType, string> = {
  tap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Soft click
  success: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Pleasant notification
  error: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Gentle negative
  transition: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Soft whoosh
  toggle: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Light switch
  complete: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Achievement chime
  notification: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3', // Soft ping
  pop: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Pop
};

// Volume levels for different sounds (0.0 to 1.0)
const SOUND_VOLUMES: Record<UISoundType, number> = {
  tap: 0.3,
  success: 0.5,
  error: 0.4,
  transition: 0.2,
  toggle: 0.3,
  complete: 0.6,
  notification: 0.5,
  pop: 0.4,
};

export function useUISounds() {
  const { soundsEnabled } = usePreferences();
  const soundCache = useRef<Map<UISoundType, Audio.Sound>>(new Map());
  const isLoadingRef = useRef<Set<UISoundType>>(new Set());

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      soundCache.current.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      soundCache.current.clear();
    };
  }, []);

  // Load a sound (with caching)
  const loadSound = useCallback(async (type: UISoundType): Promise<Audio.Sound | null> => {
    // Return cached sound if available
    if (soundCache.current.has(type)) {
      return soundCache.current.get(type)!;
    }

    // Prevent duplicate loading
    if (isLoadingRef.current.has(type)) {
      return null;
    }

    isLoadingRef.current.add(type);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: SOUND_URLS[type] },
        { shouldPlay: false, volume: SOUND_VOLUMES[type] }
      );
      soundCache.current.set(type, sound);
      isLoadingRef.current.delete(type);
      return sound;
    } catch (error) {
      logger.warn(`Failed to load UI sound: ${type}`, error);
      isLoadingRef.current.delete(type);
      return null;
    }
  }, []);

  // Play a sound
  const playSound = useCallback(async (type: UISoundType) => {
    if (!soundsEnabled) return;

    try {
      const sound = await loadSound(type);
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      // Silently fail - UI sounds are non-critical
    }
  }, [soundsEnabled, loadSound]);

  // Preload commonly used sounds
  const preloadSounds = useCallback(async () => {
    if (!soundsEnabled) return;
    
    const commonSounds: UISoundType[] = ['tap', 'success', 'toggle'];
    await Promise.all(commonSounds.map(loadSound));
  }, [soundsEnabled, loadSound]);

  // Convenience methods
  const playTap = useCallback(() => playSound('tap'), [playSound]);
  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playTransition = useCallback(() => playSound('transition'), [playSound]);
  const playToggle = useCallback(() => playSound('toggle'), [playSound]);
  const playComplete = useCallback(() => playSound('complete'), [playSound]);
  const playNotification = useCallback(() => playSound('notification'), [playSound]);
  const playPop = useCallback(() => playSound('pop'), [playSound]);

  return {
    playSound,
    playTap,
    playSuccess,
    playError,
    playTransition,
    playToggle,
    playComplete,
    playNotification,
    playPop,
    preloadSounds,
    soundsEnabled,
  };
}

export default useUISounds;
