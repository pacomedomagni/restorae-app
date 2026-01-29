/**
 * ToastContext - Global Toast Management
 * 
 * Provides centralized toast notifications with:
 * - Error retry functionality
 * - Offline action queuing
 * - Optimistic update rollback toasts
 * - Accessibility announcements
 */
import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { Toast, ToastVariant, ToastAction } from '../components/ui/Toast';

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
  visible: boolean;
}

interface ToastContextValue {
  /** Show a basic toast */
  showToast: (message: string, options?: ToastOptions) => void;
  /** Show success toast */
  showSuccess: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** Show error toast with optional retry */
  showError: (message: string, options?: ErrorToastOptions) => void;
  /** Show warning toast */
  showWarning: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** Show info toast */
  showInfo: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  /** Show offline toast */
  showOffline: (message?: string, onRetry?: () => void) => void;
  /** Show undo toast for optimistic updates */
  showUndo: (message: string, onUndo: () => void, duration?: number) => void;
  /** Hide current toast */
  hideToast: () => void;
}

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ErrorToastOptions extends Omit<ToastOptions, 'variant'> {
  /** Retry handler for failed operations */
  onRetry?: () => void;
  /** Custom retry label */
  retryLabel?: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastIdRef = useRef(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setToast(prev => prev ? { ...prev, visible: false } : null);
    
    // Clear toast after animation
    setTimeout(() => {
      setToast(null);
    }, 300);
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const { variant = 'info', duration = 4000, action } = options;

    // Clear existing timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    toastIdRef.current += 1;

    setToast({
      id: toastIdRef.current,
      message,
      variant,
      duration,
      action,
      visible: true,
    });
  }, []);

  const showSuccess = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
    showToast(message, { ...options, variant: 'success', duration: options?.duration ?? 3000 });
  }, [showToast]);

  const showError = useCallback((message: string, options?: ErrorToastOptions) => {
    const { onRetry, retryLabel = 'Retry', ...rest } = options || {};
    
    showToast(message, {
      ...rest,
      variant: 'error',
      duration: options?.duration ?? 5000,
      action: onRetry ? { label: retryLabel, onPress: onRetry } : undefined,
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
    showToast(message, { ...options, variant: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
    showToast(message, { ...options, variant: 'info' });
  }, [showToast]);

  const showOffline = useCallback((message?: string, onRetry?: () => void) => {
    showToast(message || 'You\'re offline. Changes will sync when connected.', {
      variant: 'offline',
      duration: 0, // Persistent until dismissed
      action: onRetry ? { label: 'Retry', onPress: onRetry } : undefined,
    });
  }, [showToast]);

  const showUndo = useCallback((message: string, onUndo: () => void, duration = 5000) => {
    showToast(message, {
      variant: 'info',
      duration,
      action: { label: 'Undo', onPress: onUndo },
    });
  }, [showToast]);

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showOffline,
    showUndo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          action={toast.action}
          visible={toast.visible}
          onDismiss={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}
