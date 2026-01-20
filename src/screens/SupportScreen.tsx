/**
 * SupportScreen
 * Support actions
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

import { useTheme } from '../contexts/ThemeContext';
import { Text, Card, SpaBackdrop, ScreenHeader } from '../components/ui';
import { spacing, borderRadius, layout } from '../theme';

type SupportAction = {
  id: 'help' | 'feedback' | 'about';
  title: string;
  description: string;
};

const actions: SupportAction[] = [
  { id: 'help', title: 'Help Center', description: 'Find answers fast.' },
  { id: 'feedback', title: 'Send Feedback', description: 'Share ideas or report issues.' },
  { id: 'about', title: 'About Restorae', description: 'Version and credits.' },
];

interface ActionRowProps {
  action: SupportAction;
  delay: number;
  onPress: () => void;
}

function ActionRow({ action, delay, onPress }: ActionRowProps) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.99, { damping: 15, stiffness: 400 });
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
        <Animated.View
          style={[styles.row, animatedStyle]}
        >
          <Card elevation="lift">
            <Text variant="headlineSmall" color="ink">
              {action.title}
            </Text>
            <Text variant="bodySmall" color="inkMuted" style={styles.rowDescription}>
              {action.description}
            </Text>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function SupportScreen() {
  const { gradients, reduceMotion } = useTheme();

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
              title="Support"
              subtitle="We are here to help"
              compact
            />
          </Animated.View>

          <View style={styles.list}>
            {actions.map((action, index) => (
              <ActionRow
                key={action.id}
                action={action}
                delay={200 + index * 120}
                onPress={() => {}}
              />
            ))}
          </View>

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
  list: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  row: {
    borderRadius: borderRadius.xl,
  },
  rowDescription: {
    marginTop: spacing[1],
  },
});
