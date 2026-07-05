"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Package, Clock, CheckCircle, XCircle, Truck, ChevronRight,
  Phone, Star, RotateCcw, ArrowLeft, RefreshCw, MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock; step?: number }> = {
  pending:    { label: "En attente",      color: "text-yellow-400",  bg: "bg-yellow-500/20",  icon: Clock,         step: 1 },
  confirmed:  { label: "Confirmé",        color: "text-blue-400",    bg: "bg-blue-500/20",    icon: CheckCircle,   step: 2 },
  preparing:  { label: "En préparation",  color: "text-purple-400",  bg: "bg-purple-500/20",  icon: Package,       step: 3 },
  ready:      { label: "Prêt",            color: "text-cyan-400",    bg: "bg-cyan-500/20",    icon: CheckCircle,   step: 4 },
  delivering: { label: "En livraison",    color: "text-quickgo-blue", bg: "bg-quickgo-blue/20", icon: Truck,        step: 5 },
  delivered:  { label: "Livré",           color: "text-green-400",   bg: "bg-green-500/20",   icon: CheckCircle,   step: 6 },
  cancelled:  { label: "Annulé",          color: "text-red-400",     bg: "bg-red-500/20",     icon: XCircle },
}
const STEPS = ["En attente", "Confirmé", "Préparation", "Prêt", "En livraison", "Livré"]

