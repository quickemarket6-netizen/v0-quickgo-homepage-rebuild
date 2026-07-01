"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, RefreshCw, Download, Search, Truck, Package,
  CheckCircle, XCircle, Clock, MapPin, Star, Navigation,
  MoreHorizontal, Eye, Filter, Activity, Phone,
  ChevronRight, Users, AlertTriangle, Zap,
} from "lucide-react"
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ── types ────────────────────────────────────────────────────────────────────
interface DeliveryItem {
  id: string
  order_id: string
  customer_name: string
  driver_name: string
  driver_rating: number
  city: string
  pickup: string
  destination: string
  status: "pending" | "picking_up" | "in_transit" | "delivered" | "cancelled" | "failed"
  assigned_at: string
  estimated_at: string
  delivered_at: string | null
  distance_km: number
  amount: number
}
interface TopDriver {
  id: string; name: string; deliveries_today: number
  rating: number; on_time_rate: number
  status: "active" | "idle" | "offline"; city: string
}
interface PageData {
  kpi: {
    total_today: number; in_progress: number; delivered: number
    cancelled: number; avg_time_minutes: number; on_time_rate: number
    yesterday_total: number
  }
  deliveries: DeliveryItem[]
  top_drivers: TopDriver[]
  city_distribution: { city: string; count: number; pct: number }[]
  hourly_trend: { hour: string; total: number; delivered: number }[]
}

// ── constants ────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; pulse: boolean }> = {
  pending:    { label:"En attente",   color:"text-[#6b6b8a]",  bg:"bg-[#1e1e2e]",        border:"border-[#2a2a3e]",        dot:"bg-[#6b6b8a]",   pulse:false },
  picking_up: { label:"Récupération", color:"text-yellow-300", bg:"bg-yellow-500/15",     border:"border-yellow-500/25",    dot:"bg-yellow-400",  pulse:true  },
  in_transit: { label:"En cours",     color:"text-blue-300",   bg:"bg-blue-500/15",       border:"border-blue-500/25",      dot:"bg-blue-400",    pulse:true  },
  delivered:  { label:"Livrée",       color:"text-green-300",  bg:"bg-green-500/15",      border:"border-green-500/25",     dot:"bg-green-400",   pulse:false },
  cancelled:  { label:"Annulée",      color:"text-red-300",    bg:"bg-red-500/15",        border:"border-red-500/25",       dot:"bg-red-400",     pulse:false },
  failed:     { label:"Échouée",      color:"text-orange-300", bg:"bg-orange-500/15",     border:"border-orange-500/25",    dot:"bg-orange-400",  pulse:false },
}
const DRIVER_STATUS_CFG = {
  active:  { label:"Actif",      color:"text-green-400",  dot:"bg-green-400",  pulse:true  },
  idle:    { label:"Disponible", color:"text-yellow-400", dot:"bg-yellow-400", pulse:false },
  offline: { label:"Hors ligne", color:"text-[#4a4a6a]",  dot:"bg-[#4a4a6a]",  pulse:false },
}

const CITY_COORDS: Record<string, [number, number]> = {
  "Douala":     [44, 173], "Yaoundé":    [90, 164], "Bafoussam":  [47, 143],
  "Garoua":    [112,  85], "Bamenda":    [34, 127], "Buea":       [32, 180],
  "Maroua":    [124,  43], "Ngaoundéré":[103, 118], "Bertoua":   [133, 152],
}
const CAMEROON_PATH =
  "M78,4 L83,13 L89,19 L96,13 L106,19 L116,13 L138,30 L147,52 " +
  "L141,79 L149,102 L147,130 L139,153 L129,173 L113,191 " +
  "L93,199 L72,197 L51,191 L34,179 L20,161 L15,139 " +
  "L19,115 L13,91 L19,67 L27,49 L40,34 L53,22 L65,10 Z"

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M FCFA"
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K FCFA"
  return n + " FCFA"
}
function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (d < 1)    return "À l'instant"
  if (d < 60)   return `Il y a ${d}min`
  if (d < 1440) return `Il y a ${Math.floor(d / 60)}h${String(d % 60).padStart(2, "0")}`
  return `Il y a ${Math.floor(d / 1440)}j`
}
function fmtETA(iso: string) {
  const d = Math.floor((new Date(iso).getTime() - Date.now()) / 60_000)
  if (d <= 0)  return "En retard"
  if (d < 60)  return `${d} min`
  return `${Math.floor(d / 60)}h${String(d % 60).padStart(2, "0")}`
}

