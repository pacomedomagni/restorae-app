/**
 * NewRootNavigator - Simplified 4-Tab Navigation
 * 
 * This is the revamped navigation structure:
 * 1. Sanctuary - Main hub (mood check, adaptive offerings, SOS)
 * 2. Journey - Progress & reflection (timeline, stats, journal)
 * 3. Practice - Breathing and grounding exercises
 * 4. You - Profile & settings
 * 
 * Stack screens for sessions, onboarding, etc.
 */
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ui';
import { navigationRef } from '../services/navigationRef';

import { withAlpha, spacing, radius, layout } from '../theme';

// =============================================================================
// SCREEN IMPORTS
// =============================================================================

// New revamped screens
import { SanctuaryScreen } from '../screens/Sanctuary';
import { JourneyScreen } from '../screens/Journey';
import { LibraryScreen } from '../screens/Library';
import { YouScreen } from '../screens/You';
import { SessionBridgeScreen } from '../screens/Session';

// Existing screens we still need
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnifiedSessionScreen } from '../screens/UnifiedSessionScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';
import { SessionCompleteScreen } from '../screens/SessionCompleteScreen';
import { SOSSelectScreen } from '../screens/tools/SOSSelectScreen';
import { SOSSessionScreen } from '../screens/tools/SOSSessionScreen';
import { BreathingScreen } from '../screens/tools/BreathingScreen';
import { BreathingSelectScreen } from '../screens/tools/BreathingSelectScreen';
import { GroundingSelectScreen } from '../screens/tools/GroundingSelectScreen';
import { GroundingSessionScreen } from '../screens/tools/GroundingSessionScreen';
import { StoryPlayerScreen } from '../screens/StoryPlayerScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { DataSettingsScreen } from '../screens/DataSettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { JournalEntryScreen } from '../screens/JournalEntryScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { ProgramListScreen, ProgramDetailScreen, ProgramDayCompleteScreen } from '../screens/Programs';
import { FocusSelectScreen, FocusSessionScreen } from '../screens/Focus';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type NewMainTabParamList = {
  SanctuaryTab: undefined;
  JourneyTab: undefined;
  LibraryTab: undefined;
  YouTab: undefined;
};

export type NewRootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
  // Session bridge - receives simple params and sets up SessionContext
  Session: {
    type: string;
    id: string;
    mood?: string;
  };
  // Actual session screen managed by SessionContext
  UnifiedSession: undefined;
  SessionSummary: {
    duration: number;
    type: string;
  };
  SessionComplete: {
    duration: number;
    type: string;
  };
  SOSSelect: undefined;
  SOSSession: {
    techniqueId: string;
  };
  BreathingSelect: undefined;
  Breathing: {
    pattern?: string;
  };
  GroundingSelect: undefined;
  GroundingSession: {
    techniqueId: string;
  };
  StoryPlayer: {
    storyId: string;
  };
  Appearance: undefined;
  Privacy: undefined;
  Support: undefined;
  Reminders: undefined;
  DataSettings: undefined;
  SecuritySettings: undefined;
  EditProfile: undefined;
  JournalEntry: {
    entryId?: string;
    prompt?: string;
  };
  Paywall: undefined;
  ProgramList: undefined;
  ProgramDetail: { programId: string };
  ProgramDayComplete: {
    programId: string;
    dayNumber: number;
    duration: number;
  };
  FocusSelect: undefined;
  FocusSession: {
    sessionId: string;
  };
};

const ONBOARDING_COMPLETE_KEY = '@restorae/onboarding_complete';

// =============================================================================
// NAVIGATORS
// =============================================================================

const Stack = createNativeStackNavigator<NewRootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<NewMainTabParamList>();

// =============================================================================
// AUTH NAVIGATOR
// =============================================================================

function AuthNavigator() {
  const { colors } = useTheme();
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// =============================================================================
// TAB BAR ICON COMPONENT
// =============================================================================

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
}

function TabIcon({ name, focused, color, size = 22 }: TabIconProps) {
  const iconName = focused ? name : `${name}-outline`;
  
  return (
    <Ionicons
      name={iconName as any}
      size={size}
      color={color}
    />
  );
}

// =============================================================================
// TAB WRAPPERS WITH ERROR BOUNDARIES
// =============================================================================

function SanctuaryTab() {
  return (
    <ErrorBoundary
      errorTitle="Something went wrong"
      errorDescription="The Sanctuary couldn't load. Please try restarting the app."
    >
      <SanctuaryScreen />
    </ErrorBoundary>
  );
}

function JourneyTab() {
  return (
    <ErrorBoundary
      errorTitle="Something went wrong"
      errorDescription="Your Journey couldn't load. Please try restarting the app."
    >
      <JourneyScreen />
    </ErrorBoundary>
  );
}

function LibraryTab() {
  return (
    <ErrorBoundary
      errorTitle="Something went wrong"
      errorDescription="The Library couldn't load. Please try restarting the app."
    >
      <LibraryScreen />
    </ErrorBoundary>
  );
}

