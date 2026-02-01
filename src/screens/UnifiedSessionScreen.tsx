/**
 * UnifiedSessionScreen
 * 
 * The main session screen that renders the appropriate player
 * based on the current activity type. Now enhanced with:
 * - SessionFlowManager for adaptive mid-session check-ins
 * - Emotional flow integration
 * - Breathing transitions between activities
 */
import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { useSession } from '../contexts/SessionContext';
import { useEmotionalFlow } from '../contexts/EmotionalFlowContext';
import { AmbientBackground, ExitConfirmationModal } from '../components/ui';
import { 
  SessionHeader, 
  ActivityTransition, 
  ProgressDrawer,
  SessionFlowProvider,
  SessionFlowManager 
} from '../components/session';
import {
  BreathingPlayer,
  GroundingPlayer,
  FocusPlayer,
  JournalPromptPlayer,
  ResetPlayer,
} from '../components/players';
import { 
  BreathingConfig, 
  GroundingConfig, 
  FocusConfig, 
  JournalConfig, 
  ResetConfig 
} from '../types/session';
import { useHaptics } from '../hooks/useHaptics';
import { spacing } from '../theme';

// =============================================================================
// TYPE GUARDS
// =============================================================================
function isBreathingConfig(config: any): config is BreathingConfig {
  return config?.type === 'breathing';
}

function isGroundingConfig(config: any): config is GroundingConfig {
  return config?.type === 'grounding';
}

function isFocusConfig(config: any): config is FocusConfig {
  return config?.type === 'focus';
}

function isJournalConfig(config: any): config is JournalConfig {
  return config?.type === 'journal';
}

function isResetConfig(config: any): config is ResetConfig {
  return config?.type === 'reset';
}

