/**
 * ToolsScreen
 * Premium tools collection following RESTORAE_SPEC.md
 * 
 * Features:
 * - Featured tool card with gradient accent
 * - Tool grid with category cards (shadows, proper elevation)
 * - 6 tools as per spec: Breathe, Ground, Reset, Focus, Journal, SOS
 * - Press animations and haptic feedback
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, Button, SpaBackdrop, SpaMotif, SpaCardTexture, ScreenHeader } from '../components/ui';
import { LuxeIcon } from '../components/LuxeIcon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

// =============================================================================
// TOOL DATA
// =============================================================================
type ToolChoiceId = 'breathe' | 'ground' | 'reset' | 'focus' | 'sos' | 'more';

interface ToolChoice {
  id: ToolChoiceId;
  name: string;
  description: string;
  icon: 'breathe' | 'ground' | 'reset' | 'focus' | 'sos' | 'tools';
  meta: string;
  tone?: 'primary' | 'warm' | 'calm';
}

const coreTools: ToolChoice[] = [
  { id: 'breathe', name: 'Breathwork', description: 'Gentle breathing patterns.', icon: 'breathe', meta: '3-6 min', tone: 'primary' },
  { id: 'ground', name: 'Grounding', description: 'Anchor your senses and body.', icon: 'ground', meta: '4 min', tone: 'warm' },
  { id: 'reset', name: 'Reset', description: 'Release tension and soften.', icon: 'reset', meta: '6 min', tone: 'warm' },
  { id: 'focus', name: 'Focus', description: 'Deep work sessions and ambience.', icon: 'focus', meta: '10 min', tone: 'calm' },
];

const supportTools: ToolChoice[] = [
  { id: 'sos', name: 'SOS', description: 'Fast relief when you need it.', icon: 'sos', meta: '1 min', tone: 'warm' },
  { id: 'more', name: 'Full Library', description: 'Browse rituals and tracks.', icon: 'tools', meta: 'Explore', tone: 'primary' },
];

// =============================================================================
// TOOL CARD COMPONENT
// =============================================================================
interface ToolRowProps {
  tool: ToolChoice;
  onPress: () => void;
  delay: number;
}

function ToolRow({ tool, onPress, delay }: ToolRowProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();
  const toneColor =
    tool.tone === 'warm' ? colors.accentWarm : tool.tone === 'calm' ? colors.accentCalm : colors.accentPrimary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.toolRow,
            animatedStyle,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: withAlpha(toneColor, 0.12) }]}>
              <LuxeIcon name={tool.icon} size={24} color={toneColor} />
            </View>
            <View style={styles.toolText}>
              <Text variant="headlineSmall" color="ink" style={styles.toolName}>
                {tool.name}
              </Text>
              <Text variant="bodySmall" color="inkMuted">
                {tool.description}
              </Text>
            </View>
            <Text variant="labelSmall" style={{ color: withAlpha(toneColor, 0.85) }}>
              {tool.meta}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// TOOLS SCREEN
// =============================================================================
export function ToolsScreen() {
  const { colors, gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleToolPress = (tool: ToolChoice) => {
    if (tool.id === 'breathe') {
      navigation.navigate('Breathing', { patternId: 'calm-breath' });
    }
    if (tool.id === 'ground') {
      navigation.navigate('Grounding');
    }
    if (tool.id === 'reset') {
      navigation.navigate('Reset');
    }
    if (tool.id === 'focus') {
      navigation.navigate('Focus');
    }
    if (tool.id === 'sos') {
      navigation.navigate('Sos');
    }
    if (tool.id === 'more') {
      navigation.navigate('ToolsMore');
    }
  };

  return (
    <View style={styles.container}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={gradients.calm}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SpaBackdrop />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              eyebrow="WELLNESS"
              title="Tools"
              subtitle="Curated rituals and grounding tools"
            />
          </Animated.View>

          <Card style={styles.heroCard} elevation="hero">
            <SpaMotif />
            <SpaCardTexture />
            <Text variant="labelSmall" color="inkFaint">
              FEATURED RITUAL
            </Text>
            <Text variant="headlineLarge" color="ink" style={styles.heroTitle}>
              Restorative Breath
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.heroText}>
              A guided breath sequence to slow the nervous system.
            </Text>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="calm"
              haptic="medium"
              onPress={() => navigation.navigate('Breathing', { patternId: 'calm-breath' })}
              style={styles.heroButton}
            >
              Begin Session
            </Button>
          </Card>

          <View style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              CORE TOOLS
            </Text>
            {coreTools.map((tool, index) => (
              <Card key={tool.id} padding="none" style={styles.listItemCard} elevation="soft">
                <ToolRow tool={tool} onPress={() => handleToolPress(tool)} delay={300 + index * 80} />
              </Card>
            ))}
          </View>

          <View style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              SUPPORT
            </Text>
            {supportTools.map((tool, index) => (
              <Card key={tool.id} padding="none" style={styles.listItemCard} elevation="soft">
                <ToolRow tool={tool} onPress={() => handleToolPress(tool)} delay={520 + index * 80} />
              </Card>
            ))}
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: layout.tabBarHeight }} />
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
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  heroCard: {
    marginTop: spacing[3],
    padding: spacing[6],
  },
  heroTitle: {
    marginTop: spacing[2],
  },
  heroText: {
    marginTop: spacing[2],
  },
  heroButton: {
    marginTop: spacing[5],
  },
  section: {
    marginTop: spacing[6],
  },
  sectionLabel: {
    marginBottom: spacing[3],
  },
  listItemCard: {
    marginBottom: spacing[3],
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: {
    flex: 1,
    marginLeft: spacing[4],
  },
  toolName: {
    marginBottom: spacing[1],
  },
});
