/**
 * MoodCheckinScreen - Emotional Flow Enhanced
 * 
 * Now part of the breathing flow system:
 * - Receives user after acknowledgment pause
 * - Contextual prompts based on mood and journey
 * - Gentle transitions to results
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useEmotionalFlow } from '../contexts/EmotionalFlowContext';
import { 
  Text, 
  Button, 
  GlassCard, 
  AmbientBackground, 
  ScreenHeader, 
  MoodOrb, 
  TabSafeScrollView,
  CharacterCounter,
  OptionalBadge,
} from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics, useContextualCopy } from '../hooks';
import type { RootStackParamList, MoodType } from '../types';

const MOOD_LABELS: Record<MoodType, string> = {
  energized: 'Energized',
  calm: 'Calm',
  good: 'Good',
  anxious: 'Anxious',
  low: 'Low',
  tough: 'Tough',
};

const MAX_NOTE_LENGTH = 500;
const AUTO_SAVE_DELAY = 1500;

export function MoodCheckinScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodCheckin'>>();
  const { notificationSuccess } = useHaptics();
  const { emotionalState } = useEmotionalFlow();
  const { getJournalPrompt, getEncouragement } = useContextualCopy();
  
  const [note, setNote] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mood = (route.params?.mood || 'calm') as MoodType;
  const palette = colors;
  
  // Contextual prompts based on mood and journey
  const journalPrompt = getJournalPrompt(mood);
  const encouragement = getEncouragement();

  // Auto-save simulation
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (note.trim().length > 0) {
      setAutoSaveStatus('saving');
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus('saved');
        // Reset to idle after showing "Saved"
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }, 800);
    }
  }, [note]);

  useEffect(() => {
    if (note.trim().length > 0) {
      const timer = setTimeout(triggerAutoSave, AUTO_SAVE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [note, triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleNoteChange = (text: string) => {
    if (text.length <= MAX_NOTE_LENGTH) {
      setNote(text);
    }
  };

  const handleSave = async () => {
    await notificationSuccess();
    navigation.navigate('MoodResult', { mood, note });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TabSafeScrollView
          style={styles.scrollView}
          contentStyle={styles.scrollContent}
          noTabBar
        >
          {/* Selected Mood Display - Visual continuity from Home */}
          <Animated.View
            entering={reduceMotion ? undefined : ZoomIn.duration(400).springify()}
            style={styles.moodOrbContainer}
          >
            <MoodOrb
              mood={mood}
              label={MOOD_LABELS[mood]}
              size="lg"
              selected
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(150).duration(400)}>
            <Text variant="headlineLarge" color="ink" align="center" style={styles.title}>
              Feeling {MOOD_LABELS[mood].toLowerCase()}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.subtitle}>
              {journalPrompt}
            </Text>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(250).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              {/* Label with optional badge */}
              <View style={styles.inputLabelRow}>
                <Text variant="labelSmall" color="inkFaint" style={styles.inputLabel}>
                  ADD A NOTE
                </Text>
                <OptionalBadge />
              </View>
              
              <TextInput
                style={[
                  styles.textInput,
                  { color: palette.ink, borderColor: palette.border }
                ]}
                placeholder={journalPrompt}
                placeholderTextColor={palette.inkMuted}
                multiline
                numberOfLines={6}
                value={note}
                onChangeText={handleNoteChange}
                textAlignVertical="top"
                maxLength={MAX_NOTE_LENGTH}
              />
              
              {/* Character counter with auto-save */}
              <CharacterCounter
                current={note.length}
                max={MAX_NOTE_LENGTH}
                showAutoSave={note.length > 0}
                autoSaveStatus={autoSaveStatus}
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSave}
              style={styles.saveButton}
            >
              Save Check-in
            </Button>

            <Button
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('MoodResult', { mood })}
            >
              Continue without note
            </Button>
          </Animated.View>
        </TabSafeScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  moodOrbContainer: {
    alignItems: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  subtitle: {
    marginBottom: spacing[6],
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  inputLabel: {
    letterSpacing: 1.5,
  },
  textInput: {
    minHeight: 150,
    fontSize: 16,
    lineHeight: 24,
    padding: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
});
