/**
 * SubscriptionContext
 * 
 * Manages subscription state, premium features, and paywall logic
 * with server-side validation
 */
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import api, { Subscription } from '../services/api';
import logger from '../services/logger';

// =============================================================================
// TYPES
// =============================================================================
export type SubscriptionTier = 'free' | 'premium' | 'lifetime';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'expired' | 'unknown';

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  serverSubscription: Subscription | null;
  lastValidated: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  canAccessFeature: (featureId: string) => boolean;
  startTrial: () => Promise<boolean>;
  purchaseSubscription: (productId: string, receipt: string) => Promise<boolean>;
  purchaseLifetime: (receipt: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  // Aliases for easier usage
  upgradeToPremium: (productId?: string) => Promise<boolean>;
  upgradeToLifetime: () => Promise<boolean>;
}

// =============================================================================
// PREMIUM FEATURES
// =============================================================================
const FREE_FEATURES = new Set([
  // Breathing - 5 free
  'box-breathing',
  '4-7-8-calm',
  'simple-breath',
  'grounding-breath',
  'body-scan-breath',
  // Grounding - 4 free
  '5-4-3-2-1',
  'body-anchor',
  'cold-reset',
  'object-focus',
  // Reset - 4 free
  'shoulder-drop',
  'jaw-release',
  'neck-rolls',
  'shake-it-out',
  // Focus - 3 free
  'power-start',
  'quick-sprint',
  'clarity-pause',
  // SOS - 2 free
  'panic-attack',
  'overwhelm',
  // Situational - 2 free
  'job-interview',
  'difficult-conversation',
  // Journal prompts - 5 free
  'gratitude-1',
  'gratitude-2',
  'reflection-1',
  'release-1',
  'growth-1',
  // Rituals - morning & evening basic
  'energized-morning',
  'calm-morning',
  'restful-evening',
  'release-evening',
]);

// =============================================================================
// STORAGE
// =============================================================================
const STORAGE_KEY = '@restorae/subscription';
const VALIDATION_CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

