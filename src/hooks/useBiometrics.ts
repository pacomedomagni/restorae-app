/**
 * useBiometrics - Biometric authentication wrapper
 *
 * Wraps expo-local-authentication for fingerprint/face authentication.
 * Used by JournalEntryScreen (encrypted entries) and SecuritySettingsScreen.
 */
import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

type BiometricType = 'facial' | 'fingerprint' | 'iris' | null;

interface UseBiometricsReturn {
  isAvailable: boolean;
  biometricType: BiometricType;
  authenticate: (promptMessage?: string) => Promise<boolean>;
}

export function useBiometrics(): UseBiometricsReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsAvailable(compatible && enrolled);

        if (compatible && enrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('facial');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
          } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType('iris');
          }
        }
      } catch {
        setIsAvailable(false);
      }
    };

    checkBiometrics();
  }, []);

  const authenticate = useCallback(
    async (promptMessage?: string): Promise<boolean> => {
      if (!isAvailable) return false;

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: promptMessage || 'Authenticate to continue',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        return result.success;
      } catch {
        return false;
      }
    },
    [isAvailable],
  );

  return { isAvailable, biometricType, authenticate };
}

export default useBiometrics;
