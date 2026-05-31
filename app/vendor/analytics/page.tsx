"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, TrendingDown, Wallet, Users,
  BarChart3, Tag, Star, Settings, HelpCircle, Bell, ChevronDown, RefreshCw,
  Zap, ChevronRight, LogOut, User, Download, Boxes, Truck, Crown, Percent,
} from "lucide-react"
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface RevenueData {
  vendor: {
    id: string; name: string; logo_url: string | null
    is_verified: boolean; rating: number | null; status: string; commission_rate: number
  }
  kpi: {
    today: number; today_change: number
    week: number; week_change: number
    month: number; month_change: number
    year: number; year_change: number
    avg_order_value: number
    commission_month: number
    commission_rate: number
  }
  chart: { date: string; revenue: number; orders: number }[]
  by_dow: { day: string; revenue: number }[]
  top_products: { name: string; sold: number; revenue: number }[]
  wallet: { available_balance: number; pending_balance: number; total_earned: number } | null
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  { icon: Boxes,           label: "Stocks",          href: "/vendor/stocks" },
  { icon: Truck,           label: "Livraisons",      href: "/vendor/deliveries" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits", href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: TrendingUp, label: "Revenus", href: "/vendor/analytics", active: true },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait",  href: "/vendor/wallet" },
      { label: "Retraits",         href: "/vendor/payouts" },
      { label: "Historique",       href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Star,       label: "Avis",        href: "/vendor/reviews" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

// ─── Videos ───────────────────────────────────────────────────────────────────
const VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F`
  if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} F`
  return `${Math.round(n)} F`
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}
function useCountUp(target: number, duration = 800) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target === 0) { setV(0); return }
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setV(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target, duration])
  return v
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
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