interface OrderItem { product_name: string; quantity: number; unit_price: number; total_price: number }
interface Order {
  id: string; order_number: string; status: string
  total_amount: number; delivery_fee: number; subtotal: number
  created_at: string; estimated_delivery_time: string | null
  delivery_address: { street?: string; city?: string } | string | null
  vendor: { id: string; name: string; phone: string | null; logo_url: string | null } | null
  driver: { id: string; rating: number | null; user: { full_name: string; phone: string; avatar_url: string | null } | null } | null
  items: OrderItem[]
}

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function deliveryAddr(addr: Order["delivery_address"]) {
  if (!addr) return null
  if (typeof addr === "string") return addr
  return [addr.street, addr.city].filter(Boolean).join(", ")
}

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"active" | "done" | "cancelled">("active")
  const [expanded, setExpanded] = useState<string | null>(null)

  // Dépôt d'avis (commandes livrées)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())

  const submitReview = async (orderId: string) => {
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, rating: reviewRating, comment: reviewComment || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // 409 = déjà noté : on masque le formulaire comme un succès
        if (res.status === 409) {
          setReviewedIds((prev) => new Set(prev).add(orderId))
          setReviewingId(null)
          return
        }
        setReviewError(data.error ?? "Impossible d'envoyer l'avis.")
        return
      }
      setReviewedIds((prev) => new Set(prev).add(orderId))
      setReviewingId(null)
      setReviewComment("")
      setReviewRating(5)
    } finally {
      setReviewSubmitting(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/orders")
      if (res.ok) setOrders(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status))
  const done = orders.filter((o) => o.status === "delivered")
  const cancelled = orders.filter((o) => o.status === "cancelled")
  const tabOrders = tab === "active" ? active : tab === "done" ? done : cancelled

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <Link href="/marketplace" className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-bold">Mes Commandes</h1>
          <p className="text-xs text-muted-foreground">{orders.length} commandes au total</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchOrders}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-card/50 rounded-xl p-1">
          {[
            { key: "active",    label: "En cours",   count: active.length },
            { key: "done",      label: "Terminées",  count: done.length },
            { key: "cancelled", label: "Annulées",   count: cancelled.length },
          ].map((t) => (
            <button key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === t.key ? "bg-quickgo-blue text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-white/10"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-card/30 animate-pulse mb-3" />
          ))
        ) : tabOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune commande dans cet onglet</p>
            <Link href="/marketplace">
              <Button className="mt-4 rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">Faire une commande</Button>
            </Link>
          </div>
        ) : tabOrders.map((order) => {
          const cfg = STATUS_CONFIG[order.status]
          const StatusIcon = cfg?.icon ?? Package
          const isExpanded = expanded === order.id
          const step = cfg?.step ?? 0

          return (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-3 bg-card/50 rounded-2xl border border-border/30 overflow-hidden"
            >
              {/* Header row */}
              <button className="w-full p-4 text-left" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-bold text-quickgo-blue text-sm">#{order.order_number}</p>
                    <p className="text-white font-medium text-sm mt-0.5">{(order.vendor as { name?: string } | null)?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.bg ?? ""} ${cfg?.color ?? ""}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg?.label ?? order.status}
                    </span>
                    <p className="text-white font-bold mt-1">{formatCFA(order.total_amount)}</p>
                  </div>
                </div>

                {/* Progress bar (active orders only) */}
                {order.status !== "cancelled" && step > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1">
                      {STEPS.map((s, i) => (
                        <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${
                          i < step ? "bg-quickgo-blue" : "bg-white/10"
                        }`} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] text-muted-foreground">Passée</span>
                      <span className="text-[9px] text-muted-foreground">Livrée</span>
                    </div>
                  </div>
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
                  {/* Items */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Articles commandés</p>
                    {(order.items ?? []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                        <p className="text-sm text-white">{item.product_name} <span className="text-muted-foreground">×{item.quantity}</span></p>
                        <p className="text-sm text-white font-medium">{formatCFA(item.total_price)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-white/5 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sous-total</span><span>{formatCFA(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Livraison</span><span>{formatCFA(order.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white font-bold pt-1 border-t border-border/20">
                      <span>Total</span><span>{formatCFA(order.total_amount)}</span>
                    </div>
                  </div>

                  {/* Delivery address */}
                  {deliveryAddr(order.delivery_address) && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {deliveryAddr(order.delivery_address)}
                    </p>
                  )}

                  {/* Driver */}
                  {order.driver && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(order.driver.user?.full_name ?? "L").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{order.driver.user?.full_name ?? "Livreur"}</p>
                        {order.driver.rating != null && (
                          <p className="text-xs text-yellow-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {order.driver.rating.toFixed(1)}
                          </p>
                        )}
                      </div>
                      {order.driver.user?.phone && (
                        <a href={`tel:${order.driver.user.phone}`}
                          className="p-2 rounded-xl bg-quickgo-blue/20 hover:bg-quickgo-blue/30 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-quickgo-blue" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Avis client — commandes livrées uniquement */}
                  {order.status === "delivered" && !reviewedIds.has(order.id) && (
                    reviewingId === order.id ? (
                      <div className="p-3 bg-white/5 rounded-xl space-y-3">
                        <p className="text-sm font-medium text-white">Notez votre commande</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setReviewRating(n)}
                              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
                              <Star className={`w-6 h-6 transition-colors ${n <= reviewRating ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Partagez votre expérience (optionnel)…"
                          rows={2}
                          maxLength={1000}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border/50 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-quickgo-blue/50 resize-none"
                        />
                        {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90"
                            onClick={() => submitReview(order.id)} disabled={reviewSubmitting}>
                            {reviewSubmitting ? "Envoi…" : "Envoyer l'avis"}
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full"
                            onClick={() => { setReviewingId(null); setReviewError(null) }}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : null
                  )}
                  {order.status === "delivered" && reviewedIds.has(order.id) && (
                    <p className="text-xs text-green-400 flex items-center gap-1.5 px-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Merci pour votre avis !
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === "delivered" && !reviewedIds.has(order.id) && reviewingId !== order.id && (
                      <Button size="sm" variant="outline" className="flex-1 rounded-full gap-1"
                        onClick={() => { setReviewingId(order.id); setReviewError(null) }}>
                        <Star className="w-3.5 h-3.5" /> Noter
                      </Button>
                    )}
                    {order.status === "delivered" && (
                      <Button size="sm" variant="outline" className="flex-1 rounded-full gap-1">
                        <RotateCcw className="w-3.5 h-3.5" /> Commander à nouveau
                      </Button>
                    )}
                    {!["delivered", "cancelled"].includes(order.status) && (
                      <Link href="/tracking" className="flex-1">
                        <Button size="sm" className="w-full rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90 gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Suivre en direct
                        </Button>
                      </Link>
                    )}
                    <Button size="sm" variant="outline" className="rounded-full gap-1">
                      <ChevronRight className="w-3.5 h-3.5" /> Détails
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
