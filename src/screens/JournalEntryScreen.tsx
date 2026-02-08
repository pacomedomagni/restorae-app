/**
 * JournalEntryScreen - Consistent UI with encryption support
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, Switch, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader, AlertModal, ExitConfirmationModal } from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
import logger from '../services/logger';
import { useHaptics } from '../hooks/useHaptics';
import { useBiometrics } from '../hooks/useBiometrics';
import { navigationHelpers } from '../services/navigationHelpers';
import type { RootStackParamList } from '../types';

type JournalEntryRouteParams = {
  mode: 'view' | 'prompt' | 'new';
  prompt?: string;
  entry?: { id?: string; title?: string; content: string };
};

export function JournalEntryScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: JournalEntryRouteParams }, 'params'>>();
  const { notificationSuccess, impactLight } = useHaptics();
  const { createEntry, updateEntry, entries } = useJournal();
  const { isAvailable: biometricsAvailable, authenticate } = useBiometrics();
  
  const mode = route.params?.mode || 'new';
  const prompt = route.params?.prompt;
  const existingEntry = route.params?.entry;
  const isEditing = mode === 'view' && existingEntry?.id;

  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [encrypted, setEncrypted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const palette = colors;

  // Modal state
  const [showSaveError, setShowSaveError] = useState(false);
  const [showEncryptConfirm, setShowEncryptConfirm] = useState(false);
  
  // Auto-save key
  const DRAFT_KEY = '@restorae/journal_draft';

  // Load draft on mount for new entries
  useEffect(() => {
    if (mode === 'new') {
      const loadDraft = async () => {
        try {
          const draft = await AsyncStorage.getItem(DRAFT_KEY);
          if (draft) {
            const { title: dTitle, content: dContent } = JSON.parse(draft);
            if ((!title && dTitle) || (!content && dContent)) {
               // Only restore if fields are empty to avoid overwriting prompts
               if (!title) setTitle(dTitle);
               if (!content && !prompt) setContent(dContent);
            }
          }
        } catch (e) {
          logger.debug('Failed to load draft');
        }
      };
      loadDraft();
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (mode !== 'new' || (!title && !content)) return;
    
    const saveTimeout = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
      } catch (e) {
        logger.debug('Failed to save draft');
      }
    }, 1000); // Debounce 1s

    return () => clearTimeout(saveTimeout);
  }, [title, content, mode]);

  // Pre-fill prompt if provided
  useEffect(() => {
    if (mode === 'prompt' && prompt) {
      setContent(`${prompt}\n\n`);
    }
  }, [mode, prompt]);

  const getHeaderTitle = () => {
    if (mode === 'prompt') return 'Reflect';
    if (isEditing) return 'Edit Entry';
    return 'New Entry';
  };

  const getHeaderSubtitle = () => {
    if (mode === 'prompt') return 'Respond to the prompt';
    if (isEditing) return 'Update your journal';
    return 'Write freely';
  };

  const handleSave = useCallback(async () => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (isEditing && existingEntry?.id) {
        await updateEntry(existingEntry.id, {
          title: title.trim() || undefined,
          content: content.trim(),
          prompt: prompt ?? undefined,
        });
        await notificationSuccess();
        navigation.goBack();
      } else {
        await createEntry({
          title: title.trim() || undefined,
          content: content.trim(),
          prompt: prompt ?? undefined,
          isEncrypted: encrypted,
          isLocked: encrypted,
        });

        if (mode === 'new') {
          await AsyncStorage.removeItem(DRAFT_KEY);
        }

        // Calculate word count for stats
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        // Navigate to completion screen for new entries
        navigationHelpers.navigateToSessionComplete(navigation, {
          sessionType: 'journal',
          sessionName: title.trim() || 'Journal Entry',
          wordCount,
        });
      }
    } catch (error) {
      logger.debug('Failed to save entry', { error: error instanceof Error ? error.message : String(error) });
      setShowSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }, [
    content,
    isSaving,
    isEditing,
    existingEntry?.id,
    title,
    mode,
    prompt,
    createEntry,
    updateEntry,
    encrypted,
    notificationSuccess,
    navigation,
  ]);

  const handleEncryptionToggle = useCallback(async () => {
    await impactLight();

    if (!encrypted && biometricsAvailable) {
      setShowEncryptConfirm(true);
      return;
    }

    setEncrypted(!encrypted);
  }, [encrypted, biometricsAvailable, impactLight]);

  const performEncryption = useCallback(async () => {
    setShowEncryptConfirm(false);
    const success = await authenticate();
    if (success) {
      setEncrypted(true);
      await notificationSuccess();
    }
  }, [authenticate, notificationSuccess]);
  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
              <ScreenHeader
                title={getHeaderTitle()}
                subtitle={getHeaderSubtitle()}
                compact
              />
            </Animated.View>

            {/* Prompt Card (if from prompt mode) */}
            {mode === 'prompt' && prompt && (
              <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
                <GlassCard variant="subtle" padding="md" style={styles.promptCard}>
                  <Text variant="labelMedium" color="accent">PROMPT</Text>
                  <Text variant="bodyMedium" color="ink" style={styles.promptText}>
                    {prompt}
                  </Text>
                </GlassCard>
              </Animated.View>
            )}

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
              <GlassCard variant="elevated" padding="lg">
                <TextInput
                  style={[styles.titleInput, { color: palette.ink, borderColor: palette.border }]}
                  placeholder="Title (optional)"
                  placeholderTextColor={palette.inkMuted}
                  value={title}
                  onChangeText={setTitle}
                  editable={mode === 'new' || mode === 'prompt' || Boolean(isEditing)}
                />
                
                <TextInput
                  style={[styles.contentInput, { color: palette.ink, borderColor: palette.border }]}
                  placeholder="Start writing..."
                  placeholderTextColor={palette.inkMuted}
                  multiline
                  scrollEnabled={false}
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                  editable={mode === 'new' || mode === 'prompt' || Boolean(isEditing)}
                />

                {/* Encryption Toggle (only for new entries) */}
                {!isEditing && biometricsAvailable && (
                  <View style={styles.encryptionRow}>
                    <View style={styles.encryptionInfo}>
                      <Text variant="labelMedium" color="ink">
                        🔒 Encrypt Entry
                      </Text>
                      <Text variant="bodySmall" color="inkMuted">
                        Secure with biometrics
                      </Text>
                    </View>
                    <Switch
                      value={encrypted}
                      onValueChange={handleEncryptionToggle}
                      trackColor={{ false: palette.border, true: colors.accentPrimary }}
                      thumbColor={colors.textInverse}
                    />
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!content.trim() || isSaving}
                onPress={handleSave}
                style={styles.saveButton}
              >
                {isSaving ? 'Saving...' : (isEditing ? 'Update Entry' : 'Save Entry')}
              </Button>

              <Button
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => navigation.goBack()}
              >
                Cancel
              </Button>
            </Animated.View>

            <View style={{ height: layout.tabBarHeight }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Save Error Alert */}
      <AlertModal
        visible={showSaveError}
        type="error"
        title="Save Failed"
        message="Unable to save your journal entry. Please try again."
        confirmText="OK"
        onConfirm={() => setShowSaveError(false)}
      />

      {/* Encryption Confirmation */}
      <ExitConfirmationModal
        visible={showEncryptConfirm}
        title="Enable Encryption"
        message="This entry will be secured with biometric authentication. You'll need to verify your identity to view it later."
        confirmText="Enable"
        cancelText="Cancel"
        onConfirm={performEncryption}
        onCancel={() => setShowEncryptConfirm(false)}
      />
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
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[8],
  },
  promptCard: {
    marginBottom: spacing[4],
  },
  promptText: {
    marginTop: spacing[2],
    lineHeight: 22,
    fontStyle: 'italic',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: spacing[3],
    marginBottom: spacing[4],
    borderBottomWidth: 1,
  },
  contentInput: {
    minHeight: 200,
    fontSize: 16,
    lineHeight: 26,
    padding: spacing[3],
  },
  encryptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  encryptionInfo: {
    flex: 1,
    gap: spacing[1],
  },
  saveButton: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
});