// ─── KPI Card (with % change badge) ──────────────────────────────────────────
function KpiCard({
  label, value, displayValue, change, color, sub, icon: Icon, delay,
}: {
  label: string; value: number; displayValue: string; change: number
  color: string; sub?: string; icon: typeof TrendingUp; delay: number
}) {
  const counted = useCountUp(value)
  void counted
  const isUp = change >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        transition-all duration-300 hover:border-white/10 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
          isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {isUp
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />
          }
          {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-tight">{displayValue}</p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/revenue?period=${p}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData(30) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = VIDEOS[videoIdx]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  const handlePeriod = (p: number) => { setPeriod(p); void fetchData(p) }
  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const kpi       = data?.kpi
  const chart     = data?.chart ?? []
  const byDow     = data?.by_dow ?? []
  const topProds  = data?.top_products ?? []
  const maxDow    = Math.max(...byDow.map((d) => d.revenue), 1)
  const maxProd   = Math.max(...topProds.map((p) => p.revenue), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Background orbs ────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/3 w-[420px] h-[420px] rounded-full bg-[#a3e635] blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.22, 0.1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#eab308] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#22c55e] blur-[120px]"
        />
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e] relative z-10">
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
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item, idx) => {
            const isExpanded = expandedSections[item.label]
            return (
              <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
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
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
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
                        ? "bg-[#a3e635]/10 border-l-2 border-[#a3e635] text-[#a3e635] rounded-r-xl pl-[10px]"
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
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="bg-gradient-to-br from-[#a3e635]/15 to-[#eab308]/10 border border-[#a3e635]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#a3e635]" />
              <span className="text-white text-sm font-semibold">Booster</span>
            </div>
            <p className="text-white/40 text-xs mb-3">Multipliez vos revenus avec nos offres sponsorisées.</p>
            <Button size="sm" className="w-full h-8 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-xs rounded-lg">
              Activer
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative z-10">

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            muted playsInline
            onEnded={() => setVideoIdx((i) => (i + 1) % VIDEOS.length)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/90 to-[#0a0a0f]/60" />

          {/* Topbar */}
          <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3 flex items-center justify-between gap-4 relative">
            <div>
              <h1 className="text-white font-bold">Revenus &amp; Statistiques</h1>
              <p className="text-xs text-white/30">Analyse complète de vos revenus</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
              </button>
              <Button variant="ghost" size="icon" onClick={() => void fetchData(period)} className="h-9 w-9 rounded-xl">
                <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e] focus:outline-none hover:opacity-90 transition-opacity">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)]">
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

          {/* Hero text */}
          <div className="relative px-6 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-full px-3 py-1 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#a3e635]" />
                <span className="text-[#a3e635] text-xs font-medium uppercase tracking-widest">Revenus</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">
                Statistiques<br /><span className="text-[#a3e635]">de revenus</span>
              </h2>
              <p className="text-white/40 text-sm max-w-md">
                Suivez l&apos;évolution de vos revenus, identifiez vos meilleurs produits et optimisez votre rentabilité.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── 4 KPI cards (with % change) ──────────────────────────────── */}
          {loading && !data ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <KpiCard label="Aujourd'hui"  sub="vs hier"              value={kpi?.today ?? 0} displayValue={formatCFA(kpi?.today ?? 0)} change={kpi?.today_change ?? 0} color="#22c55e" icon={TrendingUp} delay={0} />
              <KpiCard label="Cette semaine" sub="vs semaine dernière" value={kpi?.week ?? 0}  displayValue={formatCFA(kpi?.week ?? 0)}  change={kpi?.week_change ?? 0}  color="#3b82f6" icon={BarChart3} delay={0.06} />
              <KpiCard label="Ce mois"       sub="vs mois dernier"    value={kpi?.month ?? 0} displayValue={formatCFA(kpi?.month ?? 0)} change={kpi?.month_change ?? 0} color="#a3e635" icon={TrendingUp} delay={0.12} />
              <KpiCard label="Cette année"   sub="vs année dernière"  value={kpi?.year ?? 0}  displayValue={formatCFA(kpi?.year ?? 0)}  change={kpi?.year_change ?? 0}  color="#eab308" icon={Crown}     delay={0.18} />
            </div>
          )}

          {/* ── 2 secondary cards ────────────────────────────────────────── */}
          {!loading && data && (
            <div className="grid sm:grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex items-center gap-5
                  hover:border-[#8b5cf6]/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#8b5cf6]/15 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-7 h-7 text-[#8b5cf6]" />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Panier moyen (30 derniers jours)</p>
                  <p className="text-2xl font-black text-white">{formatCFA(kpi?.avg_order_value ?? 0)}</p>
                  <p className="text-[11px] text-white/20 mt-0.5">par commande validée</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex items-center gap-5
                  hover:border-[#f97316]/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#f97316]/10 flex items-center justify-center shrink-0">
                  <Percent className="w-7 h-7 text-[#f97316]" />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Commission ce mois ({kpi?.commission_rate ?? 5}%)</p>
                  <p className="text-2xl font-black text-white">{formatCFA(kpi?.commission_month ?? 0)}</p>
                  <p className="text-[11px] text-white/20 mt-0.5">déduit de vos revenus bruts</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* ── Revenue trend chart ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
              hover:border-[#a3e635]/15 transition-all duration-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-white font-semibold text-sm">Évolution des revenus</h3>
                <p className="text-xs text-white/30 mt-0.5">Revenus journaliers sur la période sélectionnée</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-1">
                  {([{ v: 7, l: "7j" }, { v: 30, l: "30j" }, { v: 90, l: "90j" }] as const).map(({ v, l }) => (
                    <button key={v} onClick={() => handlePeriod(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        period === v ? "bg-[#a3e635] text-black font-bold" : "text-white/40 hover:text-white"
                      }`}
                    >{l}</button>
                  ))}
                </div>
                <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>
            {loading ? (
              <div className="h-60 rounded-xl bg-white/5 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a3e635" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false}
                    interval={period > 30 ? 6 : period > 14 ? 3 : "preserveStartEnd"} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#a3e635" strokeWidth={2.5}
                    fill="url(#revGrad)" dot={false}
                    activeDot={{ r: 5, fill: "#a3e635", stroke: "#0a0a0f", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* ── 2-col: by day-of-week + top products ─────────────────────── */}
          <div className="grid xl:grid-cols-2 gap-4">

            {/* Revenue by day of week */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
                hover:border-[#3b82f6]/15 transition-all duration-300"
            >
              <h3 className="text-white font-semibold text-sm mb-1">Revenus par jour de la semaine</h3>
              <p className="text-xs text-white/30 mb-5">Distribution sur les {period} derniers jours</p>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-7 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {byDow.map((d, i) => (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="text-xs text-white/40 w-7 shrink-0 font-medium">{d.day}</span>
                      <div className="flex-1 h-6 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.revenue / maxDow) * 100}%` }}
                          transition={{ delay: 0.36 + i * 0.05, duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#06b6d4]"
                        />
                      </div>
                      <span className="text-xs font-semibold w-20 text-right shrink-0 text-white">
                        {d.revenue > 0 ? formatCFA(d.revenue) : <span className="text-white/20">—</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top products by revenue */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
                hover:border-[#eab308]/15 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-sm">Top produits — Revenus</h3>
                  <p className="text-xs text-white/30 mt-0.5">30 derniers jours, classés par chiffre d&apos;affaires</p>
                </div>
                <Link href="/vendor/products"
                  className="text-xs text-[#a3e635] hover:text-[#a3e635]/80 flex items-center gap-1 transition-colors">
                  Voir tout <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : topProds.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-10">Aucun produit vendu récemment</p>
              ) : (
                <div className="space-y-4">
                  {topProds.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.42 + i * 0.04 }}
                      className="flex items-center gap-3"
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? "bg-[#eab308]/20 text-[#eab308]" :
                        i === 1 ? "bg-white/10 text-white/50" :
                        i === 2 ? "bg-[#f97316]/15 text-[#f97316]" :
                        "bg-white/5 text-white/25"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{p.name}</p>
                        <div className="mt-1.5 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(p.revenue / maxProd) * 100}%` }}
                            transition={{ delay: 0.42 + i * 0.04, duration: 0.7 }}
                            className="h-full rounded-full"
                            style={{
                              background: i === 0 ? "#eab308" : i === 1 ? "#a3e635" : i === 2 ? "#22c55e" : "#3b82f6",
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-bold text-xs">{formatCFA(p.revenue)}</p>
                        <p className="text-white/30 text-[10px]">{p.sold} vendus</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Bottom: wallet + revenue breakdown ───────────────────────── */}
          {!loading && data && (
            <div className="grid sm:grid-cols-2 gap-4">

              {/* Wallet quick card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                className="bg-gradient-to-br from-[#a3e635]/10 via-[#22c55e]/5 to-transparent
                  border border-[#a3e635]/20 rounded-2xl p-5 hover:border-[#a3e635]/35 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-[#a3e635]/60 font-bold uppercase tracking-widest mb-1">Portefeuille</p>
                    <p className="text-white font-bold text-sm">Solde disponible</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#a3e635]/15 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-[#a3e635]" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white mb-1">
                  {formatCFA(data.wallet?.available_balance ?? 0)}
                </p>
                {(data.wallet?.pending_balance ?? 0) > 0 && (
                  <p className="text-xs text-white/30 mb-4">
                    + {formatCFA(data.wallet?.pending_balance ?? 0)} en attente
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-[#a3e635]/15 flex items-center justify-between">
                  <p className="text-xs text-white/30">Total encaissé</p>
                  <p className="text-xs font-bold text-[#a3e635]">{formatCFA(data.wallet?.total_earned ?? 0)}</p>
                </div>
                <Link href="/vendor/wallet"
                  className="mt-4 inline-flex items-center gap-2 bg-[#a3e635] hover:bg-[#a3e635]/90
                    text-black font-bold text-xs px-4 py-2 rounded-xl transition-colors w-full justify-center"
                >
                  Gérer le portefeuille <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>

              {/* Revenue breakdown: gross / commission / net */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
                  hover:border-[#f97316]/15 transition-all duration-300"
              >
                <h3 className="text-white font-semibold text-sm mb-5">Décomposition des revenus ce mois</h3>
                <div className="space-y-4">
                  {[
                    { label: "Revenus bruts",     value: kpi?.month ?? 0,                                                  color: "#a3e635", pct: 100 },
                    { label: "Commission QuickGo", value: kpi?.commission_month ?? 0,                                       color: "#f97316", pct: Math.min(kpi?.commission_rate ?? 5, 100) },
                    { label: "Revenus nets",       value: Math.max(0, (kpi?.month ?? 0) - (kpi?.commission_month ?? 0)),   color: "#22c55e", pct: Math.max(0, 100 - (kpi?.commission_rate ?? 5)) },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white/50">{row.label}</span>
                        <span className="text-xs font-bold text-white">{formatCFA(row.value)}</span>
                      </div>
                      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${row.pct}%` }}
                          transition={{ delay: 0.55, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: row.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-[#1e1e2e] flex items-center justify-between">
                  <span className="text-xs text-white/30">Taux de commission appliqué</span>
                  <span className="text-[#f97316] font-bold">{kpi?.commission_rate ?? 5}%</span>
                </div>
              </motion.div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
