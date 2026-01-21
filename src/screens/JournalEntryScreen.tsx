/**
 * JournalEntryScreen - Consistent UI with encryption support
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, Switch, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import { useBiometrics } from '../hooks/useBiometrics';
import type { RootStackParamList } from '../types';

type JournalEntryRouteParams = {
  mode: 'view' | 'prompt' | 'new';
  prompt?: string;
  entry?: { id?: string; title?: string; content: string };
};

export function JournalEntryScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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

  // Pre-fill prompt if provided
  useEffect(() => {
    if (mode === 'prompt' && prompt) {
      setContent(`${prompt}\n\n`);
    }
  }, [mode, prompt]);

  const handleEncryptionToggle = useCallback(async () => {
    await impactLight();
    if (!encrypted && biometricsAvailable) {
      // Verify user wants to encrypt
      Alert.alert(
        'Encrypt Entry',
        'This entry will be secured with biometric authentication. You\'ll need to authenticate to view it later.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Encrypt', 
            onPress: async () => {
              const success = await authenticate();
              if (success) {
                setEncrypted(true);
              }
            }
          },
        ]
      );
    } else {
      setEncrypted(!encrypted);
    }
  }, [encrypted, biometricsAvailable, authenticate, impactLight]);

  const handleSave = useCallback(async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    
    try {
      if (isEditing && existingEntry?.id) {
        // Update existing entry
        await updateEntry(existingEntry.id, {
          content: content.trim(),
          prompt: prompt,
        });
      } else {
        // Create new entry
        await createEntry({
          title: title.trim() || undefined,
          content: content.trim(),
          prompt: prompt,
          isEncrypted: encrypted,
          isLocked: encrypted && biometricsAvailable,
        });
      }
      
      await notificationSuccess();
      navigation.goBack();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [content, title, prompt, encrypted, biometricsAvailable, isEditing, existingEntry, createEntry, updateEntry, notificationSuccess, navigation]);

  const getHeaderTitle = () => {
    if (mode === 'prompt') return 'Guided Entry';
    if (mode === 'view') return 'View Entry';
    return 'New Entry';
  };

  const getHeaderSubtitle = () => {
    if (mode === 'prompt') return 'Reflect on the prompt below';
    if (mode === 'view') return 'Your personal reflection';
    return 'Express your thoughts freely';
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
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
                numberOfLines={12}
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
                    thumbColor="#FFFFFF"
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
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
