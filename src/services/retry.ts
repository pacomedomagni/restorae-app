/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides reliable retry logic for network requests and other
 * potentially failing operations.
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add random jitter to delay (default: true) */
  jitter?: boolean;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses?: number[];
  /** Callback when a retry occurs */
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Calculate the delay for the next retry attempt
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
  let delay = initialDelay * Math.pow(multiplier, attempt - 1);

  // Cap at maximum delay
  delay = Math.min(delay, maxDelay);

  // Add jitter (0-50% of delay) to prevent thundering herd
  if (jitter) {
    const jitterAmount = delay * 0.5 * Math.random();
    delay = delay + jitterAmount;
  }

  return Math.floor(delay);
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableStatuses: number[]): boolean {
  // Network errors are always retryable
  if (error instanceof Error) {
    if (error.message.includes('Network Error') || 
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')) {
      return true;
    }
  }

  // Check for axios-style error with response
  const axiosError = error as { response?: { status: number } };
  if (axiosError.response?.status) {
    return retryableStatuses.includes(axiosError.response.status);
  }

  return false;
}

/**
 * Execute a function with exponential backoff retry
 * 
 * @param fn The async function to retry
 * @param config Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => api.get('/users'),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    jitter,
    retryableStatuses,
    onRetry,
  } = { ...DEFAULT_CONFIG, ...config };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt === maxAttempts || !isRetryableError(error, retryableStatuses)) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier, jitter);

      // Notify about retry
      onRetry(attempt, lastError, delay);

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Create a retryable version of an async function
 * 
 * @param fn The async function to make retryable
 * @param config Retry configuration
 * @returns A new function that automatically retries on failure
 * 
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryable(
 *   (url: string) => fetch(url),
 *   { maxAttempts: 3 }
 * );
 * 
 * const response = await fetchWithRetry('/api/data');
 * ```
 */
export function createRetryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: RetryConfig = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), config);
}

/**
 * Decorator for class methods to add retry logic
 * 
 * @example
 * ```typescript
 * class ApiService {
 *   @Retryable({ maxAttempts: 3 })
 *   async fetchData() {
 *     // ...
 *   }
 * }
 * ```
 */
export function Retryable(config: RetryConfig = {}) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), config);
    };

    return descriptor;
  };
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  state: 'closed' | 'open' | 'half-open';
}

/**
 * Circuit breaker to prevent cascading failures
 * 
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 * });
 * 
 * const result = await breaker.execute(() => api.call());
 * ```
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private config: {
      failureThreshold?: number;
      resetTimeout?: number;
      onStateChange?: (state: 'closed' | 'open' | 'half-open') => void;
    } = {}
  ) {}

  private get failureThreshold(): number {
    return this.config.failureThreshold ?? 5;
  }

  private get resetTimeout(): number {
    return this.config.resetTimeout ?? 30000;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - (this.lastFailure || 0);
      
      if (timeSinceLastFailure >= this.resetTimeout) {
        // Try half-open state
        this.setState('half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      
      // Success - reset on success in half-open state
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.setState('open');
    }
  }

  private setState(state: 'closed' | 'open' | 'half-open'): void {
    if (this.state !== state) {
      this.state = state;
      this.config.onStateChange?.(state);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.lastFailure = null;
    this.setState('closed');
  }

  getState(): CircuitBreakerState {
    return {
      failures: this.failures,
      lastFailure: this.lastFailure,
      state: this.state,
    };
  }
}
