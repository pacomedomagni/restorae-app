/**
 * Input Component - Core
 * 
 * Unified text input with variants and states.
 * Supports multiline, character count, and validation.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import { spacing, radius, fontFamily, fontSize } from '../../theme/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  maxLength?: number;
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  colors: {
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
    border: string;
    borderStrong: string;
    actionPrimary: string;
    error: string;
  };
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
  colors,
  containerStyle,
  value,
  onFocus,
  onBlur,
  multiline,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    borderColor.value = withTiming(colors.actionPrimary, { duration: 150 });
    onFocus?.(e);
  }, [colors.actionPrimary, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    borderColor.value = withTiming(
      error ? colors.error : colors.border,
      { duration: 150 }
    );
    onBlur?.(e);
  }, [error, colors.error, colors.border, onBlur]);

  const charCount = value?.length || 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="labelSmall"
          style={[styles.label, { color: colors.textSecondary }]}
        >
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
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
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: fontFamily.sans,
            },
            multiline && styles.multilineInput,
          ]}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      <View style={styles.footer}>
        {(hint || error) && (
          <Text
            variant="bodySmall"
            style={{ color: error ? colors.error : colors.textTertiary }}
          >
            {error || hint}
          </Text>
        )}
        
        {showCharCount && maxLength && (
          <Text
            variant="labelSmall"
            style={[
              styles.charCount,
              { color: charCount >= maxLength ? colors.error : colors.textTertiary },
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
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
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
    alignItems: 'center',
    marginTop: spacing.xs,
    minHeight: 20,
  },
  charCount: {
    marginLeft: 'auto',
  },
});
