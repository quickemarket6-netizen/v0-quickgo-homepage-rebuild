/**
 * Single source of truth for the canonical site URL.
 * Set NEXT_PUBLIC_APP_URL in your .env.local / production env.
 * Falls back to quickgo237.com (current live domain).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://www.quickgo237.com"

/** Canonical root without trailing slash */
export const CANONICAL = SITE_URL
