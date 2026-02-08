import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { Text } from './ui/Text';
import { spacing } from '../theme';

// =============================================================================
// TYPES
// =============================================================================
interface LogoProps {
  /**
   * Size variant for the logo
   * - 'small': 24px icon, for headers/nav
   * - 'medium': 40px icon, for profile/settings
   * - 'large': 64px icon, for login/onboarding
   * - 'hero': 80px icon, for splash/welcome screens
   */
  size?: 'small' | 'medium' | 'large' | 'hero';
  
  /**
   * Whether to show the wordmark text
   */
  showText?: boolean;
  
  /**
   * Text position relative to icon
   */
  textPosition?: 'right' | 'bottom';
  
  /**
   * Custom style for container
   */
  style?: ViewStyle;
  
  /**
   * Whether to animate on mount
   */
  animated?: boolean;
}

// =============================================================================
// SIZE CONFIG
// =============================================================================
const SIZES = {
  small: {
    icon: 24,
    fontSize: 'bodyMedium' as const,
    gap: spacing[2],
  },
  medium: {
    icon: 40,
    fontSize: 'headlineSmall' as const,
    gap: spacing[2],
  },
  large: {
    icon: 64,
    fontSize: 'displaySmall' as const,
    gap: spacing[3],
  },
  hero: {
    icon: 80,
    fontSize: 'displayMedium' as const,
    gap: spacing[4],
  },
};

// =============================================================================
// LOGO ICON COMPONENT
// =============================================================================
interface LogoIconProps {
  size: number;
  primaryColor: string;
  secondaryColor: string;
}

function LogoIcon({ size, primaryColor, secondaryColor }: LogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="flowerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Flower/bush shape - multiple petals radiating from center */}
      {/* Top petal */}
      <Path
        d="M24 4C20 4 17 8 17 13C17 18 20 22 24 22C28 22 31 18 31 13C31 8 28 4 24 4Z"
        fill="url(#flowerGradient)"
      />
      {/* Top-right petal */}
      <Path
        d="M36 10C33 7 28 7 25 10C22 13 22 18 25 21C28 24 33 24 36 21C39 18 39 13 36 10Z"
        fill="url(#flowerGradient)"
        opacity={0.9}
      />
      {/* Top-left petal */}
      <Path
        d="M12 10C15 7 20 7 23 10C26 13 26 18 23 21C20 24 15 24 12 21C9 18 9 13 12 10Z"
        fill="url(#flowerGradient)"
        opacity={0.9}
      />
      {/* Bottom-right petal */}
      <Path
        d="M38 24C35 21 30 21 27 24C24 27 24 32 27 35C30 38 35 38 38 35C41 32 41 27 38 24Z"
        fill="url(#flowerGradient)"
        opacity={0.85}
      />
      {/* Bottom-left petal */}
      <Path
        d="M10 24C13 21 18 21 21 24C24 27 24 32 21 35C18 38 13 38 10 35C7 32 7 27 10 24Z"
        fill="url(#flowerGradient)"
        opacity={0.85}
      />
      {/* Bottom petal */}
      <Path
        d="M24 26C20 26 17 30 17 35C17 40 20 44 24 44C28 44 31 40 31 35C31 30 28 26 24 26Z"
        fill="url(#flowerGradient)"
        opacity={0.8}
      />
      {/* Center circle */}
      <Path
        d="M24 18C21 18 18 21 18 24C18 27 21 30 24 30C27 30 30 27 30 24C30 21 27 18 24 18Z"
        fill={secondaryColor}
      />
    </Svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function Logo({
  size = 'medium',
  showText = false,
  textPosition = 'right',
  style,
  animated = false,
}: LogoProps) {
  const { colors, reduceMotion } = useTheme();
  const config = SIZES[size];
  
  const isHorizontal = textPosition === 'right';
  
  const containerStyle: ViewStyle = {
    flexDirection: isHorizontal ? 'row' : 'column',
    alignItems: 'center',
    gap: showText ? config.gap : 0,
  };

  const content = (
    <View style={[containerStyle, style]}>
      <LogoIcon
        size={config.icon}
        primaryColor={colors.accentPrimary}
        secondaryColor={colors.accentPrimaryHover}
      />
      {showText && (
        <Text
          variant={config.fontSize}
          color="ink"
          style={styles.wordmark}
        >
          Restorae
        </Text>
      )}
    </View>
  );

  if (animated && !reduceMotion) {
    return (
      <Animated.View entering={FadeIn.duration(600)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  wordmark: {
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});

export default Logo;
