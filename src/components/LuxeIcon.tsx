import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface LuxeIconProps {
  name: LuxeIconName;
  size?: number;
  color?: string;
}

export type LuxeIconName =
  | 'breathe'
  | 'ground'
  | 'reset'
  | 'focus'
  | 'journal'
  | 'stories'
  | 'sos'
  | 'tools';

export function LuxeIcon({ name, size = 24, color }: LuxeIconProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.accentPrimary;

  const icons: Record<LuxeIconName, React.ReactNode> = {
    breathe: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path d="M4 12C8 10 12 14 16 12C20 10 24 14 28 12" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M4 18C8 16 12 20 16 18C20 16 24 20 28 18" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M4 24C8 22 12 26 16 24C20 22 24 26 28 24" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
    ),
    ground: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Line x1="16" y1="4" x2="16" y2="20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <Path d="M10 22C12 20 14 20 16 22C18 24 20 24 22 22" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        <Path d="M8 26H24" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
    ),
    reset: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path d="M22 10A8 8 0 1 0 24 18" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M22 6V12H28" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    focus: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="8" stroke={stroke} strokeWidth="1.6" />
        <Circle cx="16" cy="16" r="3" fill={stroke} />
      </Svg>
    ),
    journal: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="8" y="6" width="16" height="20" rx="3" stroke={stroke} strokeWidth="1.6" />
        <Line x1="12" y1="12" x2="20" y2="12" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <Line x1="12" y1="16" x2="20" y2="16" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <Line x1="12" y1="20" x2="18" y2="20" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
    ),
    stories: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="7" y="8" width="18" height="18" rx="3" stroke={stroke} strokeWidth="1.6" />
        <Line x1="12" y1="12" x2="20" y2="12" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <Line x1="12" y1="16" x2="20" y2="16" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <Circle cx="24" cy="10" r="4" stroke={stroke} strokeWidth="1.4" />
        <Path d="M26 10C26 8.9 25.1 8 24 8" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
    ),
    sos: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path d="M16 6C20 6 24 8 24 12C24 20 16 26 16 26C16 26 8 20 8 12C8 8 12 6 16 6Z" stroke={stroke} strokeWidth="1.6" />
        <Path d="M13 14H19" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M16 11V17" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    ),
    tools: (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="6" y="8" width="20" height="6" rx="3" stroke={stroke} strokeWidth="1.6" />
        <Rect x="6" y="18" width="20" height="6" rx="3" stroke={stroke} strokeWidth="1.6" />
      </Svg>
    ),
  };

  return icons[name];
}
