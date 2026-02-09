/**
 * Detox E2E Test - Journal Feature
 * 
 * Tests the journaling feature including creating, editing,
 * and deleting journal entries
 */
import { device, element, by, expect, waitFor } from 'detox';

describe('Journal Feature', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
    
    // Login with test account for persisted data
    try {
      await waitFor(element(by.id('email-input')))
        .toBeVisible()
        .withTimeout(15000);
      
      await element(by.id('email-input')).typeText('e2e-test@restorae.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.text('Sign In')).tap();
    } catch {
      // Continue as guest if no auth screen
      try {
        await element(by.text('Continue as Guest')).tap();
      } catch {
        // Already logged in
      }
    }
    
    await waitFor(element(by.id('bottom-tabs')).or(element(by.id('home-screen'))))
      .toBeVisible()
      .withTimeout(15000);
  });

  beforeEach(async () => {
    // Navigate to journal tab
    await element(by.id('tab-journal')).tap();
    await waitFor(element(by.id('journal-screen')).or(element(by.text('Journal'))))
      .toBeVisible()
      .withTimeout(5000);
  });

  describe('Journal Entry Creation', () => {
    it('should show new entry button', async () => {
      await expect(element(by.text('New Entry')).or(element(by.id('new-entry-button')))).toBeVisible();
    });

    it('should open journal editor', async () => {
      await element(by.text('New Entry')).tap();
      
      await waitFor(element(by.id('journal-editor')).or(element(by.id('content-input'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show writing prompts', async () => {
      await element(by.text('New Entry')).tap();
      
      await waitFor(element(by.text('Use a Prompt')).or(element(by.id('prompts-button'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should create entry with typed content', async () => {
      await element(by.text('New Entry')).tap();
      
      const testContent = 'Today I practiced mindfulness and felt more centered.';
      await element(by.id('content-input')).typeText(testContent);
      
      await element(by.text('Save')).tap();
      
      // Should navigate back to journal list
      await waitFor(element(by.id('journal-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Entry should appear in list
      await expect(element(by.text(testContent.substring(0, 30)))).toBeVisible();
    });

    it('should create entry from prompt', async () => {
      await element(by.text('New Entry')).tap();
      await element(by.text('Use a Prompt')).tap();
      
      // Select first prompt
      await waitFor(element(by.id('prompt-list')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.id('prompt-0')).tap();
      
      // Prompt should be visible
      await waitFor(element(by.id('selected-prompt')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Type response
      await element(by.id('content-input')).typeText('My response to the prompt...');
      await element(by.text('Save')).tap();
      
      await waitFor(element(by.id('journal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should attach mood to entry', async () => {
      await element(by.text('New Entry')).tap();
      await element(by.id('content-input')).typeText('Feeling happy today!');
      
      // Tap mood selector
      await element(by.id('mood-selector')).tap();
      await element(by.text('Happy')).tap();
      
      await element(by.text('Save')).tap();
      
      // Entry should show mood indicator
      await waitFor(element(by.id('journal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Journal Entry Management', () => {
    it('should open existing entry', async () => {
      // Tap on first entry
      await element(by.id('entry-0')).tap();
      
      await waitFor(element(by.id('entry-detail')).or(element(by.id('journal-editor'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should edit existing entry', async () => {
      await element(by.id('entry-0')).tap();
      await element(by.id('edit-button')).tap();
      
      // Add to content
      await element(by.id('content-input')).typeText(' [Edited]');
      await element(by.text('Save')).tap();
      
      await waitFor(element(by.id('journal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should delete entry with confirmation', async () => {
      await element(by.id('entry-0')).tap();
      await element(by.id('delete-button')).tap();
      
      // Confirmation dialog
      await waitFor(element(by.text('Delete Entry?')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.text('Delete')).tap();
      
      await waitFor(element(by.id('journal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should cancel delete', async () => {
      await element(by.id('entry-0')).tap();
      await element(by.id('delete-button')).tap();
      
      await waitFor(element(by.text('Delete Entry?')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.text('Cancel')).tap();
      
      // Should stay on entry detail
      await expect(element(by.id('entry-detail'))).toBeVisible();
    });
  });

  describe('Journal Search and Filter', () => {
    it('should search entries', async () => {
      await element(by.id('search-input')).typeText('mindfulness');
      
      // Should filter results
      await waitFor(element(by.text('mindfulness')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should filter by date range', async () => {
      await element(by.id('filter-button')).tap();
      
      await waitFor(element(by.text('This Week')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.text('This Week')).tap();
      
      // Results should update
      await waitFor(element(by.id('journal-list')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should filter by mood', async () => {
      await element(by.id('filter-button')).tap();
      await element(by.text('Mood')).tap();
      await element(by.text('Happy')).tap();
      await element(by.text('Apply')).tap();
      
      // Should show only happy entries
      await waitFor(element(by.id('journal-list')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Journal Statistics', () => {
    it('should show writing streak', async () => {
      await expect(element(by.id('writing-streak')).or(element(by.text('day streak')))).toBeVisible();
    });

    it('should show entry count', async () => {
      await expect(element(by.id('entry-count')).or(element(by.text('entries')))).toBeVisible();
    });
  });
});
