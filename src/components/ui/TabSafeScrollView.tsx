/**
 * TabSafeScrollView - ScrollView with bottom tab bar padding
 *
 * Adds automatic bottom padding to account for the tab bar height.
 */
import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, ViewStyle } from 'react-native';
import { layout } from '../../theme';

interface TabSafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /** Alias for contentContainerStyle */
  contentStyle?: ViewStyle;
  /** Skip tab bar padding when screen is not in tab navigator */
  noTabBar?: boolean;
}

export function TabSafeScrollView({
  children,
  contentContainerStyle,
  contentStyle,
  noTabBar = false,
  ...props
}: TabSafeScrollViewProps) {
  const bottomPadding = noTabBar ? 40 : layout.tabBarHeight + 20;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        { paddingBottom: bottomPadding },
        contentContainerStyle,
        contentStyle,
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export default TabSafeScrollView;
