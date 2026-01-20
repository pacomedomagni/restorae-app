/**
 * AppearanceScreen
 * Light / Dark / System choices - Consistent UI
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { Text, GlassCard, AmbientBackground, ScreenHeader } from '../components/ui';
import { spacing, borderRadius, layout } from '../theme';
import { ThemeMode } from '../types';
import { useHaptics } from '../hooks/useHaptics';

const options: { id: ThemeMode; title: string; description: string }[] = [
  { id: 'light', title: 'Light', description: 'Warm, soft canvas for day.' },
  { id: 'dark', title: 'Dark', description: 'Deep charcoal for night.' },
  { id: 'system', title: 'System', description: 'Match your device setting.' },
];

export function AppearanceScreen() {
  const { colors, mode, setMode, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.scrollContent}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Appearance"
              subtitle="Choose how Restorae looks"
              compact
            />
          </Animated.View>

          <View style={styles.options}>
            {options.map((option, index) => {
              const selected = mode === option.id;
              return (
                <Animated.View
                  key={option.id}
                  entering={reduceMotion ? undefined : FadeInDown.delay(200 + index * 120).duration(400)}
                >
                  <GlassCard
                    variant={selected ? 'elevated' : 'default'}
                    padding="md"
                    glow={selected ? 'primary' : 'none'}
                    onPress={async () => {
                      await impactLight();
                      setMode(option.id);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionDot,
                          {
                            backgroundColor: selected ? colors.accentPrimary : colors.borderMuted,
                            borderWidth: selected ? 0 : 2,
                            borderColor: colors.border,
                          },
                        ]}
                      />
                      <View style={styles.optionText}>
                        <Text variant="headlineSmall" color="ink" style={styles.optionTitle}>
                          {option.title}
                        </Text>
                        <Text variant="bodySmall" color="inkMuted">
                          {option.description}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              );
            })}
          </View>

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
  options: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing[4],
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    marginBottom: spacing[1],
  },
});
