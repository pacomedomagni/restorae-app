/**
 * useSessionAudio Hook
 * 
 * Premium audio management for breathing, grounding, and focus sessions.
 * Provides automatic sound selection based on session type and time of day.
 * 
 * Industry Standard Features:
 * - Time-aware ambient sound selection
 * - Session-type specific soundscapes
 * - Smooth fade in/out transitions
 * - Background audio support
 * - Memory-efficient sound management
 */
import { useCallback, useRef, useEffect, useState } from 'react';
import { useAudio, AMBIENT_SOUNDS_DATA } from '../contexts/AudioContext';

// =============================================================================
// TYPES
// =============================================================================
export type SessionType = 
  | 'breathing'
  | 'grounding'
  | 'focus'
  | 'meditation'
  | 'sleep'
  | 'morning'
  | 'evening'
  | 'sos';

export interface SessionAudioConfig {
  sessionType: SessionType;
  preferredSoundId?: string;
  autoStart?: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

// =============================================================================
// TIME-AWARE SOUND MAPPING
// =============================================================================

/**
 * Get appropriate ambient sound based on session type and time of day
 */
function getRecommendedSoundId(sessionType: SessionType): string {
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17 && hour < 21;
  const isNight = hour >= 21 || hour < 5;

  switch (sessionType) {
    case 'breathing':
      // Calming sounds for breathing
      if (isNight) return 'gentle-rain';
      if (isEvening) return 'fireplace';
      return 'ocean-waves';

    case 'grounding':
      // Nature sounds for grounding
      if (isNight) return 'night-crickets';
      if (isMorning) return 'forest-morning';
      return 'ocean-waves';

    case 'focus':
      // Concentration-friendly sounds
      if (isAfternoon) return 'coffee-shop';
      if (isEvening) return 'lo-fi-beats';
      return 'white-noise';

    case 'meditation':
      // Peaceful sounds for meditation
      if (isNight) return 'night-crickets';
      if (isEvening) return 'fireplace';
      return 'gentle-rain';

    case 'sleep':
      // Sleep-inducing sounds
      return isNight ? 'gentle-rain' : 'night-crickets';

    case 'morning':
      // Energizing morning sounds
      return 'forest-morning';

    case 'evening':
      // Calming evening sounds
      return 'fireplace';

    case 'sos':
      // Emergency calming sounds
      return 'gentle-rain';

    default:
      return 'gentle-rain';
  }
}

// =============================================================================
// HOOK
// =============================================================================
export function useSessionAudio(config: SessionAudioConfig) {
  const {
    sessionType,
    preferredSoundId,
    autoStart = false,
    fadeInDuration = 1500,
    fadeOutDuration = 1000,
  } = config;

  const audio = useAudio();
  const hasStartedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [currentSoundName, setCurrentSoundName] = useState<string>('');

  // Determine which sound to use
  const soundId = preferredSoundId || getRecommendedSoundId(sessionType);
  
  // Get sound info
  const soundInfo = AMBIENT_SOUNDS_DATA.find(s => s.id === soundId);

  useEffect(() => {
    if (soundInfo) {
      setCurrentSoundName(soundInfo.name);
      setIsReady(true);
    }
  }, [soundInfo]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && isReady && !hasStartedRef.current) {
      startAudio();
    }
    
    // Cleanup on unmount
    return () => {
      if (hasStartedRef.current) {
        stopAudio();
      }
    };
  }, [autoStart, isReady]);

  /**
   * Start playing the session audio with fade in
   */
  const startAudio = useCallback(async () => {
    if (hasStartedRef.current) return;
    
    hasStartedRef.current = true;
    await audio.playSound(soundId);
    await audio.fadeIn(fadeInDuration);
  }, [soundId, audio, fadeInDuration]);

  /**
   * Stop the session audio with fade out
   */
  const stopAudio = useCallback(async () => {
    if (!hasStartedRef.current) return;
    
    await audio.fadeOut(fadeOutDuration);
    await audio.stopSound();
    hasStartedRef.current = false;
  }, [audio, fadeOutDuration]);

  /**
   * Pause the audio without stopping
   */
  const pauseAudio = useCallback(async () => {
    await audio.pauseSound();
  }, [audio]);

  /**
   * Resume paused audio
   */
  const resumeAudio = useCallback(async () => {
    await audio.resumeSound();
  }, [audio]);

  /**
   * Change the sound during a session
   */
  const changeSound = useCallback(async (newSoundId: string) => {
    // Fade out current
    await audio.fadeOut(500);
    
    // Start new sound
    await audio.playSound(newSoundId);
    await audio.fadeIn(500);
    
    // Update name
    const newSoundInfo = AMBIENT_SOUNDS_DATA.find(s => s.id === newSoundId);
    if (newSoundInfo) {
      setCurrentSoundName(newSoundInfo.name);
    }
  }, [audio]);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    audio.setVolume(Math.max(0, Math.min(1, volume)));
  }, [audio]);

  return {
    // State
    isPlaying: audio.isPlaying,
    isLoading: audio.isLoading,
    isReady,
    currentSoundId: soundId,
    currentSoundName,
    currentSoundIcon: soundInfo?.icon || '🔊',
    volume: audio.volume,
    
    // Actions
    startAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    changeSound,
    setVolume,
    
    // Available sounds for picker
    availableSounds: AMBIENT_SOUNDS_DATA,
    
    // Recommended sound for session type
    recommendedSoundId: getRecommendedSoundId(sessionType),
  };
}

// =============================================================================
// SIMPLE HOOK FOR QUICK USE
// =============================================================================

/**
 * Simple hook for one-off sound effects (not looping ambient)
 */
export function useSoundEffect() {
  const audio = useAudio();

  const playCompletion = useCallback(async () => {
    // Could play a completion chime here
    // For now, just a placeholder
  }, []);

  const playStart = useCallback(async () => {
    // Could play a start sound here
  }, []);

  return {
    playCompletion,
    playStart,
  };
}

export default useSessionAudio;
