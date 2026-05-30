"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, Search, ChevronDown, RefreshCw,
  ArrowUpRight, Zap, ChevronRight, LogOut, User, Download, Boxes,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  vendor: { id: string; name: string; logo_url: string | null; is_verified: boolean; rating: number | null; status: string }
  kpi: { today_sales: number; today_orders: number; month_revenue: number; active_products: number; rating: number }
  chart: { date: string; sales: number; orders: number }[]
  top_products: { name: string; sold: number; revenue: number }[]
}

// ─── Sidebar items (same as dashboard, Analytics active) ─────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  { icon: Boxes,           label: "Stocks",          href: "/vendor/stocks" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits", href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: TrendingUp, label: "Revenus",    href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait",  href: "/vendor/wallet" },
      { label: "Historique",       href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,     label: "Clients CRM", href: "/vendor/crm" },
  { icon: BarChart3, label: "Analyses",   href: "/vendor/analytics", active: true },
  { icon: Tag,       label: "Promotions", href: "/vendor/promotions" },
  { icon: Star,      label: "Avis",       href: "/vendor/reviews" },
  { icon: Settings,  label: "Paramètres", href: "/vendor/settings" },
  { icon: HelpCircle,label: "Aide",       href: "/vendor/help" },
]

// ─── Video URLs (from hero-section) ──────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F`
  if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} F`
  return `${Math.round(n)} F`
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/60 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-bold">{p.name === "Revenus" ? formatCFA(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, rawValue, displayValue, color, icon: Icon, delay,
}: {
  label: string; rawValue: number; displayValue: string; color: string
  icon: typeof TrendingUp; delay: number
}) {
  const counted = useCountUp(rawValue, 700)
  void counted
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        hover:border-[#3b82f6]/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)] transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-tight">{displayValue}</p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(7)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/dashboard?period=${p}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(7) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Video cycling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  const handlePeriod = (p: number) => { setPeriod(p); fetchData(p) }
  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const kpi = data?.kpi
  const chartData = data?.chart ?? []
  const topProducts = data?.top_products ?? []

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Background glow orbs ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#a3e635] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#3b82f6] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#8b5cf6] blur-[120px]"
        />
      </div>

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e] relative z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1e1e2e]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
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
          {SIDEBAR_ITEMS.map((item, idx) => {
            const isExpanded = expandedSections[item.label]
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {item.expandable ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.label)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/40 hover:bg-white/5 hover:text-white"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-7 mt-0.5 space-y-0.5"
                        >
                          {item.children?.map((child) => (
                            <Link key={child.label} href={child.href}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-white/5 hover:text-white transition-all"
                            >
                              <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                      item.active
                        ? "bg-[#a3e635]/10 border-l-2 border-[#a3e635] text-[#a3e635] rounded-r-xl ml-0 pl-[10px]"
                        : "rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </nav>

        {/* Booster CTA */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="bg-gradient-to-br from-[#a3e635]/15 to-[#3b82f6]/10 border border-[#a3e635]/20 rounded-xl p-4">
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

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative z-10">

        {/* ── Hero header with video background ──────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* Video */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            onEnded={() => setVideoIdx((i) => (i + 1) % BACKGROUND_VIDEOS.length)}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/90 to-[#0a0a0f]/70" />

          {/* Sticky top bar */}
          <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3 flex items-center justify-between gap-4 relative">
            <div>
              <h1 className="text-white font-bold leading-tight">
                Analyses &amp; Performances
              </h1>
              <p className="text-xs text-white/30">Vue détaillée de votre activité</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input placeholder="Rechercher…" className="pl-9 w-56 bg-[#16161f] border-[#1e1e2e] rounded-xl h-9 text-sm placeholder:text-white/20" />
              </div>
              <button className="relative p-2 hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
              </button>
              <Button variant="ghost" size="icon" onClick={() => fetchData(period)} className="h-9 w-9 rounded-xl">
                <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e] hover:opacity-90 transition-opacity focus:outline-none">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center border-2 border-[#a3e635]/60 shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.25)]">
                      <span className="text-white font-bold text-xs">{data ? initials(data.vendor.name) : "?"}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#16161f] border-[#1e1e2e]">
                  <div className="px-3 py-2 border-b border-[#1e1e2e]">
                    <p className="text-white text-sm font-semibold truncate">{data?.vendor.name ?? "Vendeur"}</p>
                    <span className={`text-xs ${data?.vendor.status === "active" ? "text-[#22c55e]" : "text-[#f97316]"}`}>
                      {data?.vendor.status === "active" ? "● Actif" : "● Inactif"}
                    </span>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <User className="h-4 w-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <Settings className="h-4 w-4" /> Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem
                    onClick={async () => { await supabase.current.auth.signOut(); window.location.href = "/" }}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Hero content */}
          <div className="relative px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-full px-3 py-1 mb-4">
                <BarChart3 className="w-3.5 h-3.5 text-[#a3e635]" />
                <span className="text-[#a3e635] text-xs font-medium uppercase tracking-widest">Analytics</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">
                Tableau de bord<br />
                <span className="text-[#a3e635]">analytique</span>
              </h2>
              <p className="text-white/50 text-sm max-w-md">
                Suivez vos performances en temps réel et prenez les meilleures décisions pour développer votre activité.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Period selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Vue d&apos;ensemble</h3>
            <div className="flex items-center gap-1 bg-[#16161f] border border-[#1e1e2e] rounded-xl p-1">
              {[{ v: 7, l: "7j" }, { v: 30, l: "30j" }, { v: 90, l: "90j" }].map(({ v, l }) => (
                <button key={v} onClick={() => handlePeriod(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === v ? "bg-[#a3e635] text-black font-bold" : "text-white/40 hover:text-white"
                  }`}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          {loading && !data ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <KpiCard label="Ventes aujourd'hui" rawValue={kpi?.today_sales ?? 0} displayValue={formatCFA(kpi?.today_sales ?? 0)} color="#22c55e" icon={TrendingUp} delay={0} />
              <KpiCard label="Commandes du jour" rawValue={kpi?.today_orders ?? 0} displayValue={String(kpi?.today_orders ?? 0)} color="#3b82f6" icon={ShoppingBag} delay={0.05} />
              <KpiCard label="Revenus du mois" rawValue={kpi?.month_revenue ?? 0} displayValue={formatCFA(kpi?.month_revenue ?? 0)} color="#a3e635" icon={BarChart3} delay={0.1} />
              <KpiCard label="Note moyenne" rawValue={kpi?.rating ?? 0} displayValue={`${(kpi?.rating ?? 0).toFixed(1)} ★`} color="#f97316" icon={Star} delay={0.15} />
            </div>
          )}

          {/* Charts row */}
          <div className="grid xl:grid-cols-2 gap-4">

            {/* Revenue Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              whileHover={{ y: -1 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
                hover:border-[#3b82f6]/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.06)] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-sm">Revenus sur la période</h3>
                  <p className="text-xs text-white/30 mt-0.5">Derniers {period} jours</p>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              {loading && !data ? (
                <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="sales" name="Revenus" stroke="#a3e635" strokeWidth={2} fill="url(#salesGrad)" dot={false} activeDot={{ r: 4, fill: "#a3e635" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Orders Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              whileHover={{ y: -1 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
                hover:border-[#3b82f6]/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.06)] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-sm">Commandes par jour</h3>
                  <p className="text-xs text-white/30 mt-0.5">Derniers {period} jours</p>
                </div>
              </div>
              {loading && !data ? (
                <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="orders" name="Commandes" fill="url(#ordersGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* Top products table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            whileHover={{ y: -1 }}
            className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
              hover:border-[#3b82f6]/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.06)] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Top Produits</h3>
              <Link href="/vendor/products" className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 flex items-center gap-1 transition-colors">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {loading && !data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">Aucun produit pour le moment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="text-xs text-white/30 border-b border-[#1e1e2e]">
                      <th className="pb-3 text-left font-medium">#</th>
                      <th className="pb-3 text-left font-medium">Produit</th>
                      <th className="pb-3 text-right font-medium">Ventes</th>
                      <th className="pb-3 text-right font-medium">Revenus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e2e]">
                    {topProducts.map((p, i) => (
                      <motion.tr
                        key={p.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5">
                          <span className="w-6 h-6 rounded-full bg-[#a3e635]/10 text-[#a3e635] text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <p className="text-white text-sm font-medium truncate max-w-[200px]">{p.name}</p>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="text-white/60 text-sm">{p.sold}</span>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="text-white font-semibold text-sm">{formatCFA(p.revenue)}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Summary stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Total revenus période", value: formatCFA(chartData.reduce((s, d) => s + d.sales, 0)), color: "#a3e635", delay: 0.35 },
              { label: "Total commandes période", value: String(chartData.reduce((s, d) => s + d.orders, 0)), color: "#3b82f6", delay: 0.4 },
              { label: "Produits actifs", value: String(kpi?.active_products ?? 0), color: "#8b5cf6", delay: 0.45 },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: s.delay }}
                className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 text-center
                  hover:border-[#3b82f6]/30 transition-all duration-300"
              >
                <p className="text-2xl font-black" style={{ color: s.color }}>{loading && !data ? "…" : s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
