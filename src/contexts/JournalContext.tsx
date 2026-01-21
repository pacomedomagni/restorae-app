/**
 * JournalContext
 * 
 * Manages journal entries with optional encryption using expo-secure-store
 * Supports biometric lock for sensitive entries
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MoodType } from '../types';

// =============================================================================
// TYPES
// =============================================================================
export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  prompt?: string;
  mood?: MoodType;
  createdAt: string;
  updatedAt: string;
  isEncrypted: boolean;
  isLocked: boolean; // Requires biometric to view
  tags?: string[];
}

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  encryptionEnabled: boolean;
  biometricLockEnabled: boolean;
}

interface JournalContextType extends JournalState {
  createEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearAllEntries: () => Promise<void>;
  getEntry: (id: string) => JournalEntry | undefined;
  getDecryptedContent: (id: string) => Promise<string>;
  setEncryptionEnabled: (enabled: boolean) => Promise<void>;
  setBiometricLockEnabled: (enabled: boolean) => Promise<void>;
  searchEntries: (query: string) => JournalEntry[];
  getEntriesByMood: (mood: MoodType) => JournalEntry[];
  getRecentEntries: (limit?: number) => JournalEntry[];
  exportEntries: () => Promise<string>;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/journal';
const SETTINGS_KEY = '@restorae/journal_settings';
const ENCRYPTION_KEY_PREFIX = '@restorae/journal_enc_';

// =============================================================================
// ENCRYPTION HELPERS (Simplified - in production use @noble/ciphers)
// =============================================================================
// Note: For true security, integrate @noble/ciphers or similar
// This is a placeholder that demonstrates the architecture

async function encryptContent(content: string, entryId: string): Promise<string> {
  // In production: Use @noble/ciphers with a user-derived key
  // For now, store in SecureStore which provides hardware-backed encryption
  try {
    await SecureStore.setItemAsync(`${ENCRYPTION_KEY_PREFIX}${entryId}`, content);
    return `[ENCRYPTED:${entryId}]`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return content;
  }
}

async function decryptContent(encryptedMarker: string, entryId: string): Promise<string> {
  // Check if this is an encrypted marker
  if (!encryptedMarker.startsWith('[ENCRYPTED:')) {
    return encryptedMarker;
  }
  
  try {
    const content = await SecureStore.getItemAsync(`${ENCRYPTION_KEY_PREFIX}${entryId}`);
    return content || '';
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

async function deleteEncryptedContent(entryId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(`${ENCRYPTION_KEY_PREFIX}${entryId}`);
  } catch (error) {
    console.error('Failed to delete encrypted content:', error);
  }
}

// =============================================================================
// CONTEXT
// =============================================================================
const JournalContext = createContext<JournalContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function JournalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JournalState>({
    entries: [],
    isLoading: true,
    encryptionEnabled: false,
    biometricLockEnabled: false,
  });

  // Load journal data
  useEffect(() => {
    loadJournalData();
  }, []);

  const loadJournalData = async () => {
    try {
      const [entriesData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      const entries = entriesData ? JSON.parse(entriesData) : [];
      const settings = settingsData ? JSON.parse(settingsData) : {};

      setState({
        entries,
        isLoading: false,
        encryptionEnabled: settings.encryptionEnabled || false,
        biometricLockEnabled: settings.biometricLockEnabled || false,
      });
    } catch (error) {
      console.error('Failed to load journal data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveEntries = async (entries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

  const saveSettings = async (settings: { encryptionEnabled: boolean; biometricLockEnabled: boolean }) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Generate unique ID
  const generateId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new entry
  const createEntry = useCallback(async (
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<JournalEntry> => {
    const id = generateId();
    const now = new Date().toISOString();
    
    let content = entry.content;
    let isEncrypted = entry.isEncrypted;

    // Encrypt if encryption is enabled or specifically requested
    if (state.encryptionEnabled || entry.isEncrypted) {
      content = await encryptContent(entry.content, id);
      isEncrypted = true;
    }

    const newEntry: JournalEntry = {
      ...entry,
      id,
      content,
      isEncrypted,
      createdAt: now,
      updatedAt: now,
    };

    const updatedEntries = [newEntry, ...state.entries];
    setState(prev => ({ ...prev, entries: updatedEntries }));
    await saveEntries(updatedEntries);

    return newEntry;
  }, [state.entries, state.encryptionEnabled]);

  // Update entry
  const updateEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    const entryIndex = state.entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;

    const existingEntry = state.entries[entryIndex];
    let content = updates.content;
    let isEncrypted = updates.isEncrypted ?? existingEntry.isEncrypted;

    // Handle content encryption
    if (content !== undefined) {
      if (state.encryptionEnabled || isEncrypted) {
        content = await encryptContent(content, id);
        isEncrypted = true;
      }
    }

    const updatedEntry: JournalEntry = {
      ...existingEntry,
      ...updates,
      content: content ?? existingEntry.content,
      isEncrypted,
      updatedAt: new Date().toISOString(),
    };

    const updatedEntries = [...state.entries];
    updatedEntries[entryIndex] = updatedEntry;
    
    setState(prev => ({ ...prev, entries: updatedEntries }));
    await saveEntries(updatedEntries);
  }, [state.entries, state.encryptionEnabled]);

  // Delete entry
  const deleteEntry = useCallback(async (id: string) => {
    const entry = state.entries.find(e => e.id === id);
    if (entry?.isEncrypted) {
      await deleteEncryptedContent(id);
    }

    const updatedEntries = state.entries.filter(e => e.id !== id);
    setState(prev => ({ ...prev, entries: updatedEntries }));
    await saveEntries(updatedEntries);
  }, [state.entries]);

  // Clear all entries
  const clearAllEntries = useCallback(async () => {
    // Delete encrypted content for all encrypted entries
    for (const entry of state.entries) {
      if (entry.isEncrypted) {
        await deleteEncryptedContent(entry.id);
      }
    }
    setState(prev => ({ ...prev, entries: [] }));
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [state.entries]);

  // Get single entry
  const getEntry = useCallback((id: string): JournalEntry | undefined => {
    return state.entries.find(e => e.id === id);
  }, [state.entries]);

  // Get decrypted content
  const getDecryptedContent = useCallback(async (id: string): Promise<string> => {
    const entry = state.entries.find(e => e.id === id);
    if (!entry) return '';

    if (entry.isEncrypted) {
      return decryptContent(entry.content, id);
    }
    return entry.content;
  }, [state.entries]);

  // Toggle encryption
  const setEncryptionEnabled = useCallback(async (enabled: boolean) => {
    setState(prev => ({ ...prev, encryptionEnabled: enabled }));
    await saveSettings({ 
      encryptionEnabled: enabled, 
      biometricLockEnabled: state.biometricLockEnabled 
    });
  }, [state.biometricLockEnabled]);

  // Toggle biometric lock
  const setBiometricLockEnabled = useCallback(async (enabled: boolean) => {
    setState(prev => ({ ...prev, biometricLockEnabled: enabled }));
    await saveSettings({ 
      encryptionEnabled: state.encryptionEnabled, 
      biometricLockEnabled: enabled 
    });
  }, [state.encryptionEnabled]);

  // Search entries
  const searchEntries = useCallback((query: string): JournalEntry[] => {
    const lowerQuery = query.toLowerCase();
    return state.entries.filter(entry => 
      entry.title?.toLowerCase().includes(lowerQuery) ||
      (!entry.isEncrypted && entry.content.toLowerCase().includes(lowerQuery)) ||
      entry.prompt?.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [state.entries]);

  // Get entries by mood
  const getEntriesByMood = useCallback((mood: MoodType): JournalEntry[] => {
    return state.entries.filter(entry => entry.mood === mood);
  }, [state.entries]);

  // Get recent entries
  const getRecentEntries = useCallback((limit = 10): JournalEntry[] => {
    return state.entries.slice(0, limit);
  }, [state.entries]);

  // Export entries (for backup)
  const exportEntries = useCallback(async (): Promise<string> => {
    // Decrypt all entries for export
    const exportData = await Promise.all(
      state.entries.map(async (entry) => ({
        ...entry,
        content: entry.isEncrypted 
          ? await decryptContent(entry.content, entry.id) 
          : entry.content,
        isEncrypted: false,
      }))
    );
    return JSON.stringify(exportData, null, 2);
  }, [state.entries]);

  const value = useMemo<JournalContextType>(() => ({
    ...state,
    createEntry,
    updateEntry,
    deleteEntry,
    clearAllEntries,
    getEntry,
    getDecryptedContent,
    setEncryptionEnabled,
    setBiometricLockEnabled,
    searchEntries,
    getEntriesByMood,
    getRecentEntries,
    exportEntries,
  }), [
    state, createEntry, updateEntry, deleteEntry, clearAllEntries, getEntry,
    getDecryptedContent, setEncryptionEnabled, setBiometricLockEnabled,
    searchEntries, getEntriesByMood, getRecentEntries, exportEntries
  ]);

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}
