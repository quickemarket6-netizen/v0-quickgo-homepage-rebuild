"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Bell, ChevronDown, TrendingUp, TrendingDown, DollarSign,
  MapPin, RefreshCw, Eye, Activity, ShieldCheck, Wallet, Search,
  MessageCircle, Megaphone, Star, Shield, FileText, ShoppingBag,
  Tag, Percent, CreditCard, AlertTriangle, CheckCircle, XCircle,
  Zap, UserPlus, LogOut, ChevronRight, MoreHorizontal, ArrowUpRight,
  ArrowDownRight, Clock, Globe,
} from "lucide-react"
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K"
  return String(Math.round(n))
}
function fmtCFAFull(n: number) { return fmtCFA(n) + " CFA" }
function fmtTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff}min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
  return `Il y a ${Math.floor(diff / 1440)}j`
}
function pctArrow(val: number) {
  if (val > 0) return { sign: "+", color: "text-green-400", Icon: ArrowUpRight }
  if (val < 0) return { sign: "", color: "text-red-400", Icon: ArrowDownRight }
  return { sign: "", color: "text-gray-400", Icon: ArrowUpRight }
}

// ── types ─────────────────────────────────────────────────────────────────────
interface AdminDashData {
  kpi: {
    today_revenue: number; yesterday_revenue: number
    today_orders: number; yesterday_orders: number
    active_deliveries: number; yesterday_deliveries: number
    active_vendors: number; yesterday_vendors: number
    online_drivers: number; yesterday_drivers: number
  }
  chart_24h: { hour: string; revenue: number; orders: number }[]
  financial: {
    total: number; vendor_payouts: number; quickgo_commission: number
    delivery_fees: number; refunds: number; net_profit: number
    net_profit_change: number; wallet_livraison: number
    pending_payouts_count: number; pending_payouts_amount: number
    failed_transactions_count: number; failed_transactions_amount: number
  }
  city_stats: { city: string; orders: number; revenue: number; pct: number }[]
  pending_payouts: { id: string; vendor_name: string; vendor_logo: string | null; amount: number; method: string }[]
  activities: { id: string; type: string; title: string; subtitle: string; status?: string; timestamp: string }[]
  ai_alerts: { id: string; title: string; description: string; severity: "high" | "medium" | "low"; count: number; timestamp: string }[]
  system_status: Record<string, string>
  top_categories: { name: string; pct: number }[]
  performance: { availability: number; response_time: number; uptime: number }
  badges: { vendors: number; drivers: number; orders: number; deliveries: number; payouts: number; crm_support: number; notifications: number }
}

// ── sidebar items ─────────────────────────────────────────────────────────────
const NAV = [
  { group: "Principal" },
  { icon: LayoutDashboard, label: "Vue d'ensemble",  href: "/admin",               badgeKey: null,           active: true },
  { icon: Package,         label: "Commandes",        href: "/admin/orders",        badgeKey: "orders" },
  { icon: Truck,           label: "Livreurs",          href: "/admin/drivers",       badgeKey: "drivers" },
  { icon: Store,           label: "Vendeurs",          href: "/admin/vendors",       badgeKey: "vendors" },
  { icon: Users,           label: "Clients",           href: "/admin/users",         badgeKey: null },
  { group: "Finances" },
  { icon: BarChart3,       label: "Analyses",          href: "/admin/analytics",     badgeKey: null },
  { icon: DollarSign,      label: "Finances",          href: "/admin/finances",      badgeKey: null },
  { icon: Wallet,          label: "Payouts",           href: "/admin/payouts",       badgeKey: "payouts" },
  { icon: Percent,         label: "Commissions",       href: "/admin/commissions",   badgeKey: null },
  { icon: CreditCard,      label: "Transactions",      href: "/admin/transactions",  badgeKey: null },
  { group: "Engagement" },
  { icon: MessageCircle,   label: "CRM & Support",     href: "/admin/support",       badgeKey: "crm_support" },
  { icon: Bell,            label: "Notifications",     href: "/admin/notifications", badgeKey: "notifications" },
  { icon: Megaphone,       label: "Marketing",         href: "/admin/marketing",     badgeKey: null },
  { icon: Star,            label: "Avis & Notes",      href: "/admin/reviews",       badgeKey: null },
  { group: "Sécurité" },
  { icon: Shield,          label: "IA & Sécurité",     href: "/admin/security",      badgeKey: null },
  { icon: FileText,        label: "Logs système",      href: "/admin/logs",          badgeKey: null },
  { group: "Catalogue" },
  { icon: ShoppingBag,     label: "Produits",          href: "/admin/products",      badgeKey: null },
  { icon: Tag,             label: "Catégories",        href: "/admin/categories",    badgeKey: null },
  { icon: MapPin,          label: "Zones & Villes",    href: "/admin/zones",         badgeKey: null },
  { group: "Système" },
  { icon: Settings,        label: "Paramètres",        href: "/admin/settings",      badgeKey: null },
]

