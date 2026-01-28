/**
 * SecuritySettingsScreen
 * 
 * Centralized security settings for journal encryption,
 * biometric lock, and privacy controls.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../contexts/JournalContext';
import { useHaptics } from '../hooks/useHaptics';
import { useBiometrics } from '../hooks/useBiometrics';
import {
  Text,
  GlassCard,
  AmbientBackground,
  ScreenHeader,
} from '../components/ui';
import { spacing, layout, borderRadius, withAlpha } from '../theme';
import { RootStackParamList } from '../types';

// =============================================================================
// SETTING ROW COMPONENT
// =============================================================================
interface SettingRowProps {
  title: string;
  description: string;
  icon: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingRow({ title, description, icon, value, onValueChange, disabled }: SettingRowProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: withAlpha(colors.accentPrimary, 0.1) }]}>
        <Text style={styles.iconEmoji}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text variant="bodyLarge" color={disabled ? 'inkMuted' : 'ink'}>
          {title}
        </Text>
        <Text variant="bodySmall" color="inkMuted" style={styles.settingDescription}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.canvasElevated, true: colors.accentPrimary }}
        thumbColor={colors.canvas}
        ios_backgroundColor={colors.canvasElevated}
      />
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================
export function SecuritySettingsScreen() {
  const { colors, reduceMotion } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { impactLight, notificationSuccess } = useHaptics();
  const { 
    encryptionEnabled, 
    biometricLockEnabled, 
    setEncryptionEnabled, 
    setBiometricLockEnabled,
    entries,
  } = useJournal();
  const { isAvailable: biometricsAvailable, biometricType } = useBiometrics();
  
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEncryptionToggle = useCallback(async (enabled: boolean) => {
    await impactLight();
    
    if (enabled && entries.length > 0) {
      Alert.alert(
        'Enable Encryption',
        `This will encrypt all ${entries.length} existing journal entries. New entries will also be encrypted automatically.\n\nEncrypted entries are stored securely on your device and cannot be read without your device credentials.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              setIsUpdating(true);
              try {
                await setEncryptionEnabled(true);
                await notificationSuccess();
                Alert.alert('Encryption Enabled', 'Your journal entries are now encrypted.');
              } catch (error) {
                Alert.alert('Error', 'Failed to enable encryption. Please try again.');
              } finally {
                setIsUpdating(false);
              }
            },
          },
        ]
      );
    } else if (!enabled) {
      Alert.alert(
        'Disable Encryption',
        'Are you sure you want to disable encryption? Your journal entries will no longer be encrypted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setIsUpdating(true);
              try {
                await setEncryptionEnabled(false);
              } catch (error) {
                Alert.alert('Error', 'Failed to disable encryption.');
              } finally {
                setIsUpdating(false);
              }
            },
          },
        ]
      );
    } else {
      await setEncryptionEnabled(enabled);
    }
  }, [impactLight, entries.length, setEncryptionEnabled, notificationSuccess]);

  const handleBiometricToggle = useCallback(async (enabled: boolean) => {
    await impactLight();
    
    if (enabled && !biometricsAvailable) {
      Alert.alert(
        'Biometrics Unavailable',
        'Your device does not support biometric authentication or it is not set up.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await setBiometricLockEnabled(enabled);
      if (enabled) {
        await notificationSuccess();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings.');
    }
  }, [impactLight, biometricsAvailable, setBiometricLockEnabled, notificationSuccess]);

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'facial': return 'Face ID';
      case 'fingerprint': return 'Touch ID / Fingerprint';
      case 'iris': return 'Iris Recognition';
      default: return 'Biometric Lock';
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground variant="calm" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(600)}>
            <ScreenHeader
              title="Security & Privacy"
              subtitle="Protect your personal data"
              compact
            />
          </Animated.View>

          {/* Journal Encryption Section */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(400)}
          >
            <GlassCard variant="elevated" padding="lg">
              <Text variant="labelSmall" color="inkFaint" style={styles.sectionLabel}>
                JOURNAL PROTECTION
              </Text>
              
              <SettingRow
                title="Encrypt Journal Entries"
                description="Encrypt all journal content using secure device storage"
                icon="🔐"
                value={encryptionEnabled}
                onValueChange={handleEncryptionToggle}
                disabled={isUpdating}
              />
              
              <View style={[styles.divider, { backgroundColor: withAlpha(colors.ink, 0.08) }]} />
              
              <SettingRow
                title={getBiometricLabel()}
                description="Require biometric authentication to view journal entries"
                icon="👤"
                value={biometricLockEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricsAvailable}
              />
            </GlassCard>
          </Animated.View>

          {/* Info Card */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(400)}
          >
            <GlassCard variant="default" padding="lg">
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🛡️</Text>
                <View style={styles.infoContent}>
                  <Text variant="bodyMedium" color="ink">
                    Your Privacy Matters
                  </Text>
                  <Text variant="bodySmall" color="inkMuted" style={styles.infoDescription}>
                    When encryption is enabled, your journal entries are encrypted using AES-256 
                    and stored in your device's secure enclave. Even if someone accesses your device, 
                    they cannot read your private thoughts without your biometric authentication.
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Status Card */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(400)}
          >
            <GlassCard variant="default" padding="md">
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusIcon}>
                    {encryptionEnabled ? '✅' : '⚪'}
                  </Text>
                  <Text variant="labelSmall" color="inkMuted">
                    Encryption
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusIcon}>
                    {biometricLockEnabled ? '✅' : '⚪'}
                  </Text>
                  <Text variant="labelSmall" color="inkMuted">
                    Biometric
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusIcon}>✅</Text>
                  <Text variant="labelSmall" color="inkMuted">
                    Local Storage
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(400)}
          >
            <Text variant="labelSmall" color="inkMuted" align="center" style={styles.footerText}>
              Your data is stored locally on your device by default.{'\n'}
              We never sell or share your personal information.
            </Text>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[3],
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingDescription: {
    marginTop: spacing[1],
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoDescription: {
    marginTop: spacing[2],
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  statusIcon: {
    fontSize: 20,
  },
  footerText: {
    marginTop: spacing[2],
    lineHeight: 18,
  },
});

export default SecuritySettingsScreen;