// =============================================================================
// COMPONENT
// =============================================================================
export function UnifiedSessionScreen() {
  useKeepAwake();
  const { colors, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();

  const {
    mode,
    status,
    queue,
    currentIndex,
    ritualName,
    sosPresetName,
    isTransitioning,
    transitionTo,
    showProgressDrawer,
    showExitConfirmation,
    sessionStartTime,
    // Computed
    currentActivity,
    progress,
    completedActivities,
    remainingActivities,
    isLastActivity,
    canSkip,
    estimatedTimeRemaining,
    // Actions
    completeCurrentActivity,
    skipCurrentActivity,
    skipActivity,
    markRitualComplete,
    toggleProgressDrawer,
    setShowExitConfirmation,
    exitSession,
    completeTransition,
  } = useSession();

  // Calculate elapsed time in minutes
  const elapsedMinutes = sessionStartTime 
    ? Math.floor((Date.now() - sessionStartTime) / 60000) 
    : 0;
  const shouldConfirmExit = elapsedMinutes >= 3;

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status === 'in-progress' || status === 'paused') {
        // Only show confirmation for sessions longer than 3 minutes
        if (shouldConfirmExit) {
          setShowExitConfirmation(true);
        } else {
          exitSession(false); // Exit immediately for short sessions
        }
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [status, shouldConfirmExit, setShowExitConfirmation, exitSession]);

  // Handle close button press
  const handleClose = useCallback(() => {
    // Only show confirmation for sessions longer than 3 minutes
    if (shouldConfirmExit) {
      setShowExitConfirmation(true);
    } else {
      exitSession(false); // Exit immediately for short sessions
    }
  }, [shouldConfirmExit, setShowExitConfirmation, exitSession]);

  // Handle exit confirmation
  const handleExitConfirm = useCallback(() => {
    exitSession(true); // Save progress
  }, [exitSession]);

  // Handle exit cancel
  const handleExitCancel = useCallback(() => {
    setShowExitConfirmation(false);
  }, [setShowExitConfirmation]);

  // Handle activity completion
  const handleActivityComplete = useCallback(() => {
    completeCurrentActivity();
  }, [completeCurrentActivity]);

  // Handle transition complete
  const handleTransitionComplete = useCallback(() => {
    completeTransition();
  }, [completeTransition]);

  // Get session name for header
  const sessionName = mode === 'ritual' ? ritualName : mode === 'sos' ? sosPresetName : undefined;

  // Determine ambient background variant based on activity type
  const getAmbientVariant = (): 'calm' | 'focus' | 'energize' | undefined => {
    if (!currentActivity) return 'calm';
    switch (currentActivity.type) {
      case 'focus':
        return 'focus';
      case 'journal':
        return 'calm';
      case 'reset':
        return 'energize';
      default:
        return 'calm';
    }
  };

  // If no activity (shouldn't happen but safety check)
  if (!currentActivity || mode === 'idle') {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(300)}
            style={styles.emptyContainer}
          >
            {/* This shouldn't happen, but show a message just in case */}
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // Render the appropriate player based on activity type
  const renderPlayer = () => {
    if (!currentActivity) return null;
    const config = currentActivity.config;

    const commonProps = {
      autoStart: true,
      onComplete: handleActivityComplete,
    };

    switch (currentActivity.type) {
      case 'breathing':
        if (isBreathingConfig(config)) {
          return (
            <BreathingPlayer
              {...commonProps}
              patternId={config.patternId}
            />
          );
        }
        return null;

      case 'grounding':
        if (isGroundingConfig(config)) {
          return (
            <GroundingPlayer
              {...commonProps}
              techniqueId={config.techniqueId || 'five-senses'}
            />
          );
        }
        return null;

      case 'focus':
        if (isFocusConfig(config)) {
          return (
            <FocusPlayer
              {...commonProps}
              duration={config.targetMinutes}
            />
          );
        }
        return null;

      case 'journal':
        if (isJournalConfig(config)) {
          const prompts = config.prompts || (config.prompt ? [{ id: '1', prompt: config.prompt }] : undefined);
          return (
            <JournalPromptPlayer
              {...commonProps}
              prompts={prompts}
              showTextInput={config.showTextInput}
              reflectionDuration={config.reflectionDuration}
            />
          );
        }
        return null;

      case 'reset':
        if (isResetConfig(config)) {
          return (
            <ResetPlayer
              {...commonProps}
              exerciseId={config.exerciseId}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  // Map queue to activities for ProgressDrawer
  const queueActivities = queue.map(q => q.activity);

  // Determine session type for flow manager
  const sessionType = currentActivity.type as 'breathing' | 'grounding' | 'focus' | 'journal' | 'reset';
  
  // Estimated duration for flow manager
  const estimatedDuration = estimatedTimeRemaining + elapsedMinutes;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant={getAmbientVariant()} intensity="subtle" />

      <SessionFlowProvider
        config={{
          sessionType,
          estimatedDuration,
          allowMidSessionCheckins: true,
          checkInInterval: 5, // Check in every 5 minutes
          allowDirectionChange: mode !== 'sos', // SOS is fixed, others can adapt
        }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <SessionHeader
            mode={mode}
            activityName={currentActivity.name}
            sessionName={sessionName}
            progress={progress}
            completedCount={completedActivities}
            totalCount={queue.length}
            onClose={handleClose}
            onProgressTap={toggleProgressDrawer}
          />

          {/* Main Content - Player with Flow Manager */}
          <SessionFlowManager>
            <View style={styles.playerContainer}>
              <Animated.View
                key={`player-${currentActivity.id}-${currentIndex}`}
                entering={reduceMotion ? undefined : FadeIn.duration(400)}
                exiting={reduceMotion ? undefined : FadeOut.duration(200)}
                style={styles.playerWrapper}
              >
                {renderPlayer()}
              </Animated.View>
            </View>
          </SessionFlowManager>
        </SafeAreaView>

        {/* Transition Overlay */}
        {isTransitioning && transitionTo && (
          <ActivityTransition
            completedActivity={currentActivity}
            nextActivity={transitionTo}
            currentIndex={currentIndex}
            total={queue.length}
            onContinue={handleTransitionComplete}
            onEnd={() => exitSession(true)}
          />
        )}

        {/* Progress Drawer */}
        <ProgressDrawer
          visible={showProgressDrawer}
          queue={queueActivities}
          currentIndex={currentIndex}
          onClose={toggleProgressDrawer}
          onJumpTo={canSkip ? skipActivity : undefined}
        />

        {/* Exit Confirmation Modal */}
        <ExitConfirmationModal
          visible={showExitConfirmation}
          onConfirm={handleExitConfirm}
          onCancel={handleExitCancel}
          title={mode === 'ritual' ? 'Exit Ritual?' : mode === 'sos' ? 'Exit SOS?' : 'Exit Session?'}
          message={
            completedActivities > 0
              ? `You've completed ${completedActivities} ${completedActivities === 1 ? 'activity' : 'activities'}. Your progress will be saved.`
              : 'Are you sure you want to exit? Your progress will be lost.'
          }
          confirmText="Exit"
          cancelText="Continue"
        />
      </SessionFlowProvider>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerContainer: {
    flex: 1,
  },
  playerWrapper: {
    flex: 1,
  },
});

export default UnifiedSessionScreen;
