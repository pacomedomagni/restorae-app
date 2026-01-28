/**
 * AudioContext
 * 
 * Manages ambient sound playback for focus sessions
 * Uses expo-av for audio playback
 */
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { usePreferences } from './PreferencesContext';
import logger from '../services/logger';

// =============================================================================
// TYPES
// =============================================================================
export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  category: 'nature' | 'ambient' | 'music';
  uri: string; // Remote URL for streaming
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
// AMBIENT SOUNDS DATA (Premium 4K Audio)
// =============================================================================
export const AMBIENT_SOUNDS_DATA: AmbientSound[] = [
  { id: 'gentle-rain', name: 'Gentle Rain', icon: '🌧️', category: 'nature', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1253.mp3' },
  { id: 'ocean-waves', name: 'Ocean Waves', icon: '🌊', category: 'nature', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1196.mp3' },
  { id: 'forest-morning', name: 'Forest Morning', icon: '🌲', category: 'nature', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-singing-1212.mp3' },
  { id: 'night-crickets', name: 'Night Crickets', icon: '🦗', category: 'nature', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-crickets-at-night-loop-2384.mp3' },
  { id: 'fireplace', name: 'Fireplace', icon: '🔥', category: 'ambient', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackling-1289.mp3' },
  { id: 'coffee-shop', name: 'Coffee Shop', icon: '☕', category: 'ambient', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-busy-restaurant-ambience-1249.mp3' },
  { id: 'white-noise', name: 'White Noise', icon: '📻', category: 'ambient', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-radio-static-noise-1279.mp3' },
  { id: 'lo-fi-beats', name: 'Lo-Fi Beats', icon: '🎵', category: 'music', uri: 'https://assets.mixkit.co/sfx/preview/mixkit-dreamy-vibes-177.mp3' },
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

  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup Audio Mode
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        logger.error('Failed to setup audio mode', e);
      }
    }
    setupAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSound = useCallback(async (soundId: string) => {
    if (!soundsEnabled) return;

    // Don't restart if already playing
    if (state.currentSoundId === soundId && state.isPlaying) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Unload previous sound
      if (soundRef.current) {
        await fadeOut(500); // Quick fade out current
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const soundData = AMBIENT_SOUNDS_DATA.find(s => s.id === soundId);
      if (!soundData) throw new Error(`Sound ${soundId} not found`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundData.uri },
        { 
          shouldPlay: true, 
          isLooping: true, 
          volume: 0, // Start silent for fade in
        }
      );
      
      soundRef.current = sound;
      
      // Update state
      setState(prev => ({ 
        ...prev, 
        currentSoundId: soundId, 
        isPlaying: true, 
        isLoading: false 
      }));

      // Fade in to target volume
      await sound.setVolumeAsync(0); // Ensure 0
      
      // Manual fade in
      let vol = 0;
      const targetVol = state.volume;
      const step = targetVol / 10;
      
      const interval = setInterval(async () => {
         vol += step;
         if (vol >= targetVol) {
           vol = targetVol;
           clearInterval(interval);
         }
         if (soundRef.current) await soundRef.current.setVolumeAsync(vol);
      }, 100);

    } catch (error) {
      logger.error('Error playing sound', error);
      setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    }
  }, [soundsEnabled, state.volume, fadeOut]); // added fadeOut to dep array

  // Helpers
  const pauseSound = async () => {
     if (soundRef.current) {
       await soundRef.current.pauseAsync();
       setState(prev => ({ ...prev, isPlaying: false }));
     }
  };

  const resumeSound = async () => {
     if (soundRef.current) {
       await soundRef.current.playAsync();
       setState(prev => ({ ...prev, isPlaying: true }));
     }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      await fadeOut(800);
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setState(prev => ({ ...prev, isPlaying: false, currentSoundId: null }));
    }
  };

  const setVolume = async (volume: number) => {
    setState(prev => ({ ...prev, volume }));
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(volume);
    }
  };

  const fadeOut = async (duration = 1000) => {
    if (!soundRef.current) return;
    
    // Simple linear fade out
    try {
      const startVol = (await soundRef.current.getStatusAsync() as any).volume || state.volume;
      const steps = 10;
      const stepTime = duration / steps;
      const volStep = startVol / steps;

      let currentVol = startVol;
      for (let i = 0; i < steps; i++) {
        currentVol = Math.max(0, currentVol - volStep);
        if (soundRef.current) await soundRef.current.setVolumeAsync(currentVol);
        await new Promise(r => setTimeout(r, stepTime));
      }
      if (soundRef.current) await soundRef.current.setVolumeAsync(0);
    } catch (e) {
      // Ignore errors during fade if unloaded
    }
  };

  const fadeIn = async (duration = 1000) => {
    if (!soundRef.current) return;
    // Similar to playSound logic but exposed
    const targetVol = state.volume;
    const steps = 10;
    const stepTime = duration / steps;
    const volStep = targetVol / steps;

    let currentVol = 0;
    for (let i = 0; i < steps; i++) {
        currentVol = Math.min(targetVol, currentVol + volStep);
        if (soundRef.current) await soundRef.current.setVolumeAsync(currentVol);
        await new Promise(r => setTimeout(r, stepTime));
    }
  };

  const value = useMemo(() => ({
    ...state,
    playSound,
    pauseSound,
    resumeSound,
    stopSound,
    setVolume,
    fadeOut,
    fadeIn,
  }), [state, playSound]);

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
