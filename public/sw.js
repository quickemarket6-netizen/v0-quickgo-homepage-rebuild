// QuickGo Service Worker — offline shell + notifications push
const CACHE = "quickgo-v2"
const OFFLINE_URL = "/"

const PRECACHE = [
  "/",
  "/site.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
]

// ── Notifications push (Web Push / VAPID) ─────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { /* payload non-JSON */ }

  const title = data.title || "QuickGo"
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/notifications" },
    vibrate: [100, 50, 100],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/notifications"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (new URL(win.url).origin === self.location.origin && "focus" in win) {
          win.navigate(url)
          return win.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  // Skip cross-origin, API, and Supabase requests
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(OFFLINE_URL))
    })
  )
})
