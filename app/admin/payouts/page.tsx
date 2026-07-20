"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, RefreshCw, Download, Search, CreditCard,
  Store, Truck, XCircle, ChevronRight, CheckCircle,
  Clock, DollarSign, TrendingUp, AlertTriangle,
  MoreHorizontal, Eye, X, Check, Loader2 } from "lucide-react"
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { toast } from "sonner"

// ── types ────────────────────────────────────────────────────────────────────
interface PayoutItem {
  id: string; user_id: string; owner_name: string
  owner_type: "vendor" | "driver"
  amount: number; method: string
  requested_at: string; processed_at: string | null
  status: "pending" | "processed" | "rejected"; note: string | null
}
interface PageData {
  kpi: {
    pending_count: number; pending_amount: number; processed_today: number
    rejected_today: number; avg_amount: number; commission_rate: number
  }
  payouts: PayoutItem[]
  method_distribution: { method: string; count: number; pct: number; color: string }[]
  type_breakdown: { type: string; label: string; count: number; amount: number }[]
  volume_trend: { day: string; amount: number }[]
}

// ── constants ────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label:"En attente", color:"text-yellow-300", bg:"bg-yellow-500/15", border:"border-yellow-500/25" },
  processed: { label:"Traité",     color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/25"  },
  rejected:  { label:"Rejeté",     color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/25"    },
}
const METHOD_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Orange Money": { color:"text-orange-300", bg:"bg-orange-500/15", border:"border-orange-500/25" },
  "MTN Money":    { color:"text-yellow-300", bg:"bg-yellow-500/15", border:"border-yellow-500/25" },
  "Wave":         { color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/25"   },
  "CinetPay":     { color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/25"  },
}
const METHOD_DEFAULT = { color:"text-[#6b6b8a]", bg:"bg-[#1e1e2e]", border:"border-[#2a2a3e]" }

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K"
  return String(Math.round(n))
}
function fmtRelative(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (d < 1)    return "À l'instant"
  if (d < 60)   return `${d}min`
  if (d < 1440) return `${Math.floor(d / 60)}h${String(d % 60).padStart(2, "0")}`
  return `${Math.floor(d / 1440)}j`
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
  sub: string; subColor: string; icon: typeof CreditCard
  iconColor: string; delay?: number; pulse?: boolean
}) {
  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, delay, ease:[0.22,1,0.36,1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#2a2a3e] transition-colors">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl" style={{ background:iconColor+"22" }}>
          <Icon className="w-4 h-4" style={{ color:iconColor }} />
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:iconColor }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:iconColor }} />
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

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ ids, totalAmount, onConfirm, onCancel, paying }: {
  ids: string[]; totalAmount: number; onConfirm: () => void; onCancel: () => void; paying: boolean
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div className="relative bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
        transition={{ type:"spring", damping:25, stiffness:300 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base">Confirmer le paiement</h3>
          <button onClick={onCancel} aria-label="Fermer" className="p-1.5 rounded-lg hover:bg-white/10 text-[#6b6b8a] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6b6b8a]">Payouts sélectionnés</span>
            <span className="text-white font-bold">{ids.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6b6b8a]">Montant total</span>
            <span className="text-white font-bold">{fmtCFA(totalAmount)} FCFA</span>
          </div>
        </div>
        <p className="text-[#6b6b8a] text-xs mb-4">
          Cette action déclenchera le transfert immédiat vers les comptes des bénéficiaires. Irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-[#6b6b8a] text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Annuler
          </button>
          <motion.button onClick={onConfirm} disabled={paying}
            whileHover={paying ? {} : { scale:1.02 }} whileTap={paying ? {} : { scale:0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/20 text-green-300 text-sm font-bold hover:bg-green-500/30 transition-colors disabled:opacity-60">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {paying ? "Traitement…" : "Confirmer"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function PayoutsPage() {
  const [data, setData]               = useState<PageData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [search, setSearch]           = useState("")
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [paidIds, setPaidIds]         = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ ids: string[]; amount: number } | null>(null)
  const [paying, setPaying]           = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const res = await fetch("/api/admin/payouts")
      if (res.ok) { setData(await res.json()); setLastUpdated(new Date()) }
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const allPayouts = data?.payouts ?? []
  const filtered = allPayouts
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => !search || p.owner_name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !paidIds.has(p.id))

  const pendingFiltered = filtered.filter(p => p.status === "pending")
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(p => selected.has(p.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleAll() {
    if (allPendingSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingFiltered.map(p => p.id)))
    }
  }

  const selectedPending = [...selected].filter(id => allPayouts.find(p => p.id === id && p.status === "pending"))
  const selectedAmount = selectedPending.reduce((sum, id) => {
    const p = allPayouts.find(x => x.id === id)
    return sum + (p?.amount ?? 0)
  }, 0)

  async function handlePay() {
    const ids = confirmModal?.ids ?? selectedPending
    if (!ids.length) return
    setPaying(true)

    // Real payout: approve + deduct wallet + initiate CinetPay transfer per payout.
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetch(`/api/payouts/${id}/approve`, { method: "POST" })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error ?? `Échec (${res.status})`)
        return id
      }),
    )

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value)
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    )

    if (succeeded.length) {
      // Optimistically hide the approved rows until the server refetch lands.
      setPaidIds((prev) => new Set([...prev, ...succeeded]))
      toast.success(
        succeeded.length === 1
          ? "Paiement initié avec succès"
          : `${succeeded.length} paiements initiés avec succès`,
      )
    }
    if (failures.length) {
      toast.error(
        `${failures.length} paiement(s) en échec : ${failures[0].reason?.message ?? "erreur serveur"}`,
      )
    }

    setSelected(new Set())
    setConfirmModal(null)
    setPaying(false)
    // Refresh from the server so statuses reflect the real transfer state.
    load(true)
  }

  const TABS = [
    { key:"pending",   label:"En attente",  count: allPayouts.filter(p => p.status==="pending"  && !paidIds.has(p.id)).length },
    { key:"processed", label:"Traités",      count: allPayouts.filter(p => p.status==="processed").length },
    { key:"rejected",  label:"Rejetés",      count: allPayouts.filter(p => p.status==="rejected").length },
    { key:"all",       label:"Tous",         count: allPayouts.filter(p => !paidIds.has(p.id)).length },
  ]

  const kpi = data?.kpi
  const methodDist = data?.method_distribution ?? []
  const typeBreakdown = data?.type_breakdown ?? []
  const volumeTrend = data?.volume_trend ?? []

  const exportCsv = () => {
    if (filtered.length === 0) { toast.info("Aucune donnée à exporter"); return }
    const header = ["ID", "Bénéficiaire", "Type", "Montant", "Méthode", "Statut", "Demandé le", "Traité le", "Note"]
    const rows = filtered.map(p => [
      p.id, p.owner_name, p.owner_type === "vendor" ? "Vendeur" : "Livreur",
      String(Math.round(p.amount)), p.method,
      STATUS_CFG[p.status]?.label ?? p.status,
      new Date(p.requested_at).toLocaleString("fr-FR"),
      p.processed_at ? new Date(p.processed_at).toLocaleString("fr-FR") : "",
      p.note ?? "",
    ])
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `payouts-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`${filtered.length} payout${filtered.length > 1 ? "s" : ""} exporté${filtered.length > 1 ? "s" : ""}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
        <CreditCard className="w-10 h-10 text-blue-400" />
      </motion.div>
      <motion.p initial={{ opacity:0 }} animate={{ opacity:[0.4,1,0.4] }}
        transition={{ duration:1.5, repeat:Infinity }} className="text-[#6b6b8a] text-sm">
        Chargement des payouts…
      </motion.p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto text-white">

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal
            ids={confirmModal.ids}
            totalAmount={confirmModal.amount}
            onConfirm={handlePay}
            onCancel={() => !paying && setConfirmModal(null)}
            paying={paying}
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <motion.header initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.35 }}
        className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3 px-6 py-3">
          <Link href="/admin" aria-label="Retour au tableau de bord" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="p-2.5 rounded-xl bg-green-500/15 shrink-0">
            <CreditCard className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-white font-bold text-base leading-none">Payouts</h1>
              {(kpi?.pending_count ?? 0) > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold">
                  <Clock className="w-2.5 h-2.5" />
                  {kpi?.pending_count} en attente
                </span>
              )}
            </div>
            <p className="text-[#4a4a6a] text-[11px] mt-0.5 leading-none">
              Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
            </p>
          </div>

          {/* Batch pay button */}
          <AnimatePresence>
            {selectedPending.length > 0 && (
              <motion.button
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                onClick={() => setConfirmModal({ ids: selectedPending, amount: selectedAmount })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm font-bold transition-all shrink-0">
                <Check className="w-4 h-4" />
                Payer {selectedPending.length} · {fmtCFA(selectedAmount)} FCFA
              </motion.button>
            )}
          </AnimatePresence>

          <button onClick={() => load(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#6b6b8a] hover:text-white text-xs font-medium transition-all shrink-0">
            <motion.span animate={refreshing ? { rotate:360 } : { rotate:0 }}
              transition={refreshing ? { duration:0.8, repeat:Infinity, ease:"linear" } : {}}>
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
          <KpiCard label="En attente" value={kpi?.pending_count ?? 0} format={n => String(Math.round(n))}
            sub="Demandes à traiter" subColor="text-yellow-400"
            icon={Clock} iconColor="#f59e0b" delay={0} pulse />
          <KpiCard label="Montant en attente" value={kpi?.pending_amount ?? 0} format={n => fmtCFA(n) + " FCFA"}
            sub="À décaisser urgemment" subColor="text-orange-400"
            icon={DollarSign} iconColor="#f97316" delay={0.07} />
          <KpiCard label="Traités aujourd'hui" value={kpi?.processed_today ?? 0} format={n => String(Math.round(n))}
            sub="Payouts complétés" subColor="text-green-400"
            icon={CheckCircle} iconColor="#22c55e" delay={0.14} />
          <KpiCard label="Rejetés" value={kpi?.rejected_today ?? 0} format={n => String(Math.round(n))}
            sub="Nécessitent attention" subColor="text-red-400"
            icon={AlertTriangle} iconColor="#ef4444" delay={0.21} />
          <KpiCard label="Montant moyen" value={kpi?.avg_amount ?? 0} format={n => fmtCFA(n) + " FCFA"}
            sub="Par payout" subColor="text-[#6b6b8a]"
            icon={TrendingUp} iconColor="#3b82f6" delay={0.28} />
          <KpiCard label="Commission retenue" value={kpi?.commission_rate ?? 0} format={n => n.toFixed(1) + "%"}
            sub="Taux QuickGo" subColor="text-purple-400"
            icon={DollarSign} iconColor="#8b5cf6" delay={0.35} />
        </div>

        {/* ── MAIN ROW ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── PAYOUT TABLE ─────────────────────────────────────────────── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.45, delay:0.3, ease:[0.22,1,0.36,1] }}
            className="lg:col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            style={{ minHeight: 480 }}>
            {/* Toolbar */}
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-sm">Liste des payouts</h2>
                <span className="text-[#4a4a6a] text-xs">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a6a]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nom du bénéficiaire, ID payout…"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-[#4a4a6a] focus:outline-none focus:border-blue-500/50 transition-colors" />
                <AnimatePresence>
                  {search && (
                    <motion.button initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                      onClick={() => setSearch("")}
                      aria-label="Effacer la recherche"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-white transition-colors">
                      <XCircle className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-1.5">
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

            {/* Table header */}
            {statusFilter === "pending" && pendingFiltered.length > 0 && (
              <div className="flex items-center gap-3 px-5 py-2 bg-[#0a0a0f]/50 border-b border-[#1a1a28]">
                <input type="checkbox" checked={allPendingSelected} onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer" />
                <span className="text-[#4a4a6a] text-[11px]">
                  {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}` : "Sélectionner tout"}
                </span>
              </div>
            )}

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#4a4a6a]">
                  <CreditCard className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucun payout trouvé</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((p, i) => {
                    const scfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending
                    const mcfg = METHOD_CFG[p.method] ?? METHOD_DEFAULT
                    const isExpanded = expandedRow === p.id
                    const isPending = p.status === "pending"
                    const Icon = p.owner_type === "vendor" ? Store : Truck

                    return (
                      <motion.div key={p.id} layout
                        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                        exit={{ opacity:0, x:12, transition:{ duration:0.15 } }}
                        transition={{ duration:0.22, delay: Math.min(i * 0.025, 0.4) }}
                        className="border-b border-[#1a1a28] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : p.id)}>
                          {/* Checkbox (pending only) */}
                          {isPending && (
                            <div onClick={e => { e.stopPropagation(); toggleSelect(p.id) }}>
                              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                                className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer" />
                            </div>
                          )}
                          {!isPending && <div className="w-3.5 shrink-0" />}

                          {/* Owner */}
                          <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{p.owner_name}</p>
                            <p className="text-[#4a4a6a] text-[10px]">{p.id}</p>
                          </div>

                          {/* Method badge */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 hidden sm:inline-flex ${mcfg.bg} ${mcfg.color} ${mcfg.border}`}>
                            {p.method}
                          </span>

                          {/* Amount */}
                          <p className="text-white text-sm font-bold tabular-nums shrink-0 w-24 text-right">
                            {fmtCFA(p.amount)} <span className="text-[10px] text-[#4a4a6a] font-normal">FCFA</span>
                          </p>

                          {/* Status */}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 ${scfg.bg} ${scfg.color} ${scfg.border}`}>
                            {scfg.label}
                          </span>

                          {/* Time */}
                          <p className="text-[#4a4a6a] text-[10px] shrink-0 hidden md:block w-10 text-right">
                            {fmtRelative(p.requested_at)}
                          </p>

                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration:0.2 }}>
                            <ChevronRight className="w-3.5 h-3.5 text-[#4a4a6a] shrink-0" />
                          </motion.div>
                        </div>

                        {/* Expanded */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div key="detail"
                              initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
                              transition={{ duration:0.25, ease:"easeInOut" }} className="overflow-hidden">
                              <div className="px-5 pb-4 pt-1 bg-white/[0.018] border-t border-[#1e1e2e]">
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Méthode</p>
                                    <p className={`text-xs font-semibold ${mcfg.color}`}>{p.method}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">Demandé</p>
                                    <p className="text-xs text-white">{fmtRelative(p.requested_at)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#4a4a6a] uppercase tracking-wider mb-1">
                                      {p.status === "processed" ? "Traité" : "Statut"}
                                    </p>
                                    <p className={`text-xs font-semibold ${scfg.color}`}>
                                      {p.processed_at ? fmtRelative(p.processed_at) : scfg.label}
                                    </p>
                                  </div>
                                </div>
                                {p.note && (
                                  <p className="text-[11px] text-[#6b6b8a] bg-[#0a0a0f] rounded-lg px-3 py-2 mb-3">{p.note}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-colors">
                                    <Eye className="w-3 h-3" /> Voir wallet
                                  </motion.button>
                                  {isPending && (
                                    <>
                                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                        onClick={() => setConfirmModal({ ids:[p.id], amount:p.amount })}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-300 text-xs font-bold hover:bg-green-500/25 transition-colors">
                                        <Check className="w-3 h-3" /> Payer maintenant
                                      </motion.button>
                                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                                        <XCircle className="w-3 h-3" /> Rejeter
                                      </motion.button>
                                    </>
                                  )}
                                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
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

            {/* Method distribution */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.45, delay:0.38, ease:[0.22,1,0.36,1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
                <h2 className="text-white font-bold text-sm">Méthodes de paiement</h2>
                <p className="text-[#4a4a6a] text-xs mt-0.5">Payouts en attente</p>
              </div>
              <div className="p-4 flex flex-col items-center gap-4">
                <PieChart width={140} height={140}>
                  <Pie data={methodDist} cx={70} cy={70}
                    innerRadius={42} outerRadius={60}
                    paddingAngle={3} dataKey="count"
                    stroke="none" animationBegin={400} animationDuration={900}>
                    {methodDist.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:"#16161f", border:"1px solid #2a2a3e", borderRadius:8, fontSize:11 }}
                    formatter={(v: number, name: string) => [v + " payout" + (v > 1 ? "s" : ""), name]} />
                </PieChart>
                <div className="w-full space-y-2">
                  {methodDist.map((m, i) => (
                    <motion.div key={m.method}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:0.5 + i * 0.07 }}
                      className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background:m.color }} />
                      <span className="text-[#a0a0c0] text-xs flex-1 truncate">{m.method}</span>
                      <span className="text-white text-xs font-bold tabular-nums">{m.count}</span>
                      <div className="w-12 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background:m.color }}
                          initial={{ width:0 }}
                          animate={{ width:`${m.pct}%` }}
                          transition={{ duration:0.8, delay:0.55 + i * 0.07, ease:"easeOut" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Type breakdown */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.45, delay:0.44, ease:[0.22,1,0.36,1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex-1">
              <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
                <h2 className="text-white font-bold text-sm">Répartition par type</h2>
              </div>
              <div className="p-4 space-y-4">
                {typeBreakdown.map((tb, i) => {
                  const total = typeBreakdown.reduce((s, x) => s + x.amount, 0)
                  const pct = Math.round(tb.amount / Math.max(total, 1) * 100)
                  const color = tb.type === "vendor" ? "#3b82f6" : "#8b5cf6"
                  const Icon = tb.type === "vendor" ? Store : Truck
                  return (
                    <motion.div key={tb.type}
                      initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:0.55 + i * 0.1 }}
                      className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background:color+"22" }}>
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <span className="text-white text-sm font-semibold flex-1">{tb.label}</span>
                        <span className="text-white text-sm font-bold tabular-nums">{tb.count} payout{tb.count > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background:color }}
                            initial={{ width:0 }}
                            animate={{ width:`${pct}%` }}
                            transition={{ duration:0.9, delay:0.6 + i * 0.1, ease:"easeOut" }}
                          />
                        </div>
                        <span className="text-white text-xs font-bold tabular-nums w-20 text-right shrink-0">
                          {fmtCFA(tb.amount)} FCFA
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Volume trend */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.45, delay:0.5, ease:[0.22,1,0.36,1] }}
            className="lg:col-span-2 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <h2 className="text-white font-bold text-sm">Volume payouts — 7 jours</h2>
              <p className="text-[#4a4a6a] text-xs mt-0.5">Montant total décaissé par jour (FCFA)</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={volumeTrend} margin={{ top:5, right:5, bottom:0, left:-10 }}>
                  <defs>
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill:"#4a4a6a", fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#4a4a6a", fontSize:9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtCFA(v)} />
                  <Tooltip
                    contentStyle={{ background:"#16161f", border:"1px solid #2a2a3e", borderRadius:8, fontSize:11, padding:"6px 10px" }}
                    itemStyle={{ color:"#fff" }} labelStyle={{ color:"#6b6b8a", marginBottom:2 }}
                    formatter={(v: number) => [fmtCFA(v) + " FCFA", "Volume"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#payGrad)" dot={false}
                    activeDot={{ r:3, fill:"#22c55e", stroke:"#16161f", strokeWidth:2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status summary donut */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.45, delay:0.56, ease:[0.22,1,0.36,1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-[#1e1e2e]">
              <h2 className="text-white font-bold text-sm">Statuts globaux</h2>
              <p className="text-[#4a4a6a] text-xs mt-0.5">{allPayouts.length} payouts au total</p>
            </div>
            <div className="flex flex-col items-center p-4 gap-4">
              {(() => {
                const donut = [
                  { name:"En attente",  value: allPayouts.filter(p=>p.status==="pending"  && !paidIds.has(p.id)).length, color:"#f59e0b" },
                  { name:"Traités",     value: allPayouts.filter(p=>p.status==="processed").length + paidIds.size,        color:"#22c55e" },
                  { name:"Rejetés",     value: allPayouts.filter(p=>p.status==="rejected").length,                         color:"#ef4444" },
                ].filter(d => d.value > 0)
                return (
                  <>
                    <div className="relative">
                      <PieChart width={130} height={130}>
                        <Pie data={donut} cx={65} cy={65} innerRadius={40} outerRadius={58}
                          paddingAngle={3} dataKey="value" stroke="none"
                          animationBegin={600} animationDuration={900}>
                          {donut.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                        </Pie>
                      </PieChart>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-white font-extrabold text-lg tabular-nums">{allPayouts.length}</p>
                        <p className="text-[#4a4a6a] text-[10px]">total</p>
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      {donut.map((d, i) => (
                        <motion.div key={d.name}
                          initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                          transition={{ delay:0.65 + i * 0.08 }}
                          className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background:d.color }} />
                          <span className="text-[#a0a0c0] text-xs flex-1">{d.name}</span>
                          <span className="text-white text-xs font-bold tabular-nums">{d.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </motion.div>
        </div>
      </div>
      </div>
    </div>
  )
}
