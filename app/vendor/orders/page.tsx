"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Package, Search, CheckCircle2, Clock, Truck, XCircle,
  ChevronRight, Phone, Printer, BarChart3, Wallet,
  RefreshCw, AlertCircle, Users, Settings, LayoutDashboard,
  ShoppingBag, ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────
interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product: { id: string; name: string; images: string[] } | null
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string | null
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  notes: string | null
  delivery_address: { address?: string; city?: string; phone?: string } | null
  created_at: string
  updated_at: string
  delivered_at: string | null
  items: OrderItem[]
  customer: { full_name: string; phone: string; avatar_url: string | null } | null
  driver: { full_name: string; phone: string } | null
}

interface OrdersResponse {
  orders: Order[]
  total: number
  summary: Record<string, number>
}

// ─── Config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:    { label: "En attente",     icon: Clock,        color: "text-amber-600",  bg: "bg-amber-100"  },
  confirmed:  { label: "Confirmée",      icon: CheckCircle2, color: "text-blue-600",   bg: "bg-blue-100"   },
  preparing:  { label: "En préparation", icon: Package,      color: "text-purple-600", bg: "bg-purple-100" },
  ready:      { label: "Prête",          icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-100" },
  picked_up:  { label: "Récupérée",      icon: Truck,        color: "text-cyan-600",   bg: "bg-cyan-100"   },
  delivering: { label: "En livraison",   icon: Truck,        color: "text-blue-600",   bg: "bg-blue-100"   },
  delivered:  { label: "Livrée",         icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-100"  },
  cancelled:  { label: "Annulée",        icon: XCircle,      color: "text-red-600",    bg: "bg-red-100"    },
}

const FILTERS = [
  { id: "all",        label: "Toutes"        },
  { id: "pending",    label: "En attente"    },
  { id: "confirmed",  label: "Confirmées"    },
  { id: "preparing",  label: "En prép."      },
  { id: "delivering", label: "En livraison"  },
  { id: "delivered",  label: "Livrées"       },
  { id: "cancelled",  label: "Annulées"      },
]

const VENDOR_NEXT: Record<string, string> = {
  pending:   "confirmed",
  confirmed: "preparing",
  preparing: "ready",
}
const NEXT_LABEL: Record<string, string> = {
  confirmed: "Confirmer",
  preparing: "Préparer",
  ready:     "Prête",
}

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/analytics" },
  { icon: Package,         label: "Produits",         href: "/vendor/products"  },
  { icon: ShoppingBag,     label: "Commandes",        href: "/vendor/orders", active: true },
  { icon: Users,           label: "Clients CRM",      href: "/vendor/crm"       },
  { icon: Wallet,          label: "Finances",         href: "/vendor/finances"  },
  { icon: BarChart3,       label: "Analytics",        href: "/vendor/analytics" },
  { icon: Settings,        label: "Paramètres",       href: "/dashboard/settings" },
]

// ─── Helpers ────────────────────────────────────────────────────
function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const PAGE_SIZE = 20

