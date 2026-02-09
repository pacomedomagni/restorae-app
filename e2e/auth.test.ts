/**
 * Detox E2E Test - Authentication Flow
 * 
 * Tests user registration, login, and logout flows
 */
import { device, element, by, expect, waitFor } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Anonymous Authentication', () => {
    it('should allow continuing as guest', async () => {
      // Navigate to auth screen if not already there
      const skipButton = element(by.text('Skip'));
      try {
        await skipButton.tap();
      } catch {
        // Already on auth screen
      }

      // Look for guest/anonymous option
      await waitFor(element(by.text('Continue as Guest')))
        .toBeVisible()
        .withTimeout(10000);
      
      await element(by.text('Continue as Guest')).tap();

      // Should navigate to home/main screen
      await waitFor(element(by.id('home-screen')).or(element(by.id('bottom-tabs'))))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Email Authentication', () => {
    it('should show login form', async () => {
      await waitFor(element(by.id('email-input')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.text('Sign In'))).toBeVisible();
    });

    it('should validate empty fields', async () => {
      await element(by.text('Sign In')).tap();
      
      await waitFor(element(by.text('Email is required')).or(element(by.text('Please enter your email'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should validate email format', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.text('Sign In')).tap();
      
      await waitFor(element(by.text('Invalid email format')).or(element(by.text('Please enter a valid email'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.text('Sign In')).tap();
      
      await waitFor(element(by.text('Invalid credentials')).or(element(by.text('Login failed'))))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should successfully login with valid credentials', async () => {
      // Using test credentials (should be configured in test environment)
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText('e2e-test@restorae.com');
      await element(by.id('password-input')).clearText();
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.text('Sign In')).tap();
      
      // Should navigate to home screen
      await waitFor(element(by.id('home-screen')).or(element(by.id('bottom-tabs'))))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Registration', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
    });

    it('should navigate to registration screen', async () => {
      await waitFor(element(by.text('Sign Up')).or(element(by.text("Don't have an account?"))))
        .toBeVisible()
        .withTimeout(10000);
      
      await element(by.text('Sign Up')).tap();
      
      await waitFor(element(by.id('register-screen')).or(element(by.text('Create Account'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should validate password requirements', async () => {
      await element(by.text('Sign Up')).tap();
      
      await element(by.id('email-input')).typeText('newuser@example.com');
      await element(by.id('password-input')).typeText('weak');
      await element(by.text('Create Account')).tap();
      
      await waitFor(element(by.text('Password must be at least 8 characters')).or(element(by.text('Password too weak'))))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Forgot Password', () => {
    it('should navigate to forgot password screen', async () => {
      await waitFor(element(by.text('Forgot Password?')))
        .toBeVisible()
        .withTimeout(10000);
      
      await element(by.text('Forgot Password?')).tap();
      
      await waitFor(element(by.text('Reset Password')).or(element(by.text('Enter your email'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should send reset email', async () => {
      await element(by.text('Forgot Password?')).tap();
      
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.text('Send Reset Link')).tap();
      
      await waitFor(element(by.text('Check your email')).or(element(by.text('Reset link sent'))))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});
