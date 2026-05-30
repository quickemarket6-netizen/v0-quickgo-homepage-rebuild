"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  User,
  Phone,
  MessageSquare,
  Star,
  RefreshCw,
  PackageOpen,
} from "lucide-react"

type Order = {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  estimated_delivery_time: string | null
  delivery_address: string | null
  vendor: { id: string; name: string; phone: string | null } | null
  driver: { id: string; rating: number; user: { full_name: string | null; phone: string | null } | null } | null
  items: { id: string; product_name: string; quantity: number; unit_price: number }[]
}

const STATUS_STEPS = [
  { keys: ["pending", "confirmed"],    label: "Commande reçue",           emoji: "📋" },
  { keys: ["preparing", "ready"],      label: "En préparation",            emoji: "👨‍🍳" },
  { keys: ["picked_up"],              label: "Récupérée par le livreur",  emoji: "🛵" },
  { keys: ["in_transit"],             label: "En route vers vous",        emoji: "🚀" },
  { keys: ["delivered"],             label: "Livrée",                    emoji: "✅" },
]

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready", "picked_up", "in_transit"]

const STATUS_LABELS: Record<string, string> = {
  pending:    "En attente",
  confirmed:  "Confirmée",
  preparing:  "En préparation",
  ready:      "Prête",
  picked_up:  "Récupérée",
  in_transit: "En route",
  delivered:  "Livrée",
  cancelled:  "Annulée",
}

function getCurrentStep(status: string) {
  return STATUS_STEPS.findIndex(s => s.keys.includes(status))
}

function isStepCompleted(stepIdx: number, currentStep: number) {
  return stepIdx < currentStep
}

function etaLabel(order: Order) {
  if (!order.estimated_delivery_time) return "~30 min"
  const diff = new Date(order.estimated_delivery_time).getTime() - Date.now()
  if (diff <= 0) return "Imminent"
  const mins = Math.ceil(diff / 60000)
  return mins < 60 ? `${mins} min` : `${Math.ceil(mins / 60)}h`
}

