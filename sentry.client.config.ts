// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Enable Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "system",
      isNameRequired: false,
      isEmailRequired: false,
      showBranding: false,
      triggerLabel: "Report a Bug",
      formTitle: "Report a Bug",
      submitButtonLabel: "Send Report",
      successMessageText: "Thank you for your feedback!",
    }),
  ],

  // Filter out noise
  ignoreErrors: [
    // Browser extensions
    /^ResizeObserver loop limit exceeded/,
    /^ResizeObserver loop completed with undelivered notifications/,
    // Network errors
    /^Failed to fetch/,
    /^NetworkError/,
    /^AbortError/,
    // User aborted
    /^The user aborted a request/,
  ],

  // Set the environment
  environment: process.env.NODE_ENV,

  // Enable only if DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
