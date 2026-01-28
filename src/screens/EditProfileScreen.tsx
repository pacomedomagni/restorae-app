/**
 * EditProfileScreen
 * 
 * Account management screen for editing profile info,
 * logging out, and deleting account.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';
import { useTheme } from '../contexts/ThemeContext';
import { useMood } from '../contexts/MoodContext';
import { useJournal } from '../contexts/JournalContext';
import {
  Text,
  GlassCard,
  AmbientBackground,
  TabSafeScrollView,
  AlertModal,
  ExitConfirmationModal,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { spacing, borderRadius, layout, withAlpha } from '../theme';
import { RootStackParamList } from '../types';
import logger from '../services/logger';

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEYS = {
  USER_NAME: '@restorae/user_name',
  USER_EMAIL: '@restorae/user_email',
  ONBOARDING_COMPLETE: '@restorae/onboarding_complete',
};

// =============================================================================
// TYPES
// =============================================================================
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AccountActionProps {
  icon: 'home' | 'journal-tab' | 'profile';
  label: string;
  description: string;
  variant?: 'default' | 'danger';
  onPress: () => void;
  index: number;
}

// =============================================================================
// ACCOUNT ACTION ROW
// =============================================================================
function AccountAction({
  icon,
  label,
  description,
  variant = 'default',
  onPress,
  index,
}: AccountActionProps) {
  const { colors, reduceMotion } = useTheme();
  const { impactLight } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = async () => {
    await impactLight();
    onPress();
  };

  const isDanger = variant === 'danger';
  const iconColor = isDanger ? colors.accentDanger : colors.accentPrimary;
  const iconBgColor = isDanger
    ? withAlpha(colors.accentDanger, 0.12)
    : withAlpha(colors.accentPrimary, 0.12);

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(200 + index * 50).duration(400)}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View style={animatedStyle}>
          <GlassCard style={styles.actionCard}>
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, { backgroundColor: iconBgColor }]}>
                <Icon name={icon} size={20} color={iconColor} />
              </View>
              <View style={styles.actionText}>
                <Text
                  variant="bodyLarge"
                  style={{ color: isDanger ? colors.accentDanger : colors.ink }}
                >
                  {label}
                </Text>
                <Text variant="bodySmall" color="inkFaint">
                  {description}
                </Text>
              </View>
              <View style={styles.chevron}>
                <Icon
                  name="home"
                  size={16}
                  color={isDanger ? colors.accentDanger : colors.inkFaint}
                />
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, reduceMotion } = useTheme();
  const { impactLight, impactMedium, notificationError } = useHaptics();
  const { clearAllEntries: clearMoodEntries } = useMood();
  const { clearAllEntries: clearJournalEntries } = useJournal();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message?: string;
  }>({ visible: false, type: 'success', title: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalDeleteConfirm, setShowFinalDeleteConfirm] = useState(false);

  // Load saved profile data
  React.useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const savedName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
    } catch (error) {
      logger.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!hasChanges) return;

    setIsLoading(true);
    await impactMedium();

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
      setHasChanges(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      logger.error('Error saving profile:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    setHasChanges(true);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setHasChanges(true);
  };

  const handleLogout = useCallback(async () => {
    await notificationError();
    setShowLogoutConfirm(true);
  }, [notificationError]);

  const performLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    try {
      // Clear session-related data but preserve user content
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      
      // Navigate to onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      logger.error('Error logging out:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to log out. Please try again.',
      });
    }
  }, [navigation]);

  const handleDeleteAccount = useCallback(async () => {
    await notificationError();
    setShowDeleteConfirm(true);
  }, [notificationError]);

  const handleFirstDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setShowFinalDeleteConfirm(true);
  }, []);

  const performDeleteAccount = useCallback(async () => {
    setShowFinalDeleteConfirm(false);
    try {
      setIsLoading(true);
      
      // Clear all data from contexts
      await clearMoodEntries?.();
      await clearJournalEntries?.();
      
      // Clear all AsyncStorage (includes rituals, preferences, etc.)
      await AsyncStorage.clear();
      
      // Navigate to onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      logger.error('Error deleting account:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigation, clearMoodEntries, clearJournalEntries]);

  const handleExportData = useCallback(async () => {
    await impactLight();
    // Navigate to data settings which has export functionality
    navigation.navigate('DataSettings');
  }, [navigation, impactLight]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AmbientBackground variant="calm" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <View style={styles.backButton}>
              <Icon name="home" size={24} color={colors.ink} />
            </View>
          </Pressable>
          <Text variant="headlineSmall">Account</Text>
          <Pressable
            onPress={handleSaveProfile}
            disabled={!hasChanges || isLoading}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
          >
            <Text
              variant="labelLarge"
              style={{
                color: hasChanges && !isLoading ? colors.accentPrimary : colors.inkFaint,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <TabSafeScrollView
            style={styles.scrollView}
            contentStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            noTabBar
          >
            {/* Profile Info Section */}
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.duration(400)}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                PROFILE INFORMATION
              </Text>
            </Animated.View>

            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}
            >
              <GlassCard style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text variant="labelSmall" color="inkFaint" style={styles.inputLabel}>
                    NAME
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.ink,
                        backgroundColor: withAlpha(colors.surfaceSubtle, 0.5),
                        borderColor: withAlpha(colors.border, 0.5),
                      },
                    ]}
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.inkFaint}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="labelSmall" color="inkFaint" style={styles.inputLabel}>
                    EMAIL
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.ink,
                        backgroundColor: withAlpha(colors.surfaceSubtle, 0.5),
                        borderColor: withAlpha(colors.border, 0.5),
                      },
                    ]}
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.inkFaint}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </GlassCard>
            </Animated.View>

            {/* Account Actions Section */}
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(150).duration(400)}
              style={styles.actionsSection}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                DATA & PRIVACY
              </Text>
            </Animated.View>

            <View style={styles.actionsList}>
              <AccountAction
                icon="journal-tab"
                label="Export My Data"
                description="Download all your wellness data"
                onPress={handleExportData}
                index={0}
              />
            </View>

            {/* Danger Zone */}
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(250).duration(400)}
              style={styles.dangerSection}
            >
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                DANGER ZONE
              </Text>
            </Animated.View>

            <View style={styles.actionsList}>
              <AccountAction
                icon="profile"
                label="Log Out"
                description="Sign out of your account"
                onPress={handleLogout}
                index={0}
              />
              <AccountAction
                icon="home"
                label="Delete All Data"
                description="Permanently erase all your data"
                variant="danger"
                onPress={handleDeleteAccount}
                index={1}
              />
            </View>

            {/* Footer Info */}
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(350).duration(400)}
              style={styles.footerInfo}
            >
              <Text variant="bodySmall" color="inkFaint" style={styles.footerText}>
                Your data is stored locally on this device. Deleting the app will remove all data.
              </Text>
            </Animated.View>
          </TabSafeScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Alert Modal for success/error messages */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        autoDismissMs={alertConfig.type === 'success' ? 2000 : undefined}
      />

      {/* Logout Confirmation */}
      <ExitConfirmationModal
        visible={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out? Your local data will be preserved."
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Delete Account - First Confirmation */}
      <ExitConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Account"
        message="This will permanently delete all your data including mood history, journal entries, and custom rituals. This action cannot be undone."
        confirmText="Delete Everything"
        cancelText="Cancel"
        onConfirm={handleFirstDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Delete Account - Final Confirmation */}
      <ExitConfirmationModal
        visible={showFinalDeleteConfirm}
        title="Are you absolutely sure?"
        message="All your wellness data will be permanently erased."
        confirmText="Yes, Delete All"
        cancelText="Cancel"
        onConfirm={performDeleteAccount}
        onCancel={() => setShowFinalDeleteConfirm(false)}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[4],
  },
  backButton: {
    transform: [{ rotate: '90deg' }],
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[10],
  },
  sectionLabel: {
    letterSpacing: 2,
    marginBottom: spacing[3],
  },
  formCard: {
    padding: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    letterSpacing: 1.5,
    marginBottom: spacing[2],
  },
  input: {
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    fontSize: 16,
    borderWidth: 1,
  },
  actionsSection: {
    marginTop: spacing[8],
  },
  dangerSection: {
    marginTop: spacing[8],
  },
  actionsList: {
    gap: spacing[3],
  },
  actionCard: {
    padding: spacing[4],
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  actionText: {
    flex: 1,
  },
  chevron: {
    transform: [{ rotate: '-90deg' }],
  },
  footerInfo: {
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EditProfileScreen;
