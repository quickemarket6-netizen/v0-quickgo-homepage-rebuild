"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, RefreshCw, Download, Search, Wallet,
  Store, Truck, User, XCircle, ChevronRight,
  Eye, MoreHorizontal, Lock, Plus, AlertTriangle,
  Activity, Clock, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownLeft, RotateCcw,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

// ── types ────────────────────────────────────────────────────────────────────
interface WalletItem {
  id: string; owner_name: string; owner_type: "vendor" | "driver" | "client"
  balance: number; pending_withdrawal: number
  total_earned: number; total_withdrawn: number
  status: "active" | "idle" | "frozen" | "pending"
  last_transaction: string; transactions_count: number
}
interface TxnItem {
  id: string; wallet_id: string; owner_name: string; owner_type: string
  type: "credit" | "debit" | "withdrawal" | "refund"
  amount: number; description: string; timestamp: string; balance_after: number
}
interface PageData {
  kpi: {
    total_balance: number; active_wallets: number; transactions_today: number
    volume_withdrawn_month: number; pending_withdrawal: number; frozen_wallets: number
    yesterday_transactions: number
  }
  wallets: WalletItem[]
  recent_transactions: TxnItem[]
  type_distribution: { type: string; label: string; count: number; balance: number; pct: number }[]
  volume_trend: { day: string; credits: number; debits: number; withdrawals: number }[]
}

