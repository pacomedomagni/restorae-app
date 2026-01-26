/**
 * SecureStorage
 * 
 * Secure storage wrapper for sensitive data (tokens)
 * Uses expo-secure-store for encrypted storage
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';
import CryptoJS from 'crypto-js';

// Keys for secure storage
export const SECURE_KEYS = {
  ACCESS_TOKEN: 'restorae_access_token',
  REFRESH_TOKEN: 'restorae_refresh_token',
  ENCRYPTION_KEY: 'restorae_encryption_key',
} as const;

// ... (keep unused keys)

/**
 * Secure storage for sensitive data (tokens)
 */
export const secureStorage = {
  /**
   * Save a value to secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error(`SecureStore setItem error for ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get a value from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error(`SecureStore getItem error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Encrypt and save data to AsyncStorage
   * Uses a key stored in SecureStore to encrypt the payload
   */
  async setEncryptedItem(key: string, value: string): Promise<void> {
    try {
      let encryptionKey = await this.getItem(SECURE_KEYS.ENCRYPTION_KEY);
      if (!encryptionKey) {
        encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        await this.setItem(SECURE_KEYS.ENCRYPTION_KEY, encryptionKey);
      }
      
      const encrypted = CryptoJS.AES.encrypt(value, encryptionKey).toString();
      await AsyncStorage.setItem(key, encrypted);
    } catch (error) {
       logger.error(`Failed to save encrypted item ${key}`, error);
       throw error;
    }
  },

  /**
   * Retrieve and decrypt data from AsyncStorage
   */
  async getEncryptedItem(key: string): Promise<string | null> {
    try {
      const encrypted = await AsyncStorage.getItem(key);
      if (!encrypted) return null;
      
      const encryptionKey = await this.getItem(SECURE_KEYS.ENCRYPTION_KEY);
      if (!encryptionKey) {
        logger.error('No encryption key found, cannot decrypt');
        return null;
      }
      
      const bytes = CryptoJS.AES.decrypt(encrypted, encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error(`Failed to retrieve encrypted item ${key}`, error);
      return null;
    }
  },

  /**
   * Remove a value from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error(`SecureStore removeItem error for ${key}:`, error);
    }
  },

  /**
   * Save auth tokens securely
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setItem(SECURE_KEYS.ACCESS_TOKEN, accessToken),
      this.setItem(SECURE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  /**
   * Get auth tokens
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getItem(SECURE_KEYS.ACCESS_TOKEN),
      this.getItem(SECURE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },

  /**
   * Clear all auth tokens
   */
  async clearTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(SECURE_KEYS.ACCESS_TOKEN),
      this.removeItem(SECURE_KEYS.REFRESH_TOKEN),
    ]);
  },

  /**
   * Check if user has valid tokens
   */
  async hasValidToken(): Promise<boolean> {
    const token = await this.getItem(SECURE_KEYS.ACCESS_TOKEN);
    return !!token;
  },
};

/**
 * Migration utility - move tokens from AsyncStorage to SecureStore
 * Run this once on app update
 */
export async function migrateTokensToSecureStorage(): Promise<void> {
  try {
    // Check for old tokens in AsyncStorage
    const [oldAccessToken, oldRefreshToken] = await Promise.all([
      AsyncStorage.getItem('@restorae/access_token'),
      AsyncStorage.getItem('@restorae/refresh_token'),
    ]);

    // If old tokens exist, migrate them
    if (oldAccessToken || oldRefreshToken) {
      logger.debug('Migrating tokens to secure storage...');
      
      if (oldAccessToken) {
        await secureStorage.setItem(SECURE_KEYS.ACCESS_TOKEN, oldAccessToken);
        await AsyncStorage.removeItem('@restorae/access_token');
      }
      
      if (oldRefreshToken) {
        await secureStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, oldRefreshToken);
        await AsyncStorage.removeItem('@restorae/refresh_token');
      }
      
      logger.debug('Token migration complete');
    }
  } catch (error) {
    logger.error('Token migration failed:', error);
  }
}

export default secureStorage;
