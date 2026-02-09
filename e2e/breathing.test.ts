/**
 * Detox E2E Test - Breathing Exercises
 * 
 * Tests the breathing exercise feature including exercise selection,
 * timer functionality, and completion tracking
 */
import { device, element, by, expect, waitFor } from 'detox';

describe('Breathing Exercises', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
    
    // Login or continue as guest
    try {
      await element(by.text('Continue as Guest')).tap();
    } catch {
      // Already logged in
    }
    
    await waitFor(element(by.id('bottom-tabs')).or(element(by.id('home-screen'))))
      .toBeVisible()
      .withTimeout(15000);
  });

  beforeEach(async () => {
    // Navigate to home tab
    try {
      await element(by.id('tab-home')).tap();
    } catch {
      // Already on home
    }
  });

  it('should navigate to breathing exercises', async () => {
    // Tap on breathing card or button
    await waitFor(element(by.text('Breathe')).or(element(by.id('breathing-card'))))
      .toBeVisible()
      .withTimeout(10000);
    
    await element(by.text('Breathe')).tap();
    
    await waitFor(element(by.text('Breathing Exercises')).or(element(by.id('breathing-screen'))))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display available breathing patterns', async () => {
    await element(by.text('Breathe')).tap();
    
    // Check for common breathing patterns
    await expect(element(by.text('Box Breathing'))).toBeVisible();
    await expect(element(by.text('4-7-8 Breathing'))).toBeVisible();
  });

  it('should show exercise details', async () => {
    await element(by.text('Breathe')).tap();
    
    // Tap on an exercise
    await element(by.text('Box Breathing')).tap();
    
    // Should show duration and instructions
    await waitFor(element(by.text('Start')).or(element(by.id('start-button'))))
      .toBeVisible()
      .withTimeout(5000);
    
    await expect(element(by.text('4 seconds')).or(element(by.id('duration-display')))).toBeVisible();
  });

  it('should start and show breathing animation', async () => {
    await element(by.text('Breathe')).tap();
    await element(by.text('Box Breathing')).tap();
    
    await element(by.text('Start')).tap();
    
    // Should show breathing instructions
    await waitFor(element(by.text('Breathe In')).or(element(by.text('Inhale'))))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should allow pausing exercise', async () => {
    await element(by.text('Breathe')).tap();
    await element(by.text('Box Breathing')).tap();
    await element(by.text('Start')).tap();
    
    // Wait for exercise to start
    await waitFor(element(by.text('Pause')).or(element(by.id('pause-button'))))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.text('Pause')).tap();
    
    // Should show resume option
    await expect(element(by.text('Resume')).or(element(by.id('resume-button')))).toBeVisible();
  });

  it('should complete exercise and show summary', async () => {
    await element(by.text('Breathe')).tap();
    
    // Select a short exercise or skip to completion
    await element(by.text('Quick Calm')).tap();
    await element(by.text('Start')).tap();
    
    // Wait for completion (using shorter timeout for quick exercises)
    await waitFor(element(by.text('Well Done!')).or(element(by.text('Complete'))))
      .toBeVisible()
      .withTimeout(120000);
    
    // Should show completion summary
    await expect(element(by.text('Duration')).or(element(by.id('completion-duration')))).toBeVisible();
  });

  it('should track exercise in history', async () => {
    // Navigate to profile or history
    await element(by.id('tab-profile')).tap();
    
    await waitFor(element(by.text('Activity History')).or(element(by.text('Recent Activity'))))
      .toBeVisible()
      .withTimeout(5000);
    
    // Should show recent breathing exercise
    await expect(element(by.text('Breathing'))).toBeVisible();
  });

  it('should show premium badge for locked exercises', async () => {
    await element(by.id('tab-home')).tap();
    await element(by.text('Breathe')).tap();
    
    // Look for premium indicators
    const premiumBadge = element(by.text('Premium')).or(element(by.id('premium-badge')));
    await waitFor(premiumBadge)
      .toExist()
      .withTimeout(5000);
  });

  it('should remember last used exercise', async () => {
    await element(by.text('Breathe')).tap();
    await element(by.text('4-7-8 Breathing')).tap();
    await element(by.id('back-button')).tap();
    await element(by.id('back-button')).tap();
    
    // Navigate away and back
    await element(by.id('tab-profile')).tap();
    await element(by.id('tab-home')).tap();
    await element(by.text('Breathe')).tap();
    
    // Should show recent or continue option
    await waitFor(element(by.text('Continue')).or(element(by.text('4-7-8 Breathing'))))
      .toBeVisible()
      .withTimeout(5000);
  });
});
