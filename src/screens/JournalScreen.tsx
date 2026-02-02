/**
 * JournalScreen
 * 
 * Clean, empty canvas for free-form journaling.
 * Minimal UI - just search and info buttons at top.
 * The content area is a pure blank space to write freely.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import {
  Text,
  AmbientBackground,
  SwipeableModal,
} from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

// =============================================================================
// ICON BUTTON COMPONENT
// =============================================================================
interface IconButtonProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function IconButton({ icon, onPress, accessibilityLabel }: IconButtonProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.9, 1], [0.7, 1]),
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View 
        style={[
          styles.iconButton, 
          { backgroundColor: withAlpha(colors.ink, 0.06) },
          animatedStyle
        ]}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// JOURNAL SCREEN
// =============================================================================
export function JournalScreen() {
  const { colors, isDark, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactMedium, notificationSuccess } = useHaptics();
  const { createEntry } = useJournal();

  const [content, setContent] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if user has started writing
  const hasContent = content.trim().length > 0;

  // Save the entry
  const handleSave = useCallback(async () => {
    if (!hasContent || isSaving) return;
    
    setIsSaving(true);
    await impactMedium();
    
    try {
      await createEntry({
        content: content.trim(),
        isEncrypted: false,
        isLocked: false,
      });
      await notificationSuccess();
      setContent('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, hasContent, isSaving, createEntry, impactMedium, notificationSuccess]);

  const handleSearch = () => {
    navigation.navigate('JournalSearch');
  };

  const handleInfo = () => {
    setShowInfoModal(true);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Minimal Header - Just 2 tiny buttons */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(400)}
            style={styles.header}
          >
            <IconButton
              icon="🔍"
              onPress={handleSearch}
              accessibilityLabel="Search journal entries"
            />
            <IconButton
              icon="ℹ️"
              onPress={handleInfo}
              accessibilityLabel="Journal information"
            />
          </Animated.View>

          {/* Clean Empty Canvas - The Writing Space */}
          <View style={styles.canvasContainer}>
            <TextInput
              style={[
                styles.canvas,
                { 
                  color: colors.ink,
                }
              ]}
              placeholder="Write freely..."
              placeholderTextColor={withAlpha(colors.ink, 0.25)}
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              autoFocus={false}
              scrollEnabled
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>

          {/* Subtle Save Button - Only appears when there's content */}
          {hasContent && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.saveContainer}
            >
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={[
                  styles.saveButton,
                  { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }
                ]}
              >
                <Text 
                  variant="labelMedium" 
                  style={{ color: colors.accentPrimary, opacity: isSaving ? 0.5 : 1 }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Info Modal */}
      <SwipeableModal
        visible={showInfoModal}
        onDismiss={() => setShowInfoModal(false)}
        heightRatio={0.45}
      >
        <View style={styles.infoContent}>
          <Text variant="headlineSmall" color="ink" style={{ marginBottom: spacing[3] }}>
            Your Journal
          </Text>
          <Text variant="bodyMedium" color="ink" style={styles.infoParagraph}>
            This is your private space. Write freely without judgment.
          </Text>
          <Text variant="bodyMedium" color="inkMuted" style={styles.infoParagraph}>
            Everything you write stays on your device and is never shared.
          </Text>
          <View style={styles.infoTips}>
            <Text variant="labelSmall" color="inkFaint" style={styles.infoTipsLabel}>
              IDEAS
            </Text>
            <Text variant="bodySmall" color="inkMuted" style={styles.infoTip}>
              • Stream of consciousness
            </Text>
            <Text variant="bodySmall" color="inkMuted" style={styles.infoTip}>
              • Gratitude moments
            </Text>
            <Text variant="bodySmall" color="inkMuted" style={styles.infoTip}>
              • Process difficult feelings
            </Text>
            <Text variant="bodySmall" color="inkMuted" style={styles.infoTip}>
              • Capture insights
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setShowInfoModal(false);
              navigation.navigate('JournalEntries');
            }}
            style={[styles.viewEntriesButton, { borderColor: withAlpha(colors.ink, 0.1) }]}
          >
            <Text variant="labelMedium" color="inkMuted">
              View Past Entries →
            </Text>
          </Pressable>
        </View>
      </SwipeableModal>
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
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },
  canvas: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  saveContainer: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    alignItems: 'flex-end',
  },
  saveButton: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: 20,
  },
  infoContent: {
    paddingVertical: spacing[2],
  },
  infoParagraph: {
    marginBottom: spacing[3],
    lineHeight: 24,
  },
  infoTips: {
    marginTop: spacing[4],
    marginBottom: spacing[5],
  },
  infoTipsLabel: {
    letterSpacing: 1.5,
    marginBottom: spacing[3],
  },
  infoTip: {
    marginBottom: spacing[2],
    paddingLeft: spacing[2],
  },
  viewEntriesButton: {
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    marginTop: spacing[2],
    alignItems: 'center',
  },
});

export default JournalScreen;
