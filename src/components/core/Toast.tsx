/**
 * Toast Component - Core
 * 
 * Temporary notifications with auto-dismiss.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { spacing, radius, shadowLight, shadowDark } from '../../theme/tokens';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  show: (type: ToastType, message: string, duration?: number) => void;
  hide: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  colors: {
    surface: string;
    surfaceElevated: string;
    textPrimary: string;
    success: string;
    error: string;
    warning: string;
    actionPrimary: string;
  };
  isDark?: boolean;
}

export function ToastProvider({ children, colors, isDark }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    // Haptic feedback
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <View
        style={[styles.container, { top: insets.top + spacing.md }]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onHide={() => hide(toast.id)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

interface ToastProps {
  toast: ToastData;
  onHide: () => void;
  colors: ToastProviderProps['colors'];
  isDark?: boolean;
}

export function Toast({ toast, onHide, colors, isDark }: ToastProps) {
  const shadows = isDark ? shadowDark : shadowLight;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: colors.success };
      case 'error':
        return { name: 'alert-circle' as const, color: colors.error };
      case 'warning':
        return { name: 'warning' as const, color: colors.warning };
      case 'info':
        return { name: 'information-circle' as const, color: colors.actionPrimary };
    }
  };

  const icon = getIcon();

  return (
    <Animated.View
      entering={FadeIn.duration(200).springify()}
      exiting={FadeOut.duration(150)}
      style={[
        styles.toast,
        {
          backgroundColor: colors.surfaceElevated,
          ...shadows.md,
        },
      ]}
    >
      <Ionicons name={icon.name} size={20} color={icon.color} />
      <Text
        variant="bodyMedium"
        style={[styles.message, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    maxWidth: 400,
  },
  message: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
