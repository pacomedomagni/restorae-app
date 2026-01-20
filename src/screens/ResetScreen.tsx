/**
 * ResetScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Button, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

const RESET_OPTIONS = [
  { 
    id: 'quick', 
    title: 'Quick Reset', 
    duration: '2 min',
    description: 'A rapid nervous system reset' 
  },
  { 
    id: 'breath', 
    title: 'Deep Breath', 
    duration: '5 min',
    description: 'Extended breathing for deep calm' 
  },
  { 
    id: 'body', 
    title: 'Body Scan', 
    duration: '10 min',
    description: 'Full body relaxation journey' 
  },
];

export function ResetScreen() {
  const { reduceMotion } = useTheme();
  const { selectionLight, notificationSuccess } = useHaptics();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleSelect = async (id: string) => {
    await selectionLight();
    setSelectedOption(id);
  };

  const handleStart = () => {
    if (selectedOption) {
      setIsActive(true);
    }
  };

  const handleFinish = async () => {
    await notificationSuccess();
    setIsActive(false);
    setSelectedOption(null);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title={isActive ? 'Resetting...' : 'Reset'}
              subtitle={isActive ? 'Follow the rhythm' : 'Choose your reset intensity'}
              compact
            />
          </Animated.View>

          {!isActive && RESET_OPTIONS.map((option, index) => (
            <Animated.View 
              key={option.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 100).duration(400)}
            >
              <GlassCard 
                variant={selectedOption === option.id ? 'elevated' : 'default'} 
                padding="lg"
                glow={selectedOption === option.id ? 'warm' : undefined}
                onPress={() => handleSelect(option.id)}
              >
                <View style={styles.optionHeader}>
                  <Text variant="headlineSmall" color="ink">{option.title}</Text>
                  <Text variant="labelMedium" color="inkMuted">{option.duration}</Text>
                </View>
                <Text variant="bodyMedium" color="inkMuted" style={styles.optionDesc}>
                  {option.description}
                </Text>
              </GlassCard>
            </Animated.View>
          ))}

          {isActive && (
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
              <GlassCard variant="elevated" padding="lg" glow="warm">
                <View style={styles.activeContent}>
                  <Text variant="displaySmall" color="ink" align="center">
                    Breathe
                  </Text>
                  <Text variant="bodyLarge" color="inkMuted" align="center" style={styles.activeText}>
                    In through your nose... out through your mouth
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            {isActive ? (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onPress={handleFinish}
                style={styles.actionButton}
              >
                End Reset
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!selectedOption}
                onPress={handleStart}
                style={styles.actionButton}
              >
                Begin Reset
              </Button>
            )}
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
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionDesc: {
    marginTop: spacing[2],
  },
  activeContent: {
    paddingVertical: spacing[8],
  },
  activeText: {
    marginTop: spacing[4],
  },
  actionButton: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
});
