"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Search, Loader2, MapPin, Clock, CheckCircle2, XCircle, Bike } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PublicParcel {
  tracking_number: string
  status: string
  pickup_address: string | null
  delivery_address: string | null
  estimated_arrival: string | null
  created_at: string
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: typeof Clock; step: number }> = {
  pending:   { label: "En attente d'un livreur", color: "text-amber-400",  icon: Clock,        step: 1 },
  accepted:  { label: "Livreur en route vers le point de retrait", color: "text-blue-400", icon: Bike, step: 2 },
  picked_up: { label: "Colis récupéré — en cours de livraison", color: "text-cyan-400", icon: Package, step: 3 },
  delivered: { label: "Livré", color: "text-green-400", icon: CheckCircle2, step: 4 },
  cancelled: { label: "Annulée", color: "text-red-400", icon: XCircle, step: 0 },
}

// Suivi public d'un colis par numéro QGD-… — aucun compte requis.
// S'appuie sur GET /api/delivery/[tracking_number] (données non
// personnelles uniquement côté serveur).
export function PublicParcelTracker() {
  const [number, setNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parcel, setParcel] = useState<PublicParcel | null>(null)

  const track = async () => {
    const tn = number.trim().toUpperCase()
    if (!tn) return
    if (!tn.startsWith("QGD-")) {
      setError("Le numéro de suivi commence par QGD- (reçu par SMS à la création de la livraison).")
      setParcel(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/delivery/${encodeURIComponent(tn)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setParcel(null)
        setError(data.error ?? "Aucune livraison trouvée pour ce numéro.")
        return
      }
      setParcel(data)
    } catch {
      setError("Erreur réseau, réessayez.")
    } finally {
      setLoading(false)
    }
  }

  const cfg = parcel ? (STATUS_CFG[parcel.status] ?? STATUS_CFG.pending) : null

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <h2 className="font-semibold text-foreground flex items-center gap-2 mb-1">
        <Package className="w-5 h-5 text-primary" /> Suivre un colis
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Entrez votre numéro de suivi QGD-… — aucun compte nécessaire.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={number}
            onChange={(e) => { setNumber(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === "Enter" && track()}
            placeholder="Ex : QGD-M9X2K4"
            className="pl-9 h-11 rounded-xl font-mono uppercase"
          />
        </div>
        <Button onClick={track} disabled={loading || !number.trim()} className="h-11 rounded-xl px-5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suivre"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}

      <AnimatePresence>
        {parcel && cfg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary text-sm">{parcel.tracking_number}</span>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.color}`}>
                <cfg.icon className="w-4 h-4" /> {cfg.label}
              </span>
            </div>

            {/* Progression */}
            {parcel.status !== "cancelled" && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${
                    s <= cfg.step ? "bg-primary" : "bg-border"
                  }`} />
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              {parcel.pickup_address && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />
                  Retrait : <span className="text-foreground">{parcel.pickup_address}</span>
                </p>
              )}
              {parcel.delivery_address && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
                  Destination : <span className="text-foreground">{parcel.delivery_address}</span>
                </p>
              )}
              {parcel.estimated_arrival && parcel.status !== "delivered" && parcel.status !== "cancelled" && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Arrivée estimée : <span className="text-foreground">
                    {new Date(parcel.estimated_arrival).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