function initials(name: string | null | undefined) {
  if (!name) return "??"
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function TrackingPage() {
  const [orders, setOrders]               = useState<Order[]>([])
  const [selected, setSelected]           = useState<Order | null>(null)
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [search, setSearch]               = useState("")

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    const res = await fetch("/api/orders")
    if (res.ok) {
      const data: Order[] = await res.json()
      const active = data.filter(o => ACTIVE_STATUSES.includes(o.status))
      setOrders(active)
      if (!selected && active.length > 0) setSelected(active[0])
      else if (selected) {
        const updated = active.find(o => o.id === selected.id)
        if (updated) setSelected(updated)
      }
    }
    setLoading(false)
    setRefreshing(false)
  }, [selected])

  useEffect(() => {
    loadOrders()
    const iv = setInterval(() => loadOrders(true), 30000)
    return () => clearInterval(iv)
  }, [])

  const displayOrder = search
    ? orders.find(o => o.order_number.toLowerCase().includes(search.toLowerCase()))
    : selected

  const currentStep = displayOrder ? getCurrentStep(displayOrder.status) : -1

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 lg:pt-24">
        {/* ── Search / header ──────────────────────────────────── */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-[100px] -left-[100px] top-0"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] right-0 bottom-0"
            />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Suivi de livraison en{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  temps réel
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {orders.length > 0
                  ? `${orders.length} commande${orders.length > 1 ? "s" : ""} en cours`
                  : "Entrez un numéro de commande pour suivre votre colis"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ex: QG-ABC123"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-card border-border/50 text-base"
                />
              </div>
              <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  className="h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={() => loadOrders(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Actualiser
                </Button>
              </motion.div>
            </motion.div>

            {/* Order selector chips */}
            {orders.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 flex-wrap mt-4"
              >
                {orders.map(o => (
                  <button
                    key={o.id}
                    onClick={() => { setSelected(o); setSearch("") }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected?.id === o.id
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-card border-border/30 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {o.order_number}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Main content ─────────────────────────────────────── */}
        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Loading skeleton */}
            {loading && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[460px] rounded-2xl bg-card animate-pulse" />
                <div className="space-y-4">
                  <div className="h-32 rounded-2xl bg-card animate-pulse" />
                  <div className="h-64 rounded-2xl bg-card animate-pulse" />
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && orders.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-6"
                >
                  <PackageOpen className="h-20 w-20 text-muted-foreground/30 mx-auto" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">Aucune commande en cours</h2>
                <p className="text-muted-foreground mb-6">Vos livraisons actives apparaîtront ici</p>
                <Button variant="outline" onClick={() => window.location.href = "/marketplace"}>
                  <Package className="mr-2 h-4 w-4" />
                  Passer une commande
                </Button>
              </motion.div>
            )}

            {/* Order not found from search */}
            {!loading && search && !displayOrder && orders.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-12"
              >
                Commande &quot;{search}&quot; introuvable parmi vos commandes actives.
              </motion.p>
            )}

            {/* Tracking view */}
            <AnimatePresence mode="wait">
              {!loading && displayOrder && (
                <motion.div
                  key={displayOrder.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid lg:grid-cols-3 gap-8"
                >
                  {/* Map panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 18 }}
                    className="lg:col-span-2"
                  >
                    <div
                      className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-border/50"
                      style={{ background: "linear-gradient(135deg, #0d1117, #161b22)" }}
                    >
                      {/* SVG mini-map */}
                      <svg viewBox="0 0 800 500" className="absolute inset-0 w-full h-full">
                        <defs>
                          <pattern id="tgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e2030" strokeWidth="0.6" />
                          </pattern>
                        </defs>
                        <rect width="800" height="500" fill="url(#tgrid)" />
                        {/* Animated route path */}
                        <motion.path
                          d="M100,420 Q200,200 380,300 Q520,380 680,140"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="12 6"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
                        />
                        {/* Origin pin */}
                        <circle cx="100" cy="420" r="10" fill="#8b5cf6" stroke="#fff" strokeWidth="2.5" />
                        <text x="112" y="435" fontSize="11" fill="#8b5cf6" fontWeight="600">
                          📦 {displayOrder.vendor?.name ?? "Vendeur"}
                        </text>
                        {/* Destination pin */}
                        <circle cx="680" cy="140" r="10" fill="#22c55e" stroke="#fff" strokeWidth="2.5" />
                        <text x="585" y="128" fontSize="11" fill="#22c55e" fontWeight="600">🏠 Destination</text>
                        {/* Rider position */}
                        <circle cx="380" cy="295" r="18" fill="#3b82f6" stroke="#fff" strokeWidth="3" />
                        <text x="371" y="302" fontSize="16">🛵</text>
                      </svg>

                      {/* Rider glow pulse */}
                      <motion.div
                        animate={{ boxShadow: ["0 0 0px #3b82f6", "0 0 30px #3b82f6", "0 0 0px #3b82f6"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute rounded-full w-10 h-10 pointer-events-none"
                        style={{ left: "calc(47% - 20px)", top: "calc(59% - 20px)" }}
                      />

                      {/* Status overlay – top */}
                      <div className="absolute top-4 left-4 right-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 120, delay: 0.4 }}
                          className="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-white/50">Statut</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                                </span>
                                <p className="text-lg font-bold text-green-400">
                                  {STATUS_LABELS[displayOrder.status] ?? displayOrder.status}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/50">Arrivée estimée</p>
                              <p className="text-lg font-bold text-white">{etaLabel(displayOrder)}</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Driver overlay – bottom */}
                      {displayOrder.driver && (
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.6 }}
                          className="absolute bottom-4 left-4 right-4"
                        >
                          <div className="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm">
                                  {initials(displayOrder.driver.user?.full_name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">
                                    {displayOrder.driver.user?.full_name ?? "Livreur"}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-white/60">
                                      {displayOrder.driver.rating?.toFixed(1) ?? "—"}
                                    </span>
                                    <span className="text-sm text-white/40">• Livreur</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {displayOrder.driver.user?.phone && (
                                  <motion.a
                                    href={`tel:${displayOrder.driver.user.phone}`}
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="rounded-full border-white/20 hover:bg-white/10"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  </motion.a>
                                )}
                                <motion.div whileHover={{ scale: 1.1 }}>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="rounded-full border-white/20 hover:bg-white/10"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Details sidebar */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.1 }}
                    className="space-y-6"
                  >
                    {/* ETA block */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.25 }}
                      className="p-6 rounded-2xl bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/10 border border-[#3b82f6]/25"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-[#3b82f6]" />
                        </div>
                        <div>
                          <p className="text-xs text-white/50">Arrivée estimée</p>
                          <p className="text-2xl font-black text-white">{etaLabel(displayOrder)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-white/40">{displayOrder.order_number}</span>
                        <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2.5 py-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          <span className="text-green-400 text-[10px] font-semibold">En direct</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Progress steps */}
                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">{displayOrder.order_number}</h3>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {STATUS_LABELS[displayOrder.status] ?? displayOrder.status}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {STATUS_STEPS.map((step, i) => {
                          const done    = isStepCompleted(i, currentStep)
                          const current = i === currentStep
                          return (
                            <motion.div
                              key={step.keys[0]}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 120, damping: 16 }}
                              className="flex items-start gap-3"
                            >
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  current ? "bg-primary text-primary-foreground" :
                                  done    ? "bg-primary/20 text-primary" :
                                            "bg-muted text-muted-foreground"
                                }`}>
                                  {done ? (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 200, damping: 14 }}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </motion.div>
                                  ) : (
                                    <span>{step.emoji}</span>
                                  )}
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                  <div className={`w-0.5 h-8 ${done ? "bg-primary/30" : "bg-muted"}`} />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className={`font-medium ${
                                  current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                                }`}>
                                  {step.label}
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Delivery details */}
                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <h3 className="font-semibold text-foreground mb-4">Détails</h3>
                      <div className="space-y-4">
                        {[
                          displayOrder.vendor && {
                            icon: <User className="h-4 w-4 text-primary" />,
                            bg: "bg-primary/10",
                            label: "Vendeur",
                            value: displayOrder.vendor.name,
                          },
                          displayOrder.delivery_address && {
                            icon: <MapPin className="h-4 w-4 text-secondary" />,
                            bg: "bg-secondary/10",
                            label: "Destination",
                            value: displayOrder.delivery_address,
                          },
                          displayOrder.items?.length > 0 && {
                            icon: <Package className="h-4 w-4 text-muted-foreground" />,
                            bg: "bg-muted",
                            label: "Articles",
                            value: displayOrder.items.map(it => `${it.quantity}× ${it.product_name}`).join(", "),
                          },
                        ].filter(Boolean).map((item: any, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.06, type: "spring", stiffness: 120, damping: 18 }}
                            className="flex items-start gap-3"
                          >
                            <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>{item.icon}</div>
                            <div>
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="font-medium text-foreground text-sm leading-snug">{item.value}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Help */}
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Besoin d&apos;aide ?</p>
                      <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Button variant="link" className="text-primary" asChild>
                          <a href="/support">Contacter le support →</a>
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
