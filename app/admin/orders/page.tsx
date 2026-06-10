"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, Package, Users, Truck, BarChart3, Settings,
  Search, Eye, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Download, RefreshCw, Phone, Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Store } from "lucide-react"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: "En attente",      color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  confirmed:  { label: "Confirmé",        color: "bg-blue-400/20 text-blue-400",     icon: Package },
  preparing:  { label: "En préparation", color: "bg-purple-500/20 text-purple-400", icon: Package },
  ready:      { label: "Prêt",           color: "bg-cyan-500/20 text-cyan-400",     icon: CheckCircle },
  delivering: { label: "En livraison",   color: "bg-primary/20 text-primary",       icon: Truck },
  delivered:  { label: "Livré",          color: "bg-green-500/20 text-green-400",   icon: CheckCircle },
  cancelled:  { label: "Annulé",         color: "bg-red-500/20 text-red-400",       icon: XCircle },
}

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function formatTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff} min`
  return `Il y a ${Math.floor(diff / 60)}h`
}

interface Order {
  id: string; order_number: string; status: string
  total_amount: number; delivery_fee: number; created_at: string
  delivery_address: { street?: string; city?: string } | null
  customer: { full_name: string; phone: string } | null
  vendor: { name: string } | null
  driver_rel: { user: { full_name: string } | null } | null
}

const PAGE_SIZE = 20

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (q: string, status: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: q, status, page: String(p), limit: String(PAGE_SIZE) })
      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setTotal(data.total)
        setSummary(data.summary)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(search, statusFilter, page)
  }, [statusFilter, page, fetchOrders])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchOrders(val, statusFilter, 1)
    }, 350)
  }

  const patchOrder = async (id: string, status: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) fetchOrders(search, statusFilter, page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Gestion des Commandes</h1>
              <p className="text-sm text-muted-foreground">Suivi en temps réel · {total.toLocaleString()} commandes</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => fetchOrders(search, statusFilter, page)}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => { setStatusFilter(key); setPage(1) }}
                className={`p-3 rounded-xl border transition-all text-left ${
                  statusFilter === key ? "border-quickgo-blue bg-quickgo-blue/10" : "bg-card/50 border-border/30 hover:border-border/60"
                }`}
              >
                <p className="text-xl font-bold text-white">{summary[key] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="N° commande..." value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/30" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", ...Object.keys(STATUS_CONFIG)].map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => { setStatusFilter(s); setPage(1) }} className="rounded-full">
                  {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
                </Button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-card/30 animate-pulse" />
              ))
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune commande trouvée</p>
              </div>
            ) : orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status]
              const StatusIcon = cfg?.icon ?? AlertCircle
              return (
                <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-border/60 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-quickgo-blue">#{order.order_number}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg?.color ?? ""}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg?.label ?? order.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Client</p>
                          <p className="text-white font-medium">{(order.customer as { full_name?: string } | null)?.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {(order.customer as { phone?: string } | null)?.phone ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Vendeur</p>
                          <p className="text-white font-medium">{(order.vendor as { name?: string } | null)?.name ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Livreur</p>
                          <p className="text-white font-medium">
                            {(order.driver_rel as { user?: { full_name?: string } | null } | null)?.user?.full_name ?? "Non assigné"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {order.delivery_address && (
                        <p className="text-sm text-muted-foreground hidden lg:block">{order.delivery_address.city ?? ""}</p>
                      )}
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{formatCFA(order.total_amount)}</p>
                        {order.delivery_fee > 0 && (
                          <p className="text-xs text-muted-foreground">+{formatCFA(order.delivery_fee)} livraison</p>
                        )}
                      </div>
                      {/* Contextual status-change actions */}
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90 text-white shrink-0"
                          onClick={() => patchOrder(order.id, "confirmed")}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Confirmer
                        </Button>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full shrink-0"
                          onClick={() => patchOrder(order.id, "preparing")}
                        >
                          En préparation
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full shrink-0"
                          onClick={() => patchOrder(order.id, "delivering")}
                        >
                          <Truck className="h-3.5 w-3.5 mr-1" />
                          En livraison
                        </Button>
                      )}
                      {order.status === "delivering" && (
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-green-600 hover:bg-green-700 text-white shrink-0"
                          onClick={() => patchOrder(order.id, "delivered")}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Livré
                        </Button>
                      )}
                      {!["delivered", "cancelled"].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                          title="Annuler"
                          onClick={() => patchOrder(order.id, "cancelled")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total.toLocaleString()} commandes
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  const p = page <= 2 ? i + 1 : page - 1 + i
                  if (p > totalPages) return null
                  return (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 min-w-8" onClick={() => setPage(p)}>{p}</Button>
                  )
                })}
                {totalPages > 3 && <span className="text-muted-foreground">...</span>}
                {totalPages > 3 && (
                  <Button variant="ghost" size="sm" className="h-8 min-w-8" onClick={() => setPage(totalPages)}>{totalPages}</Button>
                )}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
