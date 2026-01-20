/**
 * MoodCheckinScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from '../types';

export function MoodCheckinScreen() {
  const { reduceMotion, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodCheckin'>>();
  const { notificationSuccess } = useHaptics();
  const [note, setNote] = useState('');

  const mood = route.params?.mood || 'calm';
  const palette = colors;

  const handleSave = async () => {
    await notificationSuccess();
    navigation.navigate('MoodResult', { mood, note });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Add a note"
              subtitle="What's contributing to this feeling?"
              compact
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              <TextInput
                style={[
                  styles.textInput,
                  { color: palette.ink, borderColor: palette.border }
                ]}
                placeholder="Write about what's on your mind..."
                placeholderTextColor={palette.inkMuted}
                multiline
                numberOfLines={6}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
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
              Skip note
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
