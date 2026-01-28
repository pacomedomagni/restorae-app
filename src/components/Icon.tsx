import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Rect, Line } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

type IconName =
  | 'logo'
  | 'energized'
  | 'calm'
  | 'anxious'
  | 'low'
  | 'good'
  | 'tough'
  | 'breathe'
  | 'ground'
  | 'reset'
  | 'focus'
  | 'journal'
  | 'sos'
  | 'home'
  | 'tools'
  | 'journal-tab'
  | 'profile'
  | 'stories'
  | 'back'
  | 'settings'
  | 'history'
  | 'subscription'
  | 'lock'
  | 'data'
  | 'privacy'
  | 'support'
  | 'chevronUp'
  | 'chevronDown';

export const Icon: React.FC<IconProps> = ({ name, size = 24, color }) => {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.accentPrimary;
  const stroke = resolvedColor;
  const strokeWide = size >= 28 ? 1.8 : 1.6;
  const strokeThin = size >= 28 ? 1.4 : 1.2;
  const strokeBold = size >= 28 ? 2.2 : 2.0;

  const icons: Record<IconName, React.ReactNode> = {
    // Logo - Leaf/breath forming abstract 'R'
    logo: (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accentPrimary} />
            <Stop offset="100%" stopColor={colors.accentPrimaryHover} />
          </LinearGradient>
        </Defs>
        <Path
          d="M24 4C14 4 8 12 8 22C8 32 14 40 24 44C24 44 20 36 20 28C20 20 24 14 32 12C40 10 44 14 44 14C44 14 40 4 24 4Z"
          fill="url(#logoGrad)"
        />
        <Path
          d="M24 44C24 44 28 38 30 30C32 22 30 16 30 16"
          stroke={colors.inkInverse}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </Svg>
    ),

    // Mood Icons
    energized: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="6.5" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Circle cx="16" cy="16" r="2" fill={stroke} />
        <G stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round">
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Line x1="16" y1="26" x2="16" y2="30" />
          <Line x1="2" y1="16" x2="6" y2="16" />
          <Line x1="26" y1="16" x2="30" y2="16" />
          <Line x1="6.1" y1="6.1" x2="8.93" y2="8.93" />
          <Line x1="23.07" y1="23.07" x2="25.9" y2="25.9" />
          <Line x1="6.1" y1="25.9" x2="8.93" y2="23.07" />
          <Line x1="23.07" y1="8.93" x2="25.9" y2="6.1" />
        </G>
      </Svg>
    ),

    calm: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M2 20C6 18 10 22 16 20C22 18 26 22 30 20"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.4"
        />
        <Path
          d="M2 16C6 14 10 18 16 16C22 14 26 18 30 16"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
        />
        <Path
          d="M2 12C6 10 10 14 16 12C22 10 26 14 30 12"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.4"
        />
      </Svg>
    ),

    anxious: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M16 4C16 4 20 8 20 12C20 16 16 16 16 20C16 24 20 24 20 28"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="16" cy="16" r="10" stroke={stroke} strokeWidth={strokeThin} opacity="0.35" fill="none" />
        <Circle cx="16" cy="16" r="6" stroke={stroke} strokeWidth={strokeThin} opacity="0.2" fill="none" />
      </Svg>
    ),

    low: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M8 18C8 15 10.5 13 13.5 13C14.3 11 16.1 10 18 10C20.6 10 22.8 11.9 23 14.5C25 14.7 26.5 16.2 26.5 18.2C26.5 20.4 24.7 22 22.4 22H12.2C9.9 22 8 20.2 8 18Z"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.85"
        />
        <Line x1="12" y1="25" x2="20" y2="25" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" opacity="0.4" />
      </Svg>
    ),

    good: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="11" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Circle cx="12" cy="13" r="1.4" fill={stroke} />
        <Circle cx="20" cy="13" r="1.4" fill={stroke} />
        <Path
          d="M10 19C10 19 12 23 16 23C20 23 22 19 22 19"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    ),

    tough: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M6 24L14 12L18 18L26 8L26 24"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Line x1="6" y1="24" x2="26" y2="24" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
      </Svg>
    ),

    // Navigation / Utility Icons
    back: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M19 8L11 16L19 24"
          stroke={stroke}
          strokeWidth={strokeBold}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),

    settings: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="5" stroke={stroke} strokeWidth={strokeWide} />
        <G stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round">
          <Line x1="16" y1="4" x2="16" y2="8" />
          <Line x1="16" y1="24" x2="16" y2="28" />
          <Line x1="4" y1="16" x2="8" y2="16" />
          <Line x1="24" y1="16" x2="28" y2="16" />
          <Line x1="7" y1="7" x2="9.5" y2="9.5" />
          <Line x1="22.5" y1="22.5" x2="25" y2="25" />
          <Line x1="7" y1="25" x2="9.5" y2="22.5" />
          <Line x1="22.5" y1="9.5" x2="25" y2="7" />
        </G>
      </Svg>
    ),

    history: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="10" stroke={stroke} strokeWidth={strokeWide} />
        <Path d="M16 10V16L20 19" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),

    subscription: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="6" y="9" width="20" height="14" rx="2.5" stroke={stroke} strokeWidth={strokeWide} />
        <Line x1="6" y1="13" x2="26" y2="13" stroke={stroke} strokeWidth={strokeThin} />
        <Line x1="10" y1="19" x2="16" y2="19" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
      </Svg>
    ),

    lock: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="8" y="14" width="16" height="12" rx="2.5" stroke={stroke} strokeWidth={strokeWide} />
        <Path d="M12 14V11C12 8.8 13.8 7 16 7C18.2 7 20 8.8 20 11V14" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" />
      </Svg>
    ),

    data: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="7" y="7" width="18" height="6" rx="3" stroke={stroke} strokeWidth={strokeWide} />
        <Rect x="7" y="13" width="18" height="6" rx="3" stroke={stroke} strokeWidth={strokeWide} />
        <Rect x="7" y="19" width="18" height="6" rx="3" stroke={stroke} strokeWidth={strokeWide} />
      </Svg>
    ),

    privacy: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M16 5L25 9V16C25 21 21 25 16 27C11 25 7 21 7 16V9L16 5Z"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    ),

    support: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="10" stroke={stroke} strokeWidth={strokeWide} />
        <Path d="M12.5 12.5C13 10.8 14.5 9.8 16 9.8C17.7 9.8 19.2 11 19.2 12.8C19.2 14.5 18.2 15.4 16.8 16.3" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" />
        <Circle cx="16" cy="22" r="1" fill={stroke} />
      </Svg>
    ),

    chevronUp: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path d="M8 20L16 12L24 20" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),

    chevronDown: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path d="M8 12L16 20L24 12" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),

    // Tool Icons
    breathe: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M4 16C8 12 12 16 16 12C20 8 24 12 28 8"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.4"
        />
        <Path
          d="M4 20C8 16 12 20 16 16C20 12 24 16 28 12"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
        />
        <Path
          d="M4 24C8 20 12 24 16 20C20 16 24 20 28 16"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.4"
        />
      </Svg>
    ),

    ground: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M16 4L16 14"
          stroke={stroke}
          strokeWidth={strokeBold}
          strokeLinecap="round"
        />
        <Path
          d="M16 14L10 22"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
        />
        <Path
          d="M16 14L22 22"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
        />
        <Path
          d="M16 14L16 24"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
        />
        <Path
          d="M10 22L6 28"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M22 22L26 28"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M16 24L16 30"
          stroke={stroke}
          strokeWidth={strokeThin}
          strokeLinecap="round"
          opacity="0.6"
        />
      </Svg>
    ),

    reset: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M8 16A8 8 0 1 0 16 8"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 4V10H22"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),

    focus: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="10" stroke={stroke} strokeWidth={strokeThin} fill="none" opacity="0.4" />
        <Circle cx="16" cy="16" r="6" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Circle cx="16" cy="16" r="2" fill={stroke} />
        <Line x1="16" y1="3" x2="16" y2="7" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="16" y1="25" x2="16" y2="29" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="3" y1="16" x2="7" y2="16" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="25" y1="16" x2="29" y2="16" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
      </Svg>
    ),

    journal: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="7" y="5" width="18" height="22" rx="4" stroke={stroke} strokeWidth={strokeWide} />
        <Line x1="11" y1="11" x2="21" y2="11" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="11" y1="16" x2="21" y2="16" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="11" y1="21" x2="18" y2="21" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
      </Svg>
    ),

    sos: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M16 6C20 6 23.5 8.8 23.5 12.5C23.5 19.3 16 25.5 16 25.5C16 25.5 8.5 19.3 8.5 12.5C8.5 8.8 12 6 16 6Z"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinejoin="round"
          fill="none"
        />
        <Line x1="12.5" y1="14.5" x2="19.5" y2="14.5" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" />
        <Line x1="16" y1="11" x2="16" y2="18" stroke={stroke} strokeWidth={strokeWide} strokeLinecap="round" />
      </Svg>
    ),

    // Tab Icons
    home: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M4 14L16 4L28 14L28 28L20 28L20 20L12 20L12 28L4 28L4 14Z"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M12 28L12 20L20 20L20 28"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    ),

    tools: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="4" y="4" width="10" height="10" rx="2.5" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Rect x="18" y="4" width="10" height="10" rx="2.5" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Rect x="4" y="18" width="10" height="10" rx="2.5" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Rect x="18" y="18" width="10" height="10" rx="2.5" stroke={stroke} strokeWidth={strokeWide} fill="none" />
      </Svg>
    ),

    'journal-tab': (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="6" y="4" width="20" height="24" rx="3" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Line x1="10" y1="10" x2="22" y2="10" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="10" y1="16" x2="22" y2="16" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
        <Line x1="10" y1="22" x2="18" y2="22" stroke={stroke} strokeWidth={strokeThin} strokeLinecap="round" />
      </Svg>
    ),

    profile: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="10" r="5.5" stroke={stroke} strokeWidth={strokeWide} fill="none" />
        <Path
          d="M6 28C6 28 8 20 16 20C24 20 26 28 26 28"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    ),

    // Stories - Moon with stars (sleep/bedtime stories)
    stories: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Moon crescent */}
        <Path
          d="M22 6C17 6 12 10 12 16C12 22 17 26 22 26C22 26 18 24 18 16C18 8 22 6 22 6Z"
          stroke={stroke}
          strokeWidth={strokeWide}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Stars */}
        <Circle cx="8" cy="8" r="1.5" fill={stroke} />
        <Circle cx="24" cy="12" r="1" fill={stroke} />
        <Circle cx="6" cy="18" r="1" fill={stroke} />
        <Path
          d="M26 20L27 18L28 20L30 21L28 22L27 24L26 22L24 21L26 20Z"
          fill={stroke}
        />
      </Svg>
    ),
  };

  return <>{icons[name]}</>;
};

export default Icon;
