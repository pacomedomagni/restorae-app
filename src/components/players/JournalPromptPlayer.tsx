/**
 * JournalPromptPlayer
 * 
 * Journal/reflection player for the unified session system.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Text, GlassCard, Button } from '../ui';
import { spacing, withAlpha } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

export interface JournalPromptPlayerProps {
  prompts?: Array<{ id: string; prompt: string }>;
  showTextInput?: boolean;
  reflectionDuration?: number; // seconds per prompt
  onComplete?: () => void;
}

const DEFAULT_PROMPTS = [
  { id: '1', prompt: 'What are you grateful for today?' },
  { id: '2', prompt: 'How are you feeling in this moment?' },
  { id: '3', prompt: 'What would make today meaningful?' },
];

export function JournalPromptPlayer({
  prompts = DEFAULT_PROMPTS,
  showTextInput = false,
  reflectionDuration = 60,
  onComplete,
}: JournalPromptPlayerProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight, notificationSuccess } = useHaptics();

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [countdown, setCountdown] = useState(reflectionDuration);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const currentPrompt = prompts[currentPromptIndex];
  const isLastPrompt = currentPromptIndex === prompts.length - 1;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Start countdown for each prompt
    setCountdown(reflectionDuration);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPromptIndex, reflectionDuration]);

  const handleNext = useCallback(() => {
    impactLight();
    if (timerRef.current) clearInterval(timerRef.current);

    if (isLastPrompt) {
      setIsComplete(true);
      notificationSuccess();
      onComplete?.();
    } else {
      setCurrentPromptIndex(prev => prev + 1);
      setInputText('');
    }
  }, [isLastPrompt, impactLight, notificationSuccess, onComplete]);

  if (isComplete) {
    return (
      <View style={styles.container}>
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(400)} style={styles.completeContainer}>
          <Text style={styles.completeIcon}>📝</Text>
          <Text variant="displaySmall" color="ink" align="center">Reflection complete</Text>
          <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.completeText}>
            Take these thoughts with you.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" color="inkMuted" align="center">
        {currentPromptIndex + 1} of {prompts.length}
      </Text>

      <View style={styles.progressContainer}>
        {prompts.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              { backgroundColor: idx <= currentPromptIndex ? colors.accentWarm : withAlpha(colors.ink, 0.2) },
            ]}
          />
        ))}
      </View>

      <Animated.View
        key={currentPromptIndex}
        entering={reduceMotion ? undefined : FadeInRight.duration(400)}
        exiting={reduceMotion ? undefined : FadeOutLeft.duration(300)}
        style={styles.promptCard}
      >
        <GlassCard variant="elevated" padding="xl" glow="warm">
          <Text variant="displaySmall" color="ink" align="center">
            {currentPrompt.prompt}
          </Text>
        </GlassCard>
      </Animated.View>

      {showTextInput && (
        <TextInput
          style={[styles.textInput, { color: colors.ink, borderColor: withAlpha(colors.ink, 0.2) }]}
          placeholder="Write your thoughts..."
          placeholderTextColor={colors.inkFaint}
          multiline
          value={inputText}
          onChangeText={setInputText}
        />
      )}

      <Text variant="labelSmall" color="inkMuted" align="center" style={styles.timer}>
        {countdown > 0 ? `${countdown}s remaining` : 'Take your time...'}
      </Text>

      <View style={styles.footer}>
        <Button variant="glow" size="lg" tone="warm" fullWidth onPress={handleNext}>
          {isLastPrompt ? 'Complete' : 'Next Prompt'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing[5], justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2], marginTop: spacing[3], marginBottom: spacing[6] },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  promptCard: { marginBottom: spacing[4] },
  textInput: { borderWidth: 1, borderRadius: 12, padding: spacing[4], minHeight: 100, textAlignVertical: 'top', marginBottom: spacing[4] },
  timer: { marginBottom: spacing[4] },
  footer: { marginTop: spacing[2] },
  completeContainer: { alignItems: 'center' },
  completeIcon: { fontSize: 64, marginBottom: spacing[4] },
  completeText: { marginTop: spacing[3] },
});

export default JournalPromptPlayer;
