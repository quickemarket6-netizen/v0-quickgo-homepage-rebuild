"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BellRing, BellOff, Loader2 } from "lucide-react"
import { getPushState, subscribeToPush, unsubscribeFromPush } from "@/lib/push/client"

type PushState = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed"

// Bannière d'activation des notifications push web.
// Masquée si le navigateur ne les supporte pas.
export function PushToggle() {
  const [state, setState] = useState<PushState>("loading")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"))
  }, [])

  const enable = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await subscribeToPush()
      if (res.ok) setState("subscribed")
      else {
        setError(res.error ?? null)
        setState(await getPushState())
      }
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      await unsubscribeFromPush()
      setState("unsubscribed")
    } finally {
      setBusy(false)
    }
  }

  if (state === "loading" || state === "unsupported") return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 ${
        state === "subscribed"
          ? "bg-green-500/5 border-green-500/20"
          : "bg-quickgo-blue/5 border-quickgo-blue/20"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        state === "subscribed" ? "bg-green-500/15" : "bg-quickgo-blue/15"
      }`}>
        {state === "subscribed"
          ? <BellRing className="w-5 h-5 text-green-500" />
          : <BellOff className="w-5 h-5 text-quickgo-blue" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {state === "subscribed" ? "Notifications push activées" : "Activez les notifications push"}
        </p>
        <p className="text-xs text-muted-foreground">
          {state === "subscribed"
            ? "Vous serez alerté en temps réel : commande confirmée, en route, livrée."
            : state === "denied"
              ? "Notifications bloquées par le navigateur — autorisez-les dans les réglages du site."
              : "Soyez prévenu même quand l'application est fermée (commande, livraison…)."}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      {state !== "denied" && (
        <button
          onClick={state === "subscribed" ? disable : enable}
          disabled={busy}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
            state === "subscribed"
              ? "bg-white/5 text-muted-foreground hover:text-foreground border border-border"
              : "bg-quickgo-blue text-white hover:bg-quickgo-blue/90"
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : state === "subscribed" ? "Désactiver" : "Activer"}
        </button>
      )}
    </motion.div>
  )
}
