import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import { withAlpha } from '../theme';
import { ErrorBoundary } from '../components/ui';

const ONBOARDING_COMPLETE_KEY = '@restorae/onboarding_complete';

import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList, MainTabParamList } from '../types';
import { spacing, layout, typography } from '../theme';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BreathingScreen } from '../screens/tools/BreathingScreen';
import { QuickResetScreen } from '../screens/QuickResetScreen';
import { MoodCheckinScreen } from '../screens/MoodCheckinScreen';
import { MoodSelectScreen } from '../screens/MoodSelectScreen';
import { ToolsMoreScreen } from '../screens/ToolsMoreScreen';
import { JournalPromptsScreen } from '../screens/JournalPromptsScreen';
import { JournalEntriesScreen } from '../screens/JournalEntriesScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { PreferencesScreen } from '../screens/PreferencesScreen';
import { SoundHapticsScreen } from '../screens/SoundHapticsScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { GroundingScreen } from '../screens/GroundingScreen';
import { ResetScreen } from '../screens/ResetScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { SosScreen } from '../screens/SosScreen';
import { MoodResultScreen } from '../screens/MoodResultScreen';
import { JournalEntryScreen } from '../screens/JournalEntryScreen';
import { RitualScreen } from '../screens/RitualScreen';

// New Tool Selection & Session Screens
import { BreathingSelectScreen } from '../screens/tools/BreathingSelectScreen';
import { GroundingSelectScreen } from '../screens/tools/GroundingSelectScreen';
import { GroundingSessionScreen } from '../screens/tools/GroundingSessionScreen';
import { ResetSelectScreen } from '../screens/tools/ResetSelectScreen';
import { ResetSessionScreen } from '../screens/tools/ResetSessionScreen';
import { FocusSelectScreen } from '../screens/tools/FocusSelectScreen';
import { FocusSessionScreen } from '../screens/tools/FocusSessionScreen';
import { SOSSelectScreen } from '../screens/tools/SOSSelectScreen';
import { SOSSessionScreen } from '../screens/tools/SOSSessionScreen';
import { SituationalSelectScreen } from '../screens/tools/SituationalSelectScreen';
import { SituationalSessionScreen } from '../screens/tools/SituationalSessionScreen';
import { MorningRitualScreen } from '../screens/tools/MorningRitualScreen';
import { EveningRitualScreen } from '../screens/tools/EveningRitualScreen';

// Stories Screens
import { StoriesScreen } from '../screens/StoriesScreen';
import { StoryPlayerScreen } from '../screens/StoryPlayerScreen';

// Progress Screen
import { ProgressScreen } from '../screens/ProgressScreen';

// Session Complete Screen
import { SessionCompleteScreen } from '../screens/SessionCompleteScreen';

// Unified Session System Screens
import { UnifiedSessionScreen } from '../screens/UnifiedSessionScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';

// Subscription & Paywall Screens
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { PaywallScreen } from '../screens/PaywallScreen';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Mood & Ritual Screens
import MoodHistoryScreen from '../screens/MoodHistoryScreen';
import CreateRitualScreen from '../screens/CreateRitualScreen';
import CustomRitualSessionScreen from '../screens/CustomRitualSessionScreen';
import JournalSearchScreen from '../screens/JournalSearchScreen';
import AppLockScreen from '../screens/AppLockScreen';
import AppLockSetupScreen from '../screens/AppLockSetupScreen';
import { DataSettingsScreen } from '../screens/DataSettingsScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';

// Auth Context
import { useAuth } from '../contexts/AuthContext';

// Icons
import { Icon } from '../components/Icon';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<MainTabParamList>();

