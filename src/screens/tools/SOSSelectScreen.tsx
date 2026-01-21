/**
 * SOSSelectScreen
 * 
 * Selection for 8 SOS emergency presets
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  ScreenHeader,
} from '../../components/ui';
import { spacing, layout, withAlpha, borderRadius } from '../../theme';
import { RootStackParamList } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { SOS_PRESETS } from '../../data';

// =============================================================================
// PRESET CARD
// =============================================================================
interface PresetCardProps {
  preset: typeof SOS_PRESETS[number];
  index: number;
  onPress: () => void;
}

function PresetCard({ preset, index, onPress }: PresetCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactMedium();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Use warm accent for SOS cards
  const accentColor = colors.accentWarm;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 80).duration(400)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <GlassCard variant="default" padding="lg">
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{preset.icon}</Text>
              <View style={[styles.intensityBadge, { backgroundColor: withAlpha(accentColor, 0.15) }]}>
                <Text variant="labelSmall" style={{ color: accentColor }}>
                  {preset.phases.length} phases
                </Text>
              </View>
            </View>
            <Text variant="headlineMedium" color="ink">
              {preset.name}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardDescription}>
              {preset.description}
            </Text>
            <View style={styles.cardMeta}>
              <Text variant="labelSmall" color="inkFaint">
                {preset.totalDuration}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function SOSSelectScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePresetSelect = (presetId: string) => {
    navigation.navigate('SOSSession', { presetId });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
          <ScreenHeader
            title="SOS Relief"
            subtitle="Immediate help when you need it"
            showBack
          />
        </Animated.View>

        {/* Emergency Notice */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}
          style={[
            styles.noticeContainer,
            { backgroundColor: withAlpha(colors.accentWarm, 0.08) },
          ]}
        >
          <Text variant="bodySmall" color="inkMuted" align="center">
            These exercises help with acute anxiety and panic.{'\n'}
            For ongoing concerns, please reach out to a professional.
          </Text>
        </Animated.View>

        {/* Preset List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SOS_PRESETS.map((preset, index) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              index={index}
              onPress={() => handlePresetSelect(preset.id)}
            />
          ))}
          <View style={{ height: layout.tabBarHeight + spacing[4] }} />
        </ScrollView>
      </SafeAreaView>
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
  noticeContainer: {
    marginHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[4],
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing[3],
  },
  cardContent: {
    gap: spacing[2],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIcon: {
    fontSize: 28,
  },
  intensityBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  cardDescription: {
    lineHeight: 22,
  },
  cardMeta: {
    marginTop: spacing[1],
  },
});

export default SOSSelectScreen;
