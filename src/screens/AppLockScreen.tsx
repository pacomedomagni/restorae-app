/**
 * AppLockScreen
 * 
 * Full-screen lock screen requiring biometric/PIN to unlock
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLock } from '../contexts/AppLockContext';
import { useBiometrics } from '../hooks/useBiometrics';
import { useHaptics } from '../hooks/useHaptics';

const PIN_LENGTH = 4;

export default function AppLockScreen() {
  const { colors } = useTheme();
  const { lockMethod, verifyPin, unlock, isLocked } = useAppLock();
  const { authenticate, isAvailable: biometricsAvailable, biometricType } = useBiometrics();
  const { impactLight, notificationSuccess, notificationError } = useHaptics();
  
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showBiometricButton = 
    (lockMethod === 'biometric' || lockMethod === 'both') && 
    biometricsAvailable;

  const showPinPad = 
    lockMethod === 'pin' || 
    lockMethod === 'both' ||
    (lockMethod === 'biometric' && !biometricsAvailable);

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Try biometric on mount
    if (showBiometricButton && isLocked) {
      handleBiometricUnlock();
    }
  }, []);

  const handleBiometricUnlock = async () => {
    const success = await unlock();
    if (!success && lockMethod === 'biometric') {
      setError('Authentication failed. Please try again.');
    }
  };

  const handlePinInput = async (digit: string) => {
    if (pinInput.length >= PIN_LENGTH) return;
    
    await impactLight();
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      // Verify PIN
      setTimeout(async () => {
        if (verifyPin(newPin)) {
          await notificationSuccess();
          unlock();
        } else {
          await notificationError();
          shakeError();
          setAttempts(prev => prev + 1);
          setPinInput('');
          
          if (attempts >= 4) {
            setError('Too many attempts. Please wait.');
          } else {
            setError('Incorrect PIN. Please try again.');
          }
        }
      }, 100);
    }
  };

  const handleDelete = async () => {
    if (pinInput.length > 0) {
      await impactLight();
      setPinInput(pinInput.slice(0, -1));
    }
  };

  const shakeError = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(400);
    }
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const getBiometricIcon = (): string => {
    if (biometricType === 'facial') return 'face-recognition';
    return 'fingerprint';
  };

  const getBiometricLabel = () => {
    if (biometricType === 'facial') return 'Unlock with Face ID';
    return 'Unlock with Touch ID';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    lockIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.inkMuted,
      marginBottom: 40,
      textAlign: 'center',
    },
    pinDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 40,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      marginHorizontal: 8,
    },
    dotFilled: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    dotError: {
      borderColor: colors.accentDanger,
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
    keyPressed: {
      backgroundColor: colors.surfaceHover,
    },
    keyText: {
      fontSize: 28,
      fontWeight: '500',
      color: colors.ink,
    },
    keySubtext: {
      fontSize: 10,
      color: colors.inkMuted,
      marginTop: 2,
    },
    keyEmpty: {
      backgroundColor: 'transparent',
    },
    biometricButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      marginTop: 24,
    },
    biometricText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.accentPrimary,
      marginLeft: 12,
    },
    errorText: {
      fontSize: 14,
      color: colors.accentDanger,
      marginBottom: 16,
      textAlign: 'center',
    },
    logo: {
      marginBottom: 40,
    },
    logoText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.accentPrimary,
      letterSpacing: -0.5,
    },
  });

  const KEY_LETTERS: Record<string, string> = {
    '2': 'ABC',
    '3': 'DEF',
    '4': 'GHI',
    '5': 'JKL',
    '6': 'MNO',
    '7': 'PQRS',
    '8': 'TUV',
    '9': 'WXYZ',
  };

  const renderKey = (digit: string | null, special?: 'biometric' | 'delete') => {
    if (special === 'biometric') {
      if (!showBiometricButton) {
        return <View style={[styles.key, styles.keyEmpty]} />;
      }
      return (
        <TouchableOpacity
          style={styles.key}
          onPress={handleBiometricUnlock}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={getBiometricIcon() as any} 
            size={28} 
            color={colors.ink} 
          />
        </TouchableOpacity>
      );
    }

    if (special === 'delete') {
      return (
        <TouchableOpacity
          style={styles.key}
          onPress={handleDelete}
          onLongPress={() => setPinInput('')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="backspace-outline" 
            size={28} 
            color={colors.ink} 
          />
        </TouchableOpacity>
      );
    }

    if (!digit) {
      return <View style={[styles.key, styles.keyEmpty]} />;
    }

    return (
      <TouchableOpacity
        style={styles.key}
        onPress={() => handlePinInput(digit)}
        activeOpacity={0.7}
      >
        <Text style={styles.keyText}>{digit}</Text>
        {KEY_LETTERS[digit] && (
          <Text style={styles.keySubtext}>{KEY_LETTERS[digit]}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>Restorae</Text>
      </View>

      <View style={styles.lockIcon}>
        <MaterialCommunityIcons 
          name="lock" 
          size={40} 
          color={colors.accentPrimary} 
        />
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        {showPinPad ? 'Enter your PIN to unlock' : 'Use biometrics to unlock'}
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showPinPad && (
        <>
          <Animated.View 
            style={[
              styles.pinDots,
              { transform: [{ translateX: shakeAnim }] }
            ]}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  pinInput.length > i && styles.dotFilled,
                  error && styles.dotError,
                ]}
              />
            ))}
          </Animated.View>

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
              {renderKey(null, 'biometric')}
              {renderKey('0')}
              {renderKey(null, 'delete')}
            </View>
          </View>
        </>
      )}

      {!showPinPad && showBiometricButton && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricUnlock}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={getBiometricIcon() as any} 
            size={24} 
            color={colors.accentPrimary} 
          />
          <Text style={styles.biometricText}>{getBiometricLabel()}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
