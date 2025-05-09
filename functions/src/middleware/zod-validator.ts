/**
 * Zod Validation Middleware
 * 
 * Provides middleware functions for validating function inputs using Zod schemas
 */
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { logger } from 'firebase-functions';

/**
 * Validates data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data or throws an error
 */
export function validateData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error:', error.errors);
      
      // Format error for better readability
      const formattedError = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Validation failed',
        { errors: formattedError }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred during validation'
    );
  }
}

/**
 * Creates a middleware function that validates request data against a schema
 * @param schema The Zod schema to validate against
 * @returns A middleware function
 */
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.infer<T> => {
    return validateData(schema, data);
  };
}

/**
 * Creates a middleware function that validates auth data
 * @param schema The Zod schema to validate against
 * @returns A middleware function
 */
export function validateAuth<T extends z.ZodTypeAny>(schema: T) {
  return (auth: unknown): z.infer<T> => {
    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required'
      );
    }
    
    return validateData(schema, auth);
  };
}