// =============================================================================
// AUTH NAVIGATOR
// =============================================================================
function AuthNavigator() {
  const { colors } = useTheme();
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// =============================================================================
// ANIMATED TAB BAR BUTTON
// =============================================================================
interface AnimatedTabButtonProps {
  focused: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  colors: any;
  accessibilityLabel: string;
}

function AnimatedTabButton({
  focused,
  icon,
  label,
  onPress,
  onLongPress,
  colors,
  accessibilityLabel,
}: AnimatedTabButtonProps) {
  const scale = useSharedValue(1);
  const { impactLight } = useHaptics();

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: focused
      ? withAlpha(colors.accentPrimary, 0.12)
      : 'transparent',
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focused ? 1.1 : 1 }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabButtonInner, animatedContainerStyle]}>
        <Animated.View style={animatedIconStyle}>
          {icon}
        </Animated.View>
        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: focused ? colors.accentPrimary : colors.inkFaint,
              fontWeight: focused ? '600' : '500',
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const { impactLight } = useHaptics();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: spacing[4],
          right: spacing[4],
          bottom: spacing[4],
          height: layout.tabBarHeight - spacing[4],
          paddingTop: spacing[2],
          paddingBottom: spacing[4],
          borderRadius: 28,
          backgroundColor: colors.canvasElevated,
          borderTopWidth: 0,
          shadowColor: colors.shadowStrong,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
          elevation: 12,
        },
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: typography.fontFamily.sansMedium,
          marginTop: spacing[1],
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab - Your daily wellness hub',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: withAlpha(color, 0.12) }]}>
              <Icon name="home" size={22} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: impactLight }}
      />
      <Tab.Screen
        name="ToolsTab"
        component={ToolsScreen}
        options={{
          tabBarLabel: 'Tools',
          tabBarAccessibilityLabel: 'Tools tab - Breathing, grounding, and focus exercises',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: withAlpha(color, 0.12) }]}>
              <Icon name="tools" size={22} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: impactLight }}
      />
      <Tab.Screen
        name="StoriesTab"
        component={StoriesScreen}
        options={{
          tabBarLabel: 'Stories',
          tabBarAccessibilityLabel: 'Stories tab - Sleep stories and soundscapes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: withAlpha(color, 0.12) }]}>
              <Icon name="stories" size={22} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: impactLight }}
      />
      <Tab.Screen
        name="JournalTab"
        component={JournalScreen}
        options={{
          tabBarLabel: 'Journal',
          tabBarAccessibilityLabel: 'Journal tab - Write and reflect',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: withAlpha(color, 0.12) }]}>
              <Icon name="journal-tab" size={22} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: impactLight }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab - Settings and account',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: withAlpha(color, 0.12) }]}>
              <Icon name="profile" size={22} color={color} />
            </View>
          ),
        }}
        listeners={{ tabPress: impactLight }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
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
      regular: { fontFamily: typography.fontFamily.sansRegular, fontWeight: '400' as const },
      medium: { fontFamily: typography.fontFamily.sansMedium, fontWeight: '500' as const },
      bold: { fontFamily: typography.fontFamily.sansBold, fontWeight: '700' as const },
      heavy: { fontFamily: typography.fontFamily.sansBold, fontWeight: '800' as const },
    },
  };

  // Show loading state while checking auth or onboarding status
  if (isLoading || (isAuthenticated && hasCompletedOnboarding === null)) {
    return null; // Or a splash screen component
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return (
      <NavigationContainer theme={navigationTheme}>
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
      <NavigationContainer theme={navigationTheme}>
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
          <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen 
          name="Breathing" 
          component={BreathingScreen}
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen 
          name="QuickReset" 
          component={QuickResetScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen 
          name="MoodCheckin" 
          component={MoodCheckinScreen} 
          options={{ animation: 'fade_from_bottom' }} 
        />
        <Stack.Screen 
          name="MoodSelect" 
          component={MoodSelectScreen} 
          options={{ animation: 'fade_from_bottom' }} 
        />
        <Stack.Screen 
          name="MoodResult" 
          component={MoodResultScreen} 
          options={{ animation: 'fade' }} 
        />
        <Stack.Screen 
          name="ToolsMore" 
          component={ToolsMoreScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="JournalPrompts" 
          component={JournalPromptsScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="JournalEntries" 
          component={JournalEntriesScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="JournalEntry" 
          component={JournalEntryScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen 
          name="Ritual" 
          component={RitualScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Appearance" 
          component={AppearanceScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Preferences" 
          component={PreferencesScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="SoundHaptics" 
          component={SoundHapticsScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Reminders" 
          component={RemindersScreen} 
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
          name="EditProfile" 
          component={EditProfileScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Grounding" 
          component={GroundingScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Reset" 
          component={ResetScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Focus" 
          component={FocusScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Sos" 
          component={SosScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        
        {/* New Selection Screens */}
        <Stack.Screen 
          name="BreathingSelect" 
          component={BreathingSelectScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
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
        <Stack.Screen 
          name="ResetSelect" 
          component={ResetSelectScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="ResetSession" 
          component={ResetSessionScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
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
          }} 
        />
        <Stack.Screen 
          name="SOSSelect" 
          component={SOSSelectScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="SOSSession" 
          component={SOSSessionScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen 
          name="SituationalSelect" 
          component={SituationalSelectScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="SituationalSession" 
          component={SituationalSessionScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen 
          name="MorningRitual" 
          component={MorningRitualScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen 
          name="EveningRitual" 
          component={EveningRitualScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        
        {/* Stories & Sleep */}
        <Stack.Screen 
          name="Stories" 
          component={StoriesScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="StoryPlayer" 
          component={StoryPlayerScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        
        {/* Subscription & Paywall */}
        <Stack.Screen 
          name="Subscription" 
          component={SubscriptionScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="Paywall" 
          component={PaywallScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }} 
        />
        
        {/* Mood History */}
        <Stack.Screen 
          name="MoodHistory" 
          component={MoodHistoryScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        
        {/* Progress Dashboard */}
        <Stack.Screen 
          name="Progress" 
          component={ProgressScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        
        {/* Session Complete - Unified completion screen */}
        <Stack.Screen 
          name="SessionComplete" 
          component={SessionCompleteScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }} 
        />
        
        {/* Custom Rituals */}
        <Stack.Screen 
          name="CreateRitual" 
          component={CreateRitualScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen 
          name="CustomRitualSession" 
          component={CustomRitualSessionScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }} 
        />
        
        {/* Journal Search */}
        <Stack.Screen 
          name="JournalSearch" 
          component={JournalSearchScreen} 
          options={{ animation: 'slide_from_right' }} 
        />
        
        {/* App Lock */}
        <Stack.Screen 
          name="AppLock" 
          component={AppLockScreen} 
          options={{ 
            animation: 'fade',
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen
          name="AppLockSetup"
          component={AppLockSetupScreen}
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
        
        {/* Unified Session System */}
        <Stack.Screen 
          name="UnifiedSession" 
          component={UnifiedSessionScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="SessionSummary" 
          component={SessionSummaryScreen} 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            headerShown: false,
          }} 
        />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: typography.fontFamily.sansMedium,
  },
});
