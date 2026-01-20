/**
 * PrivacyScreen
 * Privacy actions
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

type PrivacyAction = {
  id: 'lock' | 'export' | 'delete';
  title: string;
  description: string;
  destructive?: boolean;
};

const actions: PrivacyAction[] = [
  { id: 'lock', title: 'App Lock', description: 'Secure the journal with biometrics.' },
  { id: 'export', title: 'Export Data', description: 'Download an encrypted backup.' },
  { id: 'delete', title: 'Delete All Data', description: 'Permanently remove local data.', destructive: true },
];

interface ActionRowProps {
  action: PrivacyAction;
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
            <Text variant="headlineSmall" style={{ color: action.destructive ? colors.statusError : colors.ink }}>
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

export function PrivacyScreen() {
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
              title="Privacy"
              subtitle="Your data stays on device"
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
