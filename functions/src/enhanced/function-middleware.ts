/**
 * Enhanced Function Middleware System
 * 
 * A middleware system for Firebase Functions with:
 * - Input/output validation with Zod
 * - Performance monitoring
 * - Error handling
 * - Logging
 * - Rate limiting
 * - Authentication verification
 */
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { errorTracking } from './error-tracking';
import { schemaRegistry } from './schema-registry';

// Rate limiter for function execution
class RateLimiter {
  private counters: Map<string, number> = new Map();
  private timestamps: Map<string, number> = new Map();
  private readonly windowMs: number;
  private readonly maxRequestsPerWindow: number;

  constructor(windowMs: number = 60000, maxRequestsPerWindow: number = 100) {
    this.windowMs = windowMs;
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  public isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get current timestamp or set to now
    const timestamp = this.timestamps.get(key) || now;
    this.timestamps.set(key, now);
    
    // Reset counter if outside window
    if (timestamp < windowStart) {
      this.counters.set(key, 1);
      return false;
    }
    
    // Increment counter
    const currentCount = (this.counters.get(key) || 0) + 1;
    this.counters.set(key, currentCount);
    
    // Check if rate limit exceeded
    return currentCount > this.maxRequestsPerWindow;
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    // Remove entries older than window
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (timestamp < cutoff) {
        this.timestamps.delete(key);
        this.counters.delete(key);
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Middleware options
export interface MiddlewareOptions<TInput, TOutput> {
  name: string;
  inputSchema?: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;
  requireAuth?: boolean;
  rateLimit?: {
    enabled: boolean;
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (data: any, context: any) => string;
  };
  cacheResults?: boolean;
  timeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  onSuccess?: (result: TOutput, data: TInput, context: any, timing: number) => void;
  onError?: (error: any, data: any, context: any, timing: number) => void;
}

// Result cache for function results
class ResultCache {
  private cache = new Map<string, { result: any, timestamp: number }>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 60000) {
    this.ttlMs = ttlMs;
    
    // Clean up expired cache entries periodically
    setInterval(() => this.cleanup(), ttlMs);
  }

  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.result;
  }

  set(key: string, result: any): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  private cleanup() {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}

// Global result cache
const resultCache = new ResultCache();

/**
 * Create a middleware-wrapped Firebase Function
 * @param options Middleware options
 * @param handler The function handler
 * @returns A Firebase Function with middleware applied
 */
export function createFunction<TInput = any, TOutput = any>(
  options: MiddlewareOptions<TInput, TOutput>,
  handler: (data: TInput, context: functions.https.CallableContext) => Promise<TOutput>
): functions.HttpsFunction & functions.Runnable<any> {
  // Create the callable function
  return functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const startTime = Date.now();
    const functionName = options.name;
    
    try {
      // Step 1: Check authentication if required
      if (options.requireAuth && !context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'This function requires authentication'
        );
      }
      
      // Step 2: Check rate limiting if enabled
      if (options.rateLimit?.enabled) {
        // Generate rate limit key (default: user ID or IP)
        const keyGenerator = options.rateLimit.keyGenerator || 
                            ((data, context) => context.auth?.uid || context.rawRequest.ip || 'anonymous');
        const rateLimitKey = `${functionName}:${keyGenerator(data, context)}`;
        
        // Check if rate limited
        if (rateLimiter.isRateLimited(rateLimitKey)) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Too many requests, please try again later'
          );
        }
      }
      
      // Step 3: Validate input schema if provided
      let validatedInput: TInput = data;
      if (options.inputSchema) {
        try {
          if (options.inputSchema._def.typeName === 'ZodObject') {
            // For object schemas, validate using Zod directly
            validatedInput = options.inputSchema.parse(data);
          } else {
            // For named schemas, use the registry
            const schemaName = options.inputSchema._def.description || 'input';
            validatedInput = schemaRegistry.validate(schemaName, data);
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Format Zod validation errors
            const formattedErrors = error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code
            }));
            
