import * as Sentry from "@sentry/nextjs"

// Server/edge error monitoring. Entirely inert unless SENTRY_DSN is set, so
// local dev and CI builds are unaffected; it activates automatically in any
// environment (e.g. Vercel prod) where the DSN is configured.
export async function register() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  const common = {
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    // Sample a fraction of transactions for performance monitoring.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(common)
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(common)
  }
}

// Captures errors thrown in Server Components, route handlers, and middleware.
// No-op when Sentry was never initialised (no DSN).
export const onRequestError = Sentry.captureRequestError
