"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Bell, ChevronDown, TrendingUp, DollarSign, Clock,
  MapPin, RefreshCw, Eye, Activity, Globe, ShieldCheck, Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin", active: true },
  { icon: Package,         label: "Commandes",       href: "/admin/orders" },
  { icon: Truck,           label: "Livreurs",         href: "/admin/drivers" },
  { icon: Users,           label: "Clients",          href: "/admin/users" },
  { icon: Store,           label: "Vendeurs",         href: "/admin/vendors" },
  { icon: BarChart3,       label: "Analyses",         href: "/admin/analytics" },
  { icon: Wallet,          label: "Finances",         href: "/admin/finances" },
  { icon: Settings,        label: "Paramètres",       href: "/admin/settings" },
]

function formatCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M CFA"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K CFA"
  return n + " CFA"
}

function formatTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff} min`
  return `Il y a ${Math.floor(diff / 60)}h`
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/20 text-yellow-400",
  confirmed:  "bg-blue-400/20 text-blue-400",
  preparing:  "bg-purple-500/20 text-purple-400",
  ready:      "bg-cyan-500/20 text-cyan-400",
  delivering: "bg-quickgo-blue/20 text-quickgo-blue",
  delivered:  "bg-green-500/20 text-green-400",
  cancelled:  "bg-red-500/20 text-red-400",
}
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmé", preparing: "En préparation",
  ready: "Prêt", delivering: "En livraison", delivered: "Livré", cancelled: "Annulé",
}

interface DashboardData {
  stats: { revenue: number; activeOrders: number; onlineDrivers: number }
  liveOrders: {
    id: string; order_number: string; status: string; total_amount: number; created_at: string
    delivery_address: { city?: string } | null
    customer: { full_name: string } | null
    driver_rel: { user: { full_name: string } | null } | null
  }[]
  topDrivers: {
    id: string; total_deliveries: number; total_earnings: number; rating: number
    user: { full_name: string } | null
  }[]
  cityStats: { city: string; orders: number; revenue: number }[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const stats = [
    { label: "Chiffre d'affaires aujourd'hui", value: formatCFA(data?.stats.revenue ?? 0), icon: DollarSign, color: "from-green-500 to-emerald-500" },
    { label: "Commandes actives",               value: (data?.stats.activeOrders ?? 0).toLocaleString(),  icon: Package,   color: "from-quickgo-blue to-quickgo-cyan" },
    { label: "Livreurs en ligne",               value: (data?.stats.onlineDrivers ?? 0).toLocaleString(), icon: Truck,     color: "from-purple-500 to-pink-500" },
    { label: "Temps moyen livraison",           value: "— min",                                           icon: Clock,     color: "from-orange-500 to-red-500" },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/30 bg-card/30">
        <div className="p-6 border-b border-border/30">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white">QUICK</span>
              <span className="text-xl font-bold text-quickgo-lime">GO</span>
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">Admin</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active ? "bg-quickgo-blue/20 text-quickgo-blue" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border/30">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Système OK</p>
                <p className="text-xs text-green-400">Tous services actifs</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Centre de Contrôle</h1>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                Live
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleRefresh}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l border-border/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AD</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium">Admin</p>
                  <p className="text-xs text-red-400">Super Admin</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-card/50 backdrop-blur-xl rounded-2xl p-5 border border-border/30 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} w-fit mb-3`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                {loading ? (
                  <div className="h-7 w-24 bg-white/10 animate-pulse rounded mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Live Orders */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">Commandes en direct</h2>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                    <Activity className="w-3 h-3" />
                    {data?.stats.activeOrders ?? 0} actives
                  </span>
                </div>
                <Link href="/admin/orders">
                  <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">Voir tout</Button>
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />
                ))}</div>
              ) : (data?.liveOrders ?? []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune commande active en ce moment</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        {["ID", "Client", "Livreur", "Statut", "Montant", ""].map((h) => (
                          <th key={h} className="text-left text-xs text-muted-foreground font-medium py-3 px-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data?.liveOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 font-mono text-white text-sm">#{order.order_number}</td>
                          <td className="py-3 px-2">
                            <p className="text-white text-sm">{(order.customer as { full_name?: string } | null)?.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{order.delivery_address?.city ?? ""}</p>
                          </td>
                          <td className="py-3 px-2 text-white text-sm">
                            {(order.driver_rel as { user?: { full_name?: string } | null } | null)?.user?.full_name ?? "—"}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-white font-semibold text-sm">{formatCFA(order.total_amount)}</td>
                          <td className="py-3 px-2">
                            <Link href={`/admin/orders`}>
                              <button className="p-1 hover:bg-white/10 rounded"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Map preview */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Carte live</h3>
                </div>
                <div className="aspect-video rounded-xl bg-gradient-to-br from-quickgo-blue/20 via-background to-quickgo-cyan/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="absolute w-3 h-3 bg-quickgo-lime rounded-full animate-pulse"
                        style={{ top: `${20 + (i * 11) % 60}%`, left: `${10 + (i * 17) % 80}%`, animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                  <div className="text-center z-10">
                    <Globe className="h-10 w-10 text-quickgo-blue mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{data?.stats.onlineDrivers ?? "—"} livreurs actifs</p>
                  </div>
                </div>
              </motion.div>

              {/* Top Drivers */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Top livreurs</h3>
                  <Link href="/admin/drivers" className="text-quickgo-blue text-sm">Voir tout</Link>
                </div>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />)}</div>
                ) : (data?.topDrivers ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Aucune donnée</p>
                ) : (
                  <div className="space-y-3">
                    {data?.topDrivers.map((driver, i) => (
                      <div key={driver.id} className="flex items-center gap-3 p-3 bg-card/30 rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                          i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-orange-600"
                        }`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{(driver.user as { full_name?: string } | null)?.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{driver.total_deliveries} livraisons</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-quickgo-lime text-sm font-semibold">{formatCFA(driver.total_earnings)}</p>
                          <p className="text-xs text-yellow-400">★ {driver.rating?.toFixed(1) ?? "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* City Stats */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Par ville</h3>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />)}</div>
                ) : (data?.cityStats ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Pas encore de données</p>
                ) : (
                  <div className="space-y-3">
                    {data?.cityStats.map((city) => (
                      <div key={city.city} className="p-3 bg-card/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-quickgo-blue" />
                            <span className="text-white font-medium">{city.city}</span>
                          </div>
                          <span className="text-quickgo-lime font-semibold text-sm">{formatCFA(city.revenue)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{city.orders} commandes</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
