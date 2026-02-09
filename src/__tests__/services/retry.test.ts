/**
 * Retry Service Tests
 * Comprehensive test coverage for exponential backoff and circuit breaker
 */
import { withRetry, createRetryable, CircuitBreaker, RetryConfig } from '../../services/retry';

// Mock timers
jest.useFakeTimers();

describe('Retry Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('withRetry', () => {
    it('should return result on first successful call', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const resultPromise = withRetry(fn);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed eventually', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelay: 100,
        jitter: false,
      };

      const resultPromise = withRetry(fn, config);
      
      // Advance through retries
      await Promise.resolve(); // First attempt
      jest.advanceTimersByTime(100); // First delay
      await Promise.resolve(); // Second attempt
      jest.advanceTimersByTime(200); // Second delay (exponential)
      await Promise.resolve(); // Third attempt

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts exceeded', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network Error'));

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelay: 100,
        jitter: false,
      };

      const resultPromise = withRetry(fn, config);

      // Advance through all retry delays
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(5000);
      }

      await expect(resultPromise).rejects.toThrow('Network Error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback on each retry', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();
      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelay: 100,
        jitter: false,
        onRetry,
      };

      const resultPromise = withRetry(fn, config);
      
      await Promise.resolve(); // First attempt fails
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Second attempt succeeds

      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 100);
    });

    it('should respect maxDelay configuration', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();
      const config: RetryConfig = {
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 3,
        jitter: false,
        onRetry,
      };

      const resultPromise = withRetry(fn, config);

      // Advance through retries
      await Promise.resolve();
      jest.advanceTimersByTime(1000); // delay 1: 1000
      await Promise.resolve();
      jest.advanceTimersByTime(2000); // delay 2: capped at 2000 (would be 3000)
      await Promise.resolve();
      jest.advanceTimersByTime(2000); // delay 3: capped at 2000 (would be 9000)
      await Promise.resolve();

      await resultPromise;

      // Verify maxDelay was respected
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 1000);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 2000);
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error), 2000);
    });

    it('should only retry on retryable HTTP status codes', async () => {
      const error429 = { response: { status: 429 } };
      const error400 = { response: { status: 400 } };

      // Test retryable status
      const fn429 = jest.fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxAttempts: 3,
        initialDelay: 100,
        jitter: false,
      };

      const promise429 = withRetry(fn429, config);
      await Promise.resolve();
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      
      const result = await promise429;
      expect(result).toBe('success');
      expect(fn429).toHaveBeenCalledTimes(2);

      // Test non-retryable status
      const fn400 = jest.fn().mockRejectedValue(error400);

      const promise400 = withRetry(fn400, config);
      
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      
      await expect(promise400).rejects.toEqual(error400);
      expect(fn400).toHaveBeenCalledTimes(1); // No retry for 400
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      const fn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelay: 100,
        jitter: false,
      };

      const resultPromise = withRetry(fn, config);
      
      await Promise.resolve();
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on timeout errors', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      const fn = jest.fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue('success');

      const config: RetryConfig = {
        maxAttempts: 2,
        initialDelay: 100,
        jitter: false,
      };

      const resultPromise = withRetry(fn, config);
      
      await Promise.resolve();
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      const result = await resultPromise;
      expect(result).toBe('success');
    });
  });

  describe('createRetryable', () => {
    it('should wrap function with retry logic', async () => {
      const originalFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('data');

      const retryableFn = createRetryable(originalFn, {
        maxAttempts: 2,
        initialDelay: 50,
        jitter: false,
      });

      const resultPromise = retryableFn('arg1', 'arg2');
      
      await Promise.resolve();
      jest.advanceTimersByTime(50);
      await Promise.resolve();

      const result = await resultPromise;

      expect(result).toBe('data');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('CircuitBreaker', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should transition to OPEN after threshold failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reject calls when OPEN', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      // Should reject without calling the function
      const fn = jest.fn();
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('OPEN');

      // Advance time past reset timeout
      jest.advanceTimersByTime(1100);

      expect(breaker.getState()).toBe('HALF_OPEN');
    });

    it('should close after successful call in HALF_OPEN state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 500,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      // Wait for HALF_OPEN
      jest.advanceTimersByTime(600);
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Successful call should close the circuit
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reopen after failure in HALF_OPEN state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 500,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      // Wait for HALF_OPEN
      jest.advanceTimersByTime(600);

      // Fail again
      try {
        await breaker.execute(failingFn);
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should call onStateChange callback', async () => {
      const onStateChange = jest.fn();
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 500,
        onStateChange,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

      // Trigger open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      expect(onStateChange).toHaveBeenCalledWith('OPEN');

      // Trigger half-open
      jest.advanceTimersByTime(600);
      // Access state to trigger transition
      breaker.getState();

      expect(onStateChange).toHaveBeenCalledWith('HALF_OPEN');
    });

    it('should reset failure count on successful call', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));
      const successFn = jest.fn().mockResolvedValue('success');

      // Fail twice (under threshold)
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      // Succeed - should reset failure count
      await breaker.execute(successFn);

      // Fail twice more - should not open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('CLOSED');
    });
  });
});
