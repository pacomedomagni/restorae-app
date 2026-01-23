/**
 * SOSFloatingButton
 * 
 * Persistent SOS floating action button for emergency relief access.
 * Always accessible from main screens.
 */
import React from 'react';
import { StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { LuxeIcon } from '../LuxeIcon';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';
import { RootStackParamList } from '../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SOSFloatingButtonProps {
  /** Additional style for positioning */
  style?: ViewStyle;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Tab bar height offset */
  tabBarOffset?: number;
}

export function SOSFloatingButton({
  style,
  showLabel = false,
  tabBarOffset = 80,
}: SOSFloatingButtonProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactMedium } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // Subtle pulse animation to draw attention
  React.useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [reduceMotion, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactMedium();
    navigation.navigate('SOSSelect');
  };

  return (
    <AnimatedPressable
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: colors.accentWarm,
          bottom: insets.bottom + tabBarOffset,
          shadowColor: colors.accentWarm,
        },
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="SOS - Emergency relief tools"
      accessibilityHint="Open quick relief exercises for immediate support"
    >
      <LuxeIcon name="sos" size={24} color={colors.inkInverse} />
      {showLabel && (
        <Text variant="labelMedium" style={styles.label} color="inkInverse">
          SOS
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  label: {
    marginLeft: spacing[2],
  },
});
