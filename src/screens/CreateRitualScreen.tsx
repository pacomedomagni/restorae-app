/**
 * CreateRitualScreen
 * 
 * Create custom rituals with personalized steps
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import logger from '../services/logger';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutRight,
  Layout,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  ScreenHeader,
  Button,
  PremiumButton,
  AlertModal,
} from '../components/ui';
import { spacing, layout, borderRadius, withAlpha } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

// =============================================================================
// TYPES
// =============================================================================
export interface CustomRitual {
  id: string;
  name: string;
  description: string;
  timeOfDay: 'morning' | 'midday' | 'evening' | 'anytime';
  steps: RitualStep[];
  estimatedDuration: number; // minutes
  createdAt: string;
  color: string;
  icon: string;
}

interface RitualStep {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  type: 'breathe' | 'reflect' | 'move' | 'write' | 'gratitude' | 'custom';
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/custom_rituals';

const STEP_TYPES: { id: RitualStep['type']; label: string; icon: string; defaultDuration: number }[] = [
  { id: 'breathe', label: 'Breathing', icon: '🫁', defaultDuration: 60 },
  { id: 'reflect', label: 'Reflection', icon: '💭', defaultDuration: 120 },
  { id: 'move', label: 'Movement', icon: '🧘', defaultDuration: 90 },
  { id: 'write', label: 'Journaling', icon: '✍️', defaultDuration: 180 },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏', defaultDuration: 60 },
  { id: 'custom', label: 'Custom', icon: '✨', defaultDuration: 60 },
];

const TIME_OPTIONS: { id: CustomRitual['timeOfDay']; label: string; icon: string }[] = [
  { id: 'morning', label: 'Morning', icon: '☀️' },
  { id: 'midday', label: 'Midday', icon: '🌤️' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
  { id: 'anytime', label: 'Anytime', icon: '⏰' },
];

const COLORS = ['#7DD3C0', '#FFB347', '#98D8AA', '#E8A87C', '#9B8AA8', '#C38D9E', '#87CEEB', '#DDA0DD'];
const ICONS = ['🌟', '🌸', '🔥', '💎', '🌊', '🍃', '⭐', '🌙'];

// =============================================================================
// STEP EDITOR
// =============================================================================
interface StepEditorProps {
  step: RitualStep;
  index: number;
  onUpdate: (step: RitualStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function StepEditor({
  step,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: StepEditorProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const stepType = STEP_TYPES.find(t => t.id === step.type) || STEP_TYPES[5];

  return (
    <Animated.View
      entering={reduceMotion ? undefined : SlideInRight.duration(300)}
      exiting={reduceMotion ? undefined : SlideOutRight.duration(200)}
      layout={Layout.springify()}
    >
      <GlassCard variant="elevated" padding="md" style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text variant="labelMedium" color="ink">{index + 1}</Text>
          </View>
          <View style={styles.stepTypeIcon}>
            <Text style={styles.stepIcon}>{stepType.icon}</Text>
          </View>
          <View style={styles.stepActions}>
            {!isFirst && (
              <Pressable onPress={onMoveUp} hitSlop={8}>
                <Text style={styles.actionIcon}>↑</Text>
              </Pressable>
            )}
            {!isLast && (
              <Pressable onPress={onMoveDown} hitSlop={8}>
                <Text style={styles.actionIcon}>↓</Text>
              </Pressable>
            )}
            <Pressable onPress={onRemove} hitSlop={8}>
              <Text style={[styles.actionIcon, { color: colors.accentWarm }]}>×</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          style={[styles.stepTitleInput, { color: colors.ink, borderColor: colors.border }]}
          placeholder="Step title"
          placeholderTextColor={colors.inkMuted}
          value={step.title}
          onChangeText={title => onUpdate({ ...step, title })}
        />

        <TextInput
          style={[styles.stepDescInput, { color: colors.ink, borderColor: colors.border }]}
          placeholder="Description (optional)"
          placeholderTextColor={colors.inkFaint}
          value={step.description}
          onChangeText={description => onUpdate({ ...step, description })}
          multiline
          numberOfLines={2}
        />

        <View style={styles.durationRow}>
          <Text variant="labelSmall" color="inkMuted">Duration:</Text>
          <View style={styles.durationButtons}>
            {[30, 60, 120, 180].map(seconds => (
              <Pressable
                key={seconds}
                onPress={async () => {
                  await impactLight();
                  onUpdate({ ...step, duration: seconds });
                }}
                style={[
                  styles.durationButton,
                  step.duration === seconds && { backgroundColor: withAlpha(colors.accentPrimary, 0.2) },
                ]}
              >
                <Text
                  variant="labelSmall"
                  color={step.duration === seconds ? 'accent' : 'inkMuted'}
                >
                  {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function CreateRitualScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<CustomRitual['timeOfDay']>('morning');
  const [steps, setSteps] = useState<RitualStep[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Alert modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'error' | 'success';
    title: string;
    message?: string;
  }>({ visible: false, type: 'error', title: '' });

  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  const addStep = useCallback(async (type: RitualStep['type']) => {
    await impactLight();
    const stepType = STEP_TYPES.find(t => t.id === type)!;
    const newStep: RitualStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: stepType.label,
      description: '',
      duration: stepType.defaultDuration,
      type,
    };
    setSteps(prev => [...prev, newStep]);
  }, [impactLight]);

  const updateStep = useCallback((index: number, step: RitualStep) => {
    setSteps(prev => prev.map((s, i) => i === index ? step : s));
  }, []);

  const removeStep = useCallback(async (index: number) => {
    await impactLight();
    setSteps(prev => prev.filter((_, i) => i !== index));
  }, [impactLight]);

  const moveStep = useCallback(async (index: number, direction: 'up' | 'down') => {
    await impactLight();
    setSteps(prev => {
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      return newSteps;
    });
  }, [impactLight]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Name Required',
        message: 'Please give your ritual a name.',
      });
      return;
    }
    if (steps.length === 0) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Steps Required',
        message: 'Please add at least one step to your ritual.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const ritual: CustomRitual = {
        id: `ritual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim(),
        timeOfDay,
        steps,
        estimatedDuration: Math.ceil(totalDuration / 60),
        createdAt: new Date().toISOString(),
        color: selectedColor,
        icon: selectedIcon,
      };

      // Load existing rituals
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const rituals = existing ? JSON.parse(existing) : [];
      rituals.push(ritual);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rituals));

      await notificationSuccess();
      navigation.goBack();
    } catch (error) {
      logger.error('Failed to save ritual:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save ritual. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [name, description, timeOfDay, steps, totalDuration, selectedColor, selectedIcon, notificationSuccess, navigation]);

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(400)}>
            <ScreenHeader
              title="Create Ritual"
              subtitle="Design your personal practice"
              showBack
              compact
            />
          </Animated.View>

          {/* Basic Info */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
            <GlassCard variant="elevated" padding="lg">
              <Text variant="labelMedium" color="inkMuted" style={styles.fieldLabel}>
                Ritual Name
              </Text>
              <TextInput
                style={[styles.nameInput, { color: colors.ink, borderColor: colors.border }]}
                placeholder="e.g., Morning Energy Boost"
                placeholderTextColor={colors.inkMuted}
                value={name}
                onChangeText={setName}
              />

              <Text variant="labelMedium" color="inkMuted" style={styles.fieldLabel}>
                Description (optional)
              </Text>
              <TextInput
                style={[styles.descInput, { color: colors.ink, borderColor: colors.border }]}
                placeholder="What's this ritual for?"
                placeholderTextColor={colors.inkFaint}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />

              <Text variant="labelMedium" color="inkMuted" style={styles.fieldLabel}>
                Best Time
              </Text>
              <View style={styles.timeOptions}>
                {TIME_OPTIONS.map(option => (
                  <Pressable
                    key={option.id}
                    onPress={async () => {
                      await impactLight();
                      setTimeOfDay(option.id);
                    }}
                    style={[
                      styles.timeOption,
                      timeOfDay === option.id && { backgroundColor: withAlpha(colors.accentPrimary, 0.2) },
                    ]}
                  >
                    <Text style={styles.timeIcon}>{option.icon}</Text>
                    <Text
                      variant="labelSmall"
                      color={timeOfDay === option.id ? 'accent' : 'inkMuted'}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Appearance */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              APPEARANCE
            </Text>
            <GlassCard variant="subtle" padding="md">
              <View style={styles.appearanceRow}>
                <View style={styles.iconSelector}>
                  {ICONS.map(icon => (
                    <Pressable
                      key={icon}
                      onPress={async () => {
                        await impactLight();
                        setSelectedIcon(icon);
                      }}
                      style={[
                        styles.iconOption,
                        selectedIcon === icon && { backgroundColor: withAlpha(colors.accentPrimary, 0.2) },
                      ]}
                    >
                      <Text style={styles.iconText}>{icon}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.colorSelector}>
                  {COLORS.map(color => (
                    <Pressable
                      key={color}
                      onPress={async () => {
                        await impactLight();
                        setSelectedColor(color);
                      }}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorSelected,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Steps */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}>
            <View style={styles.stepsHeader}>
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                STEPS ({steps.length})
              </Text>
              {steps.length > 0 && (
                <Text variant="labelSmall" color="inkMuted">
                  ~{Math.ceil(totalDuration / 60)} min
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Step List */}
          <View style={styles.stepsList}>
            {steps.map((step, index) => (
              <StepEditor
                key={step.id}
                step={step}
                index={index}
                onUpdate={s => updateStep(index, s)}
                onRemove={() => removeStep(index)}
                onMoveUp={() => moveStep(index, 'up')}
                onMoveDown={() => moveStep(index, 'down')}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
              />
            ))}
          </View>

          {/* Add Step */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              ADD STEP
            </Text>
            <View style={styles.stepTypesGrid}>
              {STEP_TYPES.map(type => (
                <Pressable
                  key={type.id}
                  onPress={() => addStep(type.id)}
                  style={[styles.stepTypeButton, { backgroundColor: withAlpha(colors.surfaceSubtle || colors.canvasElevated, 0.5) }]}
                >
                  <Text style={styles.stepTypeIcon}>{type.icon}</Text>
                  <Text variant="labelSmall" color="ink">{type.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Save Button */}
          <Animated.View 
            entering={reduceMotion ? undefined : FadeInUp.delay(500).duration(400)}
            style={styles.saveContainer}
          >
            <PremiumButton
              variant="glow"
              size="lg"
              fullWidth
              tone="calm"
              onPress={handleSave}
              disabled={isSaving || !name.trim() || steps.length === 0}
            >
              {isSaving ? 'Saving...' : 'Save Ritual'}
            </PremiumButton>

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
      </SafeAreaView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[8],
  },
  fieldLabel: {
    marginBottom: spacing[2],
    marginTop: spacing[4],
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  descInput: {
    fontSize: 14,
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timeOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  timeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  timeIcon: {
    fontSize: 20,
  },
  sectionLabel: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
    letterSpacing: 2,
  },
  appearanceRow: {
    gap: spacing[4],
  },
  iconSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsList: {
    gap: spacing[3],
  },
  stepCard: {
    gap: spacing[2],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(125, 211, 192, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTypeIcon: {
    flex: 1,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  stepTitleInput: {
    fontSize: 16,
    fontWeight: '500',
    padding: spacing[2],
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  stepDescInput: {
    fontSize: 14,
    padding: spacing[2],
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    minHeight: 40,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  durationButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  durationButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  stepTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stepTypeButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[1],
    minWidth: '30%',
    flexGrow: 1,
  },
  saveContainer: {
    marginTop: spacing[8],
    gap: spacing[3],
  },
});

export default CreateRitualScreen;
