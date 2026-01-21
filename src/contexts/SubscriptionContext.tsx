/**
 * SubscriptionContext
 * 
 * Manages subscription state, premium features, and paywall logic
 */
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// TYPES
// =============================================================================
export type SubscriptionTier = 'free' | 'premium' | 'lifetime';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: Date | null;
  isTrialing: boolean;
  trialEndsAt: Date | null;
}

interface SubscriptionContextType extends SubscriptionState {
  isPremium: boolean;
  canAccessFeature: (featureId: string) => boolean;
  startTrial: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  upgradeToLifetime: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
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

// =============================================================================
// CONTEXT
// =============================================================================
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    expiresAt: null,
    isTrialing: false,
    trialEndsAt: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load subscription state
  useEffect(() => {
    loadSubscriptionState();
  }, []);

  const loadSubscriptionState = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          tier: parsed.tier || 'free',
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
          isTrialing: parsed.isTrialing || false,
          trialEndsAt: parsed.trialEndsAt ? new Date(parsed.trialEndsAt) : null,
        });
      }
    } catch (error) {
      console.error('Failed to load subscription state:', error);
    }
    setIsLoaded(true);
  };

  const saveSubscriptionState = async (newState: SubscriptionState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...newState,
        expiresAt: newState.expiresAt?.toISOString() || null,
        trialEndsAt: newState.trialEndsAt?.toISOString() || null,
      }));
    } catch (error) {
      console.error('Failed to save subscription state:', error);
    }
  };

  // Check if subscription is valid
  const isPremium = useMemo(() => {
    if (state.tier === 'lifetime') return true;
    if (state.tier === 'premium' && state.expiresAt && new Date() < state.expiresAt) return true;
    if (state.isTrialing && state.trialEndsAt && new Date() < state.trialEndsAt) return true;
    return false;
  }, [state]);

  // Check if user can access a specific feature
  const canAccessFeature = useCallback((featureId: string): boolean => {
    if (isPremium) return true;
    return FREE_FEATURES.has(featureId);
  }, [isPremium]);

  // Start 7-day free trial
  const startTrial = useCallback(async () => {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    
    await saveSubscriptionState({
      tier: 'free',
      expiresAt: null,
      isTrialing: true,
      trialEndsAt,
    });
  }, []);

  // Upgrade to premium (monthly/annual)
  const upgradeToPremium = useCallback(async () => {
    // In a real app, this would integrate with RevenueCat/StoreKit
    // For now, simulate a successful purchase
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // Monthly subscription
    
    await saveSubscriptionState({
      tier: 'premium',
      expiresAt,
      isTrialing: false,
      trialEndsAt: null,
    });
  }, []);

  // Upgrade to lifetime
  const upgradeToLifetime = useCallback(async () => {
    // In a real app, this would integrate with RevenueCat/StoreKit
    await saveSubscriptionState({
      tier: 'lifetime',
      expiresAt: null,
      isTrialing: false,
      trialEndsAt: null,
    });
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    // In a real app, this would call RevenueCat/StoreKit restore
    // For now, just reload from storage
    await loadSubscriptionState();
  }, []);

  // Check subscription status (for app launch, background return, etc.)
  const checkSubscriptionStatus = useCallback(async () => {
    // Check if trial/subscription has expired
    const now = new Date();
    
    if (state.isTrialing && state.trialEndsAt && now >= state.trialEndsAt) {
      await saveSubscriptionState({
        ...state,
        isTrialing: false,
        trialEndsAt: null,
      });
    }
    
    if (state.tier === 'premium' && state.expiresAt && now >= state.expiresAt) {
      await saveSubscriptionState({
        tier: 'free',
        expiresAt: null,
        isTrialing: false,
        trialEndsAt: null,
      });
    }
  }, [state]);

  const value = useMemo<SubscriptionContextType>(() => ({
    ...state,
    isPremium,
    canAccessFeature,
    startTrial,
    upgradeToPremium,
    upgradeToLifetime,
    restorePurchases,
    checkSubscriptionStatus,
  }), [state, isPremium, canAccessFeature, startTrial, upgradeToPremium, upgradeToLifetime, restorePurchases, checkSubscriptionStatus]);

  if (!isLoaded) {
    return null;
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