// ── constants ────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<string, { label: string; color: string; bg: string; border: string; iconColor: string; Icon: typeof Store }> = {
  vendor: { label:"Vendeur", color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/25",   iconColor:"#3b82f6", Icon: Store },
  driver: { label:"Livreur", color:"text-purple-300", bg:"bg-purple-500/15", border:"border-purple-500/25", iconColor:"#8b5cf6", Icon: Truck },
  client: { label:"Client",  color:"text-cyan-300",   bg:"bg-cyan-500/15",   border:"border-cyan-500/25",   iconColor:"#22d3ee", Icon: User  },
}
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:  { label:"Actif",       color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/25"  },
  idle:    { label:"Inactif",     color:"text-yellow-300", bg:"bg-yellow-500/15", border:"border-yellow-500/25" },
  frozen:  { label:"Gelé",        color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/25"    },
  pending: { label:"En attente",  color:"text-orange-300", bg:"bg-orange-500/15", border:"border-orange-500/25" },
}
const TXN_CFG: Record<string, { label: string; color: string; bg: string; border: string; sign: string; Icon: typeof Store }> = {
  credit:     { label:"Crédit",        color:"text-green-400",  bg:"bg-green-500/10",  border:"border-green-500/20",  sign:"+", Icon: ArrowDownLeft },
  debit:      { label:"Débit",         color:"text-red-400",    bg:"bg-red-500/10",    border:"border-red-500/20",    sign:"-", Icon: ArrowUpRight   },
  withdrawal: { label:"Retrait",       color:"text-orange-400", bg:"bg-orange-500/10", border:"border-orange-500/20", sign:"-", Icon: Wallet         },
  refund:     { label:"Remboursement", color:"text-blue-400",   bg:"bg-blue-500/10",   border:"border-blue-500/20",   sign:"+", Icon: RotateCcw      },
}
const TYPE_DONUT_COLORS: Record<string, string> = {
  vendor: "#3b82f6", driver: "#8b5cf6", client: "#22d3ee",
}

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number, compact = true) {
  if (compact) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K"
    return String(Math.round(n))
  }
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
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

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, format, sub, subColor, icon: Icon, iconColor, delay = 0, pulse }: {
  label: string; value: number; format: (n: number) => string
  sub: string; subColor: string; icon: typeof Wallet
  iconColor: string; delay?: number; pulse?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#2a2a3e] transition-colors"
    >
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
export default function WalletsPage() {
  const [data, setData]               = useState<PageData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [typeFilter, setTypeFilter]   = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch]           = useState("")
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null)
  const [sortBy, setSortBy]           = useState<"balance" | "activity" | "transactions">("balance")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const res = await fetch("/api/admin/wallets")
      if (res.ok) { setData(await res.json()); setLastUpdated(new Date()) }
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const allWallets = data?.wallets ?? []
  const filtered = allWallets
    .filter(w => typeFilter === "all" || w.owner_type === typeFilter)
    .filter(w => statusFilter === "all" || w.status === statusFilter)
    .filter(w => {
      if (!search) return true
      const q = search.toLowerCase()
      return w.id.toLowerCase().includes(q) || w.owner_name.toLowerCase().includes(q)
    })
    .sort((a, b) =>
      sortBy === "balance"      ? b.balance - a.balance :
      sortBy === "transactions" ? b.transactions_count - a.transactions_count :
      new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime()
    )

  const TYPE_TABS = [
    { key:"all",    label:"Tous",     count: allWallets.length },
    { key:"vendor", label:"Vendeurs", count: allWallets.filter(w => w.owner_type === "vendor").length },
    { key:"driver", label:"Livreurs", count: allWallets.filter(w => w.owner_type === "driver").length },
    { key:"client", label:"Clients",  count: allWallets.filter(w => w.owner_type === "client").length },
  ]
  const STATUS_TABS = [
    { key:"all",     label:"Tous statuts" },
    { key:"frozen",  label:"Gelés" },
    { key:"pending", label:"En attente" },
  ]

  const kpi = data?.kpi
  const typeDist = data?.type_distribution ?? []
  const volumeTrend = data?.volume_trend ?? []
  const recentTxns = data?.recent_transactions ?? []

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Wallet className="w-10 h-10 text-blue-400" />
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }} className="text-[#6b6b8a] text-sm">
        Chargement des wallets…
      </motion.p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#1e1e2e]"
      >
        <div className="flex items-center gap-3 px-6 py-3">
          <Link href="/admin" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="p-2.5 rounded-xl bg-blue-500/15 shrink-0">
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-white font-bold text-base leading-none">Wallets</h1>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                <span className="text-green-400 text-[10px] font-semibold">Temps réel</span>
              </span>
              {(kpi?.frozen_wallets ?? 0) > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {kpi?.frozen_wallets} gelé{(kpi?.frozen_wallets ?? 0) > 1 ? "s" : ""}
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
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#6b6b8a] hover:text-white text-xs font-medium transition-all shrink-0">
            <Download className="w-3.5 h-3.5" />
            Exporter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition-all shrink-0">
            <Plus className="w-3.5 h-3.5" />
            Créditer
          </button>
        </div>
      </motion.header>

      <div className="p-6 space-y-5">

        {/* ── KPI ROW ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Balance totale" value={kpi?.total_balance ?? 0}
            format={n => fmtCFA(n) + " FCFA"} sub="Tous wallets confondus" subColor="text-[#6b6b8a]"
            icon={DollarSign} iconColor="#3b82f6" delay={0} />
          <KpiCard label="Wallets actifs" value={kpi?.active_wallets ?? 0}
            format={n => String(Math.round(n))} sub="Vendeurs + Livreurs + Clients" subColor="text-green-400"
            icon={Activity} iconColor="#22c55e" delay={0.07} pulse />
          <KpiCard label="Transactions aujourd'hui" value={kpi?.transactions_today ?? 0}
            format={n => String(Math.round(n))}
            sub={`+${(((kpi?.transactions_today ?? 0) - (kpi?.yesterday_transactions ?? 0)) / Math.max(kpi?.yesterday_transactions ?? 1, 1) * 100).toFixed(1)}% vs hier`}
            subColor="text-blue-400" icon={TrendingUp} iconColor="#3b82f6" delay={0.14} />
          <KpiCard label="Volume retiré ce mois" value={kpi?.volume_withdrawn_month ?? 0}
            format={n => fmtCFA(n) + " FCFA"} sub="Retraits traités" subColor="text-purple-400"
            icon={ArrowUpRight} iconColor="#8b5cf6" delay={0.21} />
          <KpiCard label="En attente retrait" value={kpi?.pending_withdrawal ?? 0}
            format={n => fmtCFA(n) + " FCFA"} sub="À traiter urgemment" subColor="text-orange-400"
            icon={Clock} iconColor="#f59e0b" delay={0.28} />
          <KpiCard label="Wallets gelés" value={kpi?.frozen_wallets ?? 0}
            format={n => String(Math.round(n))} sub="Nécessitent attention" subColor="text-red-400"
            icon={Lock} iconColor="#ef4444" delay={0.35} />
        </div>

        {/* ── MAIN ROW ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── WALLET TABLE ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            style={{ minHeight: 500 }}
          >
            {/* Toolbar */}
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-sm">Liste des wallets</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[#4a4a6a] text-xs">{filtered.length}/{allWallets.length}</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1 text-[11px] text-[#6b6b8a] focus:outline-none"
                  >
                    <option value="balance">Trier: Balance</option>
                    <option value="activity">Trier: Activité</option>
                    <option value="transactions">Trier: Transactions</option>
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a6a]" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ID wallet, nom du propriétaire…"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-[#4a4a6a] focus:outline-none focus:border-blue-500/50 transition-colors"
                />
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

              {/* Type tabs */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1 overflow-x-auto">
                  {TYPE_TABS.map(tab => (
                    <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
                        typeFilter === tab.key
                          ? "bg-blue-500/25 text-blue-300 border border-blue-500/30"
                          : "text-[#6b6b8a] hover:bg-white/5 hover:text-white border border-transparent"
                      }`}>
                      {tab.label}
                      <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                        typeFilter === tab.key ? "bg-blue-500/30 text-blue-200" : "bg-white/10 text-[#6b6b8a]"
                      }`}>{tab.count}</span>
                    </button>
                  ))}
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-[11px] text-[#6b6b8a] focus:outline-none shrink-0"
                >
                  {STATUS_TABS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#4a4a6a]">
                  <Wallet className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucun wallet trouvé</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((w, i) => {
                    const typeCfg = TYPE_CFG[w.owner_type]
                    const statusCfg = STATUS_CFG[w.status] ?? STATUS_CFG.active
                    const isExpanded = expandedWallet === w.id
                    const isFrozen = w.status === "frozen"

                    return (
                      <motion.div key={w.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.22, delay: i * 0.025 }}
                        className={`border-b border-[#1a1a28] last:border-0 transition-colors ${
                          isFrozen ? "bg-red-500/[0.03]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                          onClick={() => setExpandedWallet(isExpanded ? null : w.id)}
                        >
                          {/* Avatar */}
                          <div className="relative w-8 h-8 shrink-0">
                            <div className="w-full h-full rounded-xl flex items-center justify-center"
                              style={{ background: typeCfg.iconColor + "22" }}>
                              <typeCfg.Icon className="w-4 h-4" style={{ color: typeCfg.iconColor }} />
                            </div>
                            {isFrozen && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                                <Lock className="w-2 h-2 text-white" />
                              </span>
                            )}
                          </div>

                          {/* Name + ID */}
                          <div className="min-w-0 w-32 shrink-0">
                            <p className="text-white text-xs font-semibold truncate">{w.owner_name}</p>
                            <p className="text-[#4a4a6a] text-[10px] truncate">{w.id}</p>
                          </div>

                          {/* Type badge */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 hidden sm:inline-flex ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                            {typeCfg.label}
                          </span>

                          {/* Balance */}
                          <div className="flex-1 text-right">
                            <p className="text-white text-sm font-bold tabular-nums">
                              {fmtCFA(w.balance)} <span className="text-[10px] text-[#4a4a6a] font-normal">FCFA</span>
                            </p>
                            {w.pending_withdrawal > 0 && (
                              <p className="text-orange-400 text-[10px] tabular-nums">
                                {fmtCFA(w.pending_withdrawal)} en attente
                              </p>
                            )}
                          </div>

                          {/* Transactions count */}
                          <div className="text-right shrink-0 hidden md:block w-14">
                            <p className="text-white text-xs font-semibold tabular-nums">{w.transactions_count}</p>
                            <p className="text-[#4a4a6a] text-[10px]">txns</p>
                          </div>

                          {/* Status */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>

                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="w-3.5 h-3.5 text-[#4a4a6a] shrink-0" />
                          </motion.div>
                        </div>

                        {/* Expanded panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div key="detail"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-4 pt-1 bg-white/[0.018] border-t border-[#1e1e2e]">
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Total gagné</p>
                                    <p className="text-white text-sm font-bold tabular-nums">{fmtCFA(w.total_earned)} FCFA</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Total retiré</p>
                                    <p className="text-white text-sm font-bold tabular-nums">{fmtCFA(w.total_withdrawn)} FCFA</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Dernière activité</p>
                                    <p className="text-white text-xs">{fmtRelative(w.last_transaction)}</p>
                                  </div>
                                </div>
                                {/* Progress bar: withdrawn vs total */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="text-[#4a4a6a]">Taux de retrait</span>
                                    <span className="text-[#6b6b8a]">{Math.round(w.total_withdrawn / Math.max(w.total_earned, 1) * 100)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.round(w.total_withdrawn / Math.max(w.total_earned, 1) * 100)}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-colors">
                                    <Eye className="w-3 h-3" /> Voir transactions
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors">
                                    <Plus className="w-3 h-3" /> Créditer
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#6b6b8a] text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
                                    <MoreHorizontal className="w-3 h-3" /> Actions
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      isFrozen
                                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                        : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                    }`}>
                                    <Lock className="w-3 h-3" />
                                    {isFrozen ? "Dégeler" : "Geler"}
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

            {/* Balance distribution donut */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
                <h2 className="text-white font-bold text-sm">Répartition des balances</h2>
                <p className="text-[#4a4a6a] text-xs mt-0.5">
                  Total : {fmtCFA((data?.wallets ?? []).reduce((s, w) => s + w.balance, 0))} FCFA
                </p>
              </div>
              <div className="p-4 flex flex-col items-center gap-4">
                <div className="relative">
                  <PieChart width={150} height={150}>
                    <Pie data={typeDist} cx={75} cy={75}
                      innerRadius={46} outerRadius={65}
                      paddingAngle={3} dataKey="balance"
                      stroke="none" animationBegin={400} animationDuration={900}>
                      {typeDist.map((e, i) => (
                        <Cell key={i} fill={TYPE_DONUT_COLORS[e.type] ?? "#4a4a6a"} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background:"#16161f", border:"1px solid #2a2a3e", borderRadius:8, fontSize:11 }}
                      formatter={(v: number) => [fmtCFA(v) + " FCFA", ""]}
                    />
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-white font-extrabold text-lg tabular-nums">{allWallets.length}</p>
                    <p className="text-[#4a4a6a] text-[10px]">wallets</p>
                  </div>
                </div>

                <div className="w-full space-y-2.5">
                  {typeDist.map((item, i) => {
                    const cfg = TYPE_CFG[item.type]
                    return (
                      <motion.div key={item.type}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs text-[#a0a0c0]">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_DONUT_COLORS[item.type] }} />
                            {item.label} ({item.count})
                          </span>
                          <span className="text-white text-xs font-bold tabular-nums">
                            {fmtCFA(item.balance)} <span className="text-[#4a4a6a] font-normal">FCFA</span>
                          </span>
                        </div>
                        <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: TYPE_DONUT_COLORS[item.type] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 0.9, delay: 0.55 + i * 0.08, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Top balances quick list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col flex-1"
            >
              <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
                <h2 className="text-white font-bold text-sm">Top 5 balances</h2>
              </div>
              <div className="p-3 space-y-1">
                {allWallets
                  .slice()
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 5)
                  .map((w, i) => {
                    const typeCfg = TYPE_CFG[w.owner_type]
                    const maxBal = allWallets[0] ? Math.max(...allWallets.map(x => x.balance)) : 1
                    return (
                      <motion.div key={w.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.06 }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <span className="text-xs w-4 text-center text-[#4a4a6a] font-bold shrink-0">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                        </span>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: typeCfg.iconColor + "22" }}>
                          <typeCfg.Icon className="w-3 h-3" style={{ color: typeCfg.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{w.owner_name}</p>
                          <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden mt-1">
                            <motion.div className="h-full rounded-full"
                              style={{ background: typeCfg.iconColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(w.balance / maxBal) * 100}%` }}
                              transition={{ duration: 0.9, delay: 0.6 + i * 0.06, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                        <span className="text-white text-xs font-bold tabular-nums shrink-0">
                          {fmtCFA(w.balance)}
                        </span>
                      </motion.div>
                    )
                  })
                }
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Volume 7 jours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white font-bold text-sm">Volume de transactions — 7 jours</h2>
                  <p className="text-[#4a4a6a] text-xs mt-0.5">Crédits, débits et retraits</p>
                </div>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="flex items-center gap-1.5 text-green-400"><span className="w-3 h-0.5 bg-green-400 inline-block rounded-full" /> Crédits</span>
                  <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-0.5 bg-red-400 inline-block rounded-full" /> Débits</span>
                  <span className="flex items-center gap-1.5 text-orange-400"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded-full" /> Retraits</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={volumeTrend} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="gCr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gWd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} /><stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill:"#4a4a6a", fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#4a4a6a", fontSize:9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtCFA(v)} />
                  <Tooltip
                    contentStyle={{ background:"#16161f", border:"1px solid #2a2a3e", borderRadius:8, fontSize:11, padding:"6px 10px" }}
                    itemStyle={{ color:"#fff" }} labelStyle={{ color:"#6b6b8a", marginBottom:2 }}
                    formatter={(v: number, name: string) => [fmtCFA(v) + " FCFA", name === "credits" ? "Crédits" : name === "debits" ? "Débits" : "Retraits"]}
                  />
                  <Area type="monotone" dataKey="credits"     stroke="#22c55e" strokeWidth={2} fill="url(#gCr)" dot={false} activeDot={{ r:3, fill:"#22c55e", stroke:"#16161f", strokeWidth:2 }} />
                  <Area type="monotone" dataKey="debits"      stroke="#ef4444" strokeWidth={2} fill="url(#gDb)" dot={false} activeDot={{ r:3, fill:"#ef4444", stroke:"#16161f", strokeWidth:2 }} />
                  <Area type="monotone" dataKey="withdrawals" stroke="#f97316" strokeWidth={2} fill="url(#gWd)" dot={false} activeDot={{ r:3, fill:"#f97316", stroke:"#16161f", strokeWidth:2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Transactions récentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] flex items-center justify-between">
              <h2 className="text-white font-bold text-sm">Transactions récentes</h2>
              <Link href="/admin/transactions" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a28]">
              {recentTxns.map((txn, i) => {
                const tcfg = TXN_CFG[txn.type] ?? TXN_CFG.credit
                const typeCfg = TYPE_CFG[txn.owner_type as keyof typeof TYPE_CFG] ?? TYPE_CFG.client
                return (
                  <motion.div key={txn.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${tcfg.bg} border ${tcfg.border}`}>
                      <tcfg.Icon className={`w-3.5 h-3.5 ${tcfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{txn.owner_name}</p>
                      <p className="text-[#4a4a6a] text-[10px] truncate">{txn.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold tabular-nums ${tcfg.color}`}>
                        {tcfg.sign}{fmtCFA(txn.amount)} FCFA
                      </p>
                      <p className="text-[#4a4a6a] text-[10px]">{fmtRelative(txn.timestamp)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
