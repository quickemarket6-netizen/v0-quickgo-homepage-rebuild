"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, Search, ChevronDown, RefreshCw,
  TrendingDown, AlertTriangle, Clock, CheckCircle, XCircle, Truck,
  ArrowUpRight, Zap, Info, Download,
} from "lucide-react"
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem { product_name: string; quantity: number; unit_price: number; total_price: number }
interface RecentOrder {
  id: string; order_number: string; status: string
  total_amount: number | null; total: number | null; created_at: string; estimated_delivery_time: string | null
  customer: { full_name: string; phone: string; avatar_url: string | null } | null
  items: OrderItem[]
}
interface DashboardData {
  vendor: { id: string; name: string; logo_url: string | null; is_verified: boolean; rating: number | null; status: string; commission_rate: number | null }
  kpi: { today_sales: number; today_orders: number; month_revenue: number; active_products: number; rating: number }
  chart: { date: string; sales: number; orders: number }[]
  recent_orders: RecentOrder[]
  top_products: { name: string; sold: number; revenue: number }[]
  wallet: { available_balance: number; pending_balance: number; total_earned: number; total_withdrawn: number; next_payout_date: string | null; next_payout_amount: number | null } | null
  commission: { yesterday: { gross_amount: number; quickgo_commission: number; vendor_net_amount: number; commission_rate: number } | null; month_total: number; rate: number }
  notifications: { id: string; title: string; message: string; is_read: boolean; created_at: string }[]
  unread_notifications: number
  low_stock: { id: string; name: string; stock_quantity: number; images: string[] | null }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard", active: true },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  { icon: Package,         label: "Produits",        href: "/vendor/products" },
  { icon: TrendingUp,      label: "Revenus",         href: "/vendor/analytics" },
  { icon: Wallet,          label: "Portefeuille",    href: "/vendor/wallet" },
  { icon: Users,           label: "Clients",         href: "/vendor/customers" },
  { icon: BarChart3,       label: "Analyses",        href: "/vendor/analytics" },
  { icon: Tag,             label: "Promotions",      href: "/vendor/promotions" },
  { icon: Star,            label: "Avis",            href: "/vendor/reviews" },
  { icon: Settings,        label: "Paramètres",      href: "/vendor/settings" },
  { icon: HelpCircle,      label: "Aide",            href: "/vendor/help" },
]

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:    { label: "En attente",     color: "text-yellow-400",  bg: "bg-yellow-500/20",  icon: Clock },
  confirmed:  { label: "Confirmé",       color: "text-blue-400",    bg: "bg-blue-500/20",    icon: CheckCircle },
  preparing:  { label: "Préparation",    color: "text-purple-400",  bg: "bg-purple-500/20",  icon: Package },
  ready:      { label: "Prêt",           color: "text-cyan-400",    bg: "bg-cyan-500/20",    icon: CheckCircle },
  delivering: { label: "En livraison",   color: "text-blue-400",    bg: "bg-blue-500/20",    icon: Truck },
  delivered:  { label: "Livré",          color: "text-green-400",   bg: "bg-green-500/20",   icon: CheckCircle },
  cancelled:  { label: "Annulé",         color: "text-red-400",     bg: "bg-red-500/20",     icon: XCircle },
}

