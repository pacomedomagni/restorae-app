/**
 * AppProviders - Combined Context Providers
 * 
 * Consolidates multiple context providers to reduce nesting hell
 * and improve maintainability.
 */
import React, { ReactNode } from 'react';

// Core contexts
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { PreferencesProvider } from './PreferencesContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { ToastProvider } from './ToastContext';
import { AccessibilityAnnouncerProvider } from './AccessibilityContext';

// Feature contexts
import { AudioProvider } from './AudioContext';
import { JournalProvider } from './JournalContext';
import { MoodProvider } from './MoodContext';
import { SessionProvider } from './SessionContext';
import { AmbientProvider } from './AmbientContext';
import { JourneyProvider } from './JourneyContext';
import { CoachMarkProvider } from './CoachMarkContext';
import { EmotionalFlowProvider } from './EmotionalFlowContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Core providers that are always needed and should be at the top
 * of the provider tree.
 */
function CoreProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AccessibilityAnnouncerProvider>
          <AuthProvider>
            <PreferencesProvider>
              <SubscriptionProvider>
                {children}
              </SubscriptionProvider>
            </PreferencesProvider>
          </AuthProvider>
        </AccessibilityAnnouncerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

/**
 * Feature providers that depend on core providers.
 * These can be lazy-loaded or conditionally rendered.
 */
function FeatureProviders({ children }: AppProvidersProps) {
  return (
    <AudioProvider>
      <AmbientProvider>
        <MoodProvider>
          <JournalProvider>
            <SessionProvider>
              <JourneyProvider>
                <CoachMarkProvider>
                  <EmotionalFlowProvider>
                    {children}
                  </EmotionalFlowProvider>
                </CoachMarkProvider>
              </JourneyProvider>
            </SessionProvider>
          </JournalProvider>
        </MoodProvider>
      </AmbientProvider>
    </AudioProvider>
  );
}

/**
 * Compose multiple providers into a single component.
 * This reduces the visual nesting in App.tsx.
 */
function composeProviders(
  ...providers: React.ComponentType<{ children: ReactNode }>[]
): React.ComponentType<{ children: ReactNode }> {
  return providers.reduce(
    (Prev, Curr) => {
      const ComposedProvider = ({ children }: { children: ReactNode }) => (
        <Prev>
          <Curr>{children}</Curr>
        </Prev>
      );
      ComposedProvider.displayName = `Composed(${Curr.displayName || Curr.name})`;
      return ComposedProvider;
    },
    ({ children }: { children: ReactNode }) => <>{children}</>
  );
}

/**
 * All app providers combined.
 * Use this in App.tsx to wrap the entire application.
 * 
 * @example
 * ```tsx
 * <AppProviders>
 *   <RootNavigator />
 * </AppProviders>
 * ```
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CoreProviders>
      <FeatureProviders>
        {children}
      </FeatureProviders>
    </CoreProviders>
  );
}

/**
 * Minimal providers for testing or lightweight screens.
 * Only includes core providers without feature-specific ones.
 */
export function MinimalProviders({ children }: AppProvidersProps) {
  return (
    <CoreProviders>
      {children}
    </CoreProviders>
  );
}

export { CoreProviders, FeatureProviders, composeProviders };
