// Garde commun des endpoints IA : authentification, rate limiting et
// validation du modèle demandé contre la liste officielle AI_MODELS.

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/payments/security"
import { AI_MODELS } from "@/lib/ai/multi-assistant"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

const ALLOWED_MODEL_IDS = new Set(AI_MODELS.map((m) => m.id))

// 20 requêtes/minute par utilisateur — large pour une conversation,
// bloquant pour un scraper.
const AI_RATE_LIMIT = { maxRequests: 20, windowMs: 60 * 1000 }

type GuardOk = { ok: true; user: User; supabase: SupabaseClient }
type GuardFail = { ok: false; response: Response }

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function isAllowedModel(modelId: string): boolean {
  return ALLOWED_MODEL_IDS.has(modelId)
}

export async function guardAIRequest(model: string): Promise<GuardOk | GuardFail> {
  if (!isAllowedModel(model)) {
    return { ok: false, response: jsonError("Modèle IA non autorisé.", 400) }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      response: jsonError("Connectez-vous pour utiliser l'assistant IA.", 401),
    }
  }

  const limit = await checkRateLimit(`ai:${user.id}`, AI_RATE_LIMIT)
  if (!limit.allowed) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))),
          },
        },
      ),
    }
  }

  return { ok: true, user, supabase }
}
