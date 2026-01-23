/**
 * RevenueCat Purchases Service
 * 
 * Handles in-app purchases and subscription management
 */
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  PRODUCT_CATEGORY,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { captureException, addBreadcrumb } from './sentry';
import logger from './logger';

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS || 'YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID || 'YOUR_REVENUECAT_ANDROID_KEY';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'restorae_premium_monthly',
  ANNUAL: 'restorae_premium_annual',
  LIFETIME: 'restorae_lifetime',
} as const;

// Entitlement identifier
export const ENTITLEMENT_ID = 'premium';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

class PurchasesService {
  private initialized = false;

  /**
   * Initialize RevenueCat
   * Call this once when the app starts
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    const apiKey = Platform.OS === 'ios' 
      ? REVENUECAT_API_KEY_IOS 
      : REVENUECAT_API_KEY_ANDROID;

    if (apiKey.startsWith('YOUR_')) {
      logger.warn('RevenueCat API key not configured');
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.initialized = true;
      addBreadcrumb('RevenueCat initialized', 'purchases');
    } catch (error) {
      captureException(error as Error, { context: 'purchases_init' });
      throw error;
    }
  }

  /**
   * Identify user after login
   */
  async login(userId: string): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      addBreadcrumb('User logged in to RevenueCat', 'purchases', { userId });
      return customerInfo;
    } catch (error) {
      captureException(error as Error, { context: 'purchases_login', userId });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      addBreadcrumb('User logged out of RevenueCat', 'purchases');
    } catch (error) {
      captureException(error as Error, { context: 'purchases_logout' });
    }
  }

  /**
   * Get available offerings/packages
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      captureException(error as Error, { context: 'get_offerings' });
      return null;
    }
  }

  /**
   * Get all available packages
   */
  async getPackages(): Promise<PurchasesPackage[]> {
    const offering = await this.getOfferings();
    return offering?.availablePackages || [];
  }

  /**
   * Purchase a package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      addBreadcrumb('Starting purchase', 'purchases', { 
        productId: pkg.product.identifier 
      });

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      addBreadcrumb('Purchase successful', 'purchases', { 
        productId: pkg.product.identifier 
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      // User cancelled
      if (error.userCancelled) {
        return {
          success: false,
          error: 'cancelled',
        };
      }

      captureException(error, { 
        context: 'purchase_package',
        productId: pkg.product.identifier,
      });

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      addBreadcrumb('Restoring purchases', 'purchases');
      const customerInfo = await Purchases.restorePurchases();
      
      addBreadcrumb('Purchases restored', 'purchases');
      
      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      captureException(error, { context: 'restore_purchases' });
      
      return {
        success: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      captureException(error as Error, { context: 'get_customer_info' });
      return null;
    }
  }

  /**
   * Check if user has premium access
   */
  async isPremium(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      
      return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get active subscription details
   */
  async getActiveSubscription(): Promise<{
    isActive: boolean;
    expiresAt: Date | null;
    productId: string | null;
    willRenew: boolean;
  }> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return {
        isActive: false,
        expiresAt: null,
        productId: null,
        willRenew: false,
      };
    }

    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (!entitlement) {
      return {
        isActive: false,
        expiresAt: null,
        productId: null,
        willRenew: false,
      };
    }

    return {
      isActive: true,
      expiresAt: entitlement.expirationDate 
        ? new Date(entitlement.expirationDate) 
        : null,
      productId: entitlement.productIdentifier,
      willRenew: !entitlement.willRenew ? false : entitlement.willRenew,
    };
  }

  /**
   * Set user attributes for analytics
   */
  async setAttributes(attributes: Record<string, string>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      logger.error('Failed to set RevenueCat attributes:', error);
    }
  }

  /**
   * Set email for receipt
   */
  async setEmail(email: string): Promise<void> {
    try {
      await Purchases.setEmail(email);
    } catch (error) {
      logger.error('Failed to set RevenueCat email:', error);
    }
  }

  /**
   * Listen to customer info updates
   */
  addCustomerInfoListener(
    listener: (customerInfo: CustomerInfo) => void
  ): () => void {
    Purchases.addCustomerInfoUpdateListener(listener);
    // Return a cleanup function - RevenueCat SDK handles listener cleanup internally
    return () => {
      // Note: The newer RevenueCat SDK manages listeners internally
      // If you need explicit removal, track listeners manually
    };
  }
}

export const purchasesService = new PurchasesService();
export default purchasesService;
