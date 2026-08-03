import webpush from "web-push"
import { createClient } from "@/lib/supabase/server"

// Envoi de notifications push web (VAPID) côté serveur.
// Best-effort : ne lève jamais — une notification push perdue ne doit pas
// faire échouer le flux métier (commande, livraison, annulation…).

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let vapidConfigured = false
function ensureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:support@quickgo237.com",
      publicKey,
      privateKey,
    )
    vapidConfigured = true
  }
  return true
}

export interface WebPushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/**
 * Envoi vers un abonnement précis. Voie d'envoi unique du projet : tout passe
 * par ici, pour n'avoir qu'une configuration VAPID et qu'un traitement des
 * abonnements expirés.
 *
 * `expired` signale un abonnement révoqué (404/410) que l'appelant doit purger.
 */
export async function sendPushToSubscription(
  subscription: WebPushSubscription,
  payload: PushPayload,
): Promise<{ success: boolean; expired: boolean }> {
  if (!ensureVapid()) return { success: false, expired: false }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { success: true, expired: false }
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode
    return { success: false, expired: status === 404 || status === 410 }
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  try {
    if (!ensureVapid()) return { sent: 0, failed: 0 }

    const supabase = await createClient()
    const { data: subs } = await supabase.rpc("get_push_subscriptions", { p_user_id: userId })
    if (!subs || subs.length === 0) return { sent: 0, failed: 0 }

    const results = await Promise.all(
      (subs as { endpoint: string; p256dh: string; auth: string }[]).map(async (s) => {
        const res = await sendPushToSubscription(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
        if (res.expired) {
          await supabase.rpc("delete_push_subscription", { p_endpoint: s.endpoint }).then(() => {}, () => {})
        }
        return res.success
      }),
    )

    return {
      sent:   results.filter(Boolean).length,
      failed: results.filter((ok) => !ok).length,
    }
  } catch (err) {
    console.error("[push] envoi échoué:", err)
    return { sent: 0, failed: 0 }
  }
}
