/**
 * SafeArea Component
 * Wrapper for safe area handling with consistent padding
 * 
 * Features:
 * - Configurable edges
 * - Background color support
 * - Uses ThemeContext for default background
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  backgroundColor?: string;
}

export function SafeArea({
  children,
  edges = ['top', 'bottom'],
  style,
  backgroundColor,
}: SafeAreaProps) {
  const { colors } = useTheme();
  const bgColor = backgroundColor ?? colors.canvas;

  return (
    <SafeAreaView
      edges={edges}
      style={[
        { flex: 1, backgroundColor: bgColor },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
