'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

export default function SentryInit() {
  useEffect(() => {
    // Initialize Sentry
    const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
    const ENVIRONMENT = process.env.NODE_ENV || 'development';
    const RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE || '1.0.0';

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
      
      // Only enable Sentry in production
      enabled: ENVIRONMENT !== 'development',
    });
  }, []);

  return null;
}