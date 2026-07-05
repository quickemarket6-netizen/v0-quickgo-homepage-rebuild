"use client"

// Abonnement aux notifications push côté navigateur (Web Push / VAPID).
// Le service worker /sw.js reçoit les événements "push".

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function pushSupported(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" })
  } catch {
    return null
  }
}

export async function getPushState(): Promise<"unsupported" | "denied" | "subscribed" | "unsubscribed"> {
  if (!pushSupported()) return "unsupported"
  if (Notification.permission === "denied") return "denied"
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? "subscribed" : "unsubscribed"
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: "Notifications non supportées par ce navigateur." }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return { ok: false, error: "Clé VAPID publique manquante (NEXT_PUBLIC_VAPID_PUBLIC_KEY)." }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return { ok: false, error: "Autorisation refusée." }

  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registerServiceWorker())
  if (!reg) return { ok: false, error: "Service worker indisponible." }
  await navigator.serviceWorker.ready

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body.error ?? "Enregistrement de l'abonnement échoué." }
  }
  return { ok: true }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" }).catch(() => {})
    await sub.unsubscribe()
  }
  return { ok: true }
}
