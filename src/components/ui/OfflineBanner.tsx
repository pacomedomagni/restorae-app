/**
 * OfflineBanner - Network status indicator
 *
 * Shows a subtle banner when the device is offline.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha } from '../../theme';

export function OfflineBanner() {
  const { colors, reduceMotion } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={[styles.banner, { backgroundColor: withAlpha(colors.accentWarm, 0.12) }]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colors.accentWarm} />
      <Text variant="labelSmall" style={{ color: colors.accentWarm, marginLeft: spacing[2] }}>
        You're offline — changes will sync when connected
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
});

export default OfflineBanner;
