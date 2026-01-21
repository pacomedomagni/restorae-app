/**
 * ErrorBoundary & ErrorState Components
 * Graceful error handling with recovery options
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Text } from './Text';
import { GlassCard } from './GlassCard';
import { LuxeIcon } from '../LuxeIcon';
import { spacing, borderRadius, withAlpha, light, dark } from '../../theme';

// =============================================================================
// ERROR STATE COMPONENT
// =============================================================================
interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error description */
  description?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Custom action button */
  action?: ReactNode;
  /** Visual variant */
  variant?: 'card' | 'inline' | 'fullscreen';
  /** Icon to display */
  icon?: 'error' | 'network' | 'empty';
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn\'t load this content. Please try again.',
  onRetry,
  action,
  variant = 'card',
  icon = 'error',
}: ErrorStateProps) {
  // Use light theme colors as fallback (context may not be available in error boundary)
  const colors = light;

  const iconMap = {
    error: '⚠️',
    network: '📡',
    empty: '📭',
  };

  const content = (
    <>
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={[
          styles.iconContainer,
          { backgroundColor: withAlpha(colors.accentDanger, 0.1) },
        ]}
      >
        <Text style={styles.iconEmoji}>{iconMap[icon]}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(400)}>
        <Text variant="headlineMedium" color="ink" align="center" style={styles.title}>
          {title}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <Text variant="bodyMedium" color="inkMuted" align="center" style={styles.description}>
          {description}
        </Text>
      </Animated.View>

      {(onRetry || action) && (
        <Animated.View
          entering={FadeInUp.delay(250).duration(400)}
          style={styles.actionContainer}
        >
          {action || (
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  backgroundColor: colors.accentPrimary,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Text variant="labelLarge" style={{ color: colors.inkInverse }}>
                Try Again
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </>
  );

  if (variant === 'fullscreen') {
    return (
      <View style={[styles.fullscreenContainer, { backgroundColor: colors.canvas }]}>
        {content}
      </View>
    );
  }

  if (variant === 'inline') {
    return <View style={styles.inlineContainer}>{content}</View>;
  }

  return (
    <GlassCard variant="subtle" padding="xl">
      <View style={styles.cardContent}>{content}</View>
    </GlassCard>
  );
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to show on error */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom error title */
  errorTitle?: string;
  /** Custom error description */
  errorDescription?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.boundaryContainer}>
          <ErrorState
            title={this.props.errorTitle || 'Oops! Something went wrong'}
            description={this.props.errorDescription || 'The app encountered an unexpected error. Please try again.'}
            onRetry={this.handleRetry}
            variant="fullscreen"
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// ASYNC ERROR WRAPPER - For data fetching errors
// =============================================================================
interface AsyncErrorWrapperProps {
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
}

export function AsyncErrorWrapper({
  isError,
  error,
  onRetry,
  children,
  errorTitle,
  errorDescription,
}: AsyncErrorWrapperProps) {
  if (isError) {
    return (
      <ErrorState
        title={errorTitle || 'Failed to load'}
        description={errorDescription || error?.message || 'Something went wrong while loading this content.'}
        onRetry={onRetry}
        variant="card"
        icon="network"
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  cardContent: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  inlineContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  boundaryContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    marginBottom: spacing[2],
  },
  description: {
    maxWidth: 280,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: spacing[6],
  },
  retryButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.full,
    minWidth: 140,
    alignItems: 'center',
  },
});
