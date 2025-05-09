/**
 * Enhanced Error Tracking System
 * 
 * A comprehensive error tracking solution with:
 * - Automatic context enrichment
 * - Performance monitoring
 * - Request tracing
 * - Rate limiting for error reporting
 * - Integration with Sentry
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as functions from 'firebase-functions';

// Error tracking configuration
interface ErrorTrackingConfig {
  enabled: boolean;
  sampleRate: number;
  performanceTracking: boolean;
  environment: string;
  release: string;
  dsn?: string;
  debug?: boolean;
  rateLimitPerMinute?: number;
}

// Rate limiter implementation
class ErrorRateLimiter {
  private counters: Map<string, number> = new Map();
  private timestamps: Map<string, number> = new Map();
  private readonly limitPerMinute: number;

  constructor(limitPerMinute: number = 100) {
    this.limitPerMinute = limitPerMinute;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  public shouldReport(errorKey: string): boolean {
    const now = Date.now();
    const lastTimestamp = this.timestamps.get(errorKey) || 0;
    const timeDiff = now - lastTimestamp;
    
    // Reset counter if more than a minute has passed
    if (timeDiff > 60000) {
      this.counters.set(errorKey, 1);
      this.timestamps.set(errorKey, now);
      return true;
    }
    
    // Increment counter
    const currentCount = (this.counters.get(errorKey) || 0) + 1;
    this.counters.set(errorKey, currentCount);
    
    // Check if rate limit is exceeded
    return currentCount <= this.limitPerMinute;
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = now - 60000;
    
    // Remove entries older than 1 minute
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (timestamp < cutoff) {
        this.timestamps.delete(key);
        this.counters.delete(key);
      }
    }
  }
}

/**
 * Enhanced Error Tracking Service
 */
export class ErrorTracking {
  private static instance: ErrorTracking;
  private initialized = false;
  private config: ErrorTrackingConfig;
  private rateLimiter: ErrorRateLimiter;
  