const DONUT_COLORS = ["#3b82f6", "#22d3ee", "#a3e635", "#f59e0b", "#f43f5e"]
const CAT_COLORS   = ["#3b82f6", "#22d3ee", "#a3e635", "#f59e0b", "#f43f5e", "#8b5cf6"]
const SEV_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  high:   { label: "Critique", cls: "border-red-500/30 bg-red-500/10",    dot: "bg-red-400" },
  medium: { label: "Moyen",    cls: "border-orange-500/30 bg-orange-500/10", dot: "bg-orange-400" },
  low:    { label: "Faible",   cls: "border-yellow-500/30 bg-yellow-500/10", dot: "bg-yellow-400" },
}
const ACT_CFG: Record<string, { color: string; Icon: typeof Package }> = {
  order:    { color: "text-blue-400",   Icon: Package },
  vendor:   { color: "text-green-400",  Icon: Store },
  driver:   { color: "text-purple-400", Icon: Truck },
  security: { color: "text-red-400",    Icon: Shield },
}
const SYS_ICONS: Record<string, typeof Package> = {
  api_quickgo: Zap, api_cinetpay: CreditCard, database: FileText, storage: ShoppingBag, notifications: Bell,
}
const SYS_LABELS: Record<string, string> = {
  api_quickgo: "API QuickGo", api_cinetpay: "API CinetPay", database: "Base de données", storage: "Stockage", notifications: "Notifications",
}

