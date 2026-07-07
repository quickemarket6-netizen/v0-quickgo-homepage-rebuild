"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

// Catches errors thrown in the root layout itself (where app/error.tsx can't
// render). Must ship its own <html>/<body>. Reports to Sentry when configured.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#0a0a0f", color: "#fff", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>
            Un problème inattendu s&apos;est produit. Nos équipes en sont informées.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: "0.6rem 1.4rem", borderRadius: 9999, border: "none", background: "#C8FF00", color: "#0a0a0f", fontWeight: 600, cursor: "pointer" }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