const DONUT_COLORS = ["#3b82f6", "#22c55e", "#a3e635", "#8b5cf6", "#f97316"]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F`
  if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} F`
  return `${Math.round(n)} F`
}
function orderTotal(o: { total_amount?: number | null; total?: number | null }) {
  return o.total_amount ?? o.total ?? 0
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Tooltip formatter ───────────────────────────────────────────────────────
function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/60 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-bold">{p.name === "Ventes" ? formatCFA(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Sparkline card ───────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, icon: Icon, sparkData, delay,
}: {
  label: string; value: string; sub?: string; color: string
  icon: typeof TrendingUp; sparkData: number[]; delay: number
}) {
  const data = sparkData.map((v) => ({ v }))
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {sub && (
          <span className={`text-xs flex items-center gap-0.5 ${sub.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
            {sub.startsWith("+") ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
      </div>
      <div className="h-10">
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={data}>
            <Area type="monotone" dataKey="v" stroke={color} fill={`${color}18`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(7)
  const supabase = useRef(createClient())

  const fetchDashboard = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/dashboard?period=${p}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard(7) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription: refresh on new orders
  useEffect(() => {
    if (!data?.vendor.id) return
    const sb = supabase.current
    const channel = sb.channel(`vendor-${data.vendor.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `vendor_id=eq.${data.vendor.id}` },
        () => fetchDashboard(period))
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [data?.vendor.id, fetchDashboard, period])

  const handlePeriod = (p: number) => { setPeriod(p); fetchDashboard(p) }

  const kpi = data?.kpi
  const chartData = data?.chart ?? []
  const sparkSales = chartData.map((d) => d.sales)
  const sparkOrders = chartData.map((d) => d.orders)
  const donutData = (data?.top_products ?? []).slice(0, 5).map((p) => ({ name: p.name.slice(0, 18), value: p.revenue }))

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Left Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1e1e2e]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">Q</span>
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">QUICK<span className="text-[#a3e635]">GO</span></p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Vendeur</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Booster CTA */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="bg-gradient-to-br from-[#a3e635]/15 to-blue-500/10 border border-[#a3e635]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#a3e635]" />
              <span className="text-white text-sm font-semibold">Booster</span>
            </div>
            <p className="text-white/40 text-xs mb-3">Mettez vos produits en avant et multipliez vos ventes.</p>
            <Button size="sm" className="w-full h-8 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-xs rounded-lg">
              Activer
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Sticky header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-bold leading-tight">
              Bonjour, {(data?.vendor.name ?? "Chargement…").split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-white/30">Bienvenue sur votre tableau de bord</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input placeholder="Rechercher…" className="pl-9 w-56 bg-[#16161f] border-[#1e1e2e] rounded-xl h-9 text-sm placeholder:text-white/20" />
            </div>
            <button className="relative p-2 hover:bg-white/5 rounded-xl">
              <Bell className="w-5 h-5 text-white/40" />
              {(data?.unread_notifications ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <Button variant="ghost" size="icon" onClick={() => fetchDashboard(period)} className="h-9 w-9 rounded-xl">
              <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">{data ? initials(data.vendor.name) : "?"}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Period selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Tableau de bord</h2>
            <div className="flex items-center gap-1 bg-[#16161f] border border-[#1e1e2e] rounded-xl p-1">
              {[{ v: 7, l: "7j" }, { v: 30, l: "30j" }, { v: 90, l: "90j" }].map(({ v, l }) => (
                <button key={v} onClick={() => handlePeriod(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === v ? "bg-blue-500 text-white" : "text-white/40 hover:text-white"
                  }`}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* KPI grid */}
          {loading && !data ? (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              <KpiCard label="Ventes aujourd'hui" value={formatCFA(kpi?.today_sales ?? 0)} color="#22c55e" icon={TrendingUp} sparkData={sparkSales} delay={0} />
              <KpiCard label="Commandes du jour" value={String(kpi?.today_orders ?? 0)} color="#3b82f6" icon={ShoppingBag} sparkData={sparkOrders} delay={0.05} />
              <KpiCard label="Revenus du mois" value={formatCFA(kpi?.month_revenue ?? 0)} color="#a3e635" icon={BarChart3} sparkData={sparkSales} delay={0.1} />
              <KpiCard label="Produits actifs" value={String(kpi?.active_products ?? 0)} color="#8b5cf6" icon={Package} sparkData={sparkOrders} delay={0.15} />
              <KpiCard label="Note moyenne" value={`${(kpi?.rating ?? 0).toFixed(1)} ★`} color="#f97316" icon={Star} sparkData={sparkOrders} delay={0.2} />
            </div>
          )}

          {/* Charts row */}
          <div className="grid xl:grid-cols-3 gap-4">
            {/* Sales line chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="xl:col-span-2 bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-sm">Évolution des ventes</h3>
                  <p className="text-xs text-white/30 mt-0.5">Derniers {period} jours</p>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              {loading && !data ? (
                <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<SalesTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#888", paddingTop: 8 }} />
                    <Line yAxisId="left" type="monotone" dataKey="sales" name="Ventes" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" name="Commandes" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Donut chart + top products */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Top Produits</h3>
                <Link href="/vendor/products" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {loading && !data ? (
                <div className="h-40 rounded-xl bg-white/5 animate-pulse mb-3" />
              ) : donutData.length > 0 ? (
                <>
                  <div className="flex justify-center mb-3">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} dataKey="value" strokeWidth={0}>
                          {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCFA(v)} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {donutData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                        <span className="text-white/50 text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-white text-xs font-medium">{formatCFA(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-white/30 text-xs text-center py-8">Pas encore de données</p>
              )}
            </motion.div>
          </div>

          {/* Recent orders */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Commandes récentes</h3>
              <Link href="/vendor/orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {loading && !data ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (data?.recent_orders ?? []).length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Aucune commande pour le moment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="text-xs text-white/30 border-b border-[#1e1e2e]">
                      <th className="pb-3 text-left font-medium">Client</th>
                      <th className="pb-3 text-left font-medium">Commande</th>
                      <th className="pb-3 text-left font-medium">Statut</th>
                      <th className="pb-3 text-right font-medium">Montant</th>
                      <th className="pb-3 text-right font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e2e]">
                    {(data?.recent_orders ?? []).map((order) => {
                      const cfg = ORDER_STATUS[order.status]
                      const StatusIcon = cfg?.icon ?? Clock
                      const customerName = (order.customer as { full_name?: string } | null)?.full_name ?? "Client"
                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-[10px]">{initials(customerName)}</span>
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium leading-tight">{customerName}</p>
                                <p className="text-white/30 text-[11px]">{(order.customer as { phone?: string } | null)?.phone ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <p className="text-white/60 text-xs font-mono">#{order.order_number}</p>
                            <p className="text-white/30 text-[11px] mt-0.5">
                              {order.items?.length ?? 0} article{(order.items?.length ?? 0) > 1 ? "s" : ""}
                            </p>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.bg ?? ""} ${cfg?.color ?? ""}`}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg?.label ?? order.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="text-white font-semibold text-sm">{formatCFA(orderTotal(order))}</span>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="text-white/30 text-xs">{formatDate(order.created_at)}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Low stock */}
          {(data?.low_stock ?? []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-[#16161f] border border-orange-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-white font-semibold text-sm">Stock faible</h3>
                <span className="ml-auto text-xs text-orange-400">{data?.low_stock.length} produit{(data?.low_stock.length ?? 0) > 1 ? "s" : ""}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(data?.low_stock ?? []).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{p.name}</p>
                      <p className="text-orange-400 text-[11px]">{p.stock_quantity} restant{p.stock_quantity > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Notifications */}
          {(data?.notifications ?? []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-white/40" />
                  <h3 className="text-white font-semibold text-sm">Notifications</h3>
                  {(data?.unread_notifications ?? 0) > 0 && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{data?.unread_notifications}</span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {(data?.notifications ?? []).map((n) => (
                  <div key={n.id} className={`flex gap-3 p-3 rounded-xl transition-colors ${n.is_read ? "bg-white/[0.02]" : "bg-blue-500/5 border border-blue-500/10"}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-white/20" : "bg-blue-400"}`} />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium">{n.title}</p>
                      <p className="text-white/40 text-[11px] mt-0.5 truncate">{n.message}</p>
                    </div>
                    <p className="text-white/20 text-[10px] shrink-0">{formatDate(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Right Wallet Panel ────────────────────────────────────────────────── */}
      <aside className="hidden xl:flex w-72 shrink-0 flex-col bg-[#111118] border-l border-[#1e1e2e] overflow-y-auto">
        <div className="p-5 space-y-4">
          {/* Wallet balance */}
          <div>
            <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Portefeuille</h3>
            {loading && !data ? (
              <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
            ) : (
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-400/10 border border-blue-500/20 rounded-2xl p-4">
                <p className="text-white/40 text-xs mb-1">Solde disponible</p>
                <p className="text-2xl font-black text-white">{formatCFA(data?.wallet?.available_balance ?? 0)}</p>
                {(data?.wallet?.pending_balance ?? 0) > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">{formatCFA(data?.wallet?.pending_balance ?? 0)} en attente</p>
                )}
                <Button className="w-full mt-4 h-9 bg-green-500 hover:bg-green-500/90 text-white font-bold text-sm rounded-xl gap-2">
                  <Download className="w-3.5 h-3.5" /> Demander un retrait
                </Button>
              </div>
            )}
          </div>

          {/* Wallet stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total gagné", value: formatCFA(data?.wallet?.total_earned ?? 0), color: "text-green-400" },
              { label: "Total retiré", value: formatCFA(data?.wallet?.total_withdrawn ?? 0), color: "text-white/60" },
            ].map((s) => (
              <div key={s.label} className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-3">
                <p className="text-white/30 text-[10px] mb-1">{s.label}</p>
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Next payout */}
          {data?.wallet?.next_payout_date && (
            <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-white/40 text-[10px]">Prochain virement</p>
                <p className="text-white text-xs font-medium">
                  {new Date(data.wallet.next_payout_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  {data.wallet.next_payout_amount ? ` · ${formatCFA(data.wallet.next_payout_amount)}` : ""}
                </p>
              </div>
            </div>
          )}

          <Link href="/vendor/wallet" className="flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1">
            Historique des retraits <ArrowUpRight className="w-3 h-3" />
          </Link>

          {/* Commission notice */}
          <div>
            <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Commission DL Solutions</h3>
            <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-xs font-semibold">Taux : {data?.commission.rate ?? 5}%</p>
                  <p className="text-white/40 text-[11px] mt-0.5">Déduite automatiquement à 23h59 (heure Cameroun)</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Commission hier</span>
                  <span className="text-white font-medium">
                    {data?.commission.yesterday ? formatCFA(data.commission.yesterday.quickgo_commission) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Commission ce mois</span>
                  <span className="text-red-400 font-medium">{formatCFA(data?.commission.month_total ?? 0)}</span>
                </div>
                {data?.commission.yesterday && (
                  <div className="flex justify-between text-xs border-t border-blue-500/20 pt-2">
                    <span className="text-white/40">Net hier</span>
                    <span className="text-green-400 font-medium">{formatCFA(data.commission.yesterday.vendor_net_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vendor status badge */}
          {data && (
            <div className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-semibold truncate">{data.vendor.name}</span>
                <span className={`w-2 h-2 rounded-full ${data.vendor.status === "active" ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              </div>
              {data.vendor.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-2.5 h-2.5" /> Vérifié
                </span>
              )}
              {data.vendor.rating != null && (
                <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {data.vendor.rating.toFixed(1)} / 5
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
