/**
 * SoundHapticsScreen - Consistent UI
 */
import React, { useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, layout } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

export function SoundHapticsScreen() {
  const { reduceMotion, colors } = useTheme();
  const { selectionLight } = useHaptics();
  const palette = colors;

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState(false);

  const handleToggle = async (setter: (val: boolean) => void, value: boolean) => {
    await selectionLight();
    setter(value);
  };

  const settings = [
    {
      id: 'haptics',
      title: 'Haptic Feedback',
      description: 'Feel gentle vibrations during interactions',
      value: hapticsEnabled,
      setter: setHapticsEnabled,
    },
    {
      id: 'sounds',
      title: 'Sound Effects',
      description: 'Play sounds for actions and completions',
      value: soundEnabled,
      setter: setSoundEnabled,
    },
    {
      id: 'ambient',
      title: 'Ambient Sounds',
      description: 'Background nature sounds during exercises',
      value: ambientSound,
      setter: setAmbientSound,
    },
  ];

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Sound & Haptics"
              subtitle="Customize your sensory experience"
              compact
            />
          </Animated.View>

          {settings.map((setting, index) => (
            <Animated.View 
              key={setting.id} 
              entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 100).duration(400)}
            >
              <GlassCard variant="default" padding="lg">
                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="headlineSmall" color="ink">{setting.title}</Text>
                    <Text variant="bodySmall" color="inkMuted">{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={(val) => handleToggle(setting.setter, val)}
                    trackColor={{ false: palette.border, true: colors.accentPrimary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </GlassCard>
            </Animated.View>
          ))}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}>
            <GlassCard variant="subtle" padding="md" style={styles.noteCard}>
              <Text variant="bodySmall" color="inkMuted" align="center">
                💡 Haptics create a more immersive and mindful experience
              </Text>
            </GlassCard>
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    marginRight: spacing[4],
  },
  noteCard: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
});
