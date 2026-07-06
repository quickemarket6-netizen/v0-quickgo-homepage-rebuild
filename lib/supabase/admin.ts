import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Client Supabase service-role — contourne le RLS.
 * Réservé aux contextes serveur SANS session utilisateur mais de confiance :
 * webhooks de paiement (CinetPay), tâches système.
 * Ne JAMAIS l'utiliser dans un handler exposé qui agit au nom d'un utilisateur.
 *
 * Requiert SUPABASE_SERVICE_ROLE_KEY (déjà documentée dans .env.example).
 * Retourne null si la clé n'est pas configurée — l'appelant doit gérer le repli.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