// =============================================================================
// CONTEXT
// =============================================================================
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    status: 'unknown',
    expiresAt: null,
    isTrialing: false,
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
    serverSubscription: null,
    lastValidated: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isOnlineRef = useRef(true);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  
  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveLocalState = useCallback(async (newState: SubscriptionState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...newState,
        expiresAt: newState.expiresAt?.toISOString() || null,
        trialEndsAt: newState.trialEndsAt?.toISOString() || null,
      }));
    } catch (error) {
      logger.error('Failed to save subscription state:', error);
    }
  }, []);

  const checkLocalExpiration = useCallback(async () => {
    const now = new Date();
    let needsUpdate = false;
    let newState = { ...stateRef.current };
    
    // Check trial expiration
    if (stateRef.current.isTrialing && stateRef.current.trialEndsAt && now >= stateRef.current.trialEndsAt) {
      newState = {
        ...newState,
        isTrialing: false,
        trialEndsAt: null,
        tier: 'free',
        status: 'expired',
      };
      needsUpdate = true;
    }
    
    // Check subscription expiration
    if (stateRef.current.tier === 'premium' && stateRef.current.expiresAt && now >= stateRef.current.expiresAt) {
      newState = {
        ...newState,
        tier: 'free',
        status: 'expired',
        expiresAt: null,
      };
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await saveLocalState(newState);
    }
  }, [saveLocalState]);

  // Sync subscription status with server (defined early so it can be used in useEffects)
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated || isSyncing) return;
    
    // Check if we've validated recently
    if (stateRef.current.lastValidated) {
      const lastValidatedDate = new Date(stateRef.current.lastValidated);
      const timeSinceValidation = Date.now() - lastValidatedDate.getTime();
      if (timeSinceValidation < VALIDATION_CACHE_DURATION) {
        return; // Still within cache period
      }
    }
    
    try {
      setIsSyncing(true);
      
      const serverSubscription = await api.getSubscription();
      
      // Map server tier to local tier
      const tierMap: Record<string, SubscriptionTier> = {
        'FREE': 'free',
        'PREMIUM': 'premium',
        'LIFETIME': 'lifetime',
      };
      
      const tier = tierMap[serverSubscription.tier] || 'free';
      const status = serverSubscription.status?.toLowerCase() as SubscriptionStatus || 'unknown';
      
      // Determine if trialing based on status
      const isTrialing = status === 'trialing';
      
      const newState: SubscriptionState = {
        tier,
        status,
        expiresAt: serverSubscription.currentPeriodEnd 
          ? new Date(serverSubscription.currentPeriodEnd) 
          : null,
        isTrialing,
        trialEndsAt: isTrialing && serverSubscription.currentPeriodEnd 
          ? new Date(serverSubscription.currentPeriodEnd) 
          : null,
        cancelAtPeriodEnd: serverSubscription.cancelAtPeriodEnd || false,
        serverSubscription,
        lastValidated: new Date().toISOString(),
      };
      
      await saveLocalState(newState);
    } catch (error) {
      logger.error('Failed to sync subscription with server:', error);
      // On error, still check local state expiration
      await checkLocalExpiration();
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isSyncing, saveLocalState, checkLocalExpiration]);

  const loadLocalState = useCallback(async () => {
    try {
      setIsLoading(true);
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          tier: parsed.tier || 'free',
          status: parsed.status || 'unknown',
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
          isTrialing: parsed.isTrialing || false,
          trialEndsAt: parsed.trialEndsAt ? new Date(parsed.trialEndsAt) : null,
          cancelAtPeriodEnd: parsed.cancelAtPeriodEnd || false,
          serverSubscription: parsed.serverSubscription || null,
          lastValidated: parsed.lastValidated || null,
        });
      }
    } catch (error) {
      logger.error('Failed to load subscription state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(netState => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = netState.isConnected ?? false;
      
      // If we just came online, validate subscription
      if (wasOffline && isOnlineRef.current && isAuthenticated) {
        syncWithServer();
      }
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, syncWithServer]);

  // Load local state on mount
  useEffect(() => {
    loadLocalState();
  }, [loadLocalState]);

  // Sync when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      syncWithServer();
    }
  }, [isAuthenticated, isLoading, syncWithServer]);

  // Periodic re-validation (every hour)
  useEffect(() => {
    if (isAuthenticated) {
      validationTimeoutRef.current = setInterval(() => {
        syncWithServer();
      }, VALIDATION_CACHE_DURATION);
    }
    
    return () => {
      if (validationTimeoutRef.current) {
        clearInterval(validationTimeoutRef.current);
      }
    };
  }, [isAuthenticated, syncWithServer]);

  // Check if subscription is valid
  // TEMPORARY: All features are FREE during beta - remove this override when ready to monetize
  const isPremium = useMemo(() => {
    // TODO: Re-enable premium checks when ready to monetize
    // if (state.tier === 'lifetime') return true;
    // if (state.tier === 'premium' && state.status === 'active') {
    //   if (state.expiresAt && new Date() < state.expiresAt) return true;
    // }
    // if (state.isTrialing && state.trialEndsAt && new Date() < state.trialEndsAt) return true;
    // return false;
    return true; // BETA: Everything is free!
  }, [state]);

  // Check if user can access a specific feature
  // TEMPORARY: All features are FREE during beta
  const canAccessFeature = useCallback((featureId: string): boolean => {
    // TODO: Re-enable premium gating when ready to monetize
    // if (isPremium) return true;
    // return FREE_FEATURES.has(featureId);
    return true; // BETA: Everything is free!
  }, [isPremium]);

  // Start 7-day free trial
  const startTrial = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.error('Must be authenticated to start trial');
      return false;
    }
    
    try {
      // In a real app, this would call the server to start a trial
      // For now, we'll handle it locally with server sync on next validation
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      
      const newState: SubscriptionState = {
        tier: 'free', // Still free tier, but trialing
        status: 'trialing',
        expiresAt: null,
        isTrialing: true,
        trialEndsAt,
        cancelAtPeriodEnd: false,
        serverSubscription: state.serverSubscription,
        lastValidated: new Date().toISOString(),
      };
      
      await saveLocalState(newState);
      
      // Sync with server to record trial start
      if (isOnlineRef.current) {
        await syncWithServer();
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to start trial:', error);
      return false;
    }
  }, [isAuthenticated, state.serverSubscription, syncWithServer]);

  // Purchase subscription via in-app purchase
  const purchaseSubscription = useCallback(async (productId: string, receipt: string): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.error('Must be authenticated to purchase');
      return false;
    }
    
    try {
      setIsSyncing(true);
      
      // Validate purchase with server
      const validatedSubscription = await api.validatePurchase(receipt, productId);
      
      const tierMap: Record<string, SubscriptionTier> = {
        'FREE': 'free',
        'PREMIUM': 'premium',
        'LIFETIME': 'lifetime',
      };
      
      const newState: SubscriptionState = {
        tier: tierMap[validatedSubscription.tier] || 'premium',
        status: 'active',
        expiresAt: validatedSubscription.currentPeriodEnd 
          ? new Date(validatedSubscription.currentPeriodEnd)
          : null,
        isTrialing: false,
        trialEndsAt: null,
        cancelAtPeriodEnd: validatedSubscription.cancelAtPeriodEnd || false,
        serverSubscription: validatedSubscription,
        lastValidated: new Date().toISOString(),
      };
      
      await saveLocalState(newState);
      return true;
    } catch (error) {
      logger.error('Failed to validate purchase:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  // Purchase lifetime
  const purchaseLifetime = useCallback(async (receipt: string): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.error('Must be authenticated to purchase');
      return false;
    }
    
    try {
      setIsSyncing(true);
      
      // Validate lifetime purchase with server
      const validatedSubscription = await api.validatePurchase(receipt, 'lifetime');
      
      const newState: SubscriptionState = {
        tier: 'lifetime',
        status: 'active',
        expiresAt: null,
        isTrialing: false,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        serverSubscription: validatedSubscription,
        lastValidated: new Date().toISOString(),
      };
      
      await saveLocalState(newState);
      return true;
    } catch (error) {
      logger.error('Failed to validate lifetime purchase:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.error('Must be authenticated to restore purchases');
      return false;
    }
    
    try {
      setIsSyncing(true);
      
      const restoredSubscription = await api.restorePurchases();
      
      if (restoredSubscription && restoredSubscription.tier !== 'FREE') {
        const tierMap: Record<string, SubscriptionTier> = {
          'FREE': 'free',
          'PREMIUM': 'premium',
          'LIFETIME': 'lifetime',
        };
        
        const newState: SubscriptionState = {
          tier: tierMap[restoredSubscription.tier] || 'free',
          status: restoredSubscription.status?.toLowerCase() as SubscriptionStatus || 'active',
          expiresAt: restoredSubscription.currentPeriodEnd 
            ? new Date(restoredSubscription.currentPeriodEnd)
            : null,
          isTrialing: false,
          trialEndsAt: null,
          cancelAtPeriodEnd: restoredSubscription.cancelAtPeriodEnd || false,
          serverSubscription: restoredSubscription,
          lastValidated: new Date().toISOString(),
        };
        
        await saveLocalState(newState);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to restore purchases:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  // Check subscription status (for app launch, background return, etc.)
  const checkSubscriptionStatus = useCallback(async () => {
    // First check local state
    await checkLocalExpiration();
    
    // Then sync with server if online
    if (isOnlineRef.current && isAuthenticated) {
      await syncWithServer();
    }
  }, [isAuthenticated, syncWithServer]);

  // Alias methods for easier usage
  const upgradeToPremium = useCallback(async (productId?: string) => {
    // In real app, this would trigger the purchase flow
    // For now, delegate to purchaseSubscription with a default product
    const defaultProductId = productId || 'restorae_premium_monthly';
    return purchaseSubscription(defaultProductId, '');
  }, [purchaseSubscription]);

  const upgradeToLifetime = useCallback(async () => {
    return purchaseLifetime('');
  }, [purchaseLifetime]);

  const value = useMemo<SubscriptionContextType>(() => ({
    ...state,
    isPremium,
    isLoading,
    isSyncing,
    canAccessFeature,
    startTrial,
    purchaseSubscription,
    purchaseLifetime,
    restorePurchases,
    checkSubscriptionStatus,
    syncWithServer,
    upgradeToPremium,
    upgradeToLifetime,
  }), [
    state, 
    isPremium, 
    isLoading, 
    isSyncing, 
    canAccessFeature, 
    startTrial, 
    purchaseSubscription,
    purchaseLifetime,
    restorePurchases, 
    checkSubscriptionStatus,
    syncWithServer,
    upgradeToPremium,
    upgradeToLifetime,
  ]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
