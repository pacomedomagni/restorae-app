/**
 * Input Component
 * Premium text input with validation, animations, and accessibility
 * 
 * Features:
 * - Animated border on focus
 * - Error and hint states
 * - Character count
 * - Left/right icons
 * - Multiline support
 * - Uses ThemeContext (no manual color passing)
 */
import React, { useCallback } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TargetedEvent,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { spacing, borderRadius, withAlpha, textStyles } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  maxLength?: number;
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: object;
}

export function Input({
  label,
  hint,
  error,
  maxLength,
  showCharCount = false,
  leftIcon,
  rightIcon,
  containerStyle,
  value,
  onFocus,
  onBlur,
  multiline,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const borderColor = useSharedValue(colors.border);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = useCallback((e: NativeSyntheticEvent<TargetedEvent>) => {
    borderColor.value = withTiming(colors.accentPrimary, { duration: 150 });
    onFocus?.(e);
  }, [colors.accentPrimary, onFocus]);

  const handleBlur = useCallback((e: NativeSyntheticEvent<TargetedEvent>) => {
    borderColor.value = withTiming(
      error ? colors.accentWarm : colors.border,
      { duration: 150 }
    );
    onBlur?.(e);
  }, [error, colors.accentWarm, colors.border, onBlur]);

  const charCount = value?.length || 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="labelSmall" color="inkMuted" style={styles.label}>
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: withAlpha(colors.canvas, 0.5),
            borderColor: error ? colors.accentWarm : colors.border,
          },
          animatedBorderStyle,
          multiline && styles.multilineContainer,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          maxLength={maxLength}
          placeholderTextColor={colors.inkFaint}
          style={[
            styles.input,
            {
              color: colors.ink,
              ...textStyles.bodyMedium,
            },
            multiline && styles.multilineInput,
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.3}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      <View style={styles.footer}>
        {(hint || error) && (
          <Text
            variant="bodySmall"
            color={error ? 'accent' : 'inkFaint'}
            style={error ? { color: colors.accentWarm } : undefined}
          >
            {error || hint}
          </Text>
        )}
        
        {showCharCount && maxLength && (
          <Text
            variant="labelSmall"
            color={charCount >= maxLength ? 'accent' : 'inkFaint'}
            style={[
              styles.charCount,
              charCount >= maxLength && { color: colors.accentWarm },
            ]}
          >
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  multilineContainer: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    minHeight: 18,
  },
  charCount: {
    marginLeft: 'auto',
  },
});
