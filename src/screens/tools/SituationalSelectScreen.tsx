/**
 * SituationalSelectScreen
 * 
 * Selection for 10 situational moment guides
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
import { SITUATIONAL_GUIDES } from '../../data';

// =============================================================================
// GUIDE CARD
// =============================================================================
interface GuideCardProps {
  guide: typeof SITUATIONAL_GUIDES[number];
  index: number;
  onPress: () => void;
}

function GuideCard({ guide, index, onPress }: GuideCardProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
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
  }));

  // Assign colors based on category
  const categoryColors: Record<string, string> = {
    work: colors.accentCalm,
    social: colors.accentPrimary,
    health: colors.accentWarm,
    personal: '#9B8E80',
  };
  const accentColor = categoryColors[guide.category] || colors.accentCalm;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 60).duration(400)}
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
              <Text style={styles.cardIcon}>{guide.icon}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: withAlpha(accentColor, 0.12) }]}>
                <Text variant="labelSmall" style={{ color: accentColor }}>
                  {guide.category}
                </Text>
              </View>
            </View>
            <Text variant="headlineMedium" color="ink">
              {guide.name}
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.cardDescription}>
              {guide.description}
            </Text>
            <View style={styles.cardMeta}>
              <Text variant="labelSmall" color="inkFaint">
                {guide.totalDuration} • {guide.steps.length} steps
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
export function SituationalSelectScreen() {
  const { reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleGuideSelect = (guideId: string) => {
    navigation.navigate('SituationalSession', { guideId });
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
          <ScreenHeader
            title="Situational Guides"
            subtitle="Support for specific moments"
            showBack
          />
        </Animated.View>

        {/* Guide List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SITUATIONAL_GUIDES.map((guide, index) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              index={index}
              onPress={() => handleGuideSelect(guide.id)}
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
  categoryBadge: {
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

export default SituationalSelectScreen;