            throw new functions.https.HttpsError(
              'invalid-argument',
              'Validation failed',
              { errors: formattedErrors }
            );
          }
          
          // Re-throw other errors
          throw error;
        }
      }
      
      // Step 4: Check cache if enabled
      if (options.cacheResults) {
        const cacheKey = `${functionName}:${JSON.stringify(validatedInput)}:${context.auth?.uid || 'anonymous'}`;
        const cachedResult = resultCache.get(cacheKey);
        
        if (cachedResult !== undefined) {
          // Log cache hit
          if (options.logLevel === 'debug') {
            functions.logger.debug(`Cache hit for ${functionName}`, { cacheKey });
          }
          
          return cachedResult;
        }
      }
      
      // Step 5: Execute the handler with monitoring
      const transaction = errorTracking.startTransaction(functionName, 'function');
      
      try {
        // Set additional transaction context
        transaction.setTag('auth.uid', context.auth?.uid || 'anonymous');
        transaction.setTag('function.name', functionName);
        
        // Execute the handler
        const result = await Promise.race([
          handler(validatedInput, context),
          // Add timeout if specified
          ...(options.timeout ? [
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error(`Function timed out after ${options.timeout}ms`)), options.timeout)
            )
          ] : [])
        ]);
        
        // Step 6: Validate output schema if provided
        let validatedOutput = result;
        if (options.outputSchema) {
          try {
            if (options.outputSchema._def.typeName === 'ZodObject') {
              // For object schemas, validate using Zod directly
              validatedOutput = options.outputSchema.parse(result);
            } else {
              // For named schemas, use the registry
              const schemaName = options.outputSchema._def.description || 'output';
              validatedOutput = schemaRegistry.validate(schemaName, result);
            }
          } catch (error) {
            functions.logger.error(`Output validation failed for ${functionName}`, error);
            
            if (error instanceof z.ZodError) {
              // Format Zod validation errors
              transaction.setTag('error', 'true');
              transaction.setTag('error.type', 'output_validation');
              
              throw new functions.https.HttpsError(
                'internal',
                'The function response failed validation. This is a server error, not a client error.',
                { 
                  function: functionName,
                  message: 'Output validation failed'
                }
              );
            }
            
            // Re-throw other errors
            throw error;
          }
        }
        
        // Step 7: Cache result if enabled
        if (options.cacheResults) {
          const cacheKey = `${functionName}:${JSON.stringify(validatedInput)}:${context.auth?.uid || 'anonymous'}`;
          resultCache.set(cacheKey, validatedOutput);
        }
        
        // Step 8: Log success and execute success callback
        const executionTime = Date.now() - startTime;
        transaction.setTag('execution_time_ms', executionTime.toString());
        
        if (options.logLevel === 'debug' || options.logLevel === 'info') {
          functions.logger.info(`Function ${functionName} completed successfully`, {
            executionTime,
            authenticated: !!context.auth,
            userId: context.auth?.uid
          });
        }
        
        // Execute success callback if provided
        if (options.onSuccess) {
          try {
            options.onSuccess(validatedOutput, validatedInput, context, executionTime);
          } catch (callbackError) {
            functions.logger.error(`Error in onSuccess callback for ${functionName}`, callbackError);
          }
        }
        
        // Mark transaction as successful and finish
        transaction.finish();
        
        return validatedOutput;
      } catch (error) {
        // Step 9: Handle errors
        const executionTime = Date.now() - startTime;
        
        // Log error
        functions.logger.error(`Error executing function ${functionName}`, error);
        
        // Set transaction error
        transaction.setTag('error', 'true');
        transaction.setTag('execution_time_ms', executionTime.toString());
        
        // Execute error callback if provided
        if (options.onError) {
          try {
            options.onError(error, validatedInput, context, executionTime);
          } catch (callbackError) {
            functions.logger.error(`Error in onError callback for ${functionName}`, callbackError);
          }
        }
        
        // Capture error with additional context
        errorTracking.captureException(error, {
          function: functionName,
          input: validatedInput,
          user: context.auth?.uid,
          executionTime
        });
        
        // Finish transaction
        transaction.finish();
        
        // Convert to HttpsError if needed
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        
        // Convert generic errors to HttpsError
        throw new functions.https.HttpsError(
          'internal',
          error.message || 'An unexpected error occurred',
          { function: functionName }
        );
      }
    } catch (error) {
      // Handle outer middleware errors
      const executionTime = Date.now() - startTime;
      
      functions.logger.error(`Middleware error in function ${functionName}`, error);
      
      // Capture outer errors
      errorTracking.captureException(error, {
        function: functionName,
        layer: 'middleware',
        executionTime
      });
      
      // Convert to HttpsError if needed
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Convert generic errors to HttpsError
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'An unexpected error occurred in function middleware',
        { function: functionName }
      );
    }
  });
}

/**
 * Create a HTTP function with middleware
 * @param options Middleware options
 * @param handler The function handler
 * @returns A Firebase HTTP Function with middleware applied
 */
export function createHttpFunction(
  options: MiddlewareOptions<any, any>,
  handler: (req: functions.https.Request, res: functions.Response) => Promise<void>
): functions.HttpsFunction {
  return functions.https.onRequest(async (req, res) => {
    const startTime = Date.now();
    const functionName = options.name;
    
    // Create a transaction for monitoring
    const transaction = errorTracking.startTransaction(functionName, 'http');
    
    try {
      // Set transaction context
      transaction.setTag('http.method', req.method);
      transaction.setTag('http.path', req.path);
      
      // Execute handler
      await handler(req, res);
      
      // Log completion
      const executionTime = Date.now() - startTime;
      transaction.setTag('execution_time_ms', executionTime.toString());
      transaction.setTag('http.status_code', res.statusCode.toString());
      
      if (options.logLevel === 'debug' || options.logLevel === 'info') {
        functions.logger.info(`HTTP function ${functionName} completed`, {
          executionTime,
          statusCode: res.statusCode,
          method: req.method,
          path: req.path
        });
      }
    } catch (error) {
      // Handle errors
      const executionTime = Date.now() - startTime;
      
      functions.logger.error(`Error in HTTP function ${functionName}`, error);
      
      // Set transaction error
      transaction.setTag('error', 'true');
      transaction.setTag('execution_time_ms', executionTime.toString());
      
      // Capture error
      errorTracking.captureException(error, {
        function: functionName,
        method: req.method,
        path: req.path,
        executionTime
      });
      
      // Send error response if headers not sent yet
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message || 'An unexpected error occurred'
        });
      }
    } finally {
      // Finish transaction
      transaction.finish();
    }
  });
}