import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { useHaptics } from '../hooks/useHaptics';

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

// Subscription & Paywall Screens
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { PaywallScreen } from '../screens/PaywallScreen';

// Mood & Ritual Screens
import MoodHistoryScreen from '../screens/MoodHistoryScreen';
import CreateRitualScreen from '../screens/CreateRitualScreen';
import CustomRitualSessionScreen from '../screens/CustomRitualSessionScreen';
import JournalSearchScreen from '../screens/JournalSearchScreen';
import AppLockScreen from '../screens/AppLockScreen';
import AppLockSetupScreen from '../screens/AppLockSetupScreen';
import { DataSettingsScreen } from '../screens/DataSettingsScreen';

// Icons
import { Icon } from '../components/Icon';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
          letterSpacing: 0.4,
        },
      }}
      screenListeners={{
        tabPress: impactLight,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ToolsTab"
        component={ToolsScreen}
        options={{
          tabBarLabel: 'Tools',
          tabBarIcon: ({ color }) => (
            <Icon name="tools" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="JournalTab"
        component={JournalScreen}
        options={{
          tabBarLabel: 'Journal',
          tabBarIcon: ({ color }) => (
            <Icon name="journal-tab" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Icon name="profile" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { colors, isDark } = useTheme();

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

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
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
        <Stack.Screen name="QuickReset" component={QuickResetScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="MoodCheckin" component={MoodCheckinScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="MoodSelect" component={MoodSelectScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="MoodResult" component={MoodResultScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="ToolsMore" component={ToolsMoreScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="JournalPrompts" component={JournalPromptsScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="JournalEntries" component={JournalEntriesScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="JournalEntry" component={JournalEntryScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Ritual" component={RitualScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="SoundHaptics" component={SoundHapticsScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Reminders" component={RemindersScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Grounding" component={GroundingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Reset" component={ResetScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Focus" component={FocusScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Sos" component={SosScreen} options={{ animation: 'fade' }} />
        
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
          options={{ title: 'App Lock' }}
        />
        <Stack.Screen
          name="DataSettings"
          component={DataSettingsScreen}
          options={{ title: 'Data & Storage' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
