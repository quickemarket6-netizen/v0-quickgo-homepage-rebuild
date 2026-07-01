"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, RefreshCw, Download, Search, DollarSign,
  XCircle, ChevronRight, CheckCircle, Clock, TrendingUp,
  AlertTriangle, MoreHorizontal, Eye, RotateCcw, Loader2,
  Activity, Zap, Filter,
} from "lucide-react"
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { toast } from "sonner"

// ── types ─────────────────────────────────────────────────────────────────────
interface TransactionItem {
  id: string
  order_id: string
  customer_name: string
  amount: number
  method: string
  status: "success" | "failed" | "refunded" | "pending"
  timestamp: string
  fee: number
  commission: number
}
interface MethodDist {
  method: string
  count: number
  pct: number
  color: string
}
interface HourlyTrend {
  hour: string
  volume: number
  count: number
}
interface StatusDist {
  status: string
  count: number
  color: string
}
interface PageData {
  kpi: {
    volume_total: number
    count_today: number
    success_rate: number
    avg_amount: number
    failed_count: number
    commission_quickgo: number
    yesterday_count: number
  }
  transactions: TransactionItem[]
  method_distribution: MethodDist[]
  hourly_trend: HourlyTrend[]
  status_distribution: StatusDist[]
}

// ── constants ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  success:  { label:"Succès",       color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/25",  icon: CheckCircle },
  failed:   { label:"Échouée",      color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/25",    icon: XCircle     },
  refunded: { label:"Remboursée",   color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/25",   icon: RotateCcw   },
  pending:  { label:"En cours",     color:"text-yellow-300", bg:"bg-yellow-500/15", border:"border-yellow-500/25", icon: Clock       },
}

const METHOD_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Orange Money": { color:"text-orange-300", bg:"bg-orange-500/15", border:"border-orange-500/25" },
  "MTN Money":    { color:"text-yellow-300", bg:"bg-yellow-500/15", border:"border-yellow-500/25" },
  "Wave":         { color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/25"   },
  "CinetPay":     { color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/25"  },
  "PayPal":       { color:"text-purple-300", bg:"bg-purple-500/15", border:"border-purple-500/25" },
  "Virement":     { color:"text-pink-300",   bg:"bg-pink-500/15",   border:"border-pink-500/25"   },
}
const METHOD_DEFAULT = { color:"text-[#6b6b8a]", bg:"bg-[#1e1e2e]", border:"border-[#2a2a3e]" }

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K"
  return String(Math.round(n))
}
function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (d < 1)    return "À l'instant"
  if (d < 60)   return `Il y a ${d}min`
  if (d < 1440) return `Il y a ${Math.floor(d / 60)}h${String(d % 60).padStart(2, "0")}`
  return `Il y a ${Math.floor(d / 1440)}j`
}
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

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, format, sub, subColor, icon: Icon, iconColor, delay = 0, pulse }: {
  label: string; value: number; format: (n: number) => string
  sub: string; subColor: string; icon: typeof DollarSign
  iconColor: string; delay?: number; pulse?: boolean
}) {
  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, delay, ease:[0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#2a2a3e] transition-colors">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl" style={{ background: iconColor + "22" }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: iconColor }} />
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
export default function TransactionsPage() {
  const [data, setData]               = useState<PageData | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [search, setSearch]           = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showMethodMenu, setShowMethodMenu] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const res = await fetch("/api/admin/transactions")
      if (!res.ok) {
        let message = "Impossible de charger les transactions."
        if (res.status === 403) message = "Accès refusé. Vous devez être administrateur."
        else {
          try {
            const body = await res.json()
            if (body?.error) message = body.error
          } catch { /* ignore non-JSON error body */ }
        }
        throw new Error(message)
      }
      setData(await res.json())
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.")
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const allTx = data?.transactions ?? []

  const TABS = [
    { key:"all",      label:"Toutes",       count: allTx.length },
    { key:"success",  label:"Succès",        count: allTx.filter(t => t.status === "success").length },
    { key:"failed",   label:"Échouées",      count: allTx.filter(t => t.status === "failed").length },
    { key:"refunded", label:"Remboursées",   count: allTx.filter(t => t.status === "refunded").length },
    { key:"pending",  label:"En cours",      count: allTx.filter(t => t.status === "pending").length },
  ]

  const filtered = allTx
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => methodFilter === "all" || t.method === methodFilter)
    .filter(t => !search || t.id.toLowerCase().includes(search.toLowerCase()) || t.order_id.toLowerCase().includes(search.toLowerCase()) || t.customer_name.toLowerCase().includes(search.toLowerCase()))

  const failedTx = allTx.filter(t => t.status === "failed")
  const kpi = data?.kpi
  const methodDist = data?.method_distribution ?? []
  const hourlyTrend = data?.hourly_trend ?? []
  const statusDist = data?.status_distribution ?? []

  // Commission by method
  const commissionByMethod = Object.entries(
    allTx.reduce<Record<string, number>>((acc, t) => {
      acc[t.method] = (acc[t.method] ?? 0) + t.commission
      return acc
    }, {})
  ).map(([method, total]) => ({ method, total })).sort((a, b) => b.total - a.total)

  const methodOptions = ["all", ...Array.from(new Set(allTx.map(t => t.method)))]

  const exportCsv = () => {
    if (filtered.length === 0) { toast.info("Aucune donnée à exporter"); return }
    const header = ["ID", "Commande", "Client", "Montant", "Méthode", "Statut", "Frais", "Commission", "Date"]
    const rows = filtered.map(t => [
      t.id, t.order_id, t.customer_name, String(Math.round(t.amount)), t.method,
      STATUS_CFG[t.status]?.label ?? t.status,
      String(Math.round(t.fee)), String(Math.round(t.commission)),
      new Date(t.timestamp).toLocaleString("fr-FR"),
    ])
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `transactions-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`${filtered.length} transaction${filtered.length > 1 ? "s" : ""} exportée${filtered.length > 1 ? "s" : ""}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <DollarSign className="w-10 h-10 text-blue-400" />
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }} className="text-[#6b6b8a] text-sm">
        Chargement des transactions…
      </motion.p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-2xl bg-red-500/15">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-base">Erreur de chargement</h2>
          <p className="text-[#6b6b8a] text-sm mt-1.5">{error}</p>
        </div>
        <button onClick={() => load()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-sm font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto text-white" onClick={() => setShowMethodMenu(false)}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3 px-6 py-3">
          <Link href="/admin" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="p-2.5 rounded-xl bg-blue-500/15 shrink-0">
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-white font-bold text-base leading-none">Transactions</h1>
              {(kpi?.failed_count ?? 0) > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {kpi?.failed_count} échouées
                </span>
              )}
            </div>
            <p className="text-[#4a4a6a] text-[11px] mt-0.5 leading-none">
              Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <button onClick={() => load(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#6b6b8a] hover:text-white text-xs font-medium transition-all shrink-0">
            <motion.span animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.span>
            Actualiser
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#6b6b8a] hover:text-white text-xs font-medium transition-all shrink-0">
            <Download className="w-3.5 h-3.5" />
            Exporter
          </button>
        </div>
      </motion.header>

      <div className="p-6 space-y-5">

        {/* ── KPI ROW ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Volume total" value={kpi?.volume_total ?? 0} format={n => fmtCFA(n) + " FCFA"}
            sub="Transactions réussies" subColor="text-blue-400"
            icon={TrendingUp} iconColor="#3b82f6" delay={0} />
          <KpiCard label="Transactions aujourd'hui" value={kpi?.count_today ?? 0} format={n => String(Math.round(n))}
            sub={`Hier : ${kpi?.yesterday_count ?? 0}`} subColor="text-[#6b6b8a]"
            icon={Activity} iconColor="#22c55e" delay={0.07} />
          <KpiCard label="Taux de succès" value={kpi?.success_rate ?? 0} format={n => n.toFixed(1) + "%"}
            sub="Sur toutes les tx" subColor="text-green-400"
            icon={CheckCircle} iconColor="#22c55e" delay={0.14} />
          <KpiCard label="Montant moyen" value={kpi?.avg_amount ?? 0} format={n => fmtCFA(n) + " FCFA"}
            sub="Par transaction" subColor="text-[#6b6b8a]"
            icon={DollarSign} iconColor="#8b5cf6" delay={0.21} />
          <KpiCard label="Échouées" value={kpi?.failed_count ?? 0} format={n => String(Math.round(n))}
            sub="Nécessitent attention" subColor="text-red-400"
            icon={XCircle} iconColor="#ef4444" delay={0.28} pulse />
          <KpiCard label="Commission QuickGo" value={kpi?.commission_quickgo ?? 0} format={n => n.toFixed(1) + "%"}
            sub="Taux de commission" subColor="text-purple-400"
            icon={Zap} iconColor="#8b5cf6" delay={0.35} />
        </div>

        {/* ── MAIN ROW ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── TRANSACTION TABLE ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            style={{ minHeight: 520 }}>

            {/* Toolbar */}
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-sm">Liste des transactions</h2>
                <span className="text-[#4a4a6a] text-xs">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a6a]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="ID transaction, n° commande…"
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-[#4a4a6a] focus:outline-none focus:border-blue-500/50 transition-colors" />
                  <AnimatePresence>
                    {search && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-white transition-colors">
                        <XCircle className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                {/* Method dropdown */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setShowMethodMenu(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-xs text-[#6b6b8a] hover:text-white hover:border-[#2a2a3e] transition-all shrink-0">
                    <Filter className="w-3 h-3" />
                    {methodFilter === "all" ? "Méthode" : methodFilter}
                  </button>
                  <AnimatePresence>
                    {showMethodMenu && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 z-20 bg-[#16161f] border border-[#2a2a3e] rounded-xl overflow-hidden shadow-2xl min-w-[150px]">
                        {methodOptions.map(m => (
                          <button key={m} onClick={() => { setMethodFilter(m); setShowMethodMenu(false) }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                              methodFilter === m ? "bg-blue-500/20 text-blue-300" : "text-[#6b6b8a] hover:bg-white/5 hover:text-white"
                            }`}>
                            {m === "all" ? "Toutes méthodes" : m}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Status tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                      statusFilter === tab.key
                        ? "bg-blue-500/25 text-blue-300 border border-blue-500/30"
                        : "text-[#6b6b8a] hover:bg-white/5 hover:text-white border border-transparent"
                    }`}>
                    {tab.label}
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      statusFilter === tab.key ? "bg-blue-500/30 text-blue-200" : "bg-white/10 text-[#6b6b8a]"
                    }`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#4a4a6a]">
                  <DollarSign className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucune transaction trouvée</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((t, i) => {
                    const scfg = STATUS_CFG[t.status] ?? STATUS_CFG.pending
                    const mcfg = METHOD_CFG[t.method] ?? METHOD_DEFAULT
                    const isExpanded = expandedRow === t.id
                    const StatusIcon = scfg.icon

                    return (
                      <motion.div key={t.id} layout
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.22, delay: i * 0.025 }}
                        className="border-b border-[#1a1a28] last:border-0 hover:bg-white/[0.02] transition-colors">

                        <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : t.id)}>

                          {/* Status icon */}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${scfg.bg}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${scfg.color}`} />
                          </div>

                          {/* IDs */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{t.customer_name}</p>
                            <p className="text-[#4a4a6a] text-[10px]">{t.id} · {t.order_id}</p>
                          </div>

                          {/* Method badge */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 hidden sm:inline-flex ${mcfg.bg} ${mcfg.color} ${mcfg.border}`}>
                            {t.method}
                          </span>

                          {/* Amount */}
                          <p className="text-white text-sm font-bold tabular-nums shrink-0 w-24 text-right">
                            {fmtCFA(t.amount)} <span className="text-[10px] text-[#4a4a6a] font-normal">FCFA</span>
                          </p>

                          {/* Status badge */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 ${scfg.bg} ${scfg.color} ${scfg.border}`}>
                            {scfg.label}
                          </span>

                          {/* Time */}
                          <p className="text-[#4a4a6a] text-[10px] shrink-0 hidden md:block w-16 text-right">
                            {fmtRelative(t.timestamp)}
                          </p>

                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="w-3.5 h-3.5 text-[#4a4a6a] shrink-0" />
                          </motion.div>
                        </div>

                        {/* Expanded row detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div key="detail"
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                              <div className="px-5 pb-4 pt-1 bg-white/[0.018] border-t border-[#1e1e2e]">
                                <div className="grid grid-cols-4 gap-4 mb-3">
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Méthode</p>
                                    <p className={`text-xs font-semibold ${mcfg.color}`}>{t.method}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Frais</p>
                                    <p className="text-xs text-white">{t.fee > 0 ? fmtCFA(t.fee) + " FCFA" : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Commission</p>
                                    <p className="text-xs text-white">{t.commission > 0 ? fmtCFA(t.commission) + " FCFA" : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Horodatage</p>
                                    <p className="text-xs text-white">{fmtRelative(t.timestamp)}</p>
                                  </div>
                                </div>
                                {/* Device / IP forensic fields removed: payment_transactions
                                    exposes no real device or IP column, so nothing is fabricated here. */}
                                <div className="flex flex-wrap gap-2">
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-colors">
                                    <Eye className="w-3 h-3" /> Voir commande
                                  </motion.button>
                                  {t.status === "failed" && (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-300 text-xs font-bold hover:bg-green-500/25 transition-colors">
                                      <RotateCcw className="w-3 h-3" /> Rembourser
                                    </motion.button>
                                  )}
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#6b6b8a] text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
                                    <MoreHorizontal className="w-3 h-3" /> Plus
                                  </motion.button>
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

          {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* 24h Volume Area Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
                <h2 className="text-white font-bold text-sm">Volume — 24h</h2>
                <p className="text-[#4a4a6a] text-xs mt-0.5">Transactions par heure (FCFA)</p>
              </div>
              <div className="p-3 pt-4">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={hourlyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: "#4a4a6a", fontSize: 9 }} axisLine={false} tickLine={false}
                      interval={5} />
                    <YAxis tick={{ fill: "#4a4a6a", fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => fmtCFA(v)} />
                    <Tooltip
                      contentStyle={{ background: "#16161f", border: "1px solid #2a2a3e", borderRadius: 8, fontSize: 11, padding: "6px 10px" }}
                      itemStyle={{ color: "#fff" }} labelStyle={{ color: "#6b6b8a", marginBottom: 2 }}
                      formatter={(v: number) => [fmtCFA(v) + " FCFA", "Volume"]}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} fill="url(#txGrad)" dot={false}
                      activeDot={{ r: 3, fill: "#3b82f6", stroke: "#16161f", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Method distribution donut */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex-1">
              <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
                <h2 className="text-white font-bold text-sm">Méthodes de paiement</h2>
                <p className="text-[#4a4a6a] text-xs mt-0.5">Répartition des transactions</p>
              </div>
              <div className="p-4 flex flex-col items-center gap-4">
                <PieChart width={140} height={140}>
                  <Pie data={methodDist} cx={70} cy={70}
                    innerRadius={42} outerRadius={60}
                    paddingAngle={3} dataKey="count"
                    stroke="none" animationBegin={400} animationDuration={900}>
                    {methodDist.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3e", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number, name: string) => [v + " transaction" + (v > 1 ? "s" : ""), name]} />
                </PieChart>
                <div className="w-full space-y-2">
                  {methodDist.map((m, i) => (
                    <motion.div key={m.method}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.07 }}
                      className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                      <span className="text-[#a0a0c0] text-xs flex-1 truncate">{m.method}</span>
                      <span className="text-white text-xs font-bold tabular-nums">{m.count}</span>
                      <div className="w-12 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: m.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${m.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.55 + i * 0.07, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Col 1 — Recent failed transactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">Transactions échouées</h2>
                <p className="text-[#4a4a6a] text-xs mt-0.5">Nécessitent une action</p>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                </span>
                {failedTx.length}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {failedTx.length === 0 ? (
                <p className="text-[#4a4a6a] text-xs text-center py-6">Aucune transaction échouée</p>
              ) : (
                failedTx.map((t, i) => (
                  <motion.div key={t.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                    className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                    <div className="p-1.5 rounded-lg bg-red-500/15 shrink-0">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-white text-xs font-semibold truncate">{t.customer_name}</p>
                        <p className="text-red-300 text-xs font-bold tabular-nums shrink-0">{fmtCFA(t.amount)} FCFA</p>
                      </div>
                      <p className="text-[#6b6b8a] text-[10px] mb-1">{t.id} · {t.order_id}</p>
                      <p className="text-red-400/70 text-[10px] font-medium">
                        Paiement échoué
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Col 2 — Status distribution donut + animated bars */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <h2 className="text-white font-bold text-sm">Statuts globaux</h2>
              <p className="text-[#4a4a6a] text-xs mt-0.5">{allTx.length} transactions au total</p>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              <div className="relative">
                <PieChart width={130} height={130}>
                  <Pie data={statusDist} cx={65} cy={65}
                    innerRadius={40} outerRadius={58}
                    paddingAngle={3} dataKey="count" stroke="none"
                    animationBegin={600} animationDuration={900}>
                    {statusDist.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-white font-extrabold text-lg tabular-nums">{allTx.length}</p>
                  <p className="text-[#4a4a6a] text-[10px]">total</p>
                </div>
              </div>
              <div className="w-full space-y-2.5">
                {statusDist.map((d, i) => {
                  const pct = Math.round((d.count / Math.max(allTx.length, 1)) * 100)
                  return (
                    <motion.div key={d.status}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + i * 0.08 }}
                      className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[#a0a0c0] text-xs flex-1">{d.status}</span>
                        <span className="text-white text-xs font-bold tabular-nums">{d.count}</span>
                        <span className="text-[#4a4a6a] text-[10px] w-8 text-right">{pct}%</span>
                      </div>
                      <div className="ml-4 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: d.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.7 + i * 0.08, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Col 3 — Commission collected by method (horizontal bars) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <h2 className="text-white font-bold text-sm">Commissions par méthode</h2>
              <p className="text-[#4a4a6a] text-xs mt-0.5">Total collecté (FCFA)</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={commissionByMethod}
                  layout="vertical"
                  margin={{ top: 0, right: 10, bottom: 0, left: 20 }}>
                  <XAxis type="number" tick={{ fill: "#4a4a6a", fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtCFA(v)} />
                  <YAxis type="category" dataKey="method" tick={{ fill: "#a0a0c0", fontSize: 9 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: "#16161f", border: "1px solid #2a2a3e", borderRadius: 8, fontSize: 11, padding: "6px 10px" }}
                    itemStyle={{ color: "#fff" }} labelStyle={{ color: "#6b6b8a", marginBottom: 2 }}
                    formatter={(v: number) => [fmtCFA(v) + " FCFA", "Commission"]}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} animationBegin={700} animationDuration={900}>
                    {commissionByMethod.map((entry, i) => {
                      const cfg = METHOD_CFG[entry.method] ?? METHOD_DEFAULT
                      // Extract a color from the border class for fill
                      const colorMap: Record<string, string> = {
                        "Orange Money": "#f97316",
                        "MTN Money":    "#eab308",
                        "Wave":         "#3b82f6",
                        "CinetPay":     "#22c55e",
                        "PayPal":       "#8b5cf6",
                        "Virement":     "#ec4899",
                      }
                      void cfg
                      return <Cell key={i} fill={colorMap[entry.method] ?? "#6b6b8a"} opacity={0.8} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </div>
      </div>
    </div>
  )
}