  private constructor() {
    this.config = {
      enabled: false,
      sampleRate: 1.0,
      performanceTracking: true,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE || process.env.FUNCTION_VERSION || '1.0.0',
      dsn: process.env.SENTRY_DSN,
      debug: process.env.NODE_ENV !== 'production',
      rateLimitPerMinute: 100
    };
    
    this.rateLimiter = new ErrorRateLimiter(this.config.rateLimitPerMinute);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorTracking {
    if (!ErrorTracking.instance) {
      ErrorTracking.instance = new ErrorTracking();
    }
    return ErrorTracking.instance;
  }

  /**
   * Initialize error tracking
   * @param config Optional custom configuration
   */
  public initialize(config?: Partial<ErrorTrackingConfig>): void {
    if (this.initialized) {
      functions.logger.warn('Error tracking already initialized');
      return;
    }
    
    // Merge provided config with defaults
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Only initialize if enabled and DSN is provided
    if (!this.config.enabled || !this.config.dsn) {
      if (!this.config.dsn) {
        functions.logger.warn('Error tracking DSN not provided. Error tracking will not be initialized.');
      }
      return;
    }
    
    try {
      const integrations = [
        // Add profiling integration for performance monitoring
        ...(this.config.performanceTracking ? [nodeProfilingIntegration()] : []),
      ];
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        debug: this.config.debug,
        integrations,
        tracesSampleRate: this.config.sampleRate,
        profilesSampleRate: this.config.environment === 'production' ? 0.1 : 1.0,
        // Only enable in production and staging by default
        enabled: ['production', 'staging'].includes(this.config.environment) || this.config.enabled,
      });
      
      this.initialized = true;
      functions.logger.info('Error tracking initialized successfully');
    } catch (error) {
      functions.logger.error('Failed to initialize error tracking:', error);
    }
  }

  /**
   * Capture an exception with optional context
   * @param error The error to capture
   * @param additionalContext Additional context data
   */
  public captureException(error: Error | any, additionalContext?: Record<string, any>): void {
    if (!this.initialized) {
      functions.logger.warn('Error tracking not initialized. Error will not be reported.');
      functions.logger.error('Uncaught error:', error);
      return;
    }
    
    // Create a unique key for the error for rate limiting
    const errorKey = this.getErrorKey(error);
    
    // Check if we should report this error (rate limiting)
    if (!this.rateLimiter.shouldReport(errorKey)) {
      functions.logger.debug('Error reporting rate limit exceeded for:', errorKey);
      return;
    }
    
    try {
      // Add additional context
      if (additionalContext) {
        Sentry.configureScope(scope => {
          for (const [key, value] of Object.entries(additionalContext)) {
            scope.setExtra(key, value);
          }
        });
      }
      
      // Add error source context
      Sentry.configureScope(scope => {
        scope.setTag('error.type', error && error.name ? error.name : typeof error);
        scope.setExtra('error.source', this.getErrorSource());
      });
      
      // Capture the exception
      Sentry.captureException(error);
      
    } catch (sentryError) {
      // Don't let Sentry errors crash our application
      functions.logger.error('Failed to report error to Sentry:', sentryError);
    }
  }

  /**
   * Set user information for error context
   * @param user User information
   */
  public setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) return;
    
    Sentry.setUser(user);
  }

  /**
   * Start a performance transaction
   * @param name Transaction name
   * @param operation Operation type
   * @returns Transaction object
   */
  public startTransaction(name: string, operation: string = 'function'): Sentry.Transaction {
    if (!this.initialized) {
      // Return a dummy transaction if not initialized
      return {
        finish: () => {},
        name,
        op: operation,
        setTag: () => ({} as any),
        setData: () => ({} as any),
        startChild: () => ({ finish: () => {} } as any)
      } as any;
    }
    
    return Sentry.startTransaction({
      name,
      op: operation
    });
  }

  /**
   * Wrapper function to track errors and performance
   * @param fn The function to wrap
   * @param operationName Optional operation name for tracing
   * @returns Wrapped function
   */
  public trackFunction<T>(
    fn: (...args: any[]) => Promise<T>,
    operationName?: string
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      // Skip if not initialized
      if (!this.initialized) {
        return fn(...args);
      }
      
      const transaction = this.startTransaction(
        operationName || fn.name || 'anonymous',
        'function'
      );
      
      // Set transaction as current
      Sentry.configureScope(scope => {
        scope.setSpan(transaction);
      });
      
      try {
        const result = await fn(...args);
        transaction.finish();
        return result;
      } catch (error) {
        // Add transaction context to the error
        transaction.setTag('error', 'true');
        transaction.setData('error_message', error.message || String(error));
        
        // Capture the exception with transaction context
        this.captureException(error, {
          transaction: transaction.name,
          args: args.map(arg => 
            // Safely stringify arguments, avoiding circular references
            typeof arg === 'object' ? this.safeStringify(arg) : String(arg)
          )
        });
        
        // Finish the transaction
        transaction.finish();
        
        // Re-throw the error
        throw error;
      }
    };
  }

  /**
   * Generate a unique key for an error for rate limiting
   * @param error The error object
   * @returns A string key representing the error
   */
  private getErrorKey(error: any): string {
    if (error instanceof Error) {
      // Use error name, message and first frame of stack
      const stackFrame = error.stack?.split('\\n')[1] || '';
      return `${error.name}:${error.message}:${stackFrame}`;
    }
    
    return `unknown:${String(error)}`;
  }

  /**
   * Get the source of an error from the stack trace
   * @returns The source location of the error
   */
  private getErrorSource(): string {
    try {
      const stackTrace = new Error().stack || '';
      const frames = stackTrace.split('\\n');
      
      // Skip the first two frames (Error constructor and this method)
      for (let i = 2; i < frames.length; i++) {
        const frame = frames[i].trim();
        if (frame && !frame.includes('/node_modules/') && !frame.includes('error-tracking.ts')) {
          return frame;
        }
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Safely stringify an object, handling circular references
   * @param obj The object to stringify
   * @returns A string representation of the object
   */
  private safeStringify(obj: any): string {
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch {
      return '[Object cannot be stringified]';
    }
  }
}

// Export singleton instance
export const errorTracking = ErrorTracking.getInstance();