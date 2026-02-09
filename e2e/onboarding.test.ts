/**
 * Detox E2E Test - Onboarding Flow
 * 
 * Tests the complete onboarding experience for new users
 */
import { device, element, by, expect, waitFor } from 'detox';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen on first launch', async () => {
    await waitFor(element(by.text('Welcome to Restorae')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate through onboarding slides', async () => {
    // Slide 1 - Welcome
    await expect(element(by.text('Welcome to Restorae'))).toBeVisible();
    await element(by.text('Next')).tap();

    // Slide 2 - Features
    await waitFor(element(by.text('Breathe & Ground')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Next')).tap();

    // Slide 3 - Journal
    await waitFor(element(by.text('Reflect & Journal')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Next')).tap();

    // Slide 4 - Goals
    await waitFor(element(by.text('Track Progress')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Get Started')).tap();
  });

  it('should allow skipping onboarding', async () => {
    await expect(element(by.text('Skip'))).toBeVisible();
    await element(by.text('Skip')).tap();
    
    // Should show auth screen or home
    await waitFor(element(by.id('auth-screen')).or(element(by.id('home-screen'))))
      .toBeVisible()
      .withTimeout(5000);
  });
});
