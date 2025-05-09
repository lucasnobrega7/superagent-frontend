import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.SENTRY_RELEASE || '1.0.0';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    integrations: [new Integrations.BrowserTracing()],
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
    
    // Capture errors in Next.js's client and server code
    enabled: ENVIRONMENT !== 'development',
  });
}

// Helper to capture exceptions
export function captureException(error: any, context?: any) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to add breadcrumbs
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Helper to set user information
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

// Helper to clear user information
export function clearUser() {
  Sentry.configureScope((scope) => {
    scope.setUser(null);
  });
}