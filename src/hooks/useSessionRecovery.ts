/**
 * useSessionRecovery
 * 
 * Hook to check for and handle interrupted sessions on app launch.
 * Returns state and handlers to show the recovery modal.
 */
import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSession, getPersistedSession } from '../contexts/SessionContext';
import { PersistedSession } from '../types/session';

interface UseSessionRecoveryResult {
  /** Whether we're checking for persisted sessions */
  isLoading: boolean;
  /** Whether there's a session to recover */
  hasRecoverySession: boolean;
  /** The persisted session data, if any */
  persistedSession: PersistedSession | null;
  /** Whether the recovery modal should be visible */
  showRecoveryModal: boolean;
  /** Handler to continue the interrupted session */
  handleContinue: () => void;
  /** Handler to discard the interrupted session */
  handleDiscard: () => void;
  /** Handler to manually dismiss the modal without action */
  dismissModal: () => void;
  /** Re-check for persisted sessions */
  checkForRecovery: () => Promise<void>;
}

/**
 * Hook to manage session recovery on app launch or foreground
 */
export function useSessionRecovery(): UseSessionRecoveryResult {
  const { recoverSession, clearPersistedSession, isActive } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [persistedSession, setPersistedSession] = useState<PersistedSession | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);

  /**
   * Check for any persisted session
   */
  const checkForRecovery = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getPersistedSession();
      
      if (session && !isActive) {
        // Only show recovery if session is recent (within 24 hours)
        const ageHours = (Date.now() - session.persistedAt) / (1000 * 60 * 60);
        
        if (ageHours < 24) {
          setPersistedSession(session);
          setShowRecoveryModal(true);
        } else {
          // Session is too old, clear it
          await clearPersistedSession();
          setPersistedSession(null);
        }
      } else {
        setPersistedSession(null);
      }
    } catch (error) {
      console.warn('Failed to check for session recovery:', error);
      setPersistedSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, clearPersistedSession]);

  /**
   * Handle continuing the interrupted session
   */
  const handleContinue = useCallback(async () => {
    if (persistedSession) {
      recoverSession(persistedSession);
    }
    setShowRecoveryModal(false);
    setPersistedSession(null);
  }, [persistedSession, recoverSession]);

  /**
   * Handle discarding the interrupted session
   */
  const handleDiscard = useCallback(async () => {
    await clearPersistedSession();
    setShowRecoveryModal(false);
    setPersistedSession(null);
  }, [clearPersistedSession]);

  /**
   * Dismiss modal without action (will show again on next check)
   */
  const dismissModal = useCallback(() => {
    setShowRecoveryModal(false);
  }, []);

  // Check on mount
  useEffect(() => {
    if (!hasCheckedOnMount) {
      setHasCheckedOnMount(true);
      checkForRecovery();
    }
  }, [hasCheckedOnMount, checkForRecovery]);

  // Check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isActive) {
        checkForRecovery();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkForRecovery, isActive]);

  return {
    isLoading,
    hasRecoverySession: persistedSession !== null,
    persistedSession,
    showRecoveryModal,
    handleContinue,
    handleDiscard,
    dismissModal,
    checkForRecovery,
  };
}

export default useSessionRecovery;
