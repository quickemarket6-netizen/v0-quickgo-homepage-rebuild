// Sérialisation JSON-LD sûre pour <script type="application/ld+json">.
// JSON.stringify n'échappe pas "</script>" : un titre stocké en base
// contenant cette séquence casserait le tag et exécuterait du JS (XSS stocké).
// Échapper tous les "<" en leur équivalent unicode neutralise "</script>"
// et "<!--" sans changer la sémantique JSON.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
