"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, Truck, CheckCircle, Clock,
  MapPin, Phone, Star, MessageSquare, RefreshCw,
  ShoppingBag, Bike,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderItem { product_name: string; quantity: number; unit_price: number }
interface ActiveOrder {
  id: string; order_number: string; status: string; total_amount: number
  created_at: string; estimated_delivery_time: string | null
  delivery_address: string | null
  vendor: { name: string; phone: string | null; logo_url: string | null } | null
  driver: {
    rating: number | null
    user: { full_name: string; phone: string | null; avatar_url: string | null } | null
  } | null
  items: OrderItem[]
}

const STATUS_STEPS = [
  { key: "pending",    label: "Commande reçue" },
  { key: "confirmed",  label: "Commande confirmée" },
  { key: "preparing",  label: "Préparation" },
  { key: "ready",      label: "Prêt pour livraison" },
  { key: "delivering", label: "En route" },
  { key: "delivered",  label: "Livré" },
]
const STEP_ORDER = ["pending","confirmed","preparing","ready","delivering","delivered"]

function getStepIndex(status: string) {
  const idx = STEP_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA"

export default function TrackingPage() {
  const [orders, setOrders] = useState<ActiveOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/orders")
      if (r.ok) {
        const data: ActiveOrder[] = await r.json()
        const active = data.filter((o) => !["delivered","cancelled"].includes(o.status))
        setOrders(active)
        if (active.length > 0) setSelectedId((prev) => prev ?? active[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const id = setInterval(fetchOrders, 30_000)
    return () => clearInterval(id)
  }, [fetchOrders])

  const order = orders.find((o) => o.id === selectedId) ?? orders[0] ?? null
  const stepIdx = order ? getStepIndex(order.status) : 0
  const eta = order?.estimated_delivery_time
    ? Math.max(0, Math.round((new Date(order.estimated_delivery_time).getTime() - Date.now()) / 60_000))
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Suivi en direct</h1>
            {order && <p className="text-xs text-white/30">Commande #{order.order_number}</p>}
          </div>
          <button onClick={fetchOrders} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <RefreshCw className={`w-4 h-4 text-white/30 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {orders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {orders.map((o) => (
              <button key={o.id} onClick={() => setSelectedId(o.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedId === o.id ? "bg-[#3b82f6] text-white" : "bg-[#16161f] text-white/40 border border-[#1e1e2e]"
                }`}>
                <Package className="w-3.5 h-3.5" /> #{o.order_number}
              </button>
            ))}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="space-y-4">
            {Array.from({length:3}).map((_,i)=><div key={i} className="h-32 rounded-2xl bg-[#16161f] animate-pulse" />)}
          </div>
        ) : !order ? (
          <div className="text-center py-20">
            <Truck className="w-16 h-16 mx-auto text-white/10 mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Aucune livraison en cours</h2>
            <p className="text-white/30 text-sm mb-6">Vos commandes actives apparaîtront ici.</p>
            <Link href="/marketplace">
              <Button className="rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90">Commander maintenant</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Map */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative h-52 rounded-3xl overflow-hidden border border-[#1e1e2e]"
              style={{ background: "linear-gradient(135deg, #0d1117, #161b22)" }}>
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e2030" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="200" fill="url(#grid)" />
                <path d="M50,170 Q120,80 200,120 Q280,160 360,60" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeDasharray="6 3" />
                <circle cx="50" cy="170" r="8" fill="#8b5cf6" stroke="#fff" strokeWidth="2" />
                <text x="58" y="185" fontSize="9" fill="#8b5cf6">📦 Vendeur</text>
                <circle cx="360" cy="60" r="8" fill="#22c55e" stroke="#fff" strokeWidth="2" />
                <text x="308" y="48" fontSize="9" fill="#22c55e">🏠 Destination</text>
                <circle cx="220" cy="118" r="13" fill="#3b82f6" stroke="#fff" strokeWidth="2.5" />
                <text x="213" y="123" fontSize="12">🛵</text>
              </svg>
              {order.status === "delivering" && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#22c55e]/20 border border-[#22c55e]/30 rounded-full px-3 py-1">
                  <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                  <span className="text-[#22c55e] text-xs font-semibold">En direct</span>
                </div>
              )}
            </motion.div>

            {/* ETA */}
            {["delivering","ready"].includes(order.status) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/10 border border-[#3b82f6]/25 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div className="flex-1">
                  <p className="text-white/50 text-xs">Arrivée estimée</p>
                  <p className="text-white font-black text-2xl">{eta != null ? `${eta} – ${eta + 5} min` : "En route"}</p>
                </div>
                {order.delivery_address && (
                  <div className="text-right">
                    <MapPin className="w-4 h-4 text-[#3b82f6] ml-auto mb-1" />
                    <p className="text-white/30 text-xs max-w-[120px] text-right truncate">{order.delivery_address}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Steps */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-5">
              <h3 className="text-white font-semibold text-sm mb-5">Suivi de la commande</h3>
              <div className="relative">
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#1e1e2e]" />
                <div className="absolute left-5 top-5 w-0.5 bg-[#3b82f6] transition-all duration-1000"
                  style={{ height: `calc(${(stepIdx / (STATUS_STEPS.length - 1)) * 100}% - 10px)` }} />
                <div className="space-y-5 relative">
                  {STATUS_STEPS.map((step, i) => {
                    const done = i < stepIdx; const current = i === stepIdx
                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          done ? "bg-[#22c55e] border-[#22c55e]" :
                          current ? "bg-[#3b82f6] border-[#3b82f6] animate-pulse" :
                                    "bg-[#0a0a0f] border-[#1e1e2e]"}`}>
                          {done ? <CheckCircle className="w-5 h-5 text-white" /> :
                           current ? <Truck className="w-4 h-4 text-white" /> :
                                     <span className="w-2 h-2 rounded-full bg-[#1e1e2e]" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${done || current ? "text-white" : "text-white/25"}`}>{step.label}</p>
                          {current && <p className="text-[#3b82f6] text-xs font-medium mt-0.5">En cours…</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Driver */}
            {order.driver && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0 border-2 border-[#a3e635]/30">
                  <Bike className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{order.driver.user?.full_name ?? "Livreur"}</p>
                  {order.driver.rating != null && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-[#eab308] fill-current" />
                      <span className="text-white/50 text-sm">{order.driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {order.driver.user?.phone && (
                    <a href={`tel:${order.driver.user.phone}`}>
                      <Button size="icon" className="h-10 w-10 rounded-xl bg-[#22c55e]/20 text-[#22c55e] border-0 hover:bg-[#22c55e]/30">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Link href="/dashboard/messages">
                    <Button size="icon" className="h-10 w-10 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] border-0 hover:bg-[#3b82f6]/30">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Order items */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Votre commande</h3>
                <span className="text-white/30 text-xs">{order.vendor?.name}</span>
              </div>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-[#3b82f6]" />
                      </div>
                      <div>
                        <p className="text-white text-sm">{item.product_name}</p>
                        <p className="text-white/30 text-xs">×{item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-white text-sm font-medium">{formatCFA(item.unit_price * item.quantity)}</p>
                  </div>
                ))}
                <div className="border-t border-[#1e1e2e] pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-[#a3e635] font-bold">{formatCFA(order.total_amount)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
