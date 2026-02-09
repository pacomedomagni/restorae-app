/**
 * E2E Test Utilities
 * 
 * Common helper functions and utilities for Detox E2E tests
 */
import { device, element, by, waitFor } from 'detox';

/**
 * Test user credentials for E2E testing
 */
export const TEST_USER = {
  email: 'e2e-test@restorae.com',
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

/**
 * Launch app with common settings
 */
export async function launchApp(options?: Partial<Detox.DeviceLaunchAppConfig>) {
  await device.launchApp({
    newInstance: true,
    permissions: { notifications: 'YES' },
    ...options,
  });
}

/**
 * Login with test credentials
 */
export async function loginWithTestUser() {
  try {
    await waitFor(element(by.id('email-input')))
      .toBeVisible()
      .withTimeout(10000);
    
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText(TEST_USER.email);
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText(TEST_USER.password);
    await element(by.text('Sign In')).tap();
    
    await waitFor(element(by.id('bottom-tabs')).or(element(by.id('home-screen'))))
      .toBeVisible()
      .withTimeout(15000);
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Continue as guest user
 */
export async function continueAsGuest() {
  try {
    await waitFor(element(by.text('Continue as Guest')))
      .toBeVisible()
      .withTimeout(10000);
    
    await element(by.text('Continue as Guest')).tap();
    
    await waitFor(element(by.id('bottom-tabs')).or(element(by.id('home-screen'))))
      .toBeVisible()
      .withTimeout(15000);
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip onboarding if shown
 */
export async function skipOnboarding() {
  try {
    await waitFor(element(by.text('Skip')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.text('Skip')).tap();
    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to a specific tab
 */
export async function navigateToTab(tabName: 'home' | 'journal' | 'insights' | 'profile') {
  await element(by.id(`tab-${tabName}`)).tap();
  await waitFor(element(by.id(`${tabName}-screen`)))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Wait for element with multiple selectors (or pattern)
 */
export async function waitForAny(
  selectors: Detox.NativeMatcher[],
  timeout = 10000
) {
  let lastError: Error | null = null;
  
  for (const selector of selectors) {
    try {
      await waitFor(element(selector))
        .toBeVisible()
        .withTimeout(timeout / selectors.length);
      return true;
    } catch (error) {
      lastError = error as Error;
    }
  }
  
  throw lastError;
}

/**
 * Scroll until element is visible
 */
export async function scrollToElement(
  scrollViewId: string,
  targetSelector: Detox.NativeMatcher,
  direction: 'up' | 'down' | 'left' | 'right' = 'down',
  maxScrolls = 10
) {
  for (let i = 0; i < maxScrolls; i++) {
    try {
      await waitFor(element(targetSelector))
        .toBeVisible()
        .withTimeout(1000);
      return true;
    } catch {
      await element(by.id(scrollViewId)).scroll(200, direction);
    }
  }
  
  throw new Error(`Could not find element after ${maxScrolls} scrolls`);
}

/**
 * Clear app state for clean test
 */
export async function clearAppState() {
  await device.clearKeychain();
  await device.launchApp({ delete: true });
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(name: string) {
  await device.takeScreenshot(name);
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingToComplete(timeout = 15000) {
  try {
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(timeout);
  } catch {
    // Loading indicator might not exist
  }
}

/**
 * Enter text safely (with clear first)
 */
export async function safeTypeText(
  selector: Detox.NativeMatcher,
  text: string
) {
  await element(selector).clearText();
  await element(selector).typeText(text);
}

/**
 * Dismiss keyboard if visible
 */
export async function dismissKeyboard() {
  try {
    await device.pressBack();
  } catch {
    // iOS doesn't have back button, try tapping outside
    await element(by.id('main-container')).tap({ x: 10, y: 10 });
  }
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(selector: Detox.NativeMatcher): Promise<boolean> {
  try {
    await waitFor(element(selector))
      .toExist()
      .withTimeout(2000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retry action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxAttempts = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  throw lastError;
}
