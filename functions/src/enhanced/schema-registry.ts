/**
 * Enhanced Schema Registry
 * 
 * A centralized registry for Zod schemas with runtime validation optimization
 * and TypeScript type generation.
 */
import { z } from 'zod';
import { generateSchema, zodToJsonSchema } from 'zod-to-ts';
import * as functions from 'firebase-functions';

// Cache for schema validation results (LRU cache implementation)
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class ValidationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 100, ttlMinutes = 10) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  private findOldestEntry(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // For debugging and monitoring
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs
    };
  }
}

// Singleton instance of the validation cache
const validationCache = new ValidationCache();

/**
 * Schema Registry to manage and validate schemas
 */
export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private schemas = new Map<string, z.ZodType<any>>();
  private jsonSchemas = new Map<string, any>();
  
  private constructor() {}

  /**
   * Get singleton instance of SchemaRegistry
   */
  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  /**
   * Register a schema with the registry
   * @param name Unique name for the schema
   * @param schema Zod schema
   * @returns The registered schema
   */
  public register<T extends z.ZodType<any>>(name: string, schema: T): T {
    if (this.schemas.has(name)) {
      functions.logger.warn(`Schema with name '${name}' already exists. Overwriting.`);
    }
    
    // Register the schema
    this.schemas.set(name, schema);
    
    // Generate JSON schema for OpenAPI docs
    try {
      const jsonSchema = zodToJsonSchema(schema);
      this.jsonSchemas.set(name, jsonSchema);
    } catch (error) {
      functions.logger.error(`Failed to generate JSON schema for '${name}'`, error);
    }
    
    return schema;
  }

  /**
   * Get a registered schema by name
   * @param name The name of the schema to retrieve
   * @returns The schema or undefined if not found
   */
  public getSchema<T extends z.ZodType<any>>(name: string): T | undefined {
    return this.schemas.get(name) as T | undefined;
  }

  /**
   * Get all registered schema names
   * @returns Array of schema names
   */
  public getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Get JSON schema for OpenAPI documentation
   * @param name The name of the schema
   * @returns JSON schema or undefined if not found
   */
  public getJsonSchema(name: string): any | undefined {
    return this.jsonSchemas.get(name);
  }

  /**
   * Get all JSON schemas for OpenAPI documentation
   * @returns Record of schema name to JSON schema
   */
  public getAllJsonSchemas(): Record<string, any> {
    const result: Record<string, any> = {};
    this.jsonSchemas.forEach((schema, name) => {
      result[name] = schema;
    });
    return result;
  }

  /**
   * Validate data against a registered schema with caching
   * @param schemaName The name of the registered schema
   * @param data The data to validate
   * @returns The validated data or throws an error
   */
  public validate<T>(schemaName: string, data: unknown): T {
    const schema = this.getSchema<z.ZodType<T>>(schemaName);
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found in registry`);
    }
    
    // Generate cache key based on schema name and data
    const cacheKey = `${schemaName}:${JSON.stringify(data)}`;
    
    // Check cache first
    const cachedResult = validationCache.get<T>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Perform validation
    try {
      const result = schema.parse(data) as T;
      
      // Cache the result
      validationCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod error into a more user-friendly format
        const formattedError = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
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
   * Get cache statistics for monitoring
   */
  public getCacheStats() {
    return validationCache.getStats();
  }
}

// Export singleton instance
export const schemaRegistry = SchemaRegistry.getInstance();