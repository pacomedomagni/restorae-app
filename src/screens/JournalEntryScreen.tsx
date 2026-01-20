/**
 * JournalEntryScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

export function JournalEntryScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { notificationSuccess } = useHaptics();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const palette = colors;

  const handleSave = async () => {
    await notificationSuccess();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="New Entry"
              subtitle="Express your thoughts freely"
              compact
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              <TextInput
                style={[styles.titleInput, { color: palette.ink, borderColor: palette.border }]}
                placeholder="Title (optional)"
                placeholderTextColor={palette.inkMuted}
                value={title}
                onChangeText={setTitle}
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
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!content.trim()}
              onPress={handleSave}
              style={styles.saveButton}
            >
              Save Entry
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
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: spacing[3],
    marginBottom: spacing[4],
    borderBottomWidth: 1,
  },
  contentInput: {
    minHeight: 250,
    fontSize: 16,
    lineHeight: 26,
    padding: spacing[3],
  },
  saveButton: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
});
