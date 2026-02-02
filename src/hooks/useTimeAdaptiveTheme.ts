/**
 * useTimeAdaptiveTheme Hook
 * 
 * Provides subtle color temperature adjustments based on time of day:
 * - Morning (5am-11am): Fresher, slightly cooler tones
 * - Afternoon (11am-5pm): Neutral, balanced
 * - Evening (5pm-9pm): Warmer, golden tones
 * - Night (9pm-5am): Warmest, reduced blue light
 * 
 * This creates a more organic, circadian-friendly experience.
 */
import { useMemo, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// =============================================================================
// TYPES
// =============================================================================

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeAdaptiveColors {
  // Warm overlay for gentle color shifting
  warmOverlay: string;
  warmOverlayIntensity: number;
  
  // Ambient background suggestions
  suggestedAmbientVariant: 'morning' | 'calm' | 'evening';
  
  // UI element adjustments
  buttonWarmth: number; // 0-1, affects accent colors
  shadowWarmth: number; // 0-1, affects shadow color
  
  // Reduced brightness for night
  brightnessMultiplier: number;
}

interface TimeAdaptiveTheme extends TimeAdaptiveColors {
  timeOfDay: TimeOfDay;
  hour: number;
  isNightMode: boolean;
  shouldReduceBlueLIght: boolean;
  
  // Greeting helpers
  greetingEmoji: string;
  periodLabel: string;
}

// =============================================================================
// TIME DETECTION
// =============================================================================

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getGreetingEmoji(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'morning': return '🌅';
    case 'afternoon': return '☀️';
    case 'evening': return '🌇';
    case 'night': return '🌙';
  }
}

function getPeriodLabel(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'morning': return 'morning';
    case 'afternoon': return 'afternoon';
    case 'evening': return 'evening';
    case 'night': return 'night';
  }
}

// =============================================================================
// COLOR TEMPERATURE CALCULATIONS
// =============================================================================

function getTimeAdaptiveColors(timeOfDay: TimeOfDay, isDark: boolean): TimeAdaptiveColors {
  switch (timeOfDay) {
    case 'morning':
      return {
        warmOverlay: isDark ? 'rgba(111, 160, 139, 0.03)' : 'rgba(31, 77, 58, 0.02)',
        warmOverlayIntensity: 0.02,
        suggestedAmbientVariant: 'morning',
        buttonWarmth: 0.1,
        shadowWarmth: 0.1,
        brightnessMultiplier: 1.0,
      };
    
    case 'afternoon':
      return {
        warmOverlay: 'transparent',
        warmOverlayIntensity: 0,
        suggestedAmbientVariant: 'calm',
        buttonWarmth: 0,
        shadowWarmth: 0,
        brightnessMultiplier: 1.0,
      };
    
    case 'evening':
      return {
        warmOverlay: isDark ? 'rgba(224, 178, 122, 0.04)' : 'rgba(200, 146, 74, 0.03)',
        warmOverlayIntensity: 0.04,
        suggestedAmbientVariant: 'evening',
        buttonWarmth: 0.2,
        shadowWarmth: 0.2,
        brightnessMultiplier: 0.98,
      };
    
    case 'night':
      return {
        warmOverlay: isDark ? 'rgba(224, 178, 122, 0.06)' : 'rgba(200, 146, 74, 0.05)',
        warmOverlayIntensity: 0.06,
        suggestedAmbientVariant: 'evening',
        buttonWarmth: 0.3,
        shadowWarmth: 0.3,
        brightnessMultiplier: 0.95,
      };
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useTimeAdaptiveTheme(): TimeAdaptiveTheme {
  const { isDark } = useTheme();
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Update hour every minute
  useEffect(() => {
    const updateHour = () => {
      setCurrentHour(new Date().getHours());
    };

    const interval = setInterval(updateHour, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const timeOfDay = getTimeOfDay(currentHour);
    const colors = getTimeAdaptiveColors(timeOfDay, isDark);

    return {
      ...colors,
      timeOfDay,
      hour: currentHour,
      isNightMode: timeOfDay === 'night',
      shouldReduceBlueLIght: timeOfDay === 'night' || timeOfDay === 'evening',
      greetingEmoji: getGreetingEmoji(timeOfDay),
      periodLabel: getPeriodLabel(timeOfDay),
    };
  }, [currentHour, isDark]);
}

// =============================================================================
// UTILITY: Apply warm overlay to a color
// =============================================================================

export function applyWarmth(color: string, warmth: number): string {
  if (warmth === 0) return color;
  
  // Simple warmth adjustment - blend towards warm tone
  const warmColor = 'rgb(224, 178, 122)'; // Warm amber
  
  // This is a simplified version - in production you'd do proper color blending
  // For now, we'll use CSS-like alpha blending concept
  return color; // Return original for simplicity, actual blending would be more complex
}
