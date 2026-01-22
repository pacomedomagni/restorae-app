/**
 * AppLockContext
 * 
 * Manages app-wide biometric/PIN lock functionality
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useBiometrics } from '../hooks/useBiometrics';

// =============================================================================
// TYPES
// =============================================================================
export type LockMethod = 'biometric' | 'pin' | 'both' | 'none';

interface AppLockState {
  isEnabled: boolean;
  lockMethod: LockMethod;
  lockOnBackground: boolean;
  lockTimeout: number; // seconds, 0 = immediate
  isLocked: boolean;
  pin: string | null;
}

interface AppLockContextType extends AppLockState {
  enableLock: (method: LockMethod) => Promise<void>;
  disableLock: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  setLockTimeout: (seconds: number) => Promise<void>;
  setLockOnBackground: (enabled: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
  lock: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/app_lock';
const PIN_KEY = '@restorae/app_lock_pin';

const DEFAULT_STATE: AppLockState = {
  isEnabled: false,
  lockMethod: 'none',
  lockOnBackground: true,
  lockTimeout: 15, // Default 15s grace period
  isLocked: false,
  pin: null,
};

// =============================================================================
// CONTEXT
// =============================================================================
const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function AppLockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppLockState>(DEFAULT_STATE);
  const [lastBackground, setLastBackground] = useState<number | null>(null);
  const { authenticate, isAvailable: biometricsAvailable } = useBiometrics();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!state.isEnabled || !state.lockOnBackground) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setLastBackground(Date.now());
      } else if (nextAppState === 'active' && lastBackground) {
        const elapsed = (Date.now() - lastBackground) / 1000;
        if (elapsed >= state.lockTimeout) {
          setState(prev => ({ ...prev, isLocked: true }));
        }
        setLastBackground(null);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [state.isEnabled, state.lockOnBackground, state.lockTimeout, lastBackground]);

  const loadSettings = async () => {
    try {
      const [settingsData, pinData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PIN_KEY),
      ]);

      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setState(prev => ({
          ...prev,
          ...settings,
          pin: pinData,
          // Start locked if lock is enabled
          isLocked: settings.isEnabled,
        }));
      }
    } catch (error) {
      console.error('Failed to load app lock settings:', error);
    }
  };

  const saveSettings = async (newState: Partial<AppLockState>) => {
    try {
      const toSave = { ...state, ...newState };
      // Don't persist isLocked or pin in main settings
      const { isLocked, pin, ...settingsToSave } = toSave;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Failed to save app lock settings:', error);
    }
  };

  const enableLock = useCallback(async (method: LockMethod) => {
    const newState = { isEnabled: true, lockMethod: method };
    setState(prev => ({ ...prev, ...newState }));
    await saveSettings(newState);
  }, []);

  const disableLock = useCallback(async () => {
    const newState = { isEnabled: false, lockMethod: 'none' as LockMethod, isLocked: false };
    setState(prev => ({ ...prev, ...newState }));
    await saveSettings(newState);
    await AsyncStorage.removeItem(PIN_KEY);
  }, []);

  const setPin = useCallback(async (pin: string) => {
    // In production, hash the PIN before storing
    await AsyncStorage.setItem(PIN_KEY, pin);
    setState(prev => ({ ...prev, pin }));
  }, []);

  const verifyPin = useCallback((inputPin: string): boolean => {
    return inputPin === state.pin;
  }, [state.pin]);

  const setLockTimeout = useCallback(async (seconds: number) => {
    const newState = { lockTimeout: seconds };
    setState(prev => ({ ...prev, ...newState }));
    await saveSettings(newState);
  }, []);

  const setLockOnBackground = useCallback(async (enabled: boolean) => {
    const newState = { lockOnBackground: enabled };
    setState(prev => ({ ...prev, ...newState }));
    await saveSettings(newState);
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!state.isEnabled) {
      setState(prev => ({ ...prev, isLocked: false }));
      return true;
    }

    // Try biometric first if enabled
    if (
      (state.lockMethod === 'biometric' || state.lockMethod === 'both') &&
      biometricsAvailable
    ) {
      const success = await authenticate('Unlock Restorae');
      if (success) {
        setState(prev => ({ ...prev, isLocked: false }));
        return true;
      }
    }

    // If biometric-only and failed, return false
    if (state.lockMethod === 'biometric') {
      return false;
    }

    // For PIN or both methods, return false to show PIN screen
    return false;
  }, [state.isEnabled, state.lockMethod, biometricsAvailable, authenticate]);

  const lock = useCallback(() => {
    if (state.isEnabled) {
      setState(prev => ({ ...prev, isLocked: true }));
    }
  }, [state.isEnabled]);

  const value = useMemo(() => ({
    ...state,
    enableLock,
    disableLock,
    setPin,
    verifyPin,
    setLockTimeout,
    setLockOnBackground,
    unlock,
    lock,
  }), [
    state,
    enableLock,
    disableLock,
    setPin,
    verifyPin,
    setLockTimeout,
    setLockOnBackground,
    unlock,
    lock,
  ]);

  return (
    <AppLockContext.Provider value={value}>
      {children}
    </AppLockContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}

export default AppLockContext;
