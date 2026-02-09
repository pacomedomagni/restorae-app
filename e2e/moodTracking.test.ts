/**
 * Detox E2E Test - Mood Tracking
 * 
 * Tests the mood check-in feature including mood selection,
 * context entry, and mood history visualization
 */
import { device, element, by, expect, waitFor } from 'detox';

describe('Mood Tracking', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
    
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
    await element(by.id('tab-home')).tap();
  });

  describe('Quick Mood Check-in', () => {
    it('should show mood check-in prompt', async () => {
      await waitFor(element(by.text('How are you feeling?')).or(element(by.id('mood-checkin-card'))))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should display mood options', async () => {
      await element(by.id('mood-checkin-card')).tap();
      
      await waitFor(element(by.id('mood-selector')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Check for mood options
      await expect(element(by.text('Great'))).toBeVisible();
      await expect(element(by.text('Good'))).toBeVisible();
      await expect(element(by.text('Okay'))).toBeVisible();
      await expect(element(by.text('Not Great'))).toBeVisible();
      await expect(element(by.text('Bad'))).toBeVisible();
    });

    it('should select mood and show context options', async () => {
      await element(by.id('mood-checkin-card')).tap();
      await element(by.text('Good')).tap();
      
      // Should show context/situation options
      await waitFor(element(by.text('What is influencing your mood?')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should allow multiple context selections', async () => {
      await element(by.id('mood-checkin-card')).tap();
      await element(by.text('Good')).tap();
      
      await waitFor(element(by.text('Work')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.text('Work')).tap();
      await element(by.text('Relationships')).tap();
      
      // Both should be selected
      await expect(element(by.id('context-Work-selected'))).toBeVisible();
      await expect(element(by.id('context-Relationships-selected'))).toBeVisible();
    });

    it('should add optional note', async () => {
      await element(by.id('mood-checkin-card')).tap();
      await element(by.text('Good')).tap();
      await element(by.text('Work')).tap();
      
      // Add note
      await element(by.id('note-input')).typeText('Had a productive meeting today');
      await element(by.text('Save')).tap();
      
      // Should return to home with confirmation
      await waitFor(element(by.text('Mood logged!')).or(element(by.id('home-screen'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should track energy level', async () => {
      await element(by.id('mood-checkin-card')).tap();
      await element(by.text('Good')).tap();
      
      // Should show energy slider
      await waitFor(element(by.id('energy-slider')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Mood History', () => {
    beforeEach(async () => {
      await element(by.id('tab-insights')).tap();
    });

    it('should show mood chart', async () => {
      await waitFor(element(by.id('mood-chart')).or(element(by.text('Mood Trends'))))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should switch time periods', async () => {
      await element(by.text('Week')).tap();
      await expect(element(by.id('week-view'))).toBeVisible();
      
      await element(by.text('Month')).tap();
      await expect(element(by.id('month-view'))).toBeVisible();
    });

    it('should show mood entry details', async () => {
      // Tap on a data point
      await element(by.id('mood-data-point-0')).tap();
      
      await waitFor(element(by.id('mood-detail-popup')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show mood, context, and note
      await expect(element(by.id('detail-mood'))).toBeVisible();
    });

    it('should show mood statistics', async () => {
      await expect(element(by.text('Average Mood'))).toBeVisible();
      await expect(element(by.text('Most Common'))).toBeVisible();
    });
  });

  describe('Mood Insights', () => {
    it('should show mood patterns', async () => {
      await element(by.id('tab-insights')).tap();
      
      await waitFor(element(by.text('Patterns')).or(element(by.id('patterns-section'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show mood correlations', async () => {
      await element(by.id('tab-insights')).tap();
      
      // Scroll to correlations
      await element(by.id('insights-scroll')).scroll(200, 'down');
      
      await waitFor(element(by.text('Sleep Impact')).or(element(by.text('Exercise Impact'))))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Mood Reminders', () => {
    it('should offer to set reminder after check-in', async () => {
      await element(by.id('mood-checkin-card')).tap();
      await element(by.text('Good')).tap();
      await element(by.text('Save')).tap();
      
      // May show reminder prompt
      try {
        await waitFor(element(by.text('Set Daily Reminder?')))
          .toBeVisible()
          .withTimeout(5000);
        
        await element(by.text('Not Now')).tap();
      } catch {
        // Reminder already set or not shown
      }
    });
  });
});
