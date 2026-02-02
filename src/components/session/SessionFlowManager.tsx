/**
 * SessionFlowManager
 * 
 * A component that wraps session screens to provide adaptive flow:
 * - Mid-session emotional check-ins
 * - Ability to extend, shorten, or change direction
 * - Adaptive pacing based on user responses
 * - Gentle off-ramps for overwhelmed users
 * 
 * This transforms rigid "do the whole thing" sessions into
 * flexible, responsive experiences.
 */
import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useEmotionalFlow } from '../../contexts/EmotionalFlowContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Text, Button, GlassCard } from '../ui';
import { spacing, withAlpha, borderRadius } from '../../theme';
import { MoodType } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export type SessionPhase = 'beginning' | 'middle' | 'ending' | 'complete';

export type CheckInTrigger = 
  | 'time_elapsed'    // After X minutes
  | 'activity_complete' // Between activities
  | 'user_pause'      // User paused
  | 'struggle_detected'; // Detected user might be struggling

export interface SessionFlowConfig {
  sessionType: 'breathing' | 'grounding' | 'focus' | 'journal' | 'reset';
  /** Estimated duration in minutes */
  estimatedDuration: number;
  allowMidSessionCheckins?: boolean;
  /** Check-in interval in minutes */
  checkInInterval?: number;
  allowDirectionChange?: boolean;
}

export interface CheckInResponse {
  feeling: 'better' | 'same' | 'struggling';
  wantsToAdjust: boolean;
  adjustmentType?: 'shorten' | 'extend' | 'change_pace' | 'take_break' | 'end_early';
}

export interface SessionFlowState {
  // Current phase
  phase: SessionPhase;
  
  // Timing
  elapsedSeconds: number;
  estimatedTotalSeconds: number;
  
  // Check-ins
  checkInsShown: number;
  lastCheckInAt: number | null;
  lastCheckInResponse: CheckInResponse | null;
  
  // Adaptations made
  adaptations: string[];
  
  // User's journey through this session
  moodAtStart: MoodType | null;
  currentSessionMood: MoodType | null;
  moodImproved: boolean;
}

interface SessionFlowContextType extends SessionFlowState {
  // Actions
  startSession: (estimatedSeconds: number) => void;
  updateElapsed: (seconds: number) => void;
  triggerCheckIn: (trigger: CheckInTrigger) => void;
  respondToCheckIn: (response: CheckInResponse) => void;
  dismissCheckIn: () => void;
  completeSession: () => void;
  
  // State
  showCheckIn: boolean;
  checkInTrigger: CheckInTrigger | null;
  
  // Computed
  progressPercent: number;
  shouldShowCheckIn: boolean;
  suggestedAction: string | null;
  adaptivePacing: number; // 0.5 - 1.5 multiplier
}

// =============================================================================
// CONTEXT
// =============================================================================

const SessionFlowContext = createContext<SessionFlowContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface SessionFlowProviderProps {
  children: ReactNode;
  config?: SessionFlowConfig;
  /** Minimum time before first check-in (seconds) */
  minTimeBeforeCheckIn?: number;
  /** Enable automatic check-ins */
  autoCheckIn?: boolean;
}

