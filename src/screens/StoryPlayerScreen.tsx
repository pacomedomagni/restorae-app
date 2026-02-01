/**
 * StoryPlayerScreen
 * 
 * Full-screen audio player for bedtime stories with:
 * - Background audio playback
 * - Sleep timer
 * - Artwork display
 * - Playback controls
 * - Progress scrubbing
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  StatusBar,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';

import { useHaptics } from '../hooks/useHaptics';
import { useUISounds } from '../hooks/useUISounds';
import { useTheme } from '../contexts/ThemeContext';
import { useCoachMarks } from '../contexts/CoachMarkContext';
import { useAnalytics, AnalyticsEvents } from '../services/analytics';
import audioService, { PlaybackState } from '../services/audio';
import { Text, GlassCard, Button, ExitConfirmationModal, CoachMarkOverlay, GestureHint } from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius } from '../theme';
import { RootStackParamList } from '../types';
import { getStoryById, formatDuration, SLEEP_TIMER_OPTIONS, BedtimeStory, mapApiStoryToLocal, ApiStory, getStoryArtwork } from '../data/bedtimeStories';
import { navigationHelpers } from '../services/navigationHelpers';
import { api } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// SLEEP TIMER MODAL
// =============================================================================
interface SleepTimerModalProps {
  visible: boolean;
  currentTimer: number | null;
  onSelect: (minutes: number) => void;
  onClose: () => void;
}

function SleepTimerModal({ visible, currentTimer, onSelect, onClose }: SleepTimerModalProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();

  if (!visible) return null;

  return (
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Animated.View
        entering={FadeInUp.duration(300)}
        style={styles.modalContainer}
      >
        <BlurView intensity={80} style={styles.modalBlur}>
          <View style={[styles.modalContent, { backgroundColor: colors.canvasElevated }]}>
            <Text variant="headlineSmall" color="ink" style={styles.modalTitle}>
              Sleep Timer
            </Text>
            
            {SLEEP_TIMER_OPTIONS.map((option) => {
              const isSelected = currentTimer === option.minutes * 60 * 1000;
              
              return (
                <Pressable
                  key={option.minutes}
                  style={[
                    styles.timerOption,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.accentPrimary },
                  ]}
                  onPress={async () => {
                    await impactLight();
                    onSelect(option.minutes);
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={{ color: isSelected ? colors.inkInverse : colors.ink }}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Icon name="check" size={20} color={colors.inkInverse} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// PROGRESS BAR
// =============================================================================
interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
}

function ProgressBar({ position, duration, onSeek }: ProgressBarProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const progress = duration > 0 ? position / duration : 0;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePress = async (event: any) => {
    await impactLight();
    const { locationX } = event.nativeEvent;
    const progressBarWidth = SCREEN_WIDTH - spacing[12] * 2;
    const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
    onSeek(newProgress * duration);
  };

  return (
    <View style={styles.progressContainer}>
      <Pressable onPress={handlePress} style={styles.progressBar}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.inkInverse,
                width: `${progress * 100}%`,
              },
            ]}
          />
          <View
            style={[
              styles.progressThumb,
              {
                backgroundColor: colors.inkInverse,
                left: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </Pressable>
      
      <View style={styles.timeLabels}>
        <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(position)}
        </Text>
        <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function StoryPlayerScreen() {
  useKeepAwake();
  
  const { colors, reduceMotion, isDark } = useTheme();
  const { impactMedium, impactLight } = useHaptics();
  const { playTap, playToggle, playSuccess } = useUISounds();
  const { shouldShowCoachMark, markAsShown, COACH_MARKS } = useCoachMarks();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StoryPlayer'>>();
  const analytics = useAnalytics();

  const storyId = route.params?.storyId;
  const [story, setStory] = useState<BedtimeStory | null>(
    storyId ? getStoryById(storyId) || null : null
  );

  // Fetch story from API (with local fallback already loaded)
  useEffect(() => {
    if (!storyId) return;
    
    const fetchStory = async () => {
      try {
        // Try to fetch from API using slug (storyId might be slug or id)
        const apiStory = await api.getStoryBySlug(storyId) as ApiStory;
        if (apiStory) {
          setStory(mapApiStoryToLocal(apiStory));
        }
      } catch (error) {
        // Keep using local data on error (already set as initial state)
        console.warn('Using local story data:', error);
      }
    };
    
    fetchStory();
  }, [storyId]);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isLoading: true,
    isBuffering: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    sleepTimerRemaining: null,
  });
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStoryCoachMark, setShowStoryCoachMark] = useState(false);
  const [showScrubHint, setShowScrubHint] = useState(false);

  // Animation values
  const pulseScale = useSharedValue(1);
  const artworkRotation = useSharedValue(0);

  // Subscribe to playback state
  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return () => unsubscribe();
  }, []);

  // Check for coach marks after loading
  useEffect(() => {
    if (!playbackState.isLoading && story) {
      const timer = setTimeout(() => {
        if (shouldShowCoachMark('stories_sleep_timer')) {
          setShowStoryCoachMark(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [playbackState.isLoading, story, shouldShowCoachMark]);

  // Load story on mount
  useEffect(() => {
    if (story) {
      loadAndPlayStory(story);
      analytics.track(AnalyticsEvents.STORY_STARTED, {
        storyId: story.id,
        storyTitle: story.title,
        category: story.category,
        duration: story.duration,
      });
    }

    return () => {
      // Don't stop audio - let it continue in background
    };
  }, [story?.id]);

  // Pulse animation when playing
  useEffect(() => {
    if (playbackState.isPlaying && !reduceMotion) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [playbackState.isPlaying, reduceMotion]);

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (playbackState.isPlaying) {
        setShowExitConfirm(true);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior if not playing
    });

    return () => backHandler.remove();
  }, [playbackState.isPlaying]);

  const loadAndPlayStory = async (story: BedtimeStory) => {
    await audioService.play({
      id: story.id,
      title: story.title,
      artist: story.narrator,
      uri: story.audioUrl,
      duration: story.duration * 60 * 1000,
      artwork: story.artworkUrl,
      type: 'story',
    });
  };

  const handlePlayPause = async () => {
    await impactMedium();
    playToggle();
    await audioService.togglePlayPause();
  };

  const handleSkip = async (seconds: number) => {
    await impactLight();
    playTap();
    await audioService.skip(seconds);
  };

  const handleSeek = async (position: number) => {
    await audioService.seekTo(position);
  };

  const handleSleepTimer = (minutes: number) => {
    playTap();
    if (minutes === 0) {
      audioService.clearSleepTimer();
    } else if (minutes === -1) {
      // End of story - calculate remaining time
      const remaining = playbackState.duration - playbackState.position;
      audioService.setSleepTimer(Math.ceil(remaining / 60000));
    } else {
      audioService.setSleepTimer(minutes);
      analytics.track(AnalyticsEvents.SLEEP_TIMER_SET, { minutes });
    }
    setShowSleepTimer(false);
  };

  const handleExitConfirm = async () => {
    setShowExitConfirm(false);
    await audioService.stop();
    navigation.goBack();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
  };

  const handleClose = async () => {
    // Track if story was completed (>90% listened)
    if (playbackState.duration > 0) {
      const percentListened = playbackState.position / playbackState.duration;
      const durationSeconds = Math.round(playbackState.position / 1000);
      
      if (percentListened >= 0.9) {
        analytics.track(AnalyticsEvents.STORY_COMPLETED, {
          storyId: story?.id,
          duration: playbackState.duration,
        });
        
        // Navigate to session complete screen for the celebration
        // (SessionCompleteScreen handles gamification, activity logging, etc.)
        navigation.replace('SessionComplete', {
          sessionType: 'story',
          sessionName: story?.title || 'Sleep Story',
          duration: durationSeconds,
        });
        return;
      } else {
        analytics.track(AnalyticsEvents.STORY_PAUSED, {
          storyId: story?.id,
          position: playbackState.position,
          percentListened: Math.round(percentListened * 100),
        });
      }
    }
    
    navigation.goBack();
  };

  const artworkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatTimerRemaining = (ms: number): string => {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes}m`;
  };

  if (!story) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <SafeAreaView style={styles.centered}>
          <Text variant="bodyLarge" color="ink">Story not found</Text>
          <Button variant="ghost" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background with artwork blur */}
      {(() => {
        const localArtwork = getStoryArtwork(story.id);
        if (localArtwork) {
          return (
            <>
              <Image
                source={localArtwork}
                style={styles.backgroundImage}
                blurRadius={50}
              />
              <View style={styles.backgroundOverlay} />
            </>
          );
        } else if (story.artworkUrl) {
          return (
            <>
              <Image
                source={{ uri: story.artworkUrl }}
                style={styles.backgroundImage}
                blurRadius={50}
              />
              <View style={styles.backgroundOverlay} />
            </>
          );
        } else {
          return (
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460']}
              style={StyleSheet.absoluteFill}
            />
          );
        }
      })()}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(400)}
          style={styles.header}
        >
          <Pressable 
            onPress={handleClose} 
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close player"
          >
            <Icon name="chevronDown" size={28} color="#FFFFFF" />
          </Pressable>
          
          <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            SLEEP STORY
          </Text>
          
          <Pressable 
            onPress={() => setShowSleepTimer(true)} 
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={playbackState.sleepTimerRemaining ? `Sleep timer: ${formatTimerRemaining(playbackState.sleepTimerRemaining)} remaining` : 'Set sleep timer'}
          >
            <View style={styles.timerButton}>
              <Icon name="moon" size={20} color="#FFFFFF" />
              {playbackState.sleepTimerRemaining && (
                <Text variant="labelSmall" style={{ color: '#FFFFFF', marginLeft: 4 }}>
                  {formatTimerRemaining(playbackState.sleepTimerRemaining)}
                </Text>
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Artwork */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(150).duration(500)}
            style={[styles.artworkContainer, artworkAnimatedStyle]}
          >
            {(() => {
              const localArtwork = getStoryArtwork(story.id);
              if (localArtwork) {
                return (
                  <Image
                    source={localArtwork}
                    style={styles.artwork}
                    resizeMode="cover"
                  />
                );
              } else if (story.artworkUrl) {
                return (
                  <Image
                    source={{ uri: story.artworkUrl }}
                    style={styles.artwork}
                    resizeMode="cover"
                  />
                );
              } else {
                return (
                  <View style={[styles.artwork, { backgroundColor: '#2a2a4a' }]}>
                    <Text style={{ fontSize: 80 }}>🌙</Text>
                  </View>
                );
              }
            })()}
          </Animated.View>

          {/* Story info */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(500)}
            style={styles.infoContainer}
          >
            <Text variant="headlineLarge" style={{ color: '#FFFFFF', textAlign: 'center' }}>
              {story.title}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: spacing[2] }}
            >
              {story.narrator}
            </Text>
          </Animated.View>

          {/* Progress bar */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(250).duration(500)}
          >
            <ProgressBar
              position={playbackState.position}
              duration={playbackState.duration}
              onSeek={handleSeek}
            />
          </Animated.View>

          {/* Controls */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(300).duration(500)}
            style={styles.controls}
          >
            {/* Skip back */}
            <Pressable 
              onPress={() => handleSkip(-15)} 
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip back 15 seconds"
            >
              <Icon name="rotateCcw" size={24} color="rgba(255,255,255,0.8)" />
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.6)' }}>
                15
              </Text>
            </Pressable>

            {/* Play/Pause */}
            <Pressable 
              onPress={handlePlayPause} 
              style={styles.playButton}
              accessibilityRole="button"
              accessibilityLabel={playbackState.isPlaying ? 'Pause' : 'Play'}
              accessibilityState={{ busy: playbackState.isLoading || playbackState.isBuffering }}
            >
              <View style={styles.playButtonInner}>
                {playbackState.isLoading || playbackState.isBuffering ? (
                  <View style={styles.bufferingContainer}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text variant="labelSmall" style={styles.bufferingText}>
                      {playbackState.isLoading ? 'Loading...' : 'Buffering...'}
                    </Text>
                  </View>
                ) : (
                  <Icon
                    name={playbackState.isPlaying ? 'pause' : 'play'}
                    size={36}
                    color="#FFFFFF"
                  />
                )}
              </View>
            </Pressable>

            {/* Skip forward */}
            <Pressable 
              onPress={() => handleSkip(15)} 
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip forward 15 seconds"
            >
              <Icon name="rotateCw" size={24} color="rgba(255,255,255,0.8)" />
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.6)' }}>
                15
              </Text>
            </Pressable>
          </Animated.View>

          {/* Volume control */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(350).duration(500)}
            style={styles.volumeContainer}
          >
            <Pressable 
              onPress={() => audioService.toggleMute()}
              accessibilityRole="button"
              accessibilityLabel={playbackState.isMuted ? 'Unmute' : 'Mute'}
            >
              <Icon
                name={playbackState.isMuted ? 'volumeX' : 'volume2'}
                size={20}
                color="rgba(255,255,255,0.6)"
              />
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        visible={showSleepTimer}
        currentTimer={playbackState.sleepTimerRemaining}
        onSelect={handleSleepTimer}
        onClose={() => setShowSleepTimer(false)}
      />

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        visible={showExitConfirm}
        title="Leave story?"
        message="The audio will stop playing. You can always come back and continue."
        confirmText="Leave"
        cancelText="Keep listening"
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />

      {/* Coach Mark - Sleep timer feature */}
      {showStoryCoachMark && (
        <CoachMarkOverlay
          markId="stories_sleep_timer"
          visible={showStoryCoachMark}
          onDismiss={() => {
            markAsShown('stories_sleep_timer');
            setShowStoryCoachMark(false);
            // Show scrub hint next
            setTimeout(() => {
              if (shouldShowCoachMark('stories_scrub')) {
                setShowScrubHint(true);
              }
            }, 500);
          }}
        />
      )}

      {/* Gesture hint for scrubbing */}
      {showScrubHint && (
        <GestureHint
          gesture="swipe-left"
          label="Drag progress bar to scrub"
          onDismiss={() => {
            markAsShown('stories_scrub');
            setShowScrubHint(false);
          }}
        />
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  artworkContainer: {
    marginBottom: spacing[8],
  },
  artwork: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  infoContainer: {
    marginBottom: spacing[8],
    width: '100%',
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  progressBar: {
    height: 40,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    marginBottom: spacing[6],
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing[3],
  },
  playButton: {
    width: 72,
    height: 72,
  },
  playButtonInner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bufferingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing[1],
    fontSize: 10,
  },
  volumeContainer: {
    alignItems: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  modalBlur: {
    overflow: 'hidden',
  },
  modalContent: {
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  timerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
});
