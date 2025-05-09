/**
 * Sentry Error Tracking Configuration
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as functions from 'firebase-functions';

// Initialize Sentry for Firebase Functions
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.FUNCTION_VERSION || '1.0.0';

  if (!dsn) {
    functions.logger.warn('Sentry DSN not found. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [
      // Add profiling integration for performance monitoring
      nodeProfilingIntegration(),
    ],
    // Performance monitoring
    tracesSampleRate: 1.0,
    // Profile 100% of transactions in development, less in production
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Only enable in production and staging environments
    enabled: ['production', 'staging'].includes(environment),
  });

  functions.logger.info('Sentry initialized successfully');
}

// Helper to capture exceptions in Firebase Functions
export function captureException(error: any, context?: any) {
  functions.logger.error('Error captured by Sentry:', error);
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to set user information
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

// Helper to add breadcrumbs
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Wrapper for Firebase functions to automatically capture errors
export function withSentry<T>(fn: (...args: any[]) => Promise<T>) {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error);
      throw error;
    }
  };
}