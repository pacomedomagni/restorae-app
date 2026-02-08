import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PreferencesState = {
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
  breathingTonesEnabled: boolean;
  breathingAmbientEnabled: boolean;
};

type PreferencesContextType = PreferencesState & {
  setHapticsEnabled: (value: boolean) => void;
  setSoundsEnabled: (value: boolean) => void;
  setBreathingTonesEnabled: (value: boolean) => void;
  setBreathingAmbientEnabled: (value: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = '@restorae/preferences';

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreferencesState>({
    hapticsEnabled: true,
    soundsEnabled: true,
    breathingTonesEnabled: true,
    breathingAmbientEnabled: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<PreferencesState>;
          setState((prev) => ({
            hapticsEnabled: parsed.hapticsEnabled ?? prev.hapticsEnabled,
            soundsEnabled: parsed.soundsEnabled ?? prev.soundsEnabled,
            breathingTonesEnabled: parsed.breathingTonesEnabled ?? prev.breathingTonesEnabled,
            breathingAmbientEnabled: parsed.breathingAmbientEnabled ?? prev.breathingAmbientEnabled,
          }));
        } catch {
          // Ignore corrupted state
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = async (next: PreferencesState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setHapticsEnabled = (value: boolean) => {
    const next = { ...state, hapticsEnabled: value };
    persist(next);
  };

  const setSoundsEnabled = (value: boolean) => {
    const next = { ...state, soundsEnabled: value };
    persist(next);
  };

  const setBreathingTonesEnabled = (value: boolean) => {
    const next = { ...state, breathingTonesEnabled: value };
    persist(next);
  };

  const setBreathingAmbientEnabled = (value: boolean) => {
    const next = { ...state, breathingAmbientEnabled: value };
    persist(next);
  };

  const value = useMemo<PreferencesContextType>(
    () => ({
      ...state,
      setHapticsEnabled,
      setSoundsEnabled,
      setBreathingTonesEnabled,
      setBreathingAmbientEnabled,
    }),
    [state],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
