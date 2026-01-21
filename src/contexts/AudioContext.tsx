/**
 * AudioContext
 * 
 * Manages ambient sound playback for focus sessions
 * Uses expo-av for audio playback
 */
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef, useEffect } from 'react';
import { usePreferences } from './PreferencesContext';

// =============================================================================
// TYPES
// =============================================================================
export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'ambient' | 'music';
  // In a real app, this would be the actual audio file path
  audioFile?: string;
}

interface AudioState {
  currentSoundId: string | null;
  isPlaying: boolean;
  volume: number;
  isLoading: boolean;
}

interface AudioContextType extends AudioState {
  playSound: (soundId: string) => Promise<void>;
  pauseSound: () => Promise<void>;
  resumeSound: () => Promise<void>;
  stopSound: () => Promise<void>;
  setVolume: (volume: number) => void;
  fadeOut: (duration?: number) => Promise<void>;
  fadeIn: (duration?: number) => Promise<void>;
}

// =============================================================================
// AMBIENT SOUNDS DATA
// =============================================================================
export const AMBIENT_SOUNDS_DATA: AmbientSound[] = [
  { id: 'gentle-rain', name: 'Gentle Rain', icon: '🌧️', category: 'nature' },
  { id: 'ocean-waves', name: 'Ocean Waves', icon: '🌊', category: 'nature' },
  { id: 'forest-morning', name: 'Forest Morning', icon: '🌲', category: 'nature' },
  { id: 'night-crickets', name: 'Night Crickets', icon: '🦗', category: 'nature' },
  { id: 'fireplace', name: 'Fireplace', icon: '🔥', category: 'ambient' },
  { id: 'coffee-shop', name: 'Coffee Shop', icon: '☕', category: 'ambient' },
  { id: 'library', name: 'Library', icon: '📚', category: 'ambient' },
  { id: 'white-noise', name: 'White Noise', icon: '📻', category: 'ambient' },
  { id: 'brown-noise', name: 'Brown Noise', icon: '🟤', category: 'ambient' },
  { id: 'lo-fi-beats', name: 'Lo-Fi Beats', icon: '🎵', category: 'music' },
];

// =============================================================================
// CONTEXT
// =============================================================================
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function AudioProvider({ children }: { children: ReactNode }) {
  const { soundsEnabled } = usePreferences();
  
  const [state, setState] = useState<AudioState>({
    currentSoundId: null,
    isPlaying: false,
    volume: 0.7,
    isLoading: false,
  });

  // In a real implementation, this would use expo-av Audio.Sound
  const soundRef = useRef<any>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      // In real app: unload sound
    };
  }, []);

  const playSound = useCallback(async (soundId: string) => {
    if (!soundsEnabled) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // In a real app, load and play the actual audio file
      // const { sound } = await Audio.Sound.createAsync(require('./sounds/' + soundId + '.mp3'));
      // soundRef.current = sound;
      // await sound.playAsync();

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 300));

      setState(prev => ({
        ...prev,
        currentSoundId: soundId,
        isPlaying: true,
        isLoading: false,
      }));

      console.log(`[Audio] Playing: ${soundId}`);
    } catch (error) {
      console.error('[Audio] Failed to play sound:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [soundsEnabled]);

  const pauseSound = useCallback(async () => {
    try {
      // In real app: await soundRef.current?.pauseAsync();
      setState(prev => ({ ...prev, isPlaying: false }));
      console.log('[Audio] Paused');
    } catch (error) {
      console.error('[Audio] Failed to pause:', error);
    }
  }, []);

  const resumeSound = useCallback(async () => {
    if (!soundsEnabled || !state.currentSoundId) return;

    try {
      // In real app: await soundRef.current?.playAsync();
      setState(prev => ({ ...prev, isPlaying: true }));
      console.log('[Audio] Resumed');
    } catch (error) {
      console.error('[Audio] Failed to resume:', error);
    }
  }, [soundsEnabled, state.currentSoundId]);

  const stopSound = useCallback(async () => {
    try {
      // In real app: 
      // await soundRef.current?.stopAsync();
      // await soundRef.current?.unloadAsync();
      // soundRef.current = null;

      setState(prev => ({
        ...prev,
        currentSoundId: null,
        isPlaying: false,
      }));
      console.log('[Audio] Stopped');
    } catch (error) {
      console.error('[Audio] Failed to stop:', error);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    // In real app: soundRef.current?.setVolumeAsync(clampedVolume);
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const fadeOut = useCallback(async (duration = 2000) => {
    return new Promise<void>((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = state.volume / steps;
      let currentVolume = state.volume;

      fadeIntervalRef.current = setInterval(() => {
        currentVolume -= volumeStep;
        if (currentVolume <= 0) {
          clearInterval(fadeIntervalRef.current!);
          fadeIntervalRef.current = null;
          stopSound();
          resolve();
        } else {
          setVolume(currentVolume);
        }
      }, stepDuration);
    });
  }, [state.volume, stopSound, setVolume]);

  const fadeIn = useCallback(async (duration = 2000) => {
    const targetVolume = 0.7;
    return new Promise<void>((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = targetVolume / steps;
      let currentVolume = 0;

      setVolume(0);

      fadeIntervalRef.current = setInterval(() => {
        currentVolume += volumeStep;
        if (currentVolume >= targetVolume) {
          clearInterval(fadeIntervalRef.current!);
          fadeIntervalRef.current = null;
          setVolume(targetVolume);
          resolve();
        } else {
          setVolume(currentVolume);
        }
      }, stepDuration);
    });
  }, [setVolume]);

  const value = useMemo<AudioContextType>(() => ({
    ...state,
    playSound,
    pauseSound,
    resumeSound,
    stopSound,
    setVolume,
    fadeOut,
    fadeIn,
  }), [state, playSound, pauseSound, resumeSound, stopSound, setVolume, fadeOut, fadeIn]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

// =============================================================================
// HELPER HOOK - For focus sessions
// =============================================================================
export function useFocusAudio(soundId: string | undefined) {
  const audio = useAudio();
  const hasStartedRef = useRef(false);

  const startAudio = useCallback(async () => {
    if (soundId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      await audio.playSound(soundId);
      await audio.fadeIn(1000);
    }
  }, [soundId, audio]);

  const stopAudio = useCallback(async () => {
    if (hasStartedRef.current) {
      await audio.fadeOut(1000);
      hasStartedRef.current = false;
    }
  }, [audio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasStartedRef.current) {
        audio.stopSound();
      }
    };
  }, [audio]);

  return {
    ...audio,
    startAudio,
    stopAudio,
  };
}
