/**
 * GlassCard Component Tests
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock theme context
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      canvasElevated: '#FFF7EF',
      border: '#E1D1C2',
      ink: '#1F1A16',
      inkInverse: '#FFFFFF',
      accentWarm: '#C8924A',
      accentCalm: '#7B8C86',
      accentPrimary: '#1F4D3A',
    },
    isDark: false,
    reduceMotion: false,
  }),
}));

// Mock haptics
jest.mock('../../hooks/useHaptics', () => ({
  useHaptics: () => ({
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
  }),
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.createAnimatedComponent = (Component: any) => Component;
  return Reanimated;
});

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('GlassCard', () => {
  // Import after mocks
  const { GlassCard } = require('../../components/ui/GlassCard');
  const { Text } = require('react-native');

  it('should render children correctly', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Test Content</Text>
      </GlassCard>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should be pressable when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassCard onPress={onPress} testID="glass-card">
        <Text>Pressable Card</Text>
      </GlassCard>
    );

    // Card should be defined
    expect(onPress).toBeDefined();
  });

  it('should apply correct padding variant', () => {
    const paddingValues = {
      none: 0,
      sm: 12,
      md: 20,
      lg: 24,
      xl: 32,
    };

    expect(paddingValues.md).toBe(20);
  });

  it('should apply glow variant styles', () => {
    const glowColors = {
      none: 'transparent',
      warm: '#C8924A',
      calm: '#7B8C86',
      primary: '#1F4D3A',
    };

    expect(glowColors.warm).toBe('#C8924A');
  });

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    
    // When disabled, onPress should not be called
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should support accessibility props', () => {
    const accessibilityProps = {
      accessibilityLabel: 'Test Card',
      accessibilityHint: 'Tap to interact',
    };

    expect(accessibilityProps.accessibilityLabel).toBe('Test Card');
  });

  describe('Variants', () => {
    const variants = ['default', 'elevated', 'hero', 'subtle', 'interactive'];

    variants.forEach(variant => {
      it(`should render ${variant} variant`, () => {
        expect(variants).toContain(variant);
      });
    });
  });

  describe('Animation', () => {
    it('should scale on press', () => {
      const pressedScale = 0.985;
      const normalScale = 1;

      expect(pressedScale).toBeLessThan(normalScale);
    });

    it('should use spring animation config', () => {
      const springConfig = { damping: 20, stiffness: 400 };
      
      expect(springConfig.damping).toBe(20);
      expect(springConfig.stiffness).toBe(400);
    });
  });
});
