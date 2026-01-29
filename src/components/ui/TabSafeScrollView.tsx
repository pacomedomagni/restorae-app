/**
 * TabSafeScrollView Component
 * ScrollView wrapper that automatically handles tab bar spacing
 * Eliminates need for manual bottom padding on every screen
 */
import React, { ReactNode } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { AnimatedScrollViewProps } from 'react-native-reanimated';
import { layout, spacing } from '../../theme';

interface TabSafeScrollViewProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: ReactNode;
  /** Additional padding at the bottom beyond tab bar */
  extraBottomPadding?: number;
  /** Use animated scroll view for scroll-based animations */
  animated?: boolean;
  /** Style for the scroll view container */
  style?: ViewStyle;
  /** Style for the content container */
  contentStyle?: ViewStyle;
  /** Show in a non-tab context (no extra bottom padding) */
  noTabBar?: boolean;
  /** Pull to refresh handler */
  onRefresh?: () => void;
  /** Pull to refresh state */
  refreshing?: boolean;
}

export function TabSafeScrollView({
  children,
  extraBottomPadding = spacing[4],
  animated = false,
  style,
  contentStyle,
  noTabBar = false,
  onRefresh,
  refreshing = false,
  ...scrollViewProps
}: TabSafeScrollViewProps) {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding: tab bar height + extra padding + safe area (if no tab bar)
  const bottomPadding = noTabBar 
    ? insets.bottom + extraBottomPadding
    : layout.tabBarHeight + extraBottomPadding;

  const contentContainerStyle: ViewStyle = {
    flexGrow: 1,
    paddingBottom: bottomPadding,
    ...contentStyle,
  };

  const refreshControl = onRefresh ? (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  ) : undefined;

  const commonProps = {
    style: [styles.scrollView, style],
    contentContainerStyle,
    showsVerticalScrollIndicator: false,
    bounces: true,
    keyboardDismissMode: 'on-drag' as const,
    keyboardShouldPersistTaps: 'handled' as const,
    refreshControl,
    ...scrollViewProps,
  };

  if (animated) {
    return (
      <Animated.ScrollView {...(commonProps as AnimatedScrollViewProps)}>
        {children}
      </Animated.ScrollView>
    );
  }

  return (
    <ScrollView {...commonProps}>
      {children}
    </ScrollView>
  );
}

/**
 * TabSafeView Component
 * Non-scrollable view that still respects tab bar spacing
 * Useful for fixed-content screens
 */
interface TabSafeViewProps {
  children: ReactNode;
  style?: ViewStyle;
  noTabBar?: boolean;
}

export function TabSafeView({ children, style, noTabBar = false }: TabSafeViewProps) {
  const insets = useSafeAreaInsets();
  
  const bottomPadding = noTabBar 
    ? insets.bottom 
    : layout.tabBarHeight + spacing[4];

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
