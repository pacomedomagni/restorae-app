/**
 * SecureStorage Tests
 */
import * as SecureStore from 'expo-secure-store';
import { secureStorage, SECURE_KEYS, migrateTokensToSecureStorage } from '../../services/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('secureStorage', () => {
  describe('setItem', () => {
    it('should save item to SecureStore', async () => {
      await secureStorage.setItem('test_key', 'test_value');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_key', 'test_value');
    });

    it('should throw error if SecureStore fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(secureStorage.setItem('test_key', 'test_value')).rejects.toThrow('Storage error');
    });
  });

  describe('getItem', () => {
    it('should retrieve item from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('stored_value');
      
      const result = await secureStorage.getItem('test_key');
      
      expect(result).toBe('stored_value');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test_key');
    });

    it('should return null if item not found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await secureStorage.getItem('nonexistent_key');
      
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Read error'));
      
      const result = await secureStorage.getItem('test_key');
      
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove item from SecureStore', async () => {
      await secureStorage.removeItem('test_key');
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test_key');
    });
  });

  describe('saveTokens', () => {
    it('should save both access and refresh tokens', async () => {
      await secureStorage.saveTokens('access_123', 'refresh_456');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.ACCESS_TOKEN,
        'access_123'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.REFRESH_TOKEN,
        'refresh_456'
      );
    });
  });

  describe('getTokens', () => {
    it('should retrieve both tokens', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      
      const tokens = await secureStorage.getTokens();
      
      expect(tokens).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens', async () => {
      await secureStorage.clearTokens();
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_KEYS.ACCESS_TOKEN);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_KEYS.REFRESH_TOKEN);
    });
  });

  describe('hasValidToken', () => {
    it('should return true if access token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('some_token');
      
      const result = await secureStorage.hasValidToken();
      
      expect(result).toBe(true);
    });

    it('should return false if no access token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await secureStorage.hasValidToken();
      
      expect(result).toBe(false);
    });
  });
});

describe('migrateTokensToSecureStorage', () => {
  it('should migrate tokens from AsyncStorage to SecureStore', async () => {
    // Mock old tokens in AsyncStorage
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce('old_access_token')
      .mockResolvedValueOnce('old_refresh_token');
    
    await migrateTokensToSecureStorage();
    
    // Should save to SecureStore
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SECURE_KEYS.ACCESS_TOKEN,
      'old_access_token'
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SECURE_KEYS.REFRESH_TOKEN,
      'old_refresh_token'
    );
    
    // Should remove from AsyncStorage
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@restorae/access_token');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@restorae/refresh_token');
  });

  it('should not migrate if no old tokens exist', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    
    await migrateTokensToSecureStorage();
    
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
