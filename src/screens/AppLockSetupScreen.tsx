/**
 * AppLockSetupScreen
 * 
 * Setup and configure app lock with PIN or biometric
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLock, LockMethod } from '../contexts/AppLockContext';
import { useBiometrics } from '../hooks/useBiometrics';
import { useHaptics } from '../hooks/useHaptics';
import { ScreenHeader, GlassCard, AmbientBackground } from '../components/ui';
import { spacing, layout } from '../theme';

const PIN_LENGTH = 4;

export default function AppLockSetupScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { 
    isEnabled, 
    lockMethod, 
    lockOnBackground, 
    lockTimeout,
    enableLock, 
    disableLock, 
    setPin, 
    setLockOnBackground, 
    setLockTimeout 
  } = useAppLock();
  const { isAvailable: biometricsAvailable, biometricType } = useBiometrics();
  const { impactLight, notificationSuccess } = useHaptics();

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleToggleLock = async (value: boolean) => {
    await impactLight();
    
    if (value) {
      // Enable lock - show PIN setup
      if (biometricsAvailable) {
        Alert.alert(
          'Choose Lock Method',
          'How would you like to secure your app?',
          [
            { text: 'Biometric Only', onPress: () => enableLock('biometric') },
            { text: 'PIN Only', onPress: () => setShowPinSetup(true) },
            { text: 'Both', onPress: () => setShowPinSetup(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        setShowPinSetup(true);
      }
    } else {
      // Disable lock
      await disableLock();
    }
  };

  const handlePinInput = async (digit: string) => {
    await impactLight();
    const currentInput = step === 'enter' ? pinInput : confirmPin;
    
    if (currentInput.length >= PIN_LENGTH) return;
    
    const newInput = currentInput + digit;
    
    if (step === 'enter') {
      setPinInput(newInput);
      if (newInput.length === PIN_LENGTH) {
        setStep('confirm');
      }
    } else {
      setConfirmPin(newInput);
      if (newInput.length === PIN_LENGTH) {
        // Verify PINs match
        if (newInput === pinInput) {
          await setPin(pinInput);
          await enableLock(biometricsAvailable ? 'both' : 'pin');
          await notificationSuccess();
          setShowPinSetup(false);
          setPinInput('');
          setConfirmPin('');
          setStep('enter');
        } else {
          Alert.alert('PINs Don\'t Match', 'Please try again.');
          setPinInput('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    }
  };

  const handlePinDelete = async () => {
    await impactLight();
    if (step === 'enter' && pinInput.length > 0) {
      setPinInput(pinInput.slice(0, -1));
    } else if (step === 'confirm' && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const cancelPinSetup = () => {
    setShowPinSetup(false);
    setPinInput('');
    setConfirmPin('');
    setStep('enter');
  };

  const handleTimeoutChange = async (timeout: number) => {
    await impactLight();
    await setLockTimeout(timeout);
  };

  const TIMEOUT_OPTIONS = [
    { label: 'Immediately', value: 0 },
    { label: '15 seconds', value: 15 },
    { label: '1 minute', value: 60 },
    { label: '5 minutes', value: 300 },
  ];

  const getBiometricLabel = () => {
    if (biometricType === 'facial') return 'Face ID';
    return 'Touch ID';
  };

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
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing[4],
    },
    settingLabel: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.inkMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    lockMethodBadge: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 12,
    },
    lockMethodText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accentPrimary,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing[3],
    },
    optionLabel: {
      fontSize: 16,
      color: colors.ink,
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioButtonSelected: {
      borderColor: colors.accentPrimary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accentPrimary,
    },
    // PIN Setup Overlay
    pinOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.canvas,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    pinTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: 8,
    },
    pinSubtitle: {
      fontSize: 16,
      color: colors.inkMuted,
      marginBottom: 40,
    },
    pinDots: {
      flexDirection: 'row',
      marginBottom: 40,
    },
    pinDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      marginHorizontal: 8,
    },
    pinDotFilled: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    keypad: {
      width: '100%',
      maxWidth: 300,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    key: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyText: {
      fontSize: 28,
      fontWeight: '500',
      color: colors.ink,
    },
    keyEmpty: {
      backgroundColor: 'transparent',
    },
    cancelButton: {
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    cancelText: {
      fontSize: 16,
      color: colors.inkMuted,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.inkFaint,
      letterSpacing: 1,
      marginTop: spacing[6],
      marginBottom: spacing[3],
    },
  });

  const currentPinInput = step === 'enter' ? pinInput : confirmPin;

  const renderKey = (digit: string | null, special?: 'delete') => {
    if (special === 'delete') {
      return (
        <TouchableOpacity style={styles.key} onPress={handlePinDelete}>
          <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.ink} />
        </TouchableOpacity>
      );
    }

    if (!digit) {
      return <View style={[styles.key, styles.keyEmpty]} />;
    }

    return (
      <TouchableOpacity style={styles.key} onPress={() => handlePinInput(digit)}>
        <Text style={styles.keyText}>{digit}</Text>
      </TouchableOpacity>
    );
  };

  if (showPinSetup) {
    return (
      <View style={styles.pinOverlay}>
        <Text style={styles.pinTitle}>
          {step === 'enter' ? 'Create PIN' : 'Confirm PIN'}
        </Text>
        <Text style={styles.pinSubtitle}>
          {step === 'enter' ? 'Enter a 4-digit PIN' : 'Re-enter your PIN'}
        </Text>

        <View style={styles.pinDots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                currentPinInput.length > i && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            {renderKey('1')}
            {renderKey('2')}
            {renderKey('3')}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('4')}
            {renderKey('5')}
            {renderKey('6')}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('7')}
            {renderKey('8')}
            {renderKey('9')}
          </View>
          <View style={styles.keypadRow}>
            {renderKey(null)}
            {renderKey('0')}
            {renderKey(null, 'delete')}
          </View>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={cancelPinSetup}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <ScreenHeader title="App Lock" subtitle="Secure your private data" compact />

          <GlassCard variant="default" padding="lg">
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text style={styles.settingTitle}>Enable App Lock</Text>
                <Text style={styles.settingDescription}>
                  Require authentication to open Restorae
                </Text>
              </View>
              {isEnabled && (
                <View style={styles.lockMethodBadge}>
                  <Text style={styles.lockMethodText}>
                    {lockMethod === 'biometric' ? getBiometricLabel() : 
                     lockMethod === 'pin' ? 'PIN' : 
                     `${getBiometricLabel()} + PIN`}
                  </Text>
                </View>
              )}
              <Switch
                value={isEnabled}
                onValueChange={handleToggleLock}
                trackColor={{ false: colors.border, true: colors.accentPrimary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GlassCard>

          {isEnabled && (
            <>
              <Text style={styles.sectionTitle}>LOCK SETTINGS</Text>
              
              <GlassCard variant="subtle" padding="lg">
                <View style={styles.settingRow}>
                  <View style={styles.settingLabel}>
                    <Text style={styles.settingTitle}>Lock on Background</Text>
                    <Text style={styles.settingDescription}>
                      Lock when switching apps
                    </Text>
                  </View>
                  <Switch
                    value={lockOnBackground}
                    onValueChange={setLockOnBackground}
                    trackColor={{ false: colors.border, true: colors.accentPrimary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </GlassCard>

              <Text style={styles.sectionTitle}>LOCK TIMEOUT</Text>
              
              <GlassCard variant="subtle" padding="lg">
                {TIMEOUT_OPTIONS.map((option, index) => (
                  <React.Fragment key={option.value}>
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() => handleTimeoutChange(option.value)}
                    >
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <View style={[
                        styles.radioButton,
                        lockTimeout === option.value && styles.radioButtonSelected
                      ]}>
                        {lockTimeout === option.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </TouchableOpacity>
                    {index < TIMEOUT_OPTIONS.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </GlassCard>
            </>
          )}

          <View style={{ height: layout.tabBarHeight }} />
        </View>
      </SafeAreaView>
    </View>
  );
}
