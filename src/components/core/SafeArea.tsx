/**
 * SafeArea Component - Core
 * 
 * Wrapper for safe area handling.
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

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
  return (
    <SafeAreaView
      edges={edges}
      style={[
        { flex: 1 },
        backgroundColor ? { backgroundColor } : undefined,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
