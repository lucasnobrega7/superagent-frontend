'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/browser';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
      <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
      <p className="mb-4">We've been notified of the issue and are working to fix it.</p>
      {error.message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 mb-4 max-w-xl mx-auto">
          <p className="text-sm">{error.message}</p>
        </div>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}