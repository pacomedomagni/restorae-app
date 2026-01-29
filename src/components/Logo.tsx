import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { Text } from './ui/Text';
import { spacing } from '../theme/spacing';

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
  veinColor: string;
}

function LogoIcon({ size, primaryColor, secondaryColor, veinColor }: LogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Main leaf shape - organic, flowing form */}
      <Path
        d="M24 4C14 4 8 12 8 22C8 32 14 40 24 44C24 44 20 36 20 28C20 20 24 14 32 12C40 10 44 14 44 14C44 14 40 4 24 4Z"
        fill="url(#leafGradient)"
      />
      {/* Central vein - subtle, natural */}
      <Path
        d="M24 44C24 44 28 38 30 30C32 22 30 16 30 16"
        stroke={veinColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.5}
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
        veinColor={colors.inkInverse}
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