function YouTab() {
  return (
    <ErrorBoundary
      errorTitle="Something went wrong"
      errorDescription="Your Profile couldn't load. Please try restarting the app."
    >
      <YouScreen />
    </ErrorBoundary>
  );
}

// =============================================================================
// MAIN TABS
// =============================================================================

function MainTabs() {
  const { colors, isDark } = useTheme();

  const handleTabPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: layout.tabBarHeight,
          paddingTop: spacing.xs,
          paddingBottom: spacing.lg,
          backgroundColor: colors.canvasElevated,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'PlusJakartaSans_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="SanctuaryTab"
        component={SanctuaryTab}
        options={{
          tabBarLabel: 'Sanctuary',
          tabBarAccessibilityLabel: 'Sanctuary - Your wellness hub',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="leaf" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tab.Screen
        name="JourneyTab"
        component={JourneyTab}
        options={{
          tabBarLabel: 'Journey',
          tabBarAccessibilityLabel: 'Journey - Your progress and reflections',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="analytics" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryTab}
        options={{
          tabBarLabel: 'Practice',
          tabBarAccessibilityLabel: 'Practice - Breathing and grounding exercises',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="library" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tab.Screen
        name="YouTab"
        component={YouTab}
        options={{
          tabBarLabel: 'You',
          tabBarAccessibilityLabel: 'You - Profile and settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
    </Tab.Navigator>
  );
}

// =============================================================================
// ROOT NAVIGATOR
// =============================================================================

export function NewRootNavigator() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Check if onboarding has been completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setHasCompletedOnboarding(completed === 'true');
      } catch {
        setHasCompletedOnboarding(false);
      }
    };
    
    if (isAuthenticated) {
      checkOnboarding();
    }
  }, [isAuthenticated]);

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.accentPrimary,
      background: colors.canvas,
      card: colors.canvasElevated,
      text: colors.ink,
      border: colors.border,
      notification: colors.statusError,
    },
    fonts: {
      regular: { fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' as const },
      medium: { fontFamily: 'PlusJakartaSans_500Medium', fontWeight: '500' as const },
      bold: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' as const },
      heavy: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '800' as const },
    },
  };

  // Show loading state while checking auth or onboarding status
  if (isLoading || (isAuthenticated && hasCompletedOnboarding === null)) {
    return null; // Or a splash screen component
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return (
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Determine initial route based on onboarding status
  const initialRouteName = hasCompletedOnboarding ? 'Main' : 'Onboarding';

  return (
    <ErrorBoundary
      errorTitle="Something went wrong"
      errorDescription="The app encountered an unexpected error. Please restart and try again."
    >
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: colors.canvas,
            },
          }}
        >
          {/* Main Tabs */}
          <Stack.Screen name="Main" component={MainTabs} />
          
          {/* Onboarding */}
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{ animation: 'fade' }}
          />

          {/* Session Screens */}
          <Stack.Screen 
            name="Session" 
            component={SessionBridgeScreen}
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="UnifiedSession" 
            component={UnifiedSessionScreen}
            options={{ 
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="SessionSummary" 
            component={SessionSummaryScreen}
            options={{ 
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="SessionComplete" 
            component={SessionCompleteScreen}
            options={{ 
              animation: 'fade',
              gestureEnabled: false,
            }}
          />

          {/* SOS Screens */}
          <Stack.Screen 
            name="SOSSelect" 
            component={SOSSelectScreen}
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen 
            name="SOSSession" 
            component={SOSSessionScreen}
            options={{ 
              animation: 'fade',
              gestureEnabled: false,
            }}
          />

          {/* Breathing Screens */}
          <Stack.Screen 
            name="BreathingSelect" 
            component={BreathingSelectScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="Breathing" 
            component={BreathingScreen}
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />

          {/* Grounding Screens */}
          <Stack.Screen 
            name="GroundingSelect" 
            component={GroundingSelectScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="GroundingSession" 
            component={GroundingSessionScreen}
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />

          {/* Story Player */}
          <Stack.Screen 
            name="StoryPlayer" 
            component={StoryPlayerScreen}
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />

          {/* Journal Entry */}
          <Stack.Screen 
            name="JournalEntry" 
            component={JournalEntryScreen}
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />

          {/* Paywall */}
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />

          {/* Program Screens */}
          <Stack.Screen
            name="ProgramList"
            component={ProgramListScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ProgramDetail"
            component={ProgramDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ProgramDayComplete"
            component={ProgramDayCompleteScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />

          {/* Focus Screens */}
          <Stack.Screen
            name="FocusSelect"
            component={FocusSelectScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="FocusSession"
            component={FocusSessionScreen}
            options={{
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />

          {/* Settings Screens */}
          <Stack.Screen 
            name="Appearance" 
            component={AppearanceScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="Privacy" 
            component={PrivacyScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="Support" 
            component={SupportScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="Reminders" 
            component={RemindersScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="DataSettings" 
            component={DataSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="SecuritySettings" 
            component={SecuritySettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default NewRootNavigator;