// ── sparkline mini ────────────────────────────────────────────────────────────
function Spark({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={pts} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace("#","")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function AdminDashboardPage() {
  const [data,       setData]       = useState<AdminDashData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search,     setSearch]     = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard")
      if (res.ok) setData(await res.json())
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function badge(key: string | null) {
    if (!key || !data?.badges) return 0
    return (data.badges as Record<string, number>)[key] ?? 0
  }

  const kpi = data?.kpi
  const fin = data?.financial
  const chart24 = data?.chart_24h ?? []

  // sparkline data from last 8 hours of chart
  const sparkRev = chart24.slice(-8).map(h => h.revenue)
  const sparkOrd = chart24.slice(-8).map(h => h.orders)

  const kpiCards = [
    {
      label: "Revenus aujourd'hui",
      value: fmtCFAFull(kpi?.today_revenue ?? 0),
      prev:  kpi?.yesterday_revenue ?? 0,
      cur:   kpi?.today_revenue ?? 0,
      spark: sparkRev,
      color: "#3b82f6",
      icon:  DollarSign,
    },
    {
      label: "Commandes actives",
      value: String(kpi?.today_orders ?? 0),
      prev:  kpi?.yesterday_orders ?? 0,
      cur:   kpi?.today_orders ?? 0,
      spark: sparkOrd,
      color: "#22d3ee",
      icon:  Package,
    },
    {
      label: "Livraisons en cours",
      value: String(kpi?.active_deliveries ?? 0),
      prev:  kpi?.yesterday_deliveries ?? 0,
      cur:   kpi?.active_deliveries ?? 0,
      spark: chart24.slice(-8).map(h => Math.round(h.orders * 0.4)),
      color: "#a3e635",
      icon:  Truck,
    },
    {
      label: "Vendeurs actifs",
      value: String(kpi?.active_vendors ?? 0),
      prev:  kpi?.yesterday_vendors ?? 0,
      cur:   kpi?.active_vendors ?? 0,
      spark: [0,0,0,0,0,0,0,kpi?.active_vendors ?? 0],
      color: "#f59e0b",
      icon:  Store,
    },
    {
      label: "Livreurs en ligne",
      value: String(kpi?.online_drivers ?? 0),
      prev:  kpi?.yesterday_drivers ?? 0,
      cur:   kpi?.online_drivers ?? 0,
      spark: [0,0,0,0,0,0,0,kpi?.online_drivers ?? 0],
      color: "#8b5cf6",
      icon:  Users,
    },
  ]

  // financial donut
  const donutData = fin ? [
    { name: "Payouts vendeurs",  value: fin.vendor_payouts },
    { name: "Commission QuickGo", value: fin.quickgo_commission },
    { name: "Frais livraison",   value: fin.delivery_fees },
    { name: "Remboursements",    value: fin.refunds },
    { name: "Autres",            value: Math.max(0, fin.total - fin.vendor_payouts - fin.quickgo_commission - fin.delivery_fees - fin.refunds) },
  ].filter(d => d.value > 0) : []

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#111118] border-r border-[#1e1e2e] shrink-0 h-screen sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#1e1e2e]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-base">Q</span>
            </div>
            <div className="leading-none">
              <span className="text-white font-extrabold text-lg">QUICK</span>
              <span className="text-[#a3e635] font-extrabold text-lg">GO</span>
              <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold">Super Admin</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map((item, idx) => {
            if ("group" in item) return (
              <p key={`g-${idx}`} className="text-[10px] uppercase tracking-widest text-[#4a4a6a] font-semibold px-3 pt-4 pb-1 first:pt-2">
                {item.group}
              </p>
            )
            const navItem = item as { icon: typeof Package; label: string; href: string; badgeKey: string | null; active?: boolean }
            const bdg = badge(navItem.badgeKey)
            return (
              <Link key={navItem.href} href={navItem.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  navItem.active
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-[#6b6b8a] hover:bg-white/5 hover:text-white"
                }`}
              >
                <navItem.icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium flex-1">{navItem.label}</span>
                {bdg > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold flex items-center justify-center">
                    {bdg > 99 ? "99+" : bdg}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Profile footer */}
        <div className="px-3 pb-4 border-t border-[#1e1e2e] pt-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">Administrateur</p>
              <p className="text-[10px] text-red-400">Super Admin</p>
            </div>
            <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 text-[#6b6b8a]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Greeting */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-lg truncate">Centre de Contrôle</h1>
              <p className="text-[#6b6b8a] text-xs">Bonjour, Administrateur — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>

            {/* Search */}
            <button onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e2e] text-[#6b6b8a] text-sm border border-[#2a2a3e] hover:border-blue-500/50 transition-colors min-w-[180px]"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Rechercher…</span>
              <kbd className="text-[10px] bg-[#2a2a3e] px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>

            {/* Live badge */}
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Live
            </span>

            {/* Refresh */}
            <button onClick={() => { setRefreshing(true); fetchData() }}
              className="p-2 rounded-xl bg-[#1e1e2e] hover:bg-[#2a2a3e] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-[#6b6b8a] ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Notifs */}
            <div className="relative">
              <button className="p-2 rounded-xl bg-[#1e1e2e] hover:bg-[#2a2a3e] transition-colors">
                <Bell className="w-4 h-4 text-[#6b6b8a]" />
              </button>
              {badge("notifications") > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {badge("notifications")}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="relative">
              <button className="p-2 rounded-xl bg-[#1e1e2e] hover:bg-[#2a2a3e] transition-colors">
                <MessageCircle className="w-4 h-4 text-[#6b6b8a]" />
              </button>
              {badge("crm_support") > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {badge("crm_support")}
                </span>
              )}
            </div>

            {/* User */}
            <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">AD</span>
              </div>
              <ChevronDown className="w-3 h-3 text-[#6b6b8a]" />
            </button>
          </div>
        </header>

        {/* Search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
              onClick={() => setSearchOpen(false)}
            >
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="bg-[#111118] border border-[#2a2a3e] rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2e]">
                  <Search className="w-5 h-5 text-[#6b6b8a]" />
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher commandes, vendeurs, livreurs…"
                    className="flex-1 bg-transparent text-white placeholder-[#6b6b8a] text-sm outline-none"
                  />
                  <kbd className="text-[10px] text-[#6b6b8a] bg-[#1e1e2e] px-1.5 py-0.5 rounded">Esc</kbd>
                </div>
                <div className="px-4 py-3 text-xs text-[#6b6b8a]">
                  {search.length === 0 ? "Commencez à taper pour rechercher…" : `Recherche: "${search}"`}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 space-y-6">

          {/* ── KPI STRIP ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {kpiCards.map((card, i) => {
              const diff = card.prev > 0 ? Math.round(((card.cur - card.prev) / card.prev) * 1000) / 10 : 0
              const { sign, color: arrowColor, Icon: ArrowIcon } = pctArrow(diff)
              return (
                <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-4 overflow-hidden relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.color + "22" }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    {diff !== 0 && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold ${arrowColor}`}>
                        <ArrowIcon className="w-3 h-3" />{sign}{Math.abs(diff)}%
                      </span>
                    )}
                  </div>
                  {loading ? (
                    <div className="h-7 w-24 bg-white/10 animate-pulse rounded mt-2 mb-1" />
                  ) : (
                    <p className="text-white font-bold text-xl mt-2 mb-0.5 leading-none">{card.value}</p>
                  )}
                  <p className="text-[#6b6b8a] text-xs mb-2">{card.label}</p>
                  <p className={`text-[10px] ${arrowColor} mb-2`}>vs hier : {fmtCFAFull(card.prev)}</p>
                  <Spark data={card.spark} color={card.color} />
                </motion.div>
              )
            })}
          </div>

          {/* ── ROW 1: Financial + 24H Chart + City Stats ──────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Aperçu financier */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Aperçu financier global</h2>
                <span className="text-[10px] text-[#6b6b8a] bg-[#1e1e2e] px-2 py-1 rounded-full">Ce mois</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40"><div className="w-24 h-24 rounded-full border-4 border-[#1e1e2e] border-t-blue-500 animate-spin" /></div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={44} outerRadius={64}
                          dataKey="value" paddingAngle={2} stroke="none"
                        >
                          {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [fmtCFAFull(v), ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-white font-bold text-sm leading-none">{fmtCFA(fin?.total ?? 0)}</p>
                      <p className="text-[#6b6b8a] text-[10px]">Total</p>
                    </div>
                  </div>

                  <div className="w-full mt-3 space-y-2">
                    {donutData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-[#6b6b8a] text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-white text-xs font-medium">{fmtCFA(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#1e1e2e] grid grid-cols-2 gap-3">
                <div className="bg-[#1e1e2e] rounded-xl p-3">
                  <p className="text-[#6b6b8a] text-[10px] mb-0.5">Bénéfice net</p>
                  <p className="text-white font-bold text-sm">{fmtCFAFull(fin?.net_profit ?? 0)}</p>
                  {(fin?.net_profit_change ?? 0) !== 0 && (
                    <p className={`text-[10px] mt-0.5 ${fin!.net_profit_change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {fin!.net_profit_change > 0 ? "+" : ""}{fin!.net_profit_change}% vs mois préc.
                    </p>
                  )}
                </div>
                <div className="bg-[#1e1e2e] rounded-xl p-3">
                  <p className="text-[#6b6b8a] text-[10px] mb-0.5">Wallet livraison</p>
                  <p className="text-white font-bold text-sm">{fmtCFAFull(fin?.wallet_livraison ?? 0)}</p>
                  <p className="text-[10px] text-[#6b6b8a] mt-0.5">Solde total</p>
                </div>
              </div>

              {(fin?.pending_payouts_count ?? 0) > 0 && (
                <div className="mt-3 flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-orange-300 text-xs font-semibold">{fin!.pending_payouts_count} payout{fin!.pending_payouts_count > 1 ? "s" : ""} en attente</p>
                    <p className="text-[#6b6b8a] text-[10px]">{fmtCFAFull(fin!.pending_payouts_amount)}</p>
                  </div>
                  <Link href="/admin/payouts" className="text-orange-400 text-[10px] font-semibold hover:underline">Voir</Link>
                </div>
              )}
            </motion.div>

            {/* Graphique 24H */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Ventes aujourd'hui (24H)</h2>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">Temps réel</span>
              </div>

              {loading ? (
                <div className="h-48 bg-white/5 animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chart24} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="grad24rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="grad24ord" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: "#6b6b8a", fontSize: 9 }} tickLine={false} axisLine={false}
                      interval={3} />
                    <YAxis tick={{ fill: "#6b6b8a", fontSize: 9 }} tickLine={false} axisLine={false}
                      tickFormatter={v => fmtCFA(v)} />
                    <Tooltip
                      contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number, name: string) => [name === "revenue" ? fmtCFAFull(v) : v, name === "revenue" ? "Revenus" : "Commandes"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#grad24rev)" dot={false} />
                    <Area type="monotone" dataKey="orders"  stroke="#22d3ee" strokeWidth={1.5} fill="url(#grad24ord)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-[#6b6b8a]">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />Revenus
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#6b6b8a]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />Commandes
                </span>
              </div>
            </motion.div>

            {/* City stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Commandes par ville</h2>
                <span className="text-[10px] text-[#6b6b8a]">Aujourd'hui</span>
              </div>

              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-white/5 animate-pulse rounded-lg" />)}</div>
              ) : (data?.city_stats ?? []).length === 0 ? (
                <p className="text-center text-[#6b6b8a] text-sm py-8">Aucune donnée</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={data?.city_stats.slice(0,5)} margin={{ top: 0, right: 0, bottom: 0, left: -24 }} barSize={14}>
                      <XAxis dataKey="city" tick={{ fill: "#6b6b8a", fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#6b6b8a", fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [v, "Commandes"]}
                      />
                      <Bar dataKey="orders" radius={[4,4,0,0]}>
                        {(data?.city_stats ?? []).map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-3 space-y-2">
                    {(data?.city_stats ?? []).slice(0,5).map((c, i) => (
                      <div key={c.city} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-medium">{c.city}</span>
                            <span className="text-[#6b6b8a] text-[10px]">{c.pct}%</span>
                          </div>
                          <div className="h-1 bg-[#1e1e2e] rounded-full mt-1">
                            <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          </div>
                        </div>
                        <span className="text-[#6b6b8a] text-[10px] shrink-0">{c.orders} cmd</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* ── ROW 2: Payouts + Activities + AI Alerts ────────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Payouts en attente */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-sm">Payouts en attente</h2>
                  {(fin?.pending_payouts_count ?? 0) > 0 && (
                    <p className="text-[#6b6b8a] text-[10px]">{fin!.pending_payouts_count} demande{fin!.pending_payouts_count > 1 ? "s" : ""} · {fmtCFAFull(fin!.pending_payouts_amount)}</p>
                  )}
                </div>
                <Link href="/admin/payouts" className="text-blue-400 text-[10px] hover:underline flex items-center gap-1">
                  Voir tout <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />)}</div>
              ) : (data?.pending_payouts ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-[#6b6b8a] text-sm">Aucun payout en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data!.pending_payouts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-[#1e1e2e] rounded-xl hover:bg-[#2a2a3e] transition-colors group">
                      {p.vendor_logo ? (
                        <Image src={p.vendor_logo} alt={p.vendor_name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{p.vendor_name}</p>
                        <p className="text-[#6b6b8a] text-[10px]">{p.method}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-bold text-sm">{fmtCFA(p.amount)}</p>
                        <button className="text-[10px] text-blue-400 hidden group-hover:block hover:underline">Payer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(fin?.failed_transactions_count ?? 0) > 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-300 text-xs font-semibold">{fin!.failed_transactions_count} paiement{fin!.failed_transactions_count > 1 ? "s" : ""} échoué{fin!.failed_transactions_count > 1 ? "s" : ""}</p>
                    <p className="text-[#6b6b8a] text-[10px]">{fmtCFAFull(fin!.failed_transactions_amount)}</p>
                  </div>
                  <Link href="/admin/transactions" className="text-red-400 text-[10px] font-semibold hover:underline">Voir</Link>
                </div>
              )}
            </motion.div>

            {/* Activités récentes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Activités récentes</h2>
                <Activity className="w-4 h-4 text-[#6b6b8a]" />
              </div>

              {loading ? (
                <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}</div>
              ) : (data?.activities ?? []).length === 0 ? (
                <p className="text-center text-[#6b6b8a] text-sm py-8">Aucune activité récente</p>
              ) : (
                <div className="relative space-y-4">
                  <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[#1e1e2e]" />
                  {(data?.activities ?? []).map((act) => {
                    const cfg = ACT_CFG[act.type] ?? ACT_CFG.order
                    return (
                      <div key={act.id} className="flex gap-3 relative">
                        <div className={`w-7 h-7 rounded-full bg-[#1e1e2e] flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                          <cfg.Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-white text-xs font-medium leading-snug truncate">{act.title}</p>
                          <p className="text-[#6b6b8a] text-[10px] truncate">{act.subtitle}</p>
                          <p className="text-[#4a4a6a] text-[10px] mt-0.5">{fmtTime(act.timestamp)}</p>
                        </div>
                        {act.status && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e1e2e] text-[#6b6b8a] shrink-0 h-fit mt-0.5">
                            {act.status}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Détection IA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-sm">Détection IA</h2>
                  <p className="text-[#6b6b8a] text-[10px]">Alertes sécurité en temps réel</p>
                </div>
                <Shield className="w-4 h-4 text-purple-400" />
              </div>

              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}</div>
              ) : (data?.ai_alerts ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShieldCheck className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-green-400 text-sm font-semibold">Aucune alerte active</p>
                  <p className="text-[#6b6b8a] text-xs mt-1">Tous les systèmes sont normaux</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data!.ai_alerts.map(alert => {
                    const sev = SEV_CFG[alert.severity] ?? SEV_CFG.medium
                    return (
                      <div key={alert.id} className={`border rounded-xl p-3 ${sev.cls}`}>
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${sev.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-white text-xs font-semibold truncate">{alert.title}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${
                                alert.severity === "high" ? "bg-red-500/20 text-red-300" :
                                alert.severity === "medium" ? "bg-orange-500/20 text-orange-300" :
                                "bg-yellow-500/20 text-yellow-300"
                              }`}>{sev.label}</span>
                            </div>
                            <p className="text-[#6b6b8a] text-[10px] mt-0.5 line-clamp-2">{alert.description}</p>
                            <p className="text-[#4a4a6a] text-[10px] mt-1">{fmtTime(alert.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <Link href="/admin/security"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] rounded-xl text-[#6b6b8a] text-xs font-medium transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />Voir tous les logs
              </Link>
            </motion.div>
          </div>

          {/* ── ROW 3: System + Categories + Performance + Shortcuts ───── */}
          <div className="grid lg:grid-cols-4 gap-6">

            {/* Statut systèmes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Statut systèmes</h2>
                <span className="flex items-center gap-1 text-green-400 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Opérationnel
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-xl" />)}</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data?.system_status ?? {}).map(([key, status]) => {
                    const Ico = SYS_ICONS[key] ?? Zap
                    const ok = status === "operational"
                    return (
                      <div key={key} className="flex items-center gap-3 p-2.5 bg-[#1e1e2e] rounded-xl">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ok ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          <Ico className={`w-3.5 h-3.5 ${ok ? "text-green-400" : "text-red-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{SYS_LABELS[key] ?? key}</p>
                          <p className={`text-[10px] ${ok ? "text-green-400" : "text-red-400"}`}>
                            {ok ? "Opérationnel" : status}
                          </p>
                        </div>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? "bg-green-400" : "bg-red-400"}`} />
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Top catégories */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Top catégories</h2>
                <Tag className="w-4 h-4 text-[#6b6b8a]" />
              </div>

              {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-white/5 animate-pulse rounded-lg" />)}</div>
              ) : (data?.top_categories ?? []).length === 0 ? (
                <p className="text-center text-[#6b6b8a] text-sm py-8">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {data!.top_categories.map((cat, i) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-xs font-medium">{cat.name}</span>
                        <span className="text-[#6b6b8a] text-xs">{cat.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1e1e2e] rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.pct}%` }}
                          transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                          className="h-1.5 rounded-full"
                          style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Performance plateforme */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Performance</h2>
                <TrendingUp className="w-4 h-4 text-[#6b6b8a]" />
              </div>

              {loading ? (
                <div className="h-48 bg-white/5 animate-pulse rounded-xl" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%"
                      data={[
                        { name: "Disponibilité", value: data?.performance.availability ?? 0, fill: "#3b82f6" },
                        { name: "Temps réponse", value: Math.max(0, 100 - (data?.performance.response_time ?? 1.2) * 10), fill: "#22d3ee" },
                        { name: "Uptime", value: data?.performance.uptime ?? 0, fill: "#a3e635" },
                      ]}
                      startAngle={180} endAngle={0}
                    >
                      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#1e1e2e" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>

                  <div className="space-y-2 mt-1">
                    {[
                      { label: "Disponibilité", value: `${data?.performance.availability ?? 0}%`, color: "bg-blue-500" },
                      { label: "Temps réponse", value: `${data?.performance.response_time ?? 0}s`, color: "bg-cyan-400" },
                      { label: "Uptime 30j",    value: `${data?.performance.uptime ?? 0}%`,        color: "bg-[#a3e635]" },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${m.color}`} />
                        <span className="text-[#6b6b8a] text-xs flex-1">{m.label}</span>
                        <span className="text-white text-xs font-bold">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Raccourcis rapides */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Raccourcis</h2>
                <Zap className="w-4 h-4 text-[#a3e635]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: UserPlus,     label: "Ajouter vendeur",   href: "/admin/vendors/new",        color: "#3b82f6" },
                  { icon: Package,      label: "Nouvelle commande",  href: "/admin/orders/new",         color: "#22d3ee" },
                  { icon: Truck,        label: "Gérer livreurs",     href: "/admin/drivers",            color: "#a3e635" },
                  { icon: DollarSign,   label: "Lancer payout",      href: "/admin/payouts",            color: "#f59e0b" },
                  { icon: BarChart3,    label: "Voir analyses",      href: "/admin/analytics",          color: "#8b5cf6" },
                  { icon: Settings,     label: "Paramètres",         href: "/admin/settings",           color: "#6b6b8a" },
                ].map(sc => (
                  <Link key={sc.label} href={sc.href}
                    className="flex flex-col items-center gap-2 p-3 bg-[#1e1e2e] rounded-xl hover:bg-[#2a2a3e] transition-colors text-center group"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: sc.color + "22" }}>
                      <sc.icon className="w-4 h-4" style={{ color: sc.color }} />
                    </div>
                    <span className="text-[#6b6b8a] text-[10px] leading-tight group-hover:text-white transition-colors">{sc.label}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-xs font-semibold mb-0.5">Astuce</p>
                <p className="text-[#6b6b8a] text-[10px]">Appuyez sur <kbd className="bg-[#1e1e2e] px-1 py-0.5 rounded text-[9px]">⌘K</kbd> pour la recherche rapide</p>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  )
}
