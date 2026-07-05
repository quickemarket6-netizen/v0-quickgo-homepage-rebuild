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

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    if (!ensureVapid()) return

    const supabase = await createClient()
    const { data: subs } = await supabase.rpc("get_push_subscriptions", { p_user_id: userId })
    if (!subs || subs.length === 0) return

    const json = JSON.stringify(payload)
    await Promise.allSettled(
      (subs as { endpoint: string; p256dh: string; auth: string }[]).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            json,
          )
        } catch (err) {
          // 404/410 : abonnement expiré → purge
          const status = (err as { statusCode?: number })?.statusCode
          if (status === 404 || status === 410) {
            await supabase.rpc("delete_push_subscription", { p_endpoint: s.endpoint }).then(() => {}, () => {})
          }
        }
      }),
    )
  } catch (err) {
    console.error("[push] envoi échoué:", err)
  }
}
