/**
 * JournalEntryScreen
 */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, layout, typography } from '../theme';
import { RootStackParamList } from '../types';
import { useHaptics } from '../hooks/useHaptics';

export function JournalEntryScreen() {
  const { gradients, colors, reduceMotion } = useTheme();
  const { notificationSuccess } = useHaptics();
  const route = useRoute<RouteProp<RootStackParamList, 'JournalEntry'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { mode, prompt, entry } = route.params;
  const [text, setText] = useState(entry?.content ?? '');
  const [title, setTitle] = useState(entry?.title ?? '');

  const isReadOnly = mode === 'view';
  const screenTitle = mode === 'view' ? 'Entry' : 'New Entry';

  const handleSave = async () => {
    await notificationSuccess();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.morning}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title={screenTitle}
              subtitle={prompt}
              compact
            />
          </Animated.View>

          <Card style={styles.card} elevation="lift">
            <TextInput
              style={[styles.titleInput, { color: colors.ink, fontFamily: typography.fontFamily.sansSemiBold }]}
              placeholder="Title (optional)"
              placeholderTextColor={colors.inkFaint}
              value={title}
              editable={!isReadOnly}
              onChangeText={setTitle}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
            <TextInput
              style={[styles.bodyInput, { color: colors.ink, fontFamily: typography.fontFamily.sansRegular }]}
              placeholder="Start writing..."
              placeholderTextColor={colors.inkFaint}
              value={text}
              editable={!isReadOnly}
              onChangeText={setText}
              multiline
            />
          </Card>

          {!isReadOnly && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="warm"
              haptic="none"
              onPress={handleSave}
              style={styles.primaryButton}
            >
              Save Entry
            </Button>
          )}

          <View style={{ height: layout.tabBarHeight }} />
        </ScrollView>
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
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  card: {
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  divider: {
    height: 1,
    marginBottom: spacing[3],
  },
  bodyInput: {
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  primaryButton: {
    marginBottom: spacing[4],
  },
});