// ─── Page ────────────────────────────────────────────────────────
export default function VendorOrdersPage() {
  const [data, setData]         = useState<OrdersResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState("all")
  const [search, setSearch]     = useState("")
  const [page, setPage]         = useState(0)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const searchTimer             = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (q: string, f: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit:  String(PAGE_SIZE),
        offset: String(p * PAGE_SIZE),
      })
      if (f && f !== "all") params.set("status", f)
      if (q)                params.set("search", q)

      const res = await fetch(`/api/vendor/orders?${params}`)
      if (!res.ok) throw new Error("Erreur de chargement")
      setData(await res.json())
    } catch {
      toast.error("Impossible de charger les commandes")
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(0)
      fetchOrders(search, filter, 0)
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, filter, fetchOrders])

  // Re-fetch on page change
  useEffect(() => { fetchOrders(search, filter, page) }, [page]) // eslint-disable-line

  async function advanceStatus(orderId: string, nextStatus: string) {
    setAdvancing(orderId)
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? "Erreur")
      toast.success(`Commande ${STATUS_CONFIG[nextStatus]?.label.toLowerCase()}`)
      fetchOrders(search, filter, page)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setAdvancing(null)
    }
  }

  const orders  = data?.orders ?? []
  const summary = data?.summary ?? {}
  const total   = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 flex flex-col z-20 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-quickgo-blue to-quickgo-cyan rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold bg-gradient-to-r from-quickgo-blue to-quickgo-cyan bg-clip-text text-transparent">QuickGo</span>
          </Link>
          <span className="text-xs text-gray-500 mt-0.5 block">Espace Vendeur</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active
                  ? "bg-gradient-to-r from-quickgo-blue/10 to-quickgo-cyan/10 text-quickgo-blue font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={17} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Commandes</h1>
            <p className="text-sm text-gray-500">
              {loading ? "Chargement..." : `${total} commande${total > 1 ? "s" : ""} au total`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchOrders(search, filter, page)} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </Button>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: "pending",    label: "En attente",    color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
              { key: "preparing",  label: "En préparation",color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
              { key: "delivering", label: "En livraison",  color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200"   },
              { key: "delivered",  label: "Livrées",       color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200"  },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => { setFilter(s.key); setPage(0) }}
                className={`p-4 rounded-2xl border text-left transition-all ${s.bg} ${s.border} hover:shadow-sm`}
              >
                <p className={`text-2xl font-bold ${s.color}`}>
                  {loading ? "—" : summary[s.key] ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Numéro de commande..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setPage(0) }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    filter === f.id
                      ? "bg-quickgo-blue text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {f.label}
                  {f.id !== "all" && (summary[f.id] ?? 0) > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      filter === f.id ? "bg-white/20" : "bg-gray-100"
                    }`}>
                      {summary[f.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Orders list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-quickgo-blue" size={32} />
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Package size={36} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucune commande</p>
              <p className="text-sm text-gray-400">
                {filter !== "all" ? "Essayez un autre filtre" : "Vos commandes apparaîtront ici"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                const StatusIcon = cfg.icon
                const nextStatus = VENDOR_NEXT[order.status]
                const isAdvancing = advancing === order.id

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900">#{order.order_number}</h3>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                        {order.delivery_fee > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Livraison
                          </span>
                        )}
                        {order.payment_status === "paid" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Payé
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCFA(order.total)}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                      {/* Items */}
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                          Articles · {order.items.length}
                        </p>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <Package size={14} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.product?.name ?? "Produit supprimé"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  x{item.quantity} · {formatCFA(item.unit_price)}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 shrink-0">
                                {formatCFA(item.total_price)}
                              </p>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-400">
                              +{order.items.length - 3} autre(s) article(s)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Customer + driver */}
                      <div className="px-5 py-4 space-y-3">
                        {order.customer && (
                          <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Client</p>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/20 flex items-center justify-center text-quickgo-blue font-bold text-xs shrink-0">
                                {order.customer.full_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{order.customer.full_name}</p>
                                <a
                                  href={`tel:${order.customer.phone}`}
                                  className="text-xs text-quickgo-blue hover:underline flex items-center gap-1"
                                >
                                  <Phone size={10} />
                                  {order.customer.phone}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        {order.delivery_address?.address && (
                          <p className="text-xs text-gray-500 truncate">
                            📍 {order.delivery_address.address}
                            {order.delivery_address.city && `, ${order.delivery_address.city}`}
                          </p>
                        )}
                        {order.driver && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                            <Truck size={14} className="text-blue-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-blue-900 truncate">{order.driver.full_name}</p>
                              <p className="text-xs text-blue-600">Livreur</p>
                            </div>
                            <a href={`tel:${order.driver.phone}`} className="text-blue-600 hover:text-blue-800">
                              <Phone size={13} />
                            </a>
                          </div>
                        )}
                        {order.notes && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 truncate">
                            💬 {order.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => advanceStatus(order.id, nextStatus)}
                          disabled={isAdvancing}
                          className="bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0 gap-1.5"
                        >
                          {isAdvancing
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <CheckCircle2 size={13} />}
                          {NEXT_LABEL[nextStatus] ?? nextStatus}
                        </Button>
                      )}
                      {["pending", "confirmed", "preparing"].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => advanceStatus(order.id, "cancelled")}
                          disabled={isAdvancing}
                          className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                        >
                          <XCircle size={13} />
                          Annuler
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.print()}
                        className="gap-1.5"
                      >
                        <Printer size={13} />
                        Imprimer
                      </Button>
                      <Link href={`/vendor/orders/${order.id}`} className="ml-auto">
                        <Button size="sm" variant="ghost" className="gap-1.5 text-gray-500">
                          Détails
                          <ChevronRight size={14} />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="gap-1.5"
              >
                <ChevronLeft size={14} />
                Précédent
              </Button>
              <span className="text-sm text-gray-500">
                Page {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="gap-1.5"
              >
                Suivant
                <ChevronRight size={14} />
              </Button>
            </div>
          )}

          {/* Error state */}
          {!loading && !data && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="text-gray-300" size={40} />
              <p className="text-gray-500">Erreur de chargement</p>
              <Button variant="outline" size="sm" onClick={() => fetchOrders(search, filter, page)}>
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
