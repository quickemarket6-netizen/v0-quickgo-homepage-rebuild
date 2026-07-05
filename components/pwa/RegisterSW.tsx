"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/push/client"

// Enregistre le service worker (offline shell + réception des push).
// Monté une fois dans le layout racine ; ne rend rien.
export function RegisterSW() {
  useEffect(() => {
    registerServiceWorker()
  }, [])
  return null
}
