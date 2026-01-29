/**
 * RegisterScreen - Enhanced
 * 
 * Premium registration experience with:
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
import { spacing, borderRadius, withAlpha } from '../theme';

interface RegisterScreenProps {
  navigation: any;
}

// Animated Button Component
function AnimatedButton({ onPress, disabled, loading, variant, children, style, accessibilityLabel }: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  style?: any;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
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

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
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
        {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.ink} /> : children}
      </Animated.View>
    </Pressable>
  );
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { colors, reduceMotion } = useTheme();
  const { register, signInWithApple, signInWithGoogle, isLoading } = useAuth();
  const { impactLight, impactMedium, notificationError, selectionLight } = useHaptics();
  const { isOffline } = useNetworkStatus();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and a number';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      notificationError();
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
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
      await register(email.trim().toLowerCase(), password, name.trim());
    } catch (error: any) {
      notificationError();
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
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

  const handleToggleTerms = async () => {
    await selectionLight();
    setAcceptedTerms(!acceptedTerms);
    if (errors.terms) setErrors(e => ({ ...e, terms: undefined }));
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
                <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
                <Text variant="labelMedium" style={styles.offlineText}>No internet connection</Text>
              </Animated.View>
            )}

            {/* Header */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}
              style={styles.header}
            >
              <Pressable
                style={styles.backButton}
                onPress={async () => { await impactLight(); navigation.goBack(); }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color={colors.ink} />
              </Pressable>
              <Text variant="displaySmall" color="ink">Create Account</Text>
              <Text variant="bodyLarge" color="inkMuted">Start your wellness journey</Text>
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
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" color="ink" style={styles.label}>Full Name</Text>
                <GlassCard 
                  variant="default" 
                  padding="none"
                  style={{...styles.inputWrapper, ...(errors.name ? { borderWidth: 1, borderColor: colors.statusError } : {})}}
                >
                  <View style={styles.inputInner}>
                    <Ionicons name="person-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.ink }]}
                      value={name}
                      onChangeText={(text) => { setName(text); if (errors.name) setErrors(e => ({ ...e, name: undefined })); }}
                      placeholder="John Doe"
                      placeholderTextColor={colors.inkMuted}
                      autoCapitalize="words"
                      editable={!isLoading && !isSubmitting}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      accessibilityLabel="Full name"
                    />
                  </View>
                </GlassCard>
                {errors.name && <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>{errors.name}</Text>}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" color="ink" style={styles.label}>Email</Text>
                <GlassCard 
                  variant="default" 
                  padding="none"
                  style={{...styles.inputWrapper, ...(errors.email ? { borderWidth: 1, borderColor: colors.statusError } : {})}}
                >
                  <View style={styles.inputInner}>
                    <Ionicons name="mail-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      ref={emailRef}
                      style={[styles.input, { color: colors.ink }]}
                      value={email}
                      onChangeText={(text) => { setEmail(text); if (errors.email) setErrors(e => ({ ...e, email: undefined })); }}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.inkMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading && !isSubmitting}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      accessibilityLabel="Email address"
                    />
                  </View>
                </GlassCard>
                {errors.email && <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" color="ink" style={styles.label}>Password</Text>
                <GlassCard 
                  variant="default" 
                  padding="none"
                  style={{...styles.inputWrapper, ...(errors.password ? { borderWidth: 1, borderColor: colors.statusError } : {})}}
                >
                  <View style={styles.inputInner}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      ref={passwordRef}
                      style={[styles.input, { color: colors.ink }]}
                      value={password}
                      onChangeText={(text) => { setPassword(text); if (errors.password) setErrors(e => ({ ...e, password: undefined })); }}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={colors.inkMuted}
                      secureTextEntry={!showPassword}
                      editable={!isLoading && !isSubmitting}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      accessibilityLabel="Password"
                    />
                    <Pressable 
                      onPress={async () => { await selectionLight(); setShowPassword(!showPassword); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    >
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
                    </Pressable>
                  </View>
                </GlassCard>
                {errors.password && <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" color="ink" style={styles.label}>Confirm Password</Text>
                <GlassCard 
                  variant="default" 
                  padding="none"
                  style={{...styles.inputWrapper, ...(errors.confirmPassword ? { borderWidth: 1, borderColor: colors.statusError } : {})}}
                >
                  <View style={styles.inputInner}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[styles.input, { color: colors.ink }]}
                      value={confirmPassword}
                      onChangeText={(text) => { setConfirmPassword(text); if (errors.confirmPassword) setErrors(e => ({ ...e, confirmPassword: undefined })); }}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.inkMuted}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading && !isSubmitting}
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                      accessibilityLabel="Confirm password"
                    />
                    <Pressable 
                      onPress={async () => { await selectionLight(); setShowConfirmPassword(!showConfirmPassword); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
                    </Pressable>
                  </View>
                </GlassCard>
                {errors.confirmPassword && <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>{errors.confirmPassword}</Text>}
              </View>

              {/* Terms Checkbox */}
              <Pressable style={styles.termsContainer} onPress={handleToggleTerms} accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }}>
                <View style={[styles.checkbox, { borderColor: errors.terms ? colors.statusError : colors.border }, acceptedTerms && { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary }]}>
                  {acceptedTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text variant="bodySmall" color="inkMuted" style={styles.termsText}>
                  I agree to the <Text style={{ color: colors.accentPrimary }}>Terms of Service</Text> and <Text style={{ color: colors.accentPrimary }}>Privacy Policy</Text>
                </Text>
              </Pressable>
              {errors.terms && <Text variant="labelSmall" style={[styles.errorText, { color: colors.statusError }]}>{errors.terms}</Text>}

              {/* Register Button */}
              <AnimatedButton
                variant="primary"
                onPress={handleRegister}
                disabled={isLoading || isSubmitting}
                loading={isSubmitting}
                accessibilityLabel="Create account"
              >
                <Text variant="labelLarge" style={styles.primaryButtonText}>Create Account</Text>
              </AnimatedButton>

              {/* Divider */}
              <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(300).duration(400)} style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text variant="labelSmall" color="inkMuted" style={styles.dividerText}>or sign up with</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </Animated.View>

              {/* Social Sign In */}
              <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(500)} style={styles.socialButtons}>
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                  />
                )}
                <AnimatedButton variant="secondary" onPress={handleGoogleSignIn} disabled={isLoading} style={styles.socialButton} accessibilityLabel="Sign up with Google">
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-google" size={20} color={colors.ink} />
                    <Text variant="labelLarge" color="ink">Google</Text>
                  </View>
                </AnimatedButton>
              </Animated.View>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(500).duration(500)} style={styles.footer}>
              <Text variant="bodyMedium" color="inkMuted">Already have an account? </Text>
              <Pressable onPress={async () => { await impactLight(); navigation.navigate('Login'); }} accessibilityRole="link">
                <Text variant="labelMedium" style={{ color: colors.accentPrimary }}>Sign In</Text>
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
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
  offlineText: { color: '#fff' },
  header: { marginBottom: spacing[6] },
  backButton: { marginBottom: spacing[4], padding: spacing[1] },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  errorBannerText: { flex: 1 },
  form: { flex: 1 },
  inputContainer: { marginBottom: spacing[4] },
  label: { marginBottom: spacing[2] },
  inputWrapper: { overflow: 'hidden' },
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
  errorText: { marginTop: spacing[1] },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[5],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: { flex: 1, lineHeight: 20 },
  button: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: spacing[4] },
  socialButtons: { gap: spacing[3] },
  appleButton: { height: 50, width: '100%' },
  socialButton: { paddingVertical: spacing[3] },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[6],
  },
});
