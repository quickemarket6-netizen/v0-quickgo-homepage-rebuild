/**
 * Single source of truth for the canonical site URL.
 * Set NEXT_PUBLIC_APP_URL in your .env.local / production env.
 *
 * Cette valeur alimente `metadataBase: new URL(SITE_URL)` dans le layout racine.
 * `new URL()` lève sur une chaîne vide ou sans protocole, et une exception au
 * niveau module du layout fait tomber toute l'application sur global-error.tsx
 * — pas seulement la page visitée. La normalisation ci-dessous rend ce crash
 * impossible quelle que soit la valeur configurée.
 */
const FALLBACK_URL = "https://quickgo237.com"

function normalizeSiteUrl(raw: string | undefined): string {
  const trimmed = raw?.trim().replace(/\/+$/, "")
  if (!trimmed) return FALLBACK_URL

  // Une valeur sans protocole ("quickgo237.com") ferait échouer new URL().
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return FALLBACK_URL
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL)

/** Canonical root without trailing slash */
export const CANONICAL = SITE_URL