// ── CountUp ──────────────────────────────────────────────────────────────────
function CountUp({ target, format }: { target: number; format: (n: number) => string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) { setVal(0); return }
    const steps = 40; const step = target / steps; let cur = 0; let f = 0
    const id = setInterval(() => {
      f++; cur = Math.min(cur + step, target); setVal(cur)
      if (f >= steps) clearInterval(id)
    }, 800 / steps)
    return () => clearInterval(id)
  }, [target])
  return <>{format(val)}</>
}

// ── DeliveryMap ──────────────────────────────────────────────────────────────
function DeliveryMap({ deliveries, hoveredCity, onHover }: {
  deliveries: DeliveryItem[]
  hoveredCity: string | null
  onHover: (c: string | null) => void
}) {
  const stats = deliveries.reduce<Record<string, { active: number; done: number; other: number }>>(
    (acc, d) => {
      if (!acc[d.city]) acc[d.city] = { active: 0, done: 0, other: 0 }
      if (["in_transit","picking_up"].includes(d.status)) acc[d.city].active++
      else if (d.status === "delivered")                  acc[d.city].done++
      else                                                acc[d.city].other++
      return acc
    }, {}
  )

  return (
    <svg viewBox="0 0 160 204" className="w-full h-full" style={{ maxHeight: 200 }}>
      <defs>
        <pattern id="dg" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#ffffff05" strokeWidth="0.5" />
        </pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="160" height="204" fill="url(#dg)" />
      <path d={CAMEROON_PATH} fill="#13131e" stroke="#2a2a3e" strokeWidth="1.5" strokeLinejoin="round" />

      {Object.entries(stats).map(([city, s]) => {
        const coords = CITY_COORDS[city]; if (!coords) return null
        const [cx, cy] = coords
        const total = s.active + s.done + s.other
        const isHov = hoveredCity === city
        const hasActive = s.active > 0
        const r = Math.min(7 + total * 0.6, 13)
        const pinColor = hasActive ? "#3b82f6" : "#22c55e"

        return (
          <g key={city} style={{ cursor: "pointer" }}
            onMouseEnter={() => onHover(city)}
            onMouseLeave={() => onHover(null)}
          >
            {hasActive && (
              <motion.circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#3b82f6" strokeWidth="1.5"
                animate={{ opacity: [0.7, 0], r: [r + 2, r + 9] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <motion.circle cx={cx} cy={cy} r={r}
              fill={pinColor + "22"}
              stroke={isHov ? "#93c5fd" : pinColor}
              strokeWidth={isHov ? 2 : 1.5}
              filter={isHov ? "url(#glow)" : undefined}
              animate={{ r: isHov ? r + 2 : r }}
              transition={{ duration: 0.2 }}
            />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
              fill={hasActive ? "#93c5fd" : "#86efac"} fontSize="5.5" fontWeight="bold"
            >{total}</text>

            {isHov && (
              <g>
                <rect x={cx - 30} y={cy - 30} width="60" height="26" rx="4"
                  fill="#16161f" stroke="#2a2a3e" strokeWidth="1" />
                <text x={cx} y={cy - 22} textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold">{city}</text>
                <text x={cx} y={cy - 14} textAnchor="middle" fill="#6b6b8a" fontSize="4">
                  {[hasActive && `${s.active} actif${s.active > 1 ? "s" : ""}`, s.done > 0 && `${s.done} livrée${s.done > 1 ? "s" : ""}`]
                    .filter(Boolean).join(" · ")}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, format, sub, subColor, icon: Icon, iconColor, pulse, delay = 0 }: {
  label: string; value: number; format: (n: number) => string
  sub: string; subColor: string
  icon: typeof Truck; iconColor: string
  pulse?: boolean; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#2a2a3e] transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl" style={{ background: iconColor + "22" }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: iconColor }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: iconColor }} />
          </span>
        )}
      </div>
      <div>
        <p className="text-white font-extrabold text-2xl tabular-nums leading-none tracking-tight">
          <CountUp target={value} format={format} />
        </p>
        <p className="text-[#6b6b8a] text-xs mt-1 leading-none">{label}</p>
      </div>
      <p className={`text-[11px] font-medium ${subColor}`}>{sub}</p>
    </motion.div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function LivraisonsPage() {
  const [data, setData]               = useState<PageData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [refreshing, setRefreshing]   = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch]           = useState("")
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [dateRange, setDateRange]     = useState<"today" | "7d" | "30d">("today")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const res = await fetch("/api/admin/deliveries")
      if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des livraisons`)
      setData(await res.json())
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const deliveries = data?.deliveries ?? []
  const filtered = deliveries.filter(d => {
    if (statusFilter !== "all") {
      if (statusFilter === "cancelled" && !["cancelled","failed"].includes(d.status)) return false
      if (statusFilter !== "cancelled" && d.status !== statusFilter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return d.id.toLowerCase().includes(q) || d.order_id.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) || d.driver_name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    all:        deliveries.length,
    in_transit: deliveries.filter(d => d.status === "in_transit").length,
    picking_up: deliveries.filter(d => d.status === "picking_up").length,
    delivered:  deliveries.filter(d => d.status === "delivered").length,
    cancelled:  deliveries.filter(d => ["cancelled","failed"].includes(d.status)).length,
    pending:    deliveries.filter(d => d.status === "pending").length,
  }

  const TABS = [
    { key:"all",        label:"Toutes",       count: counts.all },
    { key:"in_transit", label:"En cours",     count: counts.in_transit },
    { key:"picking_up", label:"Récupération", count: counts.picking_up },
    { key:"delivered",  label:"Livrées",      count: counts.delivered },
    { key:"cancelled",  label:"Annulées",     count: counts.cancelled },
    { key:"pending",    label:"En attente",   count: counts.pending },
  ]

  const kpi = data?.kpi
  const pctChange = kpi ? (((kpi.total_today - kpi.yesterday_total) / Math.max(kpi.yesterday_total, 1)) * 100) : 0
  const successRate = kpi ? ((kpi.delivered / Math.max(kpi.total_today, 1)) * 100) : 0
  const cancelRate  = kpi ? ((kpi.cancelled  / Math.max(kpi.total_today, 1)) * 100) : 0

  const donutData = [
    { name:"Livrées",    value: kpi?.delivered ?? 0,                                                                color:"#22c55e" },
    { name:"En cours",   value: kpi?.in_progress ?? 0,                                                              color:"#3b82f6" },
    { name:"En attente", value: Math.max(0, (kpi?.total_today ?? 0) - (kpi?.delivered ?? 0) - (kpi?.in_progress ?? 0) - (kpi?.cancelled ?? 0)), color:"#4a4a6a" },
    { name:"Annulées",   value: kpi?.cancelled ?? 0,                                                                color:"#ef4444" },
  ].filter(d => d.value > 0)

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Truck className="w-10 h-10 text-blue-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#6b6b8a] text-sm"
        >
          Chargement des livraisons…
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto text-white">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#1e1e2e]"
      >
        <div className="flex items-center gap-3 px-6 py-3">
          <Link href="/admin"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>

          <div className="p-2.5 rounded-xl bg-blue-500/15 shrink-0">
            <Truck className="w-5 h-5 text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-white font-bold text-base leading-none">Livraisons</h1>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                <span className="text-green-400 text-[10px] font-semibold">Temps réel</span>
              </span>
            </div>
            <p className="text-[#4a4a6a] text-[11px] mt-0.5 leading-none">
              Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Date range toggle */}
          <div className="flex items-center gap-1 bg-[#16161f] border border-[#1e1e2e] rounded-xl p-1 shrink-0">
            {(["today","7d","30d"] as const).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  dateRange === r
                    ? "bg-blue-500/25 text-blue-300"
                    : "text-[#6b6b8a] hover:text-white"
                }`}
              >{r === "today" ? "Aujourd'hui" : r === "7d" ? "7 jours" : "30 jours"}</button>
            ))}
          </div>

          <button onClick={() => load(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#6b6b8a] hover:text-white text-xs font-medium transition-all shrink-0">
            <motion.span
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.span>
            Actualiser
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition-all shrink-0">
            <Download className="w-3.5 h-3.5" />
            Exporter CSV
          </button>
        </div>
      </motion.header>

      <div className="p-6 space-y-5">

        {/* ── ERROR BANNER ────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Échec du chargement des livraisons</p>
              <p className="text-[#6b6b8a] text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={() => load()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition-colors shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
              Réessayer
            </button>
          </div>
        )}

        {/* ── KPI ROW ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Total aujourd'hui" value={kpi?.total_today ?? 0} format={n => String(Math.round(n))}
            sub={`${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}% vs hier`}
            subColor={pctChange >= 0 ? "text-green-400" : "text-red-400"}
            icon={Package} iconColor="#3b82f6" delay={0}
          />
          <KpiCard
            label="En cours" value={kpi?.in_progress ?? 0} format={n => String(Math.round(n))}
            sub="Livraisons actives maintenant" subColor="text-blue-400"
            icon={Navigation} iconColor="#3b82f6" pulse delay={0.07}
          />
          <KpiCard
            label="Livrées" value={kpi?.delivered ?? 0} format={n => String(Math.round(n))}
            sub={`${successRate.toFixed(0)}% taux de succès`} subColor="text-green-400"
            icon={CheckCircle} iconColor="#22c55e" delay={0.14}
          />
          <KpiCard
            label="Annulées / Échouées" value={kpi?.cancelled ?? 0} format={n => String(Math.round(n))}
            sub={`${cancelRate.toFixed(1)}% du total`} subColor="text-red-400"
            icon={XCircle} iconColor="#ef4444" delay={0.21}
          />
          <KpiCard
            label="Temps moyen" value={kpi?.avg_time_minutes ?? 0} format={n => `${Math.round(n)} min`}
            sub="Délai moyen de livraison" subColor="text-[#6b6b8a]"
            icon={Clock} iconColor="#f59e0b" delay={0.28}
          />
          <KpiCard
            label="À l'heure" value={kpi?.on_time_rate ?? 0} format={n => `${n.toFixed(1)}%`}
            sub="Taux de ponctualité" subColor="text-cyan-400"
            icon={Activity} iconColor="#22d3ee" delay={0.35}
          />
        </div>

        {/* ── MAIN ROW: table + map ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── DELIVERY TABLE ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            style={{ minHeight: 480 }}
          >
            {/* Table toolbar */}
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-sm">Liste des livraisons</h2>
                <span className="text-[#4a4a6a] text-xs">
                  {filtered.length} / {deliveries.length} résultat{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a6a]" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ID livraison, client, livreur, ville…"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-[#4a4a6a] focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-white transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
                      statusFilter === tab.key
                        ? "bg-blue-500/25 text-blue-300 border border-blue-500/30"
                        : "text-[#6b6b8a] hover:bg-white/5 hover:text-white border border-transparent"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                        statusFilter === tab.key ? "bg-blue-500/30 text-blue-200" : "bg-white/10 text-[#6b6b8a]"
                      }`}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-[#4a4a6a]"
                >
                  <Package className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucune livraison trouvée</p>
                  {search && <p className="text-xs mt-1">Essayez d'autres mots-clés</p>}
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((d, i) => {
                    const cfg = STATUS_CFG[d.status] ?? STATUS_CFG.pending
                    const isExpanded = expandedRow === d.id
                    const isActive = ["in_transit","picking_up"].includes(d.status)

                    return (
                      <motion.div key={d.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.22, delay: i * 0.025 }}
                        className={`border-b border-[#1a1a28] last:border-0 transition-colors ${
                          isActive ? "hover:bg-blue-500/[0.04]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Main row */}
                        <div
                          className="flex items-center gap-3 px-5 py-3 cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : d.id)}
                        >
                          {/* Animated status dot */}
                          <div className="relative w-2.5 h-2.5 shrink-0 flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full inline-block ${cfg.dot}`} />
                            {cfg.pulse && (
                              <span className={`absolute inset-0 rounded-full animate-ping ${cfg.dot} opacity-50`} />
                            )}
                          </div>

                          {/* ID */}
                          <div className="w-24 shrink-0 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{d.id}</p>
                            <p className="text-[#4a4a6a] text-[10px] truncate">{d.order_id}</p>
                          </div>

                          {/* Customer + city */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{d.customer_name}</p>
                            <p className="text-[#4a4a6a] text-[10px] flex items-center gap-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />{d.city}
                            </p>
                          </div>

                          {/* Driver */}
                          <div className="w-24 shrink-0 hidden sm:block min-w-0">
                            <p className="text-[#a0a0c0] text-xs truncate">{d.driver_name}</p>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 shrink-0" />
                              <span className="text-[10px] text-[#6b6b8a]">{d.driver_rating}</span>
                            </div>
                          </div>

                          {/* Status badge */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            {cfg.label}
                          </span>

                          {/* ETA / elapsed */}
                          <div className="text-right shrink-0 w-16 hidden md:block">
                            {(d.status === "in_transit" || d.status === "picking_up") ? (
                              <>
                                <p className="text-xs font-semibold text-yellow-300 tabular-nums">{fmtETA(d.estimated_at)}</p>
                                <p className="text-[10px] text-[#4a4a6a]">restant</p>
                              </>
                            ) : d.status === "delivered" && d.delivered_at ? (
                              <>
                                <p className="text-xs font-medium text-green-400">{fmtRelative(d.delivered_at)}</p>
                                <p className="text-[10px] text-[#4a4a6a]">livré</p>
                              </>
                            ) : (
                              <p className="text-xs text-[#4a4a6a]">{fmtRelative(d.assigned_at)}</p>
                            )}
                          </div>

                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-[#4a4a6a] shrink-0" />
                          </motion.div>
                        </div>

                        {/* Expanded detail panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              key="detail"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-4 pt-1 bg-white/[0.018] border-t border-[#1e1e2e]">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Départ</p>
                                    <p className="text-xs text-white flex items-start gap-1">
                                      <MapPin className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                                      <span>{d.pickup}</span>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Destination</p>
                                    <p className="text-xs text-white flex items-start gap-1">
                                      <MapPin className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                                      <span>{d.destination}</span>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Distance</p>
                                    <p className="text-xs text-white font-semibold">{d.distance_km} km</p>
                                    <p className="text-[10px] text-[#4a4a6a]">{Math.round(d.distance_km * 8)} FCFA/km</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Montant</p>
                                    <p className="text-xs text-white font-bold">{fmtCFA(d.amount)}</p>
                                    <p className="text-[10px] text-[#4a4a6a]">Frais livreur inclus</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" /> Voir détail complet
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#6b6b8a] text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
                                  >
                                    <Phone className="w-3 h-3" /> Contacter livreur
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#6b6b8a] text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
                                  >
                                    <MoreHorizontal className="w-3 h-3" /> Plus d'actions
                                  </motion.button>
                                  {["in_transit","picking_up","pending"].includes(d.status) && (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                                    >
                                      <XCircle className="w-3 h-3" /> Annuler
                                    </motion.button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* ── MAP ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] flex items-center justify-between">
              <h2 className="text-white font-bold text-sm">Carte en direct</h2>
              <span className="text-[#4a4a6a] text-xs">
                {deliveries.filter(d => ["in_transit","picking_up"].includes(d.status)).length} actives
              </span>
            </div>

            {/* Map */}
            <div className="flex-1 p-3 flex items-center justify-center bg-[#0d0d16]">
              <DeliveryMap
                deliveries={deliveries}
                hoveredCity={hoveredCity}
                onHover={setHoveredCity}
              />
            </div>

            {/* City breakdown */}
            <div className="px-4 py-3 space-y-1.5 border-t border-[#1e1e2e]">
              {(data?.city_distribution ?? []).slice(0, 4).map((c, i) => {
                const active = deliveries.filter(d => d.city === c.city && ["in_transit","picking_up"].includes(d.status)).length
                return (
                  <motion.div key={c.city}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                      hoveredCity === c.city ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                    onMouseEnter={() => setHoveredCity(c.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <span className="text-[10px] text-[#4a4a6a] font-bold w-3">{i + 1}</span>
                    <span className="text-white text-xs font-medium flex-1 truncate">{c.city}</span>
                    {active > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-300 shrink-0">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
                        </span>
                        {active}
                      </span>
                    )}
                    <span className="text-[#6b6b8a] text-[11px] shrink-0">{c.count}</span>
                    <div className="w-12 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden shrink-0">
                      <motion.div
                        className="h-full rounded-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${c.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + i * 0.06, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] text-[#4a4a6a] w-7 text-right shrink-0">{c.pct}%</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="px-4 pb-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                { label:"En cours",     color:"#3b82f6" },
                { label:"Récupération", color:"#f59e0b" },
                { label:"Livrée",       color:"#22c55e" },
                { label:"Annulée",      color:"#ef4444" },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-[#6b6b8a]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Top livreurs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] flex items-center justify-between">
              <h2 className="text-white font-bold text-sm">Top livreurs</h2>
              <Link href="/admin/drivers" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
              {(data?.top_drivers ?? []).map((driver, i) => {
                const dscfg = DRIVER_STATUS_CFG[driver.status]
                return (
                  <motion.div key={driver.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.065, ease: "easeOut" }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <span className="text-xs font-bold w-5 text-center text-[#4a4a6a] shrink-0">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-[#4a4a6a]">{i + 1}</span>}
                    </span>

                    {/* Avatar */}
                    <div className="relative w-8 h-8 shrink-0">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">
                          {driver.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#16161f] ${dscfg.dot}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate leading-none">{driver.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-medium ${dscfg.color}`}>{dscfg.label}</span>
                        <span className="text-[#2a2a3e] text-[10px]">·</span>
                        <span className="text-[10px] text-[#4a4a6a] truncate">{driver.city}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-white text-xs font-bold tabular-nums">{driver.deliveries_today}</p>
                      <p className="text-[10px] text-[#4a4a6a]">livr.</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-0.5 justify-end">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white font-semibold tabular-nums">{driver.rating}</span>
                      </div>
                      <p className="text-[10px] text-green-400 tabular-nums">{driver.on_time_rate}%</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Tendance horaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.54, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white font-bold text-sm">Tendance horaire</h2>
                  <p className="text-[#4a4a6a] text-xs mt-0.5">Volume de livraisons sur 24h</p>
                </div>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-3 h-0.5 bg-blue-400 inline-block rounded-full" /> Total
                  </span>
                  <span className="flex items-center gap-1.5 text-green-400">
                    <span className="w-3 h-0.5 bg-green-400 inline-block rounded-full" /> Livrées
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data?.hourly_trend ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour"
                    tick={{ fill:"#4a4a6a", fontSize:9 }}
                    axisLine={false} tickLine={false} interval={3}
                  />
                  <YAxis
                    tick={{ fill:"#4a4a6a", fontSize:9 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background:"#16161f", border:"1px solid #2a2a3e", borderRadius:8, fontSize:11, padding:"6px 10px" }}
                    itemStyle={{ color:"#fff" }}
                    labelStyle={{ color:"#6b6b8a", marginBottom:2 }}
                    formatter={(v: number, name: string) => [v, name === "total" ? "Total" : "Livrées"]}
                  />
                  <Area type="monotone" dataKey="total"
                    stroke="#3b82f6" strokeWidth={2} fill="url(#gTotal)" dot={false}
                    activeDot={{ r:3, fill:"#3b82f6", stroke:"#16161f", strokeWidth:2 }}
                  />
                  <Area type="monotone" dataKey="delivered"
                    stroke="#22c55e" strokeWidth={2} fill="url(#gDone)" dot={false}
                    activeDot={{ r:3, fill:"#22c55e", stroke:"#16161f", strokeWidth:2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Distribution des statuts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <h2 className="text-white font-bold text-sm">Distribution des statuts</h2>
              <p className="text-[#4a4a6a] text-xs mt-0.5">{kpi?.total_today ?? 0} livraisons aujourd'hui</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 gap-5">
              {/* Donut */}
              <div className="relative">
                <PieChart width={152} height={152}>
                  <Pie
                    data={donutData} cx={76} cy={76}
                    innerRadius={48} outerRadius={68}
                    paddingAngle={2} dataKey="value"
                    stroke="none"
                    animationBegin={700} animationDuration={900}
                  >
                    {donutData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background:"#16161f", border:"1px solid #2a2a3e", borderRadius:8, fontSize:11 }}
                    itemStyle={{ color:"#fff" }}
                    formatter={(v: number, name: string) => [v, name]}
                  />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-white font-extrabold text-xl tabular-nums leading-none">
                    {kpi?.total_today ?? 0}
                  </p>
                  <p className="text-[#4a4a6a] text-[10px] mt-0.5">total</p>
                </div>
              </div>

              {/* Legend with bars */}
              <div className="w-full space-y-2.5">
                {donutData.map((item, i) => (
                  <motion.div key={item.name}
                    className="space-y-1"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + i * 0.08 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-[#a0a0c0]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                        {item.name}
                      </span>
                      <span className="text-white text-xs font-bold tabular-nums">
                        {item.value}
                        <span className="text-[#4a4a6a] font-normal ml-1 text-[10px]">
                          ({((item.value / Math.max(kpi?.total_today ?? 1, 1)) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / Math.max(kpi?.total_today ?? 1, 1)) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.8 + i * 0.08, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </div>
    </div>
  )
}
