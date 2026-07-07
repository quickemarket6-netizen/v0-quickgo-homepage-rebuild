import * as Sentry from "@sentry/nextjs"

// Client-side error monitoring. Inert unless NEXT_PUBLIC_SENTRY_DSN is set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // Capture a small share of sessions, and all sessions where an error occurs.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })
}

// Instruments client-side navigations for tracing (no-op without a DSN init).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