export function SessionFlowProvider({
  children,
  config,
  minTimeBeforeCheckIn = 180, // 3 minutes
  autoCheckIn = true,
}: SessionFlowProviderProps) {
  const { currentMood, temperature, needsGentleness, recordReliefMoment } = useEmotionalFlow();

  const effectiveAutoCheckIn = config?.allowMidSessionCheckins === false ? false : autoCheckIn;
  const effectiveMinTimeBeforeCheckIn =
    typeof config?.checkInInterval === 'number' ? config.checkInInterval * 60 : minTimeBeforeCheckIn;
  
  const [state, setState] = useState<SessionFlowState>({
    phase: 'beginning',
    elapsedSeconds: 0,
    estimatedTotalSeconds: config ? Math.round(config.estimatedDuration * 60) : 0,
    checkInsShown: 0,
    lastCheckInAt: null,
    lastCheckInResponse: null,
    adaptations: [],
    moodAtStart: currentMood,
    currentSessionMood: currentMood,
    moodImproved: false,
  });

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInTrigger, setCheckInTrigger] = useState<CheckInTrigger | null>(null);

  useEffect(() => {
    if (!config) return;
    setState((prev) => ({
      ...prev,
      estimatedTotalSeconds: Math.round(config.estimatedDuration * 60),
    }));
  }, [config]);

  // Start a session
  const startSession = useCallback((estimatedSeconds: number) => {
    setState(prev => ({
      ...prev,
      phase: 'beginning',
      elapsedSeconds: 0,
      estimatedTotalSeconds: estimatedSeconds,
      checkInsShown: 0,
      lastCheckInAt: null,
      lastCheckInResponse: null,
      adaptations: [],
      moodAtStart: currentMood,
      currentSessionMood: currentMood,
      moodImproved: false,
    }));
  }, [currentMood]);

  // Update elapsed time
  const updateElapsed = useCallback((seconds: number) => {
    setState(prev => {
      const newElapsed = seconds;
      let newPhase = prev.phase;
      
      // Update phase based on progress
      const progress = newElapsed / prev.estimatedTotalSeconds;
      if (progress < 0.2) newPhase = 'beginning';
      else if (progress < 0.8) newPhase = 'middle';
      else if (progress < 1) newPhase = 'ending';
      else newPhase = 'complete';

      return {
        ...prev,
        elapsedSeconds: newElapsed,
        phase: newPhase,
      };
    });
  }, []);

  // Trigger a check-in
  const triggerCheckIn = useCallback((trigger: CheckInTrigger) => {
    setCheckInTrigger(trigger);
    setShowCheckIn(true);
    setState(prev => ({
      ...prev,
      checkInsShown: prev.checkInsShown + 1,
      lastCheckInAt: Date.now(),
    }));
  }, []);

  // Respond to check-in
  const respondToCheckIn = useCallback((response: CheckInResponse) => {
    setState(prev => {
      const adaptations = [...prev.adaptations];
      
      if (response.adjustmentType) {
        adaptations.push(response.adjustmentType);
      }

      // Check if mood improved (they started challenging, now feeling better)
      const moodImproved = response.feeling === 'better' && 
        prev.moodAtStart && 
        ['anxious', 'low', 'tough'].includes(prev.moodAtStart);

      if (moodImproved) {
        recordReliefMoment();
      }

      return {
        ...prev,
        lastCheckInResponse: response,
        adaptations,
        moodImproved: moodImproved || prev.moodImproved,
      };
    });
    setShowCheckIn(false);
    setCheckInTrigger(null);
  }, [recordReliefMoment]);

  // Dismiss check-in without responding
  const dismissCheckIn = useCallback(() => {
    setShowCheckIn(false);
    setCheckInTrigger(null);
  }, []);

  // Complete session
  const completeSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'complete',
    }));
  }, []);

  // Auto check-in logic
  useEffect(() => {
    if (!effectiveAutoCheckIn || showCheckIn) return;
    
    const { elapsedSeconds, lastCheckInAt, estimatedTotalSeconds, phase } = state;
    
    // Don't check in at beginning or end
    if (phase !== 'middle') return;
    
    // Check if enough time has passed
    const timeSinceLastCheckIn = lastCheckInAt 
      ? (Date.now() - lastCheckInAt) / 1000 
      : elapsedSeconds;
    
    // Trigger check-in at roughly 40-60% through if we haven't yet
    const progress = elapsedSeconds / estimatedTotalSeconds;
    if (
      progress >= 0.4 && 
      progress <= 0.7 && 
      timeSinceLastCheckIn >= effectiveMinTimeBeforeCheckIn &&
      state.checkInsShown === 0
    ) {
      triggerCheckIn('time_elapsed');
    }
  }, [state, showCheckIn, effectiveAutoCheckIn, effectiveMinTimeBeforeCheckIn, triggerCheckIn]);

  // Computed values
  const progressPercent = useMemo(() => {
    if (state.estimatedTotalSeconds === 0) return 0;
    return Math.min(100, (state.elapsedSeconds / state.estimatedTotalSeconds) * 100);
  }, [state.elapsedSeconds, state.estimatedTotalSeconds]);

  const shouldShowCheckIn = useMemo(() => {
    return showCheckIn && state.phase === 'middle';
  }, [showCheckIn, state.phase]);

  const suggestedAction = useMemo(() => {
    if (!state.lastCheckInResponse) return null;
    
    const { feeling, adjustmentType } = state.lastCheckInResponse;
    
    if (feeling === 'struggling') {
      if (needsGentleness) {
        return "It's okay to pause. You're doing enough.";
      }
      return "Let's slow down together.";
    }
    
    if (adjustmentType === 'extend') {
      return "We can continue as long as you need.";
    }
    
    return null;
  }, [state.lastCheckInResponse, needsGentleness]);

  const adaptivePacing = useMemo(() => {
    let pacing = temperature.pacing;
    
    // Slow down if user is struggling
    if (state.lastCheckInResponse?.feeling === 'struggling') {
      pacing *= 0.8;
    }
    
    // Speed up slightly if user is doing well and wants to continue
    if (state.lastCheckInResponse?.feeling === 'better' && 
        state.lastCheckInResponse?.adjustmentType === 'extend') {
      pacing *= 1.1;
    }
    
    return Math.max(0.5, Math.min(1.5, pacing));
  }, [temperature.pacing, state.lastCheckInResponse]);

  const value: SessionFlowContextType = {
    ...state,
    startSession,
    updateElapsed,
    triggerCheckIn,
    respondToCheckIn,
    dismissCheckIn,
    completeSession,
    showCheckIn,
    checkInTrigger,
    progressPercent,
    shouldShowCheckIn,
    suggestedAction,
    adaptivePacing,
  };

  return (
    <SessionFlowContext.Provider value={value}>
      {children}
    </SessionFlowContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useSessionFlow() {
  const context = useContext(SessionFlowContext);
  if (!context) {
    throw new Error('useSessionFlow must be used within SessionFlowProvider');
  }
  return context;
}

// =============================================================================
// MANAGER WRAPPER
// =============================================================================

export function SessionFlowManager({ children }: { children: ReactNode }) {
  const { shouldShowCheckIn, respondToCheckIn, dismissCheckIn, checkInTrigger } = useSessionFlow();

  return (
    <View style={{ flex: 1 }}>
      {children}
      {shouldShowCheckIn && (
        <MidSessionCheckIn
          onRespond={respondToCheckIn}
          onDismiss={dismissCheckIn}
          trigger={checkInTrigger}
        />
      )}
    </View>
  );
}

// =============================================================================
// MID-SESSION CHECK-IN OVERLAY
// =============================================================================

interface MidSessionCheckInProps {
  onRespond: (response: CheckInResponse) => void;
  onDismiss: () => void;
  trigger: CheckInTrigger | null;
}

export function MidSessionCheckIn({ onRespond, onDismiss, trigger }: MidSessionCheckInProps) {
  const { colors, isDark, reduceMotion } = useTheme();
  const { needsGentleness, currentMood } = useEmotionalFlow();
  const { impactLight } = useHaptics();
  
  const [selectedFeeling, setSelectedFeeling] = useState<CheckInResponse['feeling'] | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleFeelingSelect = async (feeling: CheckInResponse['feeling']) => {
    await impactLight();
    setSelectedFeeling(feeling);
    
    // If feeling better or same, can proceed without options
    if (feeling === 'better' || feeling === 'same') {
      setTimeout(() => {
        onRespond({ feeling, wantsToAdjust: false });
      }, 500);
    } else {
      // Show adjustment options for struggling
      setShowOptions(true);
    }
  };

  const handleAdjustment = (type: CheckInResponse['adjustmentType']) => {
    onRespond({
      feeling: selectedFeeling || 'same',
      wantsToAdjust: true,
      adjustmentType: type,
    });
  };

  // Get contextual check-in message
  const getMessage = () => {
    if (needsGentleness) {
      return "Checking in with you";
    }
    if (trigger === 'activity_complete') {
      return "Between moments";
    }
    return "How are you feeling?";
  };

  const getSubMessage = () => {
    if (currentMood === 'anxious') {
      return "It's okay to pause or adjust";
    }
    if (currentMood === 'low') {
      return "You're doing something meaningful";
    }
    return "No wrong answer here";
  };

  return (
    <Animated.View 
      style={styles.checkInOverlay}
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
    >
      <BlurView intensity={isDark ? 40 : 20} style={StyleSheet.absoluteFill} />
      
      <Pressable style={styles.checkInBackdrop} onPress={onDismiss} />
      
      <Animated.View
        entering={reduceMotion ? undefined : SlideInDown.springify().damping(20)}
        exiting={reduceMotion ? undefined : SlideOutDown.duration(200)}
        style={styles.checkInCard}
      >
        <GlassCard variant="elevated" padding="lg">
          <Text variant="headlineSmall" color="ink" align="center">
            {getMessage()}
          </Text>
          <Text 
            variant="bodyMedium" 
            color="inkMuted" 
            align="center"
            style={styles.checkInSubtext}
          >
            {getSubMessage()}
          </Text>

          {!showOptions ? (
            <View style={styles.feelingOptions}>
              <FeelingButton
                label="Better"
                emoji="✨"
                selected={selectedFeeling === 'better'}
                onPress={() => handleFeelingSelect('better')}
                colors={colors}
              />
              <FeelingButton
                label="Same"
                emoji="🌊"
                selected={selectedFeeling === 'same'}
                onPress={() => handleFeelingSelect('same')}
                colors={colors}
              />
              <FeelingButton
                label="Struggling"
                emoji="💨"
                selected={selectedFeeling === 'struggling'}
                onPress={() => handleFeelingSelect('struggling')}
                colors={colors}
              />
            </View>
          ) : (
            <View style={styles.adjustmentOptions}>
              <Text variant="labelSmall" color="inkMuted" align="center" style={styles.optionsLabel}>
                Would any of these help?
              </Text>
              
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => handleAdjustment('change_pace')}
                style={styles.optionButton}
              >
                Go slower
              </Button>
              
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => handleAdjustment('take_break')}
                style={styles.optionButton}
              >
                Take a break
              </Button>
              
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => handleAdjustment('end_early')}
                style={styles.optionButton}
              >
                End here (that's okay)
              </Button>
              
              <Pressable 
                onPress={() => {
                  setShowOptions(false);
                  onRespond({ feeling: 'struggling', wantsToAdjust: false });
                }}
                style={styles.continueAnyway}
              >
                <Text variant="labelSmall" color="inkMuted">
                  Continue as is
                </Text>
              </Pressable>
            </View>
          )}
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

// =============================================================================
// FEELING BUTTON
// =============================================================================

interface FeelingButtonProps {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

function FeelingButton({ label, emoji, selected, onPress, colors }: FeelingButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: selected 
      ? withAlpha(colors.accentPrimary, 0.15)
      : withAlpha(colors.canvasElevated, 0.5),
    borderColor: selected 
      ? colors.accentPrimary 
      : withAlpha(colors.border, 0.3),
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.feelingButton, animatedStyle]}>
        <Text style={styles.feelingEmoji}>{emoji}</Text>
        <Text 
          variant="labelMedium" 
          style={{ color: selected ? colors.accentPrimary : colors.ink }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  checkInOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  checkInBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  checkInCard: {
    width: '90%',
    maxWidth: 360,
  },
  checkInSubtext: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  feelingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  feelingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  feelingEmoji: {
    fontSize: 24,
    marginBottom: spacing[2],
  },
  adjustmentOptions: {
    gap: spacing[3],
  },
  optionsLabel: {
    marginBottom: spacing[2],
  },
  optionButton: {
    marginBottom: spacing[1],
  },
  continueAnyway: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
});

export default SessionFlowContext;
