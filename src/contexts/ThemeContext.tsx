import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { light, dark, gradients, shadows, ColorTokens, GradientTokens, ShadowTokens } from '../theme';

// =============================================================================
// TYPES
// =============================================================================
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  // Current resolved colors
  colors: ColorTokens;
  gradients: GradientTokens;
  shadows: ShadowTokens;
  
  // Theme state
  mode: ThemeMode;
  isDark: boolean;
  reduceMotion: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@restorae/theme_mode';

// =============================================================================
// PROVIDER
// =============================================================================
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  // Persist preference when changed
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  // Resolve actual dark/light based on mode and system
  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemScheme]);

  // Memoize theme values for performance
  const value = useMemo<ThemeContextType>(() => ({
    colors: isDark ? dark : light,
    gradients: isDark ? gradients.dark : gradients.light,
    shadows: isDark ? shadows.dark : shadows.light,
    mode,
    isDark,
    reduceMotion,
    setMode,
  }), [isDark, mode, reduceMotion]);

  // Prevent flash of wrong theme
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
