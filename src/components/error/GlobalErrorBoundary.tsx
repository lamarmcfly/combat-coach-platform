'use client';

import { ErrorBoundary } from './ErrorBoundary';
import { ReactNode } from 'react';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Global Error Boundary caught:', error);
          console.error('Component stack:', errorInfo.componentStack);
        }

        // Send to error tracking service in production
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureException(error, {
            extra: {
              componentStack: errorInfo.componentStack,
              url: window.location.href,
            },
          });
        }
      }}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              We&apos;re sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-gray-300"
              >
                Go to Homepage
              </a>
            </div>
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              If this problem persists, please contact{' '}
              <a href="mailto:support@combatcoach.com" className="text-blue-600 hover:underline">
                support@combatcoach.com
              </a>
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
