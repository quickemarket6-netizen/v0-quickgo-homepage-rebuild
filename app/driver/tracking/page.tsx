"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { LiveMap } from "@/components/ui/live-map"
import { useDriverBroadcast } from "@/lib/realtime/tracking"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Navigation,
  Power,
  PowerOff,
  Package,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
} from "lucide-react"

type ActiveOrder = {
  id: string
  order_number: string
  status: string
  delivery_address: string | null
  estimated_delivery_time: string | null
  customer: { full_name: string | null; phone: string | null } | null
  items: { product_name: string; quantity: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending:    "En attente",
  confirmed:  "Confirmée",
  preparing:  "En préparation",
  ready:      "Prête",
  picked_up:  "Récupérée",
  delivering: "En route",
  delivered:  "Livrée",
}

// Statuts conformes à l'enum SQL ("in_transit" n'existe pas)
const ACTIVE_DRIVER_STATUSES = ["ready", "picked_up", "delivering"]

export default function DriverTrackingPage() {
  const [driverId, setDriverId]     = useState<string | null>(null)
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [loading, setLoading]       = useState(true)
  const [statusMsg, setStatusMsg]   = useState<string | null>(null)

  const { isTracking, position, gpsError, start, stop } =
    useDriverBroadcast(activeOrder?.id ?? null, driverId)

  // ── Fetch driver profile + active order ──────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!driver) { setLoading(false); return }
      setDriverId(driver.id)

      // Fetch active order assigned to this driver
      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, delivery_address, estimated_delivery_time,
          customer:profiles!orders_user_id_fkey(full_name, phone),
          items:order_items(product_name, quantity)
        `)
        .eq("driver_id", user.id)   // orders.driver_id référence auth.users(id)
        .in("status", ACTIVE_DRIVER_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1)

      if (orders && orders.length > 0) {
        setActiveOrder(orders[0] as unknown as ActiveOrder)
      }
      setLoading(false)
    }

    init()
  }, [])

  // Update order status
  const updateStatus = async (newStatus: string) => {
    if (!activeOrder) return
    setStatusMsg("Mise à jour…")

    // La livraison passe par le serveur : horodatage, encaissement cash
    // (cash_on_hand + journal), crédit et libération des fonds vendeur.
    if (newStatus === "delivered") {
      const res = await fetch("/api/driver/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: activeOrder.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatusMsg("Erreur: " + (data.error ?? "livraison non confirmée"))
        return
      }
      setActiveOrder(o => o ? { ...o, status: "delivered" } : null)
      setStatusMsg(
        data.cash_on_hand != null
          ? `Livraison confirmée ✓ — Cash en main : ${new Intl.NumberFormat("fr-FR").format(data.cash_on_hand)} FCFA`
          : "Livraison confirmée ✓",
      )
      setTimeout(() => setStatusMsg(null), 5000)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", activeOrder.id)

    if (error) {
      setStatusMsg("Erreur: " + error.message)
    } else {
      setActiveOrder(o => o ? { ...o, status: newStatus } : null)
      setStatusMsg("Statut mis à jour ✓")
      setTimeout(() => setStatusMsg(null), 3000)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Tracking livreur</h1>
          <p className="text-sm text-muted-foreground">
            Diffusez votre position GPS en temps réel
          </p>
        </motion.div>

        {/* GPS toggle card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/50 bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isTracking ? "bg-green-500/20" : "bg-muted"
              }`}>
                <Navigation className={`h-5 w-5 ${isTracking ? "text-green-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Position GPS</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isTracking
                    ? <><Wifi className="h-3.5 w-3.5 text-green-400" /><span className="text-xs text-green-400">En diffusion</span></>
                    : <><WifiOff className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Arrêté</span></>
                  }
                </div>
              </div>
            </div>
            <Button
              onClick={isTracking ? stop : start}
              disabled={!driverId || !activeOrder}
              className={isTracking
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              }
              variant="outline"
            >
              {isTracking
                ? <><PowerOff className="h-4 w-4 mr-2" />Arrêter</>
                : <><Power className="h-4 w-4 mr-2" />Démarrer</>
              }
            </Button>
          </div>

          {/* GPS error */}
          {gpsError && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {gpsError}
            </div>
          )}

          {/* Current coordinates */}
          {position && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </span>
              <span className="ml-auto text-[10px]">Broadcast toutes les 3s · DB flush 30s</span>
            </div>
          )}

          {!activeOrder && !loading && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Aucune commande active à suivre pour l&apos;instant.
            </p>
          )}
        </motion.div>

        {/* Live map */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden border border-border/50"
        >
          <LiveMap
            center={position ?? [3.848, 11.5021]}
            zoom={position ? 16 : 13}
            driverPosition={position}
            className="h-[320px]"
          />
        </motion.div>

        {/* Active order card */}
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border/50 bg-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">{activeOrder.order_number}</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {STATUS_LABELS[activeOrder.status] ?? activeOrder.status}
              </span>
            </div>

            {activeOrder.delivery_address && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 shrink-0">
                  <MapPin className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="text-sm font-medium text-foreground">{activeOrder.delivery_address}</p>
                </div>
              </div>
            )}

            {activeOrder.estimated_delivery_time && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Heure estimée</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(activeOrder.estimated_delivery_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )}

            {activeOrder.items?.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {activeOrder.items.map(i => `${i.quantity}× ${i.product_name}`).join(", ")}
              </p>
            )}

            {/* Status actions */}
            <div className="pt-2 border-t border-border/50 space-y-2">
              {statusMsg && (
                <p className="text-xs text-center text-muted-foreground">{statusMsg}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {activeOrder.status === "ready" && (
                  <Button
                    className="col-span-2"
                    onClick={() => updateStatus("picked_up")}
                  >
                    📦 Commande récupérée
                  </Button>
                )}
                {activeOrder.status === "picked_up" && (
                  <Button
                    className="col-span-2"
                    onClick={() => updateStatus("delivering")}
                  >
                    🛵 En route pour livraison
                  </Button>
                )}
                {activeOrder.status === "delivering" && (
                  <Button
                    className="col-span-2 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    variant="outline"
                    onClick={() => { updateStatus("delivered"); stop() }}
                  >
                    ✅ Livraison confirmée
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
