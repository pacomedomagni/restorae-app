/**
 * Navigation Ref Service
 * 
 * Provides a navigation reference that can be used outside of React components.
 * This is needed for contexts that are rendered outside of NavigationContainer
 * but need to perform navigation actions.
 */
import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

// Create the navigation ref
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a screen from anywhere in the app
 */
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params as any);
  } else {
    console.warn('Navigation not ready, cannot navigate to:', name);
  }
}

/**
 * Go back from anywhere in the app
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Check if navigation is ready
 */
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}
