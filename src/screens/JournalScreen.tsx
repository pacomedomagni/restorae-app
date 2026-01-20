/**
 * JournalScreen
 * Premium journal experience following RESTORAE_SPEC.md
 * 
 * Features:
 * - Warm gradient header
 * - New entry CTA with proper elevation
 * - Horizontal scrolling prompts (3 visible)
 * - Recent entries with mood indicators
 * - Press animations throughout
 */
import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

type JournalAction = {
  id: 'new' | 'prompt' | 'entries';
  title: string;
  description: string;
  icon: 'journal' | 'focus' | 'journal-tab';
  meta: string;
  tone?: 'primary' | 'warm' | 'calm';
};

const actions: JournalAction[] = [
  {
    id: 'new',
    title: 'New Entry',
    description: 'Begin with a clean page.',
    icon: 'journal',
    meta: '5 min',
    tone: 'primary',
  },
  {
    id: 'prompt',
    title: 'Prompted Entry',
    description: 'Gentle questions to guide you.',
    icon: 'focus',
    meta: '7 min',
    tone: 'calm',
  },
  {
    id: 'entries',
    title: 'Recent Entries',
    description: 'Return to your latest reflections.',
    icon: 'journal-tab',
    meta: 'View',
    tone: 'warm',
  },
];

interface ActionRowProps {
  action: JournalAction;
  delay: number;
  onPress: () => void;
}

function ActionRow({ action, delay, onPress }: ActionRowProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();
  const toneColor =
    action.tone === 'warm' ? colors.accentWarm : action.tone === 'calm' ? colors.accentCalm : colors.accentPrimary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(400)}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <Animated.View style={[styles.actionRow, animatedStyle]}>
          <View style={[styles.actionIcon, { backgroundColor: withAlpha(toneColor, 0.12) }]}>
            <LuxeIcon name={action.icon} size={22} color={toneColor} />
          </View>
          <View style={styles.actionText}>
            <Text variant="headlineSmall" color="ink" style={styles.actionTitle}>
              {action.title}
            </Text>
            <Text variant="bodySmall" color="inkMuted">
              {action.description}
            </Text>
          </View>
          <Text variant="labelSmall" style={{ color: withAlpha(toneColor, 0.85) }}>
            {action.meta}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// JOURNAL SCREEN
// =============================================================================
export function JournalScreen() {
  const { colors, gradients, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleNewEntry = () => {
    navigation.navigate('JournalEntry', { mode: 'new' });
  };

  const handleNavigate = (action: JournalAction['id']) => {
    if (action === 'prompt') {
      navigation.navigate('JournalPrompts');
    }
    if (action === 'entries') {
      navigation.navigate('JournalEntries');
    }
    if (action === 'new') {
      handleNewEntry();
    }
  };

  return (
    <View style={styles.container}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={gradients.morning}
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
              eyebrow="REFLECTION"
              title="Journal"
              subtitle="A private space to unwind and reflect"
            />
          </Animated.View>

          <Card style={styles.heroCard} elevation="hero">
            <SpaMotif />
            <SpaCardTexture />
            <Text variant="labelSmall" color="inkFaint">
              OPEN A NEW PAGE
            </Text>
            <Text variant="headlineLarge" color="ink" style={styles.heroTitle}>
              Start a new entry
            </Text>
            <Text variant="bodyMedium" color="inkMuted" style={styles.heroText}>
              Let your thoughts land without pressure. Free write or follow a prompt.
            </Text>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              tone="warm"
              haptic="medium"
              onPress={handleNewEntry}
              style={styles.heroButton}
            >
              Begin Writing
            </Button>
          </Card>

          <View style={styles.section}>
            <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
              JOURNAL FLOW
            </Text>
            {actions.map((action, index) => (
              <Card key={action.id} padding="none" style={styles.listItemCard} elevation="soft">
                <ActionRow
                  action={action}
                  delay={260 + index * 80}
                  onPress={() => handleNavigate(action.id)}
                />
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    marginBottom: spacing[1],
  },
});
