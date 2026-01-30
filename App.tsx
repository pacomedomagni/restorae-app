import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text as RNText, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';

// Initialize services
import { migrateTokensToSecureStorage } from './src/services/secureStorage';

import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { AudioProvider } from './src/contexts/AudioContext';
import { JournalProvider } from './src/contexts/JournalContext';
import { MoodProvider } from './src/contexts/MoodContext';
import { AppLockProvider } from './src/contexts/AppLockContext';
import { RitualsProvider } from './src/contexts/RitualsContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CoachMarkProvider } from './src/contexts/CoachMarkContext';
import { SessionProvider } from './src/contexts/SessionContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { AccessibilityAnnouncerProvider } from './src/contexts/AccessibilityContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary, SharedTransitionProvider } from './src/components/ui';

// Migrate tokens from AsyncStorage to SecureStore (one-time migration)
migrateTokensToSecureStorage();

function AppContent() {
  const { isDark, reduceMotion } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      return;
    }
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, isDark, reduceMotion]);
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <RootNavigator />
      </Animated.View>
    </>
  );
}

export default function App() {
  const [fontError, setFontError] = useState<Error | null>(null);
  const [fontsLoaded, fontLoadError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  // Track font loading errors
  useEffect(() => {
    if (fontLoadError) {
      console.error('Font loading error:', fontLoadError);
      setFontError(fontLoadError);
    }
  }, [fontLoadError]);

  // Show loading screen while fonts load (with timeout fallback)
  const [forceLoad, setForceLoad] = useState(false);
  useEffect(() => {
    // Force proceed after 5 seconds even if fonts haven't loaded
    const timeout = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading timeout - proceeding without custom fonts');
        setForceLoad(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [fontsLoaded]);

  // Show splash screen while loading
  if (!fontsLoaded && !forceLoad) {
    return (
      <View style={splashStyles.container}>
        <ActivityIndicator size="large" color="#8B7355" />
        <RNText style={splashStyles.text}>Loading Restorae...</RNText>
        {fontError && (
          <RNText style={splashStyles.errorText}>Font load issue - using system fonts</RNText>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <SubscriptionProvider>
                <AudioProvider>
                  <JournalProvider>
                    <MoodProvider>
                      <RitualsProvider>
                        <AppLockProvider>
                          <CoachMarkProvider>
                            <SessionProvider>
                              <ToastProvider>
                                <AccessibilityAnnouncerProvider>
                                  <SharedTransitionProvider>
                                    <ErrorBoundary
                                    errorTitle="Something went wrong"
                                    errorDescription="Restorae encountered an unexpected error. Please restart the app."
                                  >
                                    <AppContent />
                                  </ErrorBoundary>
                                  </SharedTransitionProvider>
                                </AccessibilityAnnouncerProvider>
                              </ToastProvider>
                            </SessionProvider>
                          </CoachMarkProvider>
                        </AppLockProvider>
                      </RitualsProvider>
                    </MoodProvider>
                  </JournalProvider>
                </AudioProvider>
              </SubscriptionProvider>
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
});
