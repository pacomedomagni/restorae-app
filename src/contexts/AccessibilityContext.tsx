/**
 * AccessibilityAnnouncer
 * 
 * Provides utilities for announcing state changes to screen readers.
 * Essential for premium accessibility experience.
 */
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

interface AnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  /** Announce loading state */
  announceLoading: (what?: string) => void;
  /** Announce completion */
  announceComplete: (what?: string) => void;
  /** Announce error */
  announceError: (message: string) => void;
  /** Announce navigation */
  announceNavigation: (screenName: string) => void;
  /** Announce connection status change */
  announceConnectionStatus: (isOnline: boolean) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

export function useAccessibilityAnnouncer() {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAccessibilityAnnouncer must be used within AccessibilityAnnouncerProvider');
  }
  return context;
}

interface AccessibilityAnnouncerProviderProps {
  children: ReactNode;
}

export function AccessibilityAnnouncerProvider({ children }: AccessibilityAnnouncerProviderProps) {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (Platform.OS === 'ios') {
      // iOS handles priority differently
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android: Use queue announcement for polite, immediate for assertive
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  const announceLoading = useCallback((what?: string) => {
    const message = what ? `Loading ${what}` : 'Loading';
    announce(message, 'polite');
  }, [announce]);

  const announceComplete = useCallback((what?: string) => {
    const message = what ? `${what} loaded` : 'Content loaded';
    announce(message, 'polite');
  }, [announce]);

  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);

  const announceNavigation = useCallback((screenName: string) => {
    announce(`Navigated to ${screenName}`, 'polite');
  }, [announce]);

  const announceConnectionStatus = useCallback((isOnline: boolean) => {
    const message = isOnline 
      ? 'Connection restored. You are back online.'
      : 'Connection lost. You are offline. Changes will sync when reconnected.';
    announce(message, isOnline ? 'polite' : 'assertive');
  }, [announce]);

  const value: AnnouncerContextValue = {
    announce,
    announceLoading,
    announceComplete,
    announceError,
    announceNavigation,
    announceConnectionStatus,
  };

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook to announce state changes automatically
 * 
 * @example
 * ```tsx
 * useStateAnnouncement(isLoading, {
 *   loading: 'Loading journal entries',
 *   complete: 'Journal entries loaded',
 * });
 * ```
 */
export function useStateAnnouncement(
  isLoading: boolean,
  messages: {
    loading?: string;
    complete?: string;
  }
) {
  const { announceLoading, announceComplete } = useAccessibilityAnnouncer();
  const previousLoading = React.useRef(isLoading);

  React.useEffect(() => {
    if (isLoading && !previousLoading.current) {
      // Started loading
      if (messages.loading) {
        announceLoading(messages.loading);
      }
    } else if (!isLoading && previousLoading.current) {
      // Finished loading
      if (messages.complete) {
        announceComplete(messages.complete);
      }
    }
    previousLoading.current = isLoading;
  }, [isLoading, messages.loading, messages.complete, announceLoading, announceComplete]);
}

/**
 * Hook to announce connection status changes
 */
export function useConnectionAnnouncement(isOffline: boolean) {
  const { announceConnectionStatus } = useAccessibilityAnnouncer();
  const previousOffline = React.useRef(isOffline);

  React.useEffect(() => {
    if (isOffline !== previousOffline.current) {
      announceConnectionStatus(!isOffline);
      previousOffline.current = isOffline;
    }
  }, [isOffline, announceConnectionStatus]);
}
