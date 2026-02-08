/**
 * useBreathingAudio Hook
 *
 * Premium audio guidance for breathing sessions.
 * Plays singing-bowl/bell tones at phase transitions (inhale, hold, exhale, complete)
 * and optionally layers ambient background sound via useSessionAudio.
 *
 * Follows the useUISounds pattern: Audio.Sound cache, loading guard, preload/cleanup lifecycle.
 */
import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { usePreferences } from '../contexts/PreferencesContext';
import { useSessionAudio } from './useSessionAudio';
import logger from '../services/logger';

// =============================================================================
// TYPES
// =============================================================================
export type BreathingToneType = 'inhale' | 'hold' | 'exhale' | 'complete';

// =============================================================================
// TONE CONFIGURATION
// =============================================================================

// Singing bowl / bell sounds from Mixkit CDN (royalty-free)
const TONE_URLS: Record<BreathingToneType, string> = {
  inhale:   'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3', // Singing bowl strike
  hold:     'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3', // Soft ping
  exhale:   'https://assets.mixkit.co/active_storage/sfx/2514/2514-preview.mp3', // Warm low bell
  complete: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Achievement chime
};

// Lower volumes than UI sounds — these play during a calm session
const TONE_VOLUMES: Record<BreathingToneType, number> = {
  inhale:   0.4,
  hold:     0.2,
  exhale:   0.35,
  complete: 0.5,
};

// =============================================================================
// HOOK
// =============================================================================
export function useBreathingAudio() {
  const { breathingTonesEnabled, breathingAmbientEnabled } = usePreferences();
  const soundCache = useRef<Map<BreathingToneType, Audio.Sound>>(new Map());
  const isLoadingRef = useRef<Set<BreathingToneType>>(new Set());

  // Ambient background via existing session audio infrastructure
  const ambient = useSessionAudio({
    sessionType: 'breathing',
    autoStart: false,
  });

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      soundCache.current.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch {
          // Ignore cleanup errors
        }
      });
      soundCache.current.clear();
    };
  }, []);

  // Load a single tone (with caching and loading guard)
  const loadTone = useCallback(async (type: BreathingToneType): Promise<Audio.Sound | null> => {
    if (soundCache.current.has(type)) {
      return soundCache.current.get(type)!;
    }

    if (isLoadingRef.current.has(type)) {
      return null;
    }

    isLoadingRef.current.add(type);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: TONE_URLS[type] },
        { shouldPlay: false, volume: TONE_VOLUMES[type] }
      );
      soundCache.current.set(type, sound);
      isLoadingRef.current.delete(type);
      return sound;
    } catch (error) {
      logger.warn(`Failed to load breathing tone: ${type}`, error as Record<string, any>);
      isLoadingRef.current.delete(type);
      return null;
    }
  }, []);

  // Play a cached tone (fire-and-forget, never delays phase timers)
  const playTone = useCallback(async (type: BreathingToneType) => {
    if (!breathingTonesEnabled) return;

    try {
      const sound = await loadTone(type);
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch {
      // Silently fail — audio is non-critical
    }
  }, [breathingTonesEnabled, loadTone]);

  // Preload all 4 tones in parallel (call on mount)
  const preload = useCallback(async () => {
    if (!breathingTonesEnabled) return;
    const types: BreathingToneType[] = ['inhale', 'hold', 'exhale', 'complete'];
    await Promise.all(types.map(loadTone));
  }, [breathingTonesEnabled, loadTone]);

  // Cleanup all cached sounds
  const cleanup = useCallback(() => {
    soundCache.current.forEach(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore
      }
    });
    soundCache.current.clear();
  }, []);

  // Ambient controls (delegate to useSessionAudio)
  const startAmbient = useCallback(async () => {
    if (!breathingAmbientEnabled) return;
    await ambient.startAudio();
  }, [breathingAmbientEnabled, ambient]);

  const stopAmbient = useCallback(async () => {
    await ambient.stopAudio();
  }, [ambient]);

  // Convenience methods
  const playInhaleTone = useCallback(() => playTone('inhale'), [playTone]);
  const playHoldTone = useCallback(() => playTone('hold'), [playTone]);
  const playExhaleTone = useCallback(() => playTone('exhale'), [playTone]);
  const playCompleteTone = useCallback(() => playTone('complete'), [playTone]);

  return {
    // Phase tone triggers
    playInhaleTone,
    playHoldTone,
    playExhaleTone,
    playCompleteTone,

    // Ambient control
    startAmbient,
    stopAmbient,

    // Lifecycle
    preload,
    cleanup,

    // State
    isLoaded: soundCache.current.size > 0,
    tonesEnabled: breathingTonesEnabled,
    ambientEnabled: breathingAmbientEnabled,
    ambientSoundName: ambient.currentSoundName,
    ambientSoundIcon: ambient.currentSoundIcon,
  };
}

export default useBreathingAudio;
