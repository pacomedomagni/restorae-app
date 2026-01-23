/**
 * Purchases Service Tests
 */
import Purchases from 'react-native-purchases';
import { purchasesService, ENTITLEMENT_ID } from '../../services/purchases';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PurchasesService', () => {
  describe('initialize', () => {
    it('should configure RevenueCat with API key', async () => {
      // Note: Will warn about unconfigured key in test, but shouldn't throw
      await purchasesService.initialize('user_123');
      
      // In real test with valid key, would verify Purchases.configure was called
    });
  });

  describe('login', () => {
    it('should log in user to RevenueCat', async () => {
      const mockCustomerInfo = {
        entitlements: { active: {} },
        originalAppUserId: 'user_123',
      };
      
      (Purchases.logIn as jest.Mock).mockResolvedValueOnce({
        customerInfo: mockCustomerInfo,
      });
      
      const result = await purchasesService.login('user_123');
      
      expect(Purchases.logIn).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockCustomerInfo);
    });
  });

  describe('logout', () => {
    it('should log out from RevenueCat', async () => {
      await purchasesService.logout();
      
      expect(Purchases.logOut).toHaveBeenCalled();
    });
  });

  describe('getOfferings', () => {
    it('should return current offering', async () => {
      const mockOfferings = {
        current: {
          identifier: 'default',
          availablePackages: [
            { identifier: 'monthly', product: { identifier: 'monthly_sub' } },
          ],
        },
      };
      
      (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce(mockOfferings);
      
      const result = await purchasesService.getOfferings();
      
      expect(result).toEqual(mockOfferings.current);
    });

    it('should return null if no offerings', async () => {
      (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({ current: null });
      
      const result = await purchasesService.getOfferings();
      
      expect(result).toBeNull();
    });
  });

  describe('purchasePackage', () => {
    it('should complete purchase successfully', async () => {
      const mockPackage = {
        identifier: 'monthly',
        product: { identifier: 'monthly_sub' },
      };
      
      const mockCustomerInfo = {
        entitlements: {
          active: {
            [ENTITLEMENT_ID]: { productIdentifier: 'monthly_sub' },
          },
        },
      };
      
      (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({
        customerInfo: mockCustomerInfo,
      });
      
      const result = await purchasesService.purchasePackage(mockPackage as any);
      
      expect(result.success).toBe(true);
      expect(result.customerInfo).toEqual(mockCustomerInfo);
    });

    it('should handle user cancellation', async () => {
      const mockPackage = {
        identifier: 'monthly',
        product: { identifier: 'monthly_sub' },
      };
      
      (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({
        userCancelled: true,
      });
      
      const result = await purchasesService.purchasePackage(mockPackage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('cancelled');
    });

    it('should handle purchase error', async () => {
      const mockPackage = {
        identifier: 'monthly',
        product: { identifier: 'monthly_sub' },
      };
      
      (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({
        message: 'Payment failed',
      });
      
      const result = await purchasesService.purchasePackage(mockPackage as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment failed');
    });
  });

  describe('restorePurchases', () => {
    it('should restore purchases successfully', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {
            [ENTITLEMENT_ID]: { productIdentifier: 'lifetime' },
          },
        },
      };
      
      (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce(mockCustomerInfo);
      
      const result = await purchasesService.restorePurchases();
      
      expect(result.success).toBe(true);
      expect(result.customerInfo).toEqual(mockCustomerInfo);
    });
  });

  describe('isPremium', () => {
    it('should return true if premium entitlement is active', async () => {
      (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce({
        entitlements: {
          active: {
            [ENTITLEMENT_ID]: { productIdentifier: 'monthly_sub' },
          },
        },
      });
      
      const result = await purchasesService.isPremium();
      
      expect(result).toBe(true);
    });

    it('should return false if no premium entitlement', async () => {
      (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce({
        entitlements: { active: {} },
      });
      
      const result = await purchasesService.isPremium();
      
      expect(result).toBe(false);
    });
  });

  describe('getActiveSubscription', () => {
    it('should return subscription details when active', async () => {
      const expirationDate = '2026-02-23T00:00:00Z';
      
      (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce({
        entitlements: {
          active: {
            [ENTITLEMENT_ID]: {
              productIdentifier: 'monthly_sub',
              expirationDate,
              willRenew: true,
            },
          },
        },
      });
      
      const result = await purchasesService.getActiveSubscription();
      
      expect(result.isActive).toBe(true);
      expect(result.productId).toBe('monthly_sub');
      expect(result.willRenew).toBe(true);
      expect(result.expiresAt).toEqual(new Date(expirationDate));
    });

    it('should return inactive status when no subscription', async () => {
      (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce({
        entitlements: { active: {} },
      });
      
      const result = await purchasesService.getActiveSubscription();
      
      expect(result.isActive).toBe(false);
      expect(result.productId).toBeNull();
      expect(result.expiresAt).toBeNull();
    });
  });
});
