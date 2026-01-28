/**
 * Audio Service
 * 
 * Professional audio playback service with:
 * - Background audio support
 * - Crossfade between tracks
 * - Queue management
 * - Sleep timer
 * - Volume control with fade
 * - Playback state management
 */
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

// Types
export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  uri: string;
  duration?: number;
  artwork?: string;
  type: 'story' | 'soundscape' | 'music' | 'guided';
}

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTrack: AudioTrack | null;
  position: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  sleepTimerRemaining: number | null;
}

export type PlaybackStateListener = (state: PlaybackState) => void;

// Storage keys
const STORAGE_KEYS = {
  VOLUME: '@restorae/audio_volume',
  LAST_POSITION: '@restorae/audio_last_position',
  LAST_TRACK: '@restorae/audio_last_track',
};

class AudioService {
  private sound: Audio.Sound | null = null;
  private nextSound: Audio.Sound | null = null; // For crossfade
  private currentTrack: AudioTrack | null = null;
  private queue: AudioTrack[] = [];
  private queueIndex: number = 0;
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private listeners: Set<PlaybackStateListener> = new Set();
  private sleepTimer: NodeJS.Timeout | null = null;
  private sleepTimerRemaining: number | null = null;
  private sleepTimerInterval: NodeJS.Timeout | null = null;
  private fadeInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  // Config
  private readonly CROSSFADE_DURATION = 2000; // 2 seconds
  private readonly FADE_STEPS = 20;
  private readonly DEFAULT_VOLUME = 1.0;

