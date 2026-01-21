/**
 * usePremiumFeature Hook
 * 
 * Utility hook to check premium access and show paywall if needed
 */
import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSubscription } from '../contexts/SubscriptionContext';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UsePremiumFeatureReturn {
  /** Check if user can access the feature by ID */
  canAccess: (featureId: string) => boolean;
  /** Check and navigate to paywall if needed, returns true if access granted */
  checkAccessOrPaywall: (featureId: string, featureName?: string) => boolean;
  /** Show paywall for a specific feature */
  showPaywall: (featureId: string, featureName?: string) => void;
  /** Check if premium subscription is active */
  isPremium: boolean;
  /** Check if currently in trial period */
  isTrialing: boolean;
}

/**
 * Hook for checking premium feature access
 */
export function usePremiumFeature(): UsePremiumFeatureReturn {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium, isTrialing, canAccessFeature } = useSubscription();

  const canAccess = useCallback((featureId: string): boolean => {
    return canAccessFeature(featureId);
  }, [canAccessFeature]);

  const showPaywall = useCallback((featureId: string, featureName?: string) => {
    navigation.navigate('Paywall', {
      feature: featureId,
      featureName: featureName || 'this feature',
    });
  }, [navigation]);

  const checkAccessOrPaywall = useCallback((featureId: string, featureName?: string): boolean => {
    const hasAccess = canAccessFeature(featureId);
    
    if (!hasAccess) {
      showPaywall(featureId, featureName);
    }
    
    return hasAccess;
  }, [canAccessFeature, showPaywall]);

  return {
    canAccess,
    checkAccessOrPaywall,
    showPaywall,
    isPremium,
    isTrialing,
  };
}

export default usePremiumFeature;
