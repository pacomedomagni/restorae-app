/**
 * SoundHapticsScreen
 * Two toggles only
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, layout, withAlpha } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

export function SoundHapticsScreen() {
  const { gradients, colors, reduceMotion } = useTheme();
  const { hapticsEnabled, soundsEnabled, setHapticsEnabled, setSoundsEnabled } = usePreferences();
  const { impactLight } = useHaptics();

  const toggleHaptics = async (value: boolean) => {
    await impactLight();
    setHapticsEnabled(value);
  };

  const toggleSounds = async (value: boolean) => {
    await impactLight();
    setSoundsEnabled(value);
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
              title="Sounds & Haptics"
              subtitle="Choose what you feel and hear"
              compact
            />
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}>
            <Card style={styles.row} elevation="lift">
              <View style={styles.rowText}>
                <Text variant="headlineSmall" color="ink">
                  Haptics
                </Text>
                <Text variant="bodySmall" color="inkMuted">
                  Subtle tactile feedback
                </Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={toggleHaptics}
                trackColor={{ false: colors.borderMuted, true: withAlpha(colors.accentPrimary, 0.5) }}
                thumbColor={hapticsEnabled ? colors.accentPrimary : colors.canvasElevated}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(320).duration(400)}>
            <Card style={styles.row} elevation="lift">
              <View style={styles.rowText}>
                <Text variant="headlineSmall" color="ink">
                  Sounds
                </Text>
                <Text variant="bodySmall" color="inkMuted">
                  Ambient and UI audio
                </Text>
              </View>
              <Switch
                value={soundsEnabled}
                onValueChange={toggleSounds}
                trackColor={{ false: colors.borderMuted, true: withAlpha(colors.accentPrimary, 0.5) }}
                thumbColor={soundsEnabled ? colors.accentPrimary : colors.canvasElevated}
              />
            </Card>
          </Animated.View>

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  rowText: {
    flex: 1,
    marginRight: spacing[4],
  },
});