  /**
   * Initialize audio service with background mode
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load saved volume
      const savedVolume = await AsyncStorage.getItem(STORAGE_KEYS.VOLUME);
      if (savedVolume) {
        this.volume = parseFloat(savedVolume);
      }

      // Handle app state changes
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      this.isInitialized = true;
      logger.info('Audio service initialized');
    } catch (error) {
      logger.error('Audio initialization failed:', error);
    }
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // Audio continues in background due to staysActiveInBackground: true
    if (nextAppState === 'active') {
      // App came to foreground - sync UI state
      this.notifyListeners();
    }
  };

  /**
   * Load and play a track
   */
  async play(track: AudioTrack): Promise<void> {
    try {
      await this.initialize();

      // If same track, just resume
      if (this.currentTrack?.id === track.id && this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.sound.playAsync();
          this.notifyListeners();
          return;
        }
      }

      // Crossfade if already playing
      if (this.sound && this.currentTrack) {
        await this.crossfadeTo(track);
      } else {
        await this.loadAndPlay(track);
      }
    } catch (error) {
      logger.error('Play failed:', error);
      throw error;
    }
  }

  private async loadAndPlay(track: AudioTrack): Promise<void> {
    // Unload current sound
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }

    this.currentTrack = track;
    this.notifyListeners();

    // Create new sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: track.uri },
      { 
        shouldPlay: true,
        volume: this.isMuted ? 0 : this.volume,
        progressUpdateIntervalMillis: 500,
      },
      this.onPlaybackStatusUpdate
    );

    this.sound = sound;
    this.notifyListeners();

    // Save last track
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_TRACK, JSON.stringify(track));
  }

  /**
   * Crossfade to new track
   */
  private async crossfadeTo(track: AudioTrack): Promise<void> {
    if (!this.sound) {
      await this.loadAndPlay(track);
      return;
    }

    // Load next track at 0 volume
    const { sound: nextSound } = await Audio.Sound.createAsync(
      { uri: track.uri },
      { 
        shouldPlay: true,
        volume: 0,
        progressUpdateIntervalMillis: 500,
      }
    );
    this.nextSound = nextSound;

    const currentSound = this.sound;
    const stepDuration = this.CROSSFADE_DURATION / this.FADE_STEPS;
    const volumeStep = this.volume / this.FADE_STEPS;
    let step = 0;

    return new Promise((resolve) => {
      this.fadeInterval = setInterval(async () => {
        step++;
        
        try {
          // Fade out current
          const currentVolume = Math.max(0, this.volume - (volumeStep * step));
          await currentSound.setVolumeAsync(this.isMuted ? 0 : currentVolume);

          // Fade in next
          const nextVolume = Math.min(this.volume, volumeStep * step);
          await nextSound.setVolumeAsync(this.isMuted ? 0 : nextVolume);

          if (step >= this.FADE_STEPS) {
            clearInterval(this.fadeInterval!);
            this.fadeInterval = null;

            // Cleanup old sound
            await currentSound.unloadAsync();

            // Set next as current
            this.sound = this.nextSound;
            this.nextSound = null;
            this.currentTrack = track;

            // Set up status listener
            this.sound?.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);

            this.notifyListeners();
            resolve();
          }
        } catch (error) {
          clearInterval(this.fadeInterval!);
          logger.error('Crossfade error:', error);
          resolve();
        }
      }, stepDuration);
    });
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const successStatus = status as AVPlaybackStatusSuccess;

    // Track finished
    if (successStatus.didJustFinish) {
      this.onTrackFinished();
    }

    // Save position periodically
    if (successStatus.positionMillis > 0 && this.currentTrack) {
      AsyncStorage.setItem(
        `${STORAGE_KEYS.LAST_POSITION}_${this.currentTrack.id}`,
        String(successStatus.positionMillis)
      );
    }

    this.notifyListeners();
  };

  private async onTrackFinished(): Promise<void> {
    // Play next in queue if available
    if (this.queueIndex < this.queue.length - 1) {
      this.queueIndex++;
      await this.play(this.queue[this.queueIndex]);
    } else {
      // Queue finished
      this.currentTrack = null;
      this.notifyListeners();
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.notifyListeners();
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
      this.notifyListeners();
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause(): Promise<void> {
    if (!this.sound) return;

    const status = await this.sound.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await this.pause();
      } else {
        await this.resume();
      }
    }
  }

  /**
   * Stop playback
   */
  async stop(): Promise<void> {
    this.clearSleepTimer();

    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }

    this.currentTrack = null;
    this.queue = [];
    this.queueIndex = 0;
    this.notifyListeners();
  }

  /**
   * Seek to position
   */
  async seekTo(positionMs: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMs);
      this.notifyListeners();
    }
  }

  /**
   * Skip forward/backward
   */
  async skip(seconds: number): Promise<void> {
    if (!this.sound) return;

    const status = await this.sound.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.max(0, status.positionMillis + (seconds * 1000));
      await this.seekTo(Math.min(newPosition, status.durationMillis || newPosition));
    }
  }

  /**
   * Set volume (0-1)
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.sound && !this.isMuted) {
      await this.sound.setVolumeAsync(this.volume);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.VOLUME, String(this.volume));
    this.notifyListeners();
  }

  /**
   * Fade volume to target
   */
  async fadeVolumeTo(targetVolume: number, durationMs: number = 1000): Promise<void> {
    if (!this.sound) return;

    const startVolume = this.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = volumeDiff / steps;
    let step = 0;

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        step++;
        const newVolume = startVolume + (volumeStep * step);
        await this.setVolume(newVolume);

        if (step >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Toggle mute
   */
  async toggleMute(): Promise<void> {
    this.isMuted = !this.isMuted;

    if (this.sound) {
      await this.sound.setVolumeAsync(this.isMuted ? 0 : this.volume);
    }

    this.notifyListeners();
  }

  /**
   * Set sleep timer
   */
  setSleepTimer(minutes: number): void {
    this.clearSleepTimer();

    const durationMs = minutes * 60 * 1000;
    this.sleepTimerRemaining = durationMs;

    // Countdown interval
    this.sleepTimerInterval = setInterval(() => {
      if (this.sleepTimerRemaining !== null) {
        this.sleepTimerRemaining -= 1000;
        if (this.sleepTimerRemaining <= 0) {
          this.sleepTimerRemaining = null;
        }
        this.notifyListeners();
      }
    }, 1000);

    // Actual sleep timer
    this.sleepTimer = setTimeout(async () => {
      // Fade out then stop
      await this.fadeVolumeTo(0, 10000); // 10 second fade
      await this.stop();
      
      // Restore volume for next play
      this.volume = this.DEFAULT_VOLUME;
    }, durationMs);

    this.notifyListeners();
    logger.info(`Sleep timer set for ${minutes} minutes`);
  }

  /**
   * Clear sleep timer
   */
  clearSleepTimer(): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerRemaining = null;
    this.notifyListeners();
  }

  /**
   * Queue management
   */
  setQueue(tracks: AudioTrack[], startIndex: number = 0): void {
    this.queue = tracks;
    this.queueIndex = startIndex;
  }

  addToQueue(track: AudioTrack): void {
    this.queue.push(track);
  }

  async playNext(): Promise<void> {
    if (this.queueIndex < this.queue.length - 1) {
      this.queueIndex++;
      await this.play(this.queue[this.queueIndex]);
    }
  }

  async playPrevious(): Promise<void> {
    if (this.queueIndex > 0) {
      this.queueIndex--;
      await this.play(this.queue[this.queueIndex]);
    }
  }

  /**
   * Get current playback state
   */
  async getPlaybackState(): Promise<PlaybackState> {
    let isPlaying = false;
    let isLoading = false;
    let isBuffering = false;
    let position = 0;
    let duration = 0;

    if (this.sound) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        isPlaying = status.isPlaying;
        isBuffering = status.isBuffering;
        position = status.positionMillis;
        duration = status.durationMillis || 0;
      } else {
        isLoading = true;
      }
    }

    return {
      isPlaying,
      isLoading,
      isBuffering,
      currentTrack: this.currentTrack,
      position,
      duration,
      volume: this.volume,
      isMuted: this.isMuted,
      sleepTimerRemaining: this.sleepTimerRemaining,
    };
  }

  /**
   * Subscribe to playback state changes
   */
  subscribe(listener: PlaybackStateListener): () => void {
    this.listeners.add(listener);
    
    // Send current state immediately
    this.getPlaybackState().then(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    const state = await this.getPlaybackState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Resume from last position
   */
  async resumeLastTrack(): Promise<boolean> {
    try {
      const trackData = await AsyncStorage.getItem(STORAGE_KEYS.LAST_TRACK);
      if (!trackData) return false;

      const track: AudioTrack = JSON.parse(trackData);
      const positionData = await AsyncStorage.getItem(`${STORAGE_KEYS.LAST_POSITION}_${track.id}`);
      
      await this.play(track);

      if (positionData) {
        await this.seekTo(parseInt(positionData, 10));
      }

      return true;
    } catch (error) {
      logger.error('Resume last track failed:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    this.clearSleepTimer();
    
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    if (this.sound) {
      await this.sound.unloadAsync();
    }
    if (this.nextSound) {
      await this.nextSound.unloadAsync();
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton
export const audioService = new AudioService();
export default audioService;
