/**
 * JournalContext
 * 
 * Manages journal entries with optional encryption using expo-secure-store.
 * Features offline-first architecture with automatic sync to backend.
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { syncQueue, SyncOperation } from '../services/syncQueue';
import { MoodType } from '../types';
import logger from '../services/logger';

// =============================================================================
// TYPES
// =============================================================================
export interface JournalEntry {
  id: string;
  serverId?: string;
  title?: string;
  content: string;
  prompt?: string;
  mood?: MoodType;
  createdAt: string;
  updatedAt: string;
  isEncrypted: boolean;
  isLocked: boolean;
  tags?: string[];
  isSynced?: boolean;
}

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  isSyncing: boolean;
  encryptionEnabled: boolean;
  biometricLockEnabled: boolean;
  lastSyncedAt: string | null;
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
  syncWithServer: () => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = '@restorae/journal';
const SETTINGS_KEY = '@restorae/journal_settings';
const LAST_SYNC_KEY = '@restorae/journal_last_sync';
const ENCRYPTION_KEY_PREFIX = '@restorae/journal_enc_';

// =============================================================================
// ENCRYPTION HELPERS
// =============================================================================
async function encryptContent(content: string, entryId: string): Promise<string> {
  try {
    await SecureStore.setItemAsync(`${ENCRYPTION_KEY_PREFIX}${entryId}`, content);
    return `[ENCRYPTED:${entryId}]`;
  } catch (error) {
    logger.error('Encryption failed:', error);
    return content;
  }
}

async function decryptContent(encryptedMarker: string, entryId: string): Promise<string> {
  if (!encryptedMarker.startsWith('[ENCRYPTED:')) return encryptedMarker;
  try {
    const content = await SecureStore.getItemAsync(`${ENCRYPTION_KEY_PREFIX}${entryId}`);
    return content || '';
  } catch (error) {
    logger.error('Decryption failed:', error);
    return '';
  }
}

async function deleteEncryptedContent(entryId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(`${ENCRYPTION_KEY_PREFIX}${entryId}`);
  } catch (error) {
    logger.error('Failed to delete encrypted content:', error);
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
    isSyncing: false,
    encryptionEnabled: false,
    biometricLockEnabled: false,
    lastSyncedAt: null,
  });
  const syncInProgress = useRef(false);

  useEffect(() => { loadJournalData(); }, []);

  // Set up sync queue processor
  useEffect(() => {
    const processJournalOps = async (op: SyncOperation): Promise<{ success: boolean; serverId?: string }> => {
      if (op.entity !== 'journal') return { success: true };
      try {
        switch (op.type) {
          case 'create':
            const res = await api.createJournalEntry({
              content: op.data.content,
              promptId: op.data.promptId,
              mood: op.data.mood?.toUpperCase(),
              tags: op.data.tags,
              isPrivate: op.data.isPrivate,
            });
            setState(prev => ({
              ...prev,
              entries: prev.entries.map(e => e.id === op.data.localId ? { ...e, serverId: res.id, isSynced: true } : e),
            }));
            return { success: true, serverId: res.id };
          case 'update':
            if (op.data.serverId) {
              await api.updateJournalEntry(op.data.serverId, {
                content: op.data.content,
                mood: op.data.mood?.toUpperCase(),
                tags: op.data.tags,
                isPrivate: op.data.isPrivate,
              });
            }
            return { success: true };
          case 'delete':
            if (op.data.serverId) await api.deleteJournalEntry(op.data.serverId);
            return { success: true };
          default: return { success: true };
        }
      } catch (error: any) {
        if (error.response?.status === 404) return { success: true };
        return { success: false };
      }
    };
    syncQueue.processQueue(processJournalOps);
  }, []);

  // Listen for network changes
  useEffect(() => {
    const unsub = NetInfo.addEventListener((netState) => {
      if (netState.isConnected && netState.isInternetReachable && !syncInProgress.current) {
        syncWithServer();
      }
    });
    return () => unsub();
  }, []);

  const loadJournalData = async () => {
    try {
      const [entriesData, settingsData, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(LAST_SYNC_KEY),
      ]);
      const entries = entriesData ? JSON.parse(entriesData) : [];
      const settings = settingsData ? JSON.parse(settingsData) : {};
      setState({
        entries,
        isLoading: false,
        isSyncing: false,
        encryptionEnabled: settings.encryptionEnabled || false,
        biometricLockEnabled: settings.biometricLockEnabled || false,
        lastSyncedAt: lastSync,
      });
      syncWithServer();
    } catch (error) {
      logger.error('Failed to load journal data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveEntries = async (entries: JournalEntry[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
    catch (error) { logger.error('Failed to save entries:', error); }
  };

  const saveSettings = async (settings: { encryptionEnabled: boolean; biometricLockEnabled: boolean }) => {
    try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch (error) { logger.error('Failed to save settings:', error); }
  };

  const syncWithServer = useCallback(async () => {
    if (syncInProgress.current || state.isSyncing) return;
    
    // Check if user is authenticated before syncing
    const hasToken = await api.hasValidToken();
    if (!hasToken) return;
    
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) return;
    syncInProgress.current = true;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      const serverEntries = await api.getJournalEntries({ limit: 500 });
      // Ensure we have an array
      const entries = Array.isArray(serverEntries) ? serverEntries : [];
      const localData = await AsyncStorage.getItem(STORAGE_KEY);
      const localEntries: JournalEntry[] = localData ? JSON.parse(localData) : [];
      const localByServerId = new Map(localEntries.filter(e => e.serverId).map(e => [e.serverId, e]));
      const mergedEntries: JournalEntry[] = [];
      entries.forEach((se: any) => {
        const le = localByServerId.get(se.id);
        mergedEntries.push({
          id: le?.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serverId: se.id,
          title: se.title,
          content: se.content,
          prompt: se.promptId,
          mood: se.mood?.toLowerCase() as MoodType,
          createdAt: se.createdAt,
          updatedAt: se.updatedAt || se.createdAt,
          isEncrypted: le?.isEncrypted || false,
          isLocked: le?.isLocked || false,
          tags: se.tags || [],
          isSynced: true,
        });
      });
      localEntries.forEach(le => { if (!le.serverId && !le.isSynced) mergedEntries.push(le); });
      mergedEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setState(prev => ({ ...prev, entries: mergedEntries, isSyncing: false, lastSyncedAt: new Date().toISOString() }));
      await saveEntries(mergedEntries);
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      logger.error('Failed to sync journal data:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    } finally {
      syncInProgress.current = false;
    }
  }, [state.isSyncing]);

  const generateId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> => {
    const id = generateId();
    const now = new Date().toISOString();
    let content = entry.content;
    let isEncrypted = entry.isEncrypted;
    if (state.encryptionEnabled || entry.isEncrypted) {
      content = await encryptContent(entry.content, id);
      isEncrypted = true;
    }
    const newEntry: JournalEntry = { ...entry, id, content, isEncrypted, createdAt: now, updatedAt: now, isSynced: false };
    const updatedEntries = [newEntry, ...state.entries];
    setState(prev => ({ ...prev, entries: updatedEntries }));
    await saveEntries(updatedEntries);
    
    // Sync with server
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      try {
        const originalContent = isEncrypted ? entry.content : content;
        const res = await api.createJournalEntry({
          content: originalContent,
          promptId: entry.prompt,
          mood: entry.mood?.toUpperCase(),
          tags: entry.tags,
          isPrivate: entry.isLocked,
        });
        const syncedEntry = { ...newEntry, serverId: res.id, isSynced: true };
        const finalEntries = updatedEntries.map(e => e.id === id ? syncedEntry : e);
        setState(prev => ({ ...prev, entries: finalEntries }));
        await saveEntries(finalEntries);
        return syncedEntry;
      } catch (error) {
        logger.error('Failed to sync journal entry:', error);
        await syncQueue.addToQueue({ type: 'create', entity: 'journal', data: { localId: id, content: entry.content, promptId: entry.prompt, mood: entry.mood, tags: entry.tags, isPrivate: entry.isLocked } });
      }
    } else {
      await syncQueue.addToQueue({ type: 'create', entity: 'journal', data: { localId: id, content: entry.content, promptId: entry.prompt, mood: entry.mood, tags: entry.tags, isPrivate: entry.isLocked } });
    }
    return newEntry;
  }, [state.entries, state.encryptionEnabled]);

  const updateEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    const entryIndex = state.entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    const existingEntry = state.entries[entryIndex];
    let content = updates.content;
    let isEncrypted = updates.isEncrypted ?? existingEntry.isEncrypted;
    if (content !== undefined && (state.encryptionEnabled || isEncrypted)) {
      content = await encryptContent(content, id);
      isEncrypted = true;
    }
    const updatedEntry: JournalEntry = { ...existingEntry, ...updates, content: content ?? existingEntry.content, isEncrypted, updatedAt: new Date().toISOString(), isSynced: false };
    const updatedEntries = [...state.entries];
    updatedEntries[entryIndex] = updatedEntry;
    setState(prev => ({ ...prev, entries: updatedEntries }));
    await saveEntries(updatedEntries);
    
    if (existingEntry.serverId) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        try {
          await api.updateJournalEntry(existingEntry.serverId, {
            content: updates.content,
            mood: updates.mood?.toUpperCase(),
            tags: updates.tags,
            isPrivate: updates.isLocked,
          });
          updatedEntries[entryIndex] = { ...updatedEntry, isSynced: true };
          setState(prev => ({ ...prev, entries: [...updatedEntries] }));
          await saveEntries(updatedEntries);
        } catch (error) {
          await syncQueue.addToQueue({ type: 'update', entity: 'journal', data: { serverId: existingEntry.serverId, ...updates } });
        }
      } else {
        await syncQueue.addToQueue({ type: 'update', entity: 'journal', data: { serverId: existingEntry.serverId, ...updates } });
      }
    }
  }, [state.entries, state.encryptionEnabled]);

  const deleteEntry = useCallback(async (id: string) => {
    const entry = state.entries.find(e => e.id === id);
    if (!entry) return;
    if (entry.isEncrypted) await deleteEncryptedContent(id);
    const updatedEntries = state.entries.filter(e => e.id !== id);
    setState(prev => ({ ...prev, entries: updatedEntries }));
    await saveEntries(updatedEntries);
    
    if (entry.serverId) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        try { await api.deleteJournalEntry(entry.serverId); }
        catch (error) { await syncQueue.addToQueue({ type: 'delete', entity: 'journal', data: { serverId: entry.serverId } }); }
      } else {
        await syncQueue.addToQueue({ type: 'delete', entity: 'journal', data: { serverId: entry.serverId } });
      }
    }
  }, [state.entries]);

  const clearAllEntries = useCallback(async () => {
    for (const entry of state.entries) {
      if (entry.isEncrypted) await deleteEncryptedContent(entry.id);
    }
    setState(prev => ({ ...prev, entries: [] }));
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [state.entries]);

  const getEntry = useCallback((id: string): JournalEntry | undefined => state.entries.find(e => e.id === id), [state.entries]);
  const getDecryptedContent = useCallback(async (id: string): Promise<string> => {
    const entry = state.entries.find(e => e.id === id);
    if (!entry) return '';
    return entry.isEncrypted ? decryptContent(entry.content, id) : entry.content;
  }, [state.entries]);
  
  const setEncryptionEnabled = useCallback(async (enabled: boolean) => {
    setState(prev => ({ ...prev, encryptionEnabled: enabled }));
    await saveSettings({ encryptionEnabled: enabled, biometricLockEnabled: state.biometricLockEnabled });
    
    // Encrypt or decrypt existing entries
    if (enabled) {
      // Encrypt all unencrypted entries
      const updatedEntries = await Promise.all(
        state.entries.map(async (entry) => {
          if (!entry.isEncrypted) {
            const encryptedContent = await encryptContent(entry.content, entry.id);
            return { ...entry, content: encryptedContent, isEncrypted: true };
          }
          return entry;
        })
      );
      setState(prev => ({ ...prev, entries: updatedEntries }));
      await saveEntries(updatedEntries);
    } else {
      // Decrypt all encrypted entries
      const updatedEntries = await Promise.all(
        state.entries.map(async (entry) => {
          if (entry.isEncrypted) {
            const decryptedContent = await decryptContent(entry.content, entry.id);
            // Delete the encrypted content from SecureStore
            await deleteEncryptedContent(entry.id);
            return { ...entry, content: decryptedContent, isEncrypted: false };
          }
          return entry;
        })
      );
      setState(prev => ({ ...prev, entries: updatedEntries }));
      await saveEntries(updatedEntries);
    }
  }, [state.biometricLockEnabled, state.entries]);
  
  const setBiometricLockEnabled = useCallback(async (enabled: boolean) => {
    setState(prev => ({ ...prev, biometricLockEnabled: enabled }));
    await saveSettings({ encryptionEnabled: state.encryptionEnabled, biometricLockEnabled: enabled });
  }, [state.encryptionEnabled]);
  const searchEntries = useCallback((query: string): JournalEntry[] => {
    const lowerQuery = query.toLowerCase();
    return state.entries.filter(entry => 
      entry.title?.toLowerCase().includes(lowerQuery) ||
      (!entry.isEncrypted && entry.content.toLowerCase().includes(lowerQuery)) ||
      entry.prompt?.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [state.entries]);
  const getEntriesByMood = useCallback((mood: MoodType): JournalEntry[] => state.entries.filter(entry => entry.mood === mood), [state.entries]);
  const getRecentEntries = useCallback((limit = 10): JournalEntry[] => state.entries.slice(0, limit), [state.entries]);
  const exportEntries = useCallback(async (): Promise<string> => {
    const exportData = await Promise.all(
      state.entries.map(async (entry) => ({
        ...entry,
        content: entry.isEncrypted ? await decryptContent(entry.content, entry.id) : entry.content,
        isEncrypted: false,
      }))
    );
    return JSON.stringify(exportData, null, 2);
  }, [state.entries]);

  const value = useMemo<JournalContextType>(() => ({
    ...state,
    createEntry, updateEntry, deleteEntry, clearAllEntries, getEntry, getDecryptedContent,
    setEncryptionEnabled, setBiometricLockEnabled, searchEntries, getEntriesByMood, getRecentEntries, exportEntries, syncWithServer,
  }), [state, createEntry, updateEntry, deleteEntry, clearAllEntries, getEntry, getDecryptedContent, setEncryptionEnabled, setBiometricLockEnabled, searchEntries, getEntriesByMood, getRecentEntries, exportEntries, syncWithServer]);

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) throw new Error('useJournal must be used within a JournalProvider');
  return context;
}
