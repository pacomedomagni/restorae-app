import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { light, dark, gradients, shadows, ColorTokens, GradientTokens, ShadowTokens } from '../theme';

// =============================================================================
// TYPES
// =============================================================================
type ThemeMode = 'light' | 'dark' | 'system';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeAdaptiveState {
  timeOfDay: TimeOfDay;
  warmOverlay: string;
  warmOverlayIntensity: number;
  isNightMode: boolean;
  shouldReduceBlueLight: boolean;
}

interface ThemeContextType {
  // Current resolved colors
  colors: ColorTokens;
  gradients: GradientTokens;
  shadows: ShadowTokens;
  
  // Theme state
  mode: ThemeMode;
  isDark: boolean;
  reduceMotion: boolean;
  
  // Time-adaptive state
  timeAdaptive: TimeAdaptiveState;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@restorae/theme_mode';

// =============================================================================
// TIME-ADAPTIVE HELPERS
// =============================================================================
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getTimeAdaptiveState(hour: number, isDark: boolean): TimeAdaptiveState {
  const timeOfDay = getTimeOfDay(hour);
  
  let warmOverlay: string;
  let warmOverlayIntensity: number;
  
  switch (timeOfDay) {
    case 'morning':
      warmOverlay = isDark ? 'rgba(111, 160, 139, 0.03)' : 'rgba(31, 77, 58, 0.02)';
      warmOverlayIntensity = 0.02;
      break;
    case 'afternoon':
      warmOverlay = 'transparent';
      warmOverlayIntensity = 0;
      break;
    case 'evening':
      warmOverlay = isDark ? 'rgba(224, 178, 122, 0.04)' : 'rgba(200, 146, 74, 0.03)';
      warmOverlayIntensity = 0.04;
      break;
    case 'night':
      warmOverlay = isDark ? 'rgba(224, 178, 122, 0.06)' : 'rgba(200, 146, 74, 0.05)';
      warmOverlayIntensity = 0.06;
      break;
  }
  
  return {
    timeOfDay,
    warmOverlay,
    warmOverlayIntensity,
    isNightMode: timeOfDay === 'night',
    shouldReduceBlueLight: timeOfDay === 'night' || timeOfDay === 'evening',
  };
}

// =============================================================================
// PROVIDER
// =============================================================================
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Load saved preference on mount with error handling
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch((error) => {
        console.warn('Failed to load theme preference:', error);
      })
      .finally(() => {
        setIsLoaded(true);
      });
    
    // Fallback timeout in case AsyncStorage hangs
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn('Theme loading timeout - using default');
        setIsLoaded(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Update current hour every minute for time-adaptive theme
  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
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

  // Compute time-adaptive state
  const timeAdaptive = useMemo(() => 
    getTimeAdaptiveState(currentHour, isDark),
    [currentHour, isDark]
  );

  // Memoize theme values for performance
  const value = useMemo<ThemeContextType>(() => ({
    colors: isDark ? dark : light,
    gradients: isDark ? gradients.dark : gradients.light,
    shadows: isDark ? shadows.dark : shadows.light,
    mode,
    isDark,
    reduceMotion,
    timeAdaptive,
    setMode,
  }), [isDark, mode, reduceMotion, timeAdaptive]);

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
