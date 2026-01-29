/**
 * ForgotPasswordScreen - Premium password reset flow
 * 
 * Features:
 * - Smooth animations with Reanimated
 * - Haptic feedback throughout
 * - Network awareness with OfflineBanner
 * - Inline error display (no alerts)
 * - Premium glassmorphism design
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useHaptics } from '../hooks/useHaptics';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { 
  Text as PremiumText, 
  GlassCard, 
  AmbientBackground, 
  OfflineBanner,
  Button,
} from '../components/ui';
import { spacing, borderRadius, withAlpha, layout } from '../theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { colors, reduceMotion } = useTheme();
  const { forgotPassword } = useAuth();
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { isConnected } = useNetworkStatus();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      notificationError();
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      notificationError();
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) return;
    
    if (!isConnected) {
      setError('No internet connection. Please check your network.');
      notificationError();
      return;
    }

    await impactMedium();
    setIsLoading(true);
    setError('');
    
    try {
      await forgotPassword(email.trim().toLowerCase());
      await notificationSuccess();
      setIsEmailSent(true);
    } catch (err: any) {
      await notificationError();
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await impactLight();
    navigation.goBack();
  };

  const handleNavigateToLogin = async () => {
    await impactLight();
    navigation.navigate('Login');
  };

  // Success state
  if (isEmailSent) {
    return (
      <View style={styles.container}>
        <AmbientBackground variant="calm" />
        <OfflineBanner />
        
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Animated.View 
            entering={reduceMotion ? undefined : FadeIn.duration(400)}
            style={styles.successContainer}
          >
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(500)}
              style={[styles.successIcon, { backgroundColor: withAlpha(colors.accentCalm, 0.2) }]}
            >
              <Ionicons name="mail-open-outline" size={64} color={colors.accentCalm} />
            </Animated.View>
            
            <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}>
              <PremiumText variant="displaySmall" color="ink" style={styles.successTitle}>
                Check your email
              </PremiumText>
              <PremiumText variant="bodyMedium" color="inkMuted" style={styles.successText}>
                We've sent password reset instructions to
              </PremiumText>
              <PremiumText variant="bodyMedium" color="accent" style={styles.emailHighlight}>
                {email}
              </PremiumText>
              <PremiumText variant="bodySmall" color="inkFaint" style={styles.successSubtext}>
                If you don't see the email, check your spam folder.
              </PremiumText>
            </Animated.View>

            <Animated.View 
              entering={reduceMotion ? undefined : FadeInUp.delay(400).duration(400)}
              style={styles.successActions}
            >
              <Button
                onPress={handleNavigateToLogin}
                variant="primary"
                size="lg"
                fullWidth
              >
                Back to Sign In
              </Button>

              <Pressable
                style={styles.resendButton}
                onPress={async () => {
                  await impactLight();
                  setIsEmailSent(false);
                  handleSubmit();
                }}
                accessibilityRole="button"
                accessibilityLabel="Resend email"
                accessibilityHint="Sends another password reset email to your address"
              >
                <PremiumText variant="labelMedium" color="accent">
                  Resend email
                </PremiumText>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" />
      <OfflineBanner />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeIn.duration(400)}
              style={styles.header}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                accessibilityHint="Returns to the previous screen"
              >
                <Ionicons name="arrow-back" size={24} color={colors.ink} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}>
              <PremiumText variant="displaySmall" color="ink">
                Forgot Password?
              </PremiumText>
              <PremiumText variant="bodyMedium" color="inkMuted" style={{ marginTop: spacing[2] }}>
                No worries! Enter your email and we'll send you instructions to reset it.
              </PremiumText>
            </Animated.View>

            {/* Form */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeInUp.delay(200).duration(400)}
              style={styles.form}
            >
              <GlassCard variant="elevated" padding="lg">
                {/* Error Banner */}
                {error ? (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    style={[styles.errorBanner, { backgroundColor: withAlpha(colors.accentWarm, 0.15) }]}
                  >
                    <Ionicons name="alert-circle" size={18} color={colors.accentWarm} />
                    <PremiumText variant="bodySmall" color="ink" style={{ marginLeft: spacing[2], flex: 1 }}>
                      {error}
                    </PremiumText>
                  </Animated.View>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <PremiumText variant="labelSmall" color="inkMuted" style={styles.label}>
                    EMAIL
                  </PremiumText>
                  <View style={[
                    styles.inputWrapper, 
                    { 
                      backgroundColor: withAlpha(colors.canvasElevated, 0.5),
                      borderColor: error ? colors.accentWarm : 'transparent',
                    }
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={colors.inkMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.ink }]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError('');
                      }}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.inkFaint}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                      editable={!isLoading}
                      accessibilityLabel="Email address"
                      accessibilityHint="Enter your email to receive password reset instructions"
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <Button
                  onPress={handleSubmit}
                  loading={isLoading}
                  disabled={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={{ marginTop: spacing[4] }}
                >
                  Send Reset Link
                </Button>
              </GlassCard>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              entering={reduceMotion ? undefined : FadeIn.delay(400).duration(400)}
              style={styles.footer}
            >
              <PremiumText variant="bodySmall" color="inkMuted">
                Remember your password?{' '}
              </PremiumText>
              <Pressable 
                onPress={handleNavigateToLogin}
                accessibilityRole="link"
                accessibilityLabel="Sign In"
                accessibilityHint="Navigate to the sign in screen"
              >
                <PremiumText variant="labelMedium" color="accent">
                  Sign In
                </PremiumText>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    marginBottom: spacing[6],
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  form: {
    marginTop: spacing[8],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  label: {
    marginBottom: spacing[2],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[8],
  },
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  successText: {
    textAlign: 'center',
  },
  emailHighlight: {
    textAlign: 'center',
    marginTop: spacing[1],
  },
  successSubtext: {
    textAlign: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  successActions: {
    width: '100%',
    marginTop: spacing[8],
    gap: spacing[4],
  },
  resendButton: {
    alignItems: 'center',
    padding: spacing[3],
  },
});
