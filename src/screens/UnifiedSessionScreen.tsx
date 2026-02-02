/**
 * UnifiedSessionScreen - Simplified
 * 
 * Renders the active session based on SessionContext.
 * For now, this is a simplified placeholder that works with the new flow.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useSession } from '../contexts/SessionContext';
import { Text, Button, Card } from '../components/core';
import { BreathingGuide } from '../components/domain/BreathingGuide';
import { spacing, radius, withAlpha, layout } from '../theme/tokens';

export function UnifiedSessionScreen() {
  useKeepAwake();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { status, currentActivity, completeCurrentActivity, exitSession } = useSession();
  
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (isPaused || status !== 'active') return;
    
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPaused, status]);

  const handlePause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleComplete = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeCurrentActivity?.();
    navigation.goBack();
  }, [completeCurrentActivity, navigation]);

  const handleExit = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    exitSession?.();
    navigation.goBack();
  }, [exitSession, navigation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activityType = currentActivity?.type || 'breathing';
  const activityName = currentActivity?.name || 'Session';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleExit} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
            {activityName}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {activityType === 'breathing' && (
            <BreathingGuide
              pattern="calm"
              isActive={!isPaused}
              colors={colors}
            />
          )}
          
          {activityType !== 'breathing' && (
            <View style={styles.genericSession}>
              <Ionicons
                name={
                  activityType === 'grounding' ? 'earth' :
                  activityType === 'focus' ? 'eye' :
                  activityType === 'journal' ? 'create' :
                  'leaf'
                }
                size={64}
                color={colors.actionPrimary}
              />
              <Text variant="headlineMedium" style={{ color: colors.textPrimary, marginTop: spacing.lg }}>
                {activityName}
              </Text>
            </View>
          )}

          {/* Timer */}
          <Text variant="displayMedium" style={[styles.timer, { color: colors.textPrimary }]}>
            {formatTime(elapsed)}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={handlePause}
            style={[styles.controlButton, { backgroundColor: withAlpha(colors.surfaceElevated, 0.8) }]}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={32}
              color={colors.textPrimary}
            />
          </Pressable>

          <Button
            variant="primary"
            size="lg"
            onPress={handleComplete}
            colors={colors}
            style={styles.completeButton}
          >
            Complete Session
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  genericSession: {
    alignItems: 'center',
  },
  timer: {
    marginTop: spacing['2xl'],
  },
  controls: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.lg,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButton: {
    width: '100%',
  },
});

export default UnifiedSessionScreen;
