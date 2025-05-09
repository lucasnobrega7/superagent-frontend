/**
 * Enhanced Functions System Tests
 */
import { schemaRegistry } from '../schema-registry';
import { errorTracking } from '../error-tracking';
import { z } from 'zod';
import * as functions from 'firebase-functions';

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  https: {
    HttpsError: jest.fn((code, message, details) => ({
      code,
      message,
      details,
      httpErrorCode: jest.fn(() => 500)
    })),
    onCall: jest.fn(handler => handler),
    onRequest: jest.fn(handler => handler),
  }
}));

// Mock Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
    setTag: jest.fn(),
    setData: jest.fn(),
    startChild: jest.fn(() => ({
      finish: jest.fn()
    }))
  })),
  configureScope: jest.fn(callback => callback({
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setUser: jest.fn(),
    setSpan: jest.fn()
  })),
  setUser: jest.fn()
}));

describe('Schema Registry', () => {
  beforeEach(() => {
    // Clear any registered schemas between tests
    (schemaRegistry as any).schemas = new Map();
    (schemaRegistry as any).jsonSchemas = new Map();
  });

  test('Should register a schema', () => {
    const schema = z.object({
      name: z.string(),
      value: z.number()
    });
    
    const registered = schemaRegistry.register('TestSchema', schema);
    expect(registered).toBe(schema);
    
    const retrieved = schemaRegistry.getSchema('TestSchema');
    expect(retrieved).toBe(schema);
  });

  test('Should validate data against a registered schema', () => {
    const schema = z.object({
      name: z.string(),
      value: z.number()
    });
    
    schemaRegistry.register('TestSchema', schema);
    
    const validData = { name: 'test', value: 42 };
    const result = schemaRegistry.validate('TestSchema', validData);
    
    expect(result).toEqual(validData);
  });

  test('Should throw on validation failure', () => {
    const schema = z.object({
      name: z.string(),
      value: z.number()
    });
    
    schemaRegistry.register('TestSchema', schema);
    
    const invalidData = { name: 'test', value: 'not-a-number' };
    
    expect(() => {
      schemaRegistry.validate('TestSchema', invalidData);
    }).toThrow(functions.https.HttpsError);
  });

  test('Should generate JSON schema for OpenAPI', () => {
    const schema = z.object({
      name: z.string(),
      value: z.number()
    });
    
    schemaRegistry.register('TestSchema', schema);
    
    const jsonSchema = schemaRegistry.getJsonSchema('TestSchema');
    expect(jsonSchema).toBeDefined();
    expect(jsonSchema.properties).toBeDefined();
    expect(jsonSchema.properties.name).toBeDefined();
    expect(jsonSchema.properties.value).toBeDefined();
  });
});

describe('Error Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset error tracking state
    (errorTracking as any).initialized = false;
  });

  test('Should initialize without errors', () => {
    errorTracking.initialize({
      enabled: true,
      environment: 'test',
      sampleRate: 1.0
    });
    
    expect((errorTracking as any).initialized).toBe(true);
  });

  test('Should capture exceptions with context', () => {
    errorTracking.initialize({
      enabled: true,
      environment: 'test',
      sampleRate: 1.0
    });
    
    const error = new Error('Test error');
    const context = { userId: '123', operation: 'test' };
    
    errorTracking.captureException(error, context);
    
    // Check if Sentry was called
    expect(require('@sentry/node').captureException).toHaveBeenCalledWith(error);
  });

  test('Should create performance transactions', () => {
    errorTracking.initialize({
      enabled: true,
      environment: 'test',
      sampleRate: 1.0
    });
    
    const transaction = errorTracking.startTransaction('test-operation');
    
    expect(transaction).toBeDefined();
    expect(transaction.finish).toBeDefined();
    
    // Finish transaction
    transaction.finish();
  });

  test('Should wrap functions for error tracking', async () => {
    errorTracking.initialize({
      enabled: true,
      environment: 'test',
      sampleRate: 1.0
    });
    
    const mockFn = jest.fn().mockResolvedValue('result');
    const wrappedFn = errorTracking.trackFunction(mockFn, 'test-function');
    
    // Execute wrapped function
    const result = await wrappedFn('arg1', 'arg2');
    
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  test('Should track errors in wrapped functions', async () => {
    errorTracking.initialize({
      enabled: true,
      environment: 'test',
      sampleRate: 1.0
    });
    
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = errorTracking.trackFunction(mockFn, 'test-function');
    
    // Execute wrapped function
    try {
      await wrappedFn('arg1', 'arg2');
      fail('Should have thrown an error');
    } catch (e) {
      expect(e).toBe(error);
    }
    
    // Check if error was captured
    expect(require('@sentry/node').captureException).toHaveBeenCalled();
  });
});

// More tests can be added for other components