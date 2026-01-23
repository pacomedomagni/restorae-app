/**
 * useBiometrics Hook
 * 
 * Handles biometric authentication for sensitive features
 * Gracefully degrades if expo-local-authentication is not installed
 */
import { useCallback, useEffect, useState } from 'react';
import logger from '../services/logger';

// Dynamic import for expo-local-authentication
// Using any type since the package may not be installed
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  // Package not installed
}

// =============================================================================
// TYPES
// =============================================================================
export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

interface BiometricsState {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
}

interface UseBiometricsReturn extends BiometricsState {
  authenticate: (reason?: string) => Promise<boolean>;
  checkBiometrics: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================
export function useBiometrics(): UseBiometricsReturn {
  const [state, setState] = useState<BiometricsState>({
    isAvailable: false,
    biometricType: 'none',
    isEnrolled: false,
  });

  const checkBiometrics = useCallback(async () => {
    // If package not installed, biometrics not available
    if (!LocalAuthentication) {
      setState({
        isAvailable: false,
        biometricType: 'none',
        isEnrolled: false,
      });
      return;
    }

    try {
      // Check if hardware is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      
      if (!compatible) {
        setState({
          isAvailable: false,
          biometricType: 'none',
          isEnrolled: false,
        });
        return;
      }

      // Check if enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Get supported types
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      let biometricType: BiometricType = 'none';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'facial';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      setState({
        isAvailable: compatible,
        biometricType,
        isEnrolled: enrolled,
      });
    } catch (error) {
      logger.error('Failed to check biometrics:', error);
      setState({
        isAvailable: false,
        biometricType: 'none',
        isEnrolled: false,
      });
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkBiometrics();
  }, [checkBiometrics]);

  const authenticate = useCallback(async (reason = 'Authenticate to continue'): Promise<boolean> => {
    // If package not installed or biometrics not available, skip auth
    if (!LocalAuthentication || !state.isAvailable || !state.isEnrolled) {
      // If biometrics not available, consider it a pass (fallback to no auth)
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow PIN/password fallback
        fallbackLabel: 'Use Passcode',
      });

      return result.success;
    } catch (error) {
      logger.error('Biometric authentication failed:', error);
      return false;
    }
  }, [state.isAvailable, state.isEnrolled]);

  return {
    ...state,
    authenticate,
    checkBiometrics,
  };
}

// =============================================================================
// HELPER - Get friendly biometric name
// =============================================================================
export function getBiometricName(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return 'Face ID';
    case 'fingerprint':
      return 'Touch ID';
    case 'iris':
      return 'Iris Scan';
    default:
      return 'Biometrics';
  }
}
