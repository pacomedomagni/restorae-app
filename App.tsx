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
import { setupNotificationResponseHandler } from './src/services/notificationRouter';

// Contexts
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { PreferencesProvider } from './src/contexts/PreferencesContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { AudioProvider } from './src/contexts/AudioContext';
import { JournalProvider } from './src/contexts/JournalContext';
import { MoodProvider } from './src/contexts/MoodContext';
import { SessionProvider } from './src/contexts/SessionContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { AccessibilityAnnouncerProvider } from './src/contexts/AccessibilityContext';
import { AmbientProvider } from './src/contexts/AmbientContext';
import { JourneyProvider } from './src/contexts/JourneyContext';

// Navigation & UI
import { NewRootNavigator } from './src/navigation/NewRootNavigator';
import { ErrorBoundary, SharedTransitionProvider } from './src/components/ui';

// Migrate tokens from AsyncStorage to SecureStore (one-time migration)
migrateTokensToSecureStorage();

function AnimatedSplash() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 18,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 400,
      delay: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.Image
        source={require('./assets/icon.png')}
        style={[
          splashStyles.logo,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
        resizeMode="contain"
      />
      <Animated.Text style={[splashStyles.appName, { opacity: textOpacity }]}>
        Restorae
      </Animated.Text>
    </View>
  );
}

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

  // Register notification deep-link handler after navigator mounts
  useEffect(() => {
    const cleanup = setupNotificationResponseHandler();
    return () => cleanup?.();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <NewRootNavigator />
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
    const timeout = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading timeout - proceeding without custom fonts');
        setForceLoad(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [fontsLoaded]);

  // Branded animated splash — no spinner, just the logo moment
  if (!fontsLoaded && !forceLoad) {
    return <AnimatedSplash />;
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
                      <SessionProvider>
                        <AmbientProvider>
                          <JourneyProvider>
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
                          </JourneyProvider>
                        </AmbientProvider>
                      </SessionProvider>
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
    backgroundColor: '#F2E7DB',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    color: '#2B2018',
    fontWeight: '300',
    letterSpacing: 2,
  },
});
