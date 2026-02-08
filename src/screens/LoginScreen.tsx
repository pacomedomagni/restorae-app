/**
 * LoginScreen - Enhanced
 * 
 * Premium login experience with:
 * - Haptic feedback on all interactions
 * - Animated entry transitions
 * - Inline error display
 * - Network error handling
 * - Accessibility support
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useHaptics } from '../hooks/useHaptics';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Text, GlassCard, AmbientBackground } from '../components/ui';
import { Logo } from '../components/Logo';
import { spacing, borderRadius, withAlpha } from '../theme';

interface LoginScreenProps {
  navigation: any;
}

// =============================================================================
// ANIMATED BUTTON
// =============================================================================
interface AnimatedButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  style?: any;
  accessibilityLabel?: string;
}

function AnimatedButton({ onPress, disabled, loading, variant, children, style, accessibilityLabel }: AnimatedButtonProps) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    if (!disabled && !loading) {
      await impactLight();
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle = [
    styles.button,
    variant === 'primary' && { backgroundColor: colors.accentPrimary },
    variant === 'secondary' && { backgroundColor: colors.canvasElevated, borderWidth: 1, borderColor: colors.border },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    (disabled || loading) && { opacity: 0.6 },
    style,
  ];

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
    >
      <Animated.View style={[buttonStyle, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.ink} />
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors, reduceMotion } = useTheme();
  const { login, signInWithApple, signInWithGoogle, registerAnonymous, isLoading } = useAuth();
  const { impactLight, impactMedium, notificationError, selectionLight } = useHaptics();
  const { isOffline } = useNetworkStatus();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      notificationError();
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (isOffline) {
      setErrors({ general: 'No internet connection. Please check your network.' });
      notificationError();
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    
    try {
      await impactMedium();
      await login(email.trim().toLowerCase(), password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      notificationError();
      setErrors({ 
        general: error.message || 'Unable to sign in. Please check your credentials.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (isOffline) {
      setErrors({ general: 'No internet connection. Please check your network.' });
      notificationError();
      return;
    }

    try {
      await impactMedium();
      await signInWithApple();
    } catch (error: any) {
      if (error.message) {
        notificationError();
        setErrors({ general: error.message });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isOffline) {
      setErrors({ general: 'No internet connection. Please check your network.' });
      notificationError();
      return;
    }

    try {
      await impactMedium();
      await signInWithGoogle();
    } catch (error: any) {
      notificationError();
      setErrors({ general: error.message || 'Google sign in failed' });
    }
  };

  const handleContinueWithoutAccount = async () => {
    try {
      await impactLight();
      await registerAnonymous();
    } catch (error: any) {
      notificationError();
      setErrors({ general: 'Failed to continue. Please try again.' });
    }
  };

  const handleTogglePassword = async () => {
    await selectionLight();
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" intensity="subtle" />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Offline Banner */}
            {isOffline && (
              <Animated.View 
                entering={reduceMotion ? undefined : FadeIn.duration(300)}
                style={[styles.offlineBanner, { backgroundColor: colors.statusError }]}
              >
                <Ionicons name="cloud-offline-outline" size={16} color={colors.textInverse} />
                <Text variant="labelMedium" style={[styles.offlineText, { color: colors.textInverse }]}>
                  No internet connection
                </Text>
              </Animated.View>
            )}

            {/* Header */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}
              style={styles.header}
            >
              <Logo size="large" showText textPosition="bottom" style={styles.logo} />
              <Text variant="bodyLarge" color="inkMuted">
                Welcome back
              </Text>
            </Animated.View>

            {/* General Error */}
            {errors.general && (
              <Animated.View 
                entering={reduceMotion ? undefined : FadeIn.duration(300)}
                style={[styles.errorBanner, { backgroundColor: withAlpha(colors.statusError, 0.1) }]}
              >
                <Ionicons name="alert-circle-outline" size={20} color={colors.statusError} />
                <Text variant="bodyMedium" style={[styles.errorBannerText, { color: colors.statusError }]}>
                  {errors.general}
                </Text>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(500)}
              style={styles.form}
            >
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" color="ink" style={styles.label}>
                  Email
                </Text>
                <GlassCard 
                  variant="default" 
                  padding="none"
                  style={{
                    ...styles.inputWrapper,
                    ...(errors.email ? { borderWidth: 1, borderColor: colors.statusError } : {})
                  }}
                >
                  <View style={styles.inputInner}>
                    <Ionicons name="mail-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.ink }]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors(e => ({ ...e, email: undefined }));
                      }}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.inkMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading && !isSubmitting}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      accessibilityLabel="Email address"
                      accessibilityHint="Enter your email address"
                    />
                  </View>
                </GlassCard>
                {errors.email && (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>
                      {errors.email}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" color="ink" style={styles.label}>
                  Password
                </Text>
                <GlassCard 
                  variant="default" 
                  padding="none"
                  style={{
                    ...styles.inputWrapper,
                    ...(errors.password ? { borderWidth: 1, borderColor: colors.statusError } : {})
                  }}
                >
                  <View style={styles.inputInner}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      ref={passwordRef}
                      style={[styles.input, { color: colors.ink }]}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors(e => ({ ...e, password: undefined }));
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.inkMuted}
                      secureTextEntry={!showPassword}
                      editable={!isLoading && !isSubmitting}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      accessibilityLabel="Password"
                      accessibilityHint="Enter your password"
                    />
                    <Pressable 
                      onPress={handleTogglePassword}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.inkMuted}
                      />
                    </Pressable>
                  </View>
                </GlassCard>
                {errors.password && (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>
                      {errors.password}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* Forgot Password */}
              <Pressable
                onPress={async () => {
                  await impactLight();
                  navigation.navigate('ForgotPassword');
                }}
                style={styles.forgotPassword}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
              >
                <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
                  Forgot password?
                </Text>
              </Pressable>

              {/* Login Button */}
              <AnimatedButton
                variant="primary"
                onPress={handleLogin}
                disabled={isLoading || isSubmitting}
                loading={isSubmitting}
                accessibilityLabel="Sign in"
              >
                <Text variant="labelLarge" style={[styles.primaryButtonText, { color: colors.textInverse }]}>
                  Sign In
                </Text>
              </AnimatedButton>

              {/* Divider */}
              <Animated.View 
                entering={reduceMotion ? undefined : FadeIn.delay(300).duration(400)}
                style={styles.divider}
              >
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text variant="labelSmall" color="inkMuted" style={styles.dividerText}>
                  or continue with
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </Animated.View>

              {/* Social Sign In */}
              <Animated.View 
                entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(500)}
                style={styles.socialButtons}
              >
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                  />
                )}
                
                <AnimatedButton
                  variant="secondary"
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  style={styles.socialButton}
                  accessibilityLabel="Sign in with Google"
                >
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-google" size={20} color={colors.ink} />
                    <Text variant="labelLarge" color="ink">
                      Google
                    </Text>
                  </View>
                </AnimatedButton>
              </Animated.View>

              {/* Continue Without Account */}
              <AnimatedButton
                variant="ghost"
                onPress={handleContinueWithoutAccount}
                disabled={isLoading}
                style={styles.skipButton}
                accessibilityLabel="Continue without an account"
              >
                <Text variant="bodyMedium" color="inkMuted" style={styles.underline}>
                  Continue without an account
                </Text>
              </AnimatedButton>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeInUp.delay(500).duration(500)}
              style={styles.footer}
            >
              <Text variant="bodyMedium" color="inkMuted">
                Don't have an account?{' '}
              </Text>
              <Pressable 
                onPress={async () => {
                  await impactLight();
                  navigation.navigate('Register');
                }}
                accessibilityRole="link"
                accessibilityLabel="Sign up for a new account"
              >
                <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>
                  Sign Up
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10],
    paddingBottom: spacing[6],
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  offlineText: {
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logo: {
    marginBottom: spacing[2],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  errorBannerText: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing[5],
  },
  label: {
    marginBottom: spacing[2],
  },
  inputWrapper: {
    overflow: 'hidden',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing[3],
    paddingVertical: spacing[1],
  },
  errorText: {
    marginTop: spacing[1],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
    paddingVertical: spacing[1],
  },
  button: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing[4],
  },
  socialButtons: {
    gap: spacing[3],
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
  socialButton: {
    paddingVertical: spacing[3],
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  skipButton: {
    marginTop: spacing[6],
  },
  underline: {
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[6],
  },
});
