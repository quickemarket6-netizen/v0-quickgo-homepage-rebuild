"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {

  Wallet, TrendingUp, DollarSign, ArrowUpRight, Download,
  RefreshCw, CreditCard,
  CheckCircle2, XCircle, AlertTriangle, Lock, Unlock,
  Clock, Search, X, Activity,
  Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── Types ───────────────────────────────────────────────────────
interface FinanceSummary {
  total_revenue: number
  total_commissions: number
  total_vendor_paid: number
  pending_payouts_count: number
  pending_payouts_total: number
  frozen_wallets: number
}

interface DailyPoint {
  date: string
  revenue: number
  commission: number
  vendor: number
}

interface PendingPayout {
  id: string
  vendor_id: string
  amount: number
  payout_method: string
  payout_phone: string
  status: string
  created_at: string
  vendors: { name: string; logo_url: string | null } | null
}

interface VendorWallet {
  vendor_id: string
  pending_balance: number
  available_balance: number
  withdrawn_balance: number
  total_earned: number
  total_sales: number
  frozen: boolean
  freeze_reason: string | null
  vendors: { id: string; name: string; logo_url: string | null; is_active: boolean } | null
}

interface FinanceData {
  summary: FinanceSummary
  daily_trend: DailyPoint[]
  pending_payouts: PendingPayout[]
  vendor_wallets: VendorWallet[]
  recent_transactions: unknown[]
  fraud_flags: unknown[]
}

// ─── Helpers ────────────────────────────────────────────────────
function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

// ─── Mini sparkline ─────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 80
  const h = 32
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Bar chart component ─────────────────────────────────────────
function RevenueChart({ data }: { data: DailyPoint[] }) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1)
  const last7 = data.slice(-14)
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {last7.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-blue-600/60 to-cyan-500/80 transition-all duration-300 group-hover:from-blue-600 group-hover:to-cyan-500 cursor-pointer"
            style={{ height: `${Math.max(4, (d.revenue / maxRev) * 100)}%` }}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#16161f] border border-[#2a2a3e] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {d.date.slice(5)} — {formatCFA(d.revenue)}
          </div>
          <span className="text-[8px] text-[#6b6b8a] truncate w-full text-center">{d.date.slice(8)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Approve/Reject Modal ────────────────────────────────────────
function PayoutActionModal({
  payout,
  action,
  onClose,
  onSuccess,
}: {
  payout: PendingPayout | null
  action: "approve" | "reject" | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  if (!payout || !action) return null

  async function handleSubmit() {
    if (!payout) return
    if (action === "reject" && !reason.trim()) {
      toast.error("Une raison est requise")
      return
    }
    setLoading(true)
    try {
      const url = `/api/payouts/${payout.id}/${action}`
      const body = action === "reject" ? { reason } : {}
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      toast.success(action === "approve" ? "Paiement approuvé et initié" : "Paiement refusé")
      onSuccess()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className={`p-6 rounded-t-2xl ${action === "approve" ? "bg-green-500/10 border-b border-green-500/20" : "bg-red-500/10 border-b border-red-500/20"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {action === "approve"
                ? <CheckCircle2 className="text-green-400" size={24} />
                : <XCircle className="text-red-400" size={24} />}
              <h2 className="text-lg font-bold text-white">
                {action === "approve" ? "Approuver le paiement" : "Refuser le paiement"}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Fermer" className="text-[#6b6b8a] hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#0a0a0f] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b8a]">Vendeur</span>
              <span className="font-semibold text-white">{payout.vendors?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b8a]">Montant</span>
              <span className="font-bold text-xl text-white">{formatCFA(payout.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b8a]">Méthode</span>
              <span className="font-medium capitalize text-[#6b6b8a]">{payout.payout_method.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b8a]">Téléphone</span>
              <span className="font-medium text-[#6b6b8a]">{payout.payout_phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b8a]">Demandé le</span>
              <span className="text-[#6b6b8a]">{formatDate(payout.created_at)}</span>
            </div>
          </div>

          {action === "reject" && (
            <div>
              <label className="text-sm font-medium text-[#6b6b8a] mb-2 block">Raison du refus <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3 text-sm text-white placeholder-[#4a4a6a] focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 outline-none resize-none"
                rows={3}
                placeholder="Ex: Informations de compte incorrectes..."
              />
            </div>
          )}

          {action === "approve" && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-amber-300">
                Ce paiement sera immédiatement initié via CinetPay. Le montant sera débité du portefeuille vendeur et transféré vers {payout.payout_method.replace("_", " ")} au {payout.payout_phone}.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 text-white ${action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {loading
                ? <RefreshCw size={16} className="animate-spin mr-2" />
                : action === "approve" ? <CheckCircle2 size={16} className="mr-2" /> : <XCircle size={16} className="mr-2" />}
              {action === "approve" ? "Confirmer & Payer" : "Refuser"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Freeze/Unfreeze modal ───────────────────────────────────────
function FreezeModal({
  wallet,
  onClose,
  onSuccess,
}: {
  wallet: VendorWallet | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  if (!wallet) return null
  const isFrozen = wallet.frozen

  async function handleSubmit() {
    if (!wallet) return
    if (!isFrozen && !reason.trim()) {
      toast.error("Une raison est requise pour geler un portefeuille")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/wallets/${wallet.vendor_id}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frozen: !isFrozen, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isFrozen ? "Portefeuille réactivé" : "Portefeuille gelé")
      onSuccess()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className={`p-6 rounded-t-2xl ${isFrozen ? "bg-green-500/10 border-b border-green-500/20" : "bg-orange-500/10 border-b border-orange-500/20"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isFrozen ? <Unlock className="text-green-400" size={24} /> : <Lock className="text-orange-400" size={24} />}
              <h2 className="text-lg font-bold text-white">
                {isFrozen ? "Réactiver le portefeuille" : "Geler le portefeuille"}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Fermer" className="text-[#6b6b8a] hover:text-white"><X size={20} /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#6b6b8a]">
            Vendeur: <span className="font-semibold text-white">{wallet.vendors?.name}</span>
          </p>
          {!isFrozen && (
            <div>
              <label className="text-sm font-medium text-[#6b6b8a] mb-2 block">Raison du gel <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3 text-sm text-white placeholder-[#4a4a6a] focus:ring-2 focus:ring-orange-500/40 outline-none resize-none"
                rows={3}
                placeholder="Ex: Activité suspecte détectée..."
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 text-white ${isFrozen ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
            >
              {loading && <RefreshCw size={16} className="animate-spin mr-2" />}
              {isFrozen ? "Réactiver" : "Geler"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────
export default function AdminFinancesPage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const [activeTab, setActiveTab] = useState<"payouts" | "wallets" | "transactions">("payouts")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null)
  const [payoutAction, setPayoutAction] = useState<"approve" | "reject" | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<VendorWallet | null>(null)
  const [allPayouts, setAllPayouts] = useState<PendingPayout[]>([])
  const [payoutsFilter, setPayoutsFilter] = useState("pending")
  const [loadingAllPayouts, setLoadingAllPayouts] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finances?period=${period}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast.error("Erreur de chargement des données financières")
    } finally {
      setLoading(false)
    }
  }, [period])

  const fetchAllPayouts = useCallback(async () => {
    setLoadingAllPayouts(true)
    try {
      const res = await fetch(`/api/payouts?status=${payoutsFilter}&limit=100`)
      if (res.ok) {
        const d = await res.json()
        setAllPayouts(d.payouts ?? [])
      }
    } catch {
      // silently fail
    } finally {
      setLoadingAllPayouts(false)
    }
  }, [payoutsFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    if (activeTab === "payouts") fetchAllPayouts()
  }, [activeTab, fetchAllPayouts])

  const summary = data?.summary
  const sparkData = (data?.daily_trend ?? []).map((d) => d.commission)

  // Real period-over-period trend: compare the sum over the recent half of the
  // period against the earlier half. Returns null when there isn't enough data.
  function computeTrend(series: number[]): { label: string; up: boolean } | null {
    if (series.length < 2) return null
    const mid = Math.floor(series.length / 2)
    const earlier = series.slice(0, mid).reduce((s, v) => s + v, 0)
    const recent = series.slice(mid).reduce((s, v) => s + v, 0)
    if (earlier === 0) return null
    const pct = ((recent - earlier) / earlier) * 100
    return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, up: pct >= 0 }
  }

  const trend = data?.daily_trend ?? []
  const revenueTrend = computeTrend(trend.map((d) => d.revenue))
  const commissionTrend = computeTrend(trend.map((d) => d.commission))
  const vendorTrend = computeTrend(trend.map((d) => d.vendor))
  // Effective commission rate derived from real totals
  const commissionRate = summary && summary.total_revenue > 0
    ? Math.round((summary.total_commissions / summary.total_revenue) * 100)
    : null

  const statCards = summary
    ? [
        {
          label: "Revenus totaux",
          value: formatCFA(summary.total_revenue),
          sub: `${period}j`,
          icon: DollarSign,
          gradient: "from-green-500 to-emerald-600",
          trend: revenueTrend?.label,
          up: revenueTrend?.up ?? true,
        },
        {
          label: "Commissions QuickGo",
          value: formatCFA(summary.total_commissions),
          sub: commissionRate != null ? `${commissionRate}% moyen` : "Commission",
          icon: TrendingUp,
          gradient: "from-blue-600 to-cyan-500",
          trend: commissionTrend?.label,
          up: commissionTrend?.up ?? true,
        },
        {
          label: "Reversé aux vendeurs",
          value: formatCFA(summary.total_vendor_paid),
          sub: "Net après frais",
          icon: ArrowUpRight,
          gradient: "from-purple-500 to-violet-600",
          trend: vendorTrend?.label,
          up: vendorTrend?.up ?? true,
        },
        {
          label: "Retraits en attente",
          value: `${summary.pending_payouts_count}`,
          sub: formatCFA(summary.pending_payouts_total),
          icon: Clock,
          gradient: "from-orange-500 to-amber-500",
          trend: summary.pending_payouts_count > 5 ? "Urgent" : "Normal",
          up: summary.pending_payouts_count <= 5,
          alert: summary.pending_payouts_count > 5,
        },
        {
          label: "Portefeuilles gelés",
          value: `${summary.frozen_wallets}`,
          sub: "Fraude / vérif.",
          icon: Shield,
          gradient: summary.frozen_wallets > 0 ? "from-red-500 to-rose-600" : "from-[#2a2a3e] to-[#1e1e2e]",
          alert: summary.frozen_wallets > 0,
        },
        {
          label: "Commissions / jour",
          value: formatCFA(
            data!.daily_trend.length
              ? summary.total_commissions / data!.daily_trend.length
              : 0,
          ),
          sub: "Moyenne",
          icon: Activity,
          gradient: "from-teal-500 to-cyan-600",
          sparkline: sparkData,
        },
      ]
    : []

  const filteredWallets = (data?.vendor_wallets ?? []).filter((w) =>
    searchQuery ? w.vendors?.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  )

  const payoutsToShow = activeTab === "payouts"
    ? allPayouts.filter((p) =>
        searchQuery ? p.vendors?.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true,
      )
    : []

  function exportCsv() {
    const download = (header: string[], rows: (string | number)[][], name: string) => {
      const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\n")
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${name}-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    }

    if (activeTab === "payouts") {
      if (payoutsToShow.length === 0) { toast.info("Aucune donnée à exporter"); return }
      download(
        ["ID", "Vendeur", "Montant", "Méthode", "Téléphone", "Statut", "Demandé le"],
        payoutsToShow.map((p) => [
          p.id, p.vendors?.name ?? "—", Math.round(p.amount),
          p.payout_method, p.payout_phone, p.status, formatDate(p.created_at),
        ]),
        "retraits",
      )
      toast.success(`${payoutsToShow.length} retrait${payoutsToShow.length > 1 ? "s" : ""} exporté${payoutsToShow.length > 1 ? "s" : ""}`)
    } else if (activeTab === "wallets") {
      if (filteredWallets.length === 0) { toast.info("Aucune donnée à exporter"); return }
      download(
        ["Vendeur", "En attente", "Disponible", "Retiré", "Total gagné", "Ventes", "Gelé"],
        filteredWallets.map((w) => [
          w.vendors?.name ?? "—", Math.round(w.pending_balance), Math.round(w.available_balance),
          Math.round(w.withdrawn_balance), Math.round(w.total_earned), w.total_sales,
          w.frozen ? "Oui" : "Non",
        ]),
        "portefeuilles",
      )
      toast.success(`${filteredWallets.length} portefeuille${filteredWallets.length > 1 ? "s" : ""} exporté${filteredWallets.length > 1 ? "s" : ""}`)
    } else {
      const txns = (data?.recent_transactions as Array<Record<string, unknown>>) ?? []
      if (txns.length === 0) { toast.info("Aucune donnée à exporter"); return }
      download(
        ["ID transaction", "Montant", "Statut", "Date"],
        txns.map((t) => [
          String(t.transaction_id ?? "—"), Math.round(Number(t.amount ?? 0)),
          String(t.status ?? ""), formatDate(String(t.created_at)),
        ]),
        "transactions",
      )
      toast.success(`${txns.length} transaction${txns.length > 1 ? "s" : ""} exportée${txns.length > 1 ? "s" : ""}`)
    }
  }

  function openApprove(p: PendingPayout) { setSelectedPayout(p); setPayoutAction("approve") }
  function openReject(p: PendingPayout) { setSelectedPayout(p); setPayoutAction("reject") }
  function closeModal() { setSelectedPayout(null); setPayoutAction(null) }

  const payoutMethodIcon = (method: string) =>
    method === "orange_money" ? "🟠" : method === "mtn_momo" ? "💛" : "🏦"

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-300",
      approved: "bg-blue-500/15 text-blue-300",
      processing: "bg-purple-500/15 text-purple-300",
      completed: "bg-green-500/15 text-green-300",
      rejected: "bg-red-500/15 text-red-300",
      failed: "bg-[#1e1e2e] text-[#6b6b8a]",
    }
    const labels: Record<string, string> = {
      pending: "En attente",
      approved: "Approuvé",
      processing: "En cours",
      completed: "Complété",
      rejected: "Refusé",
      failed: "Échoué",
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-[#1e1e2e] text-[#6b6b8a]"}`}>
        {labels[status] ?? status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-[#16161f] border-b border-[#1e1e2e] px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-white">Tableau de bord financier</h1>
            <p className="text-sm text-[#6b6b8a]">Escrow · Commissions · Retraits vendeurs</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm border border-[#1e1e2e] rounded-lg px-3 py-1.5 bg-[#0a0a0f] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            <Button size="sm" onClick={exportCsv} className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0">
              <Download size={14} />
              Exporter
            </Button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8">
          {/* Urgent alert: pending payouts > 5 */}
          {(summary?.pending_payouts_count ?? 0) > 5 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4"
            >
              <AlertTriangle className="text-amber-400 shrink-0" size={24} />
              <div>
                <p className="font-semibold text-amber-200">
                  {summary?.pending_payouts_count} retraits en attente de validation
                </p>
                <p className="text-sm text-amber-300">
                  Montant total: {formatCFA(summary?.pending_payouts_total ?? 0)} — Action requise
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => { setActiveTab("payouts"); setPayoutsFilter("pending") }}
                className="ml-auto bg-amber-600 hover:bg-amber-700 text-white"
              >
                Traiter maintenant
              </Button>
            </motion.div>
          )}

          {/* Fraud alerts */}
          {(summary?.frozen_wallets ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4"
            >
              <Shield className="text-red-400 shrink-0" size={24} />
              <div>
                <p className="font-semibold text-red-200">
                  {summary?.frozen_wallets} portefeuille{(summary?.frozen_wallets ?? 0) > 1 ? "s" : ""} gelé{(summary?.frozen_wallets ?? 0) > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-300">Activités suspectes signalées — vérification en cours</p>
              </div>
            </motion.div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#16161f] rounded-2xl p-5 animate-pulse h-28">
                    <div className="h-4 bg-[#1e1e2e] rounded w-1/2 mb-3" />
                    <div className="h-7 bg-[#1e1e2e] rounded w-3/4" />
                  </div>
                ))
              : statCards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                    className={`bg-[#16161f] rounded-2xl p-5 shadow-sm border border-[#1e1e2e] relative overflow-hidden ${card.alert ? "ring-2 ring-red-500/30" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                        <card.icon className="text-white" size={18} />
                      </div>
                      {card.trend && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.up ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
                          {card.trend}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6b8a] mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    {card.sub && <p className="text-xs text-[#4a4a6a] mt-1">{card.sub}</p>}
                    {card.sparkline && card.sparkline.length > 1 && (
                      <div className="absolute bottom-3 right-3 opacity-50">
                        <Sparkline data={card.sparkline} color="#3B82F6" />
                      </div>
                    )}
                  </motion.div>
                ))}
          </div>

          {/* Revenue Chart */}
          {!loading && data && data.daily_trend.length > 0 && (
            <div className="bg-[#16161f] rounded-2xl p-6 shadow-sm border border-[#1e1e2e]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-white">Évolution des revenus</h2>
                  <p className="text-sm text-[#6b6b8a]">Chiffre d&apos;affaires journalier — {period} jours</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#6b6b8a]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-600 to-cyan-500" />
                    Revenus bruts
                  </span>
                </div>
              </div>
              <RevenueChart data={data.daily_trend} />
            </div>
          )}

          {/* Tabs */}
          <div className="bg-[#16161f] rounded-2xl shadow-sm border border-[#1e1e2e] overflow-hidden">
            <div className="flex items-center border-b border-[#1e1e2e] px-6 gap-1">
              {(["payouts", "wallets", "transactions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === tab
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-[#6b6b8a] hover:text-white"}`}
                >
                  {tab === "payouts" ? "Retraits vendeurs" : tab === "wallets" ? "Portefeuilles" : "Transactions"}
                  {tab === "payouts" && (summary?.pending_payouts_count ?? 0) > 0 && (
                    <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {summary?.pending_payouts_count}
                    </span>
                  )}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a6a]" size={14} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-8 pr-3 py-1.5 text-sm bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#4a4a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                  />
                </div>
                {activeTab === "payouts" && (
                  <select
                    value={payoutsFilter}
                    onChange={(e) => setPayoutsFilter(e.target.value)}
                    className="text-sm border border-[#1e1e2e] rounded-lg px-2 py-1.5 bg-[#0a0a0f] text-white focus:outline-none"
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvés</option>
                    <option value="processing">En cours</option>
                    <option value="completed">Complétés</option>
                    <option value="rejected">Refusés</option>
                    <option value="failed">Échoués</option>
                  </select>
                )}
              </div>
            </div>

            {/* Payouts Tab */}
            {activeTab === "payouts" && (
              <div className="divide-y divide-[#1e1e2e]">
                {loadingAllPayouts ? (
                  <div className="p-12 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-400" size={24} />
                  </div>
                ) : payoutsToShow.length === 0 ? (
                  <div className="p-12 text-center">
                    <Wallet className="mx-auto text-[#4a4a6a] mb-3" size={40} />
                    <p className="text-[#6b6b8a] font-medium">Aucun retrait trouvé</p>
                    <p className="text-sm text-[#4a4a6a]">Aucun retrait avec ce statut pour le moment</p>
                  </div>
                ) : (
                  payoutsToShow.map((payout) => (
                    <motion.div
                      key={payout.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="text-2xl">{payoutMethodIcon(payout.payout_method)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate">
                            {payout.vendors?.name ?? "Vendeur inconnu"}
                          </p>
                          {statusBadge(payout.status)}
                        </div>
                        <p className="text-sm text-[#6b6b8a]">
                          {payout.payout_phone} · {payout.payout_method.replace("_", " ")} · {formatDate(payout.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-lg">{formatCFA(payout.amount)}</p>
                        <p className="text-xs text-[#4a4a6a]">{payout.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      {payout.status === "pending" && (
                        <div className="flex gap-2 ml-2">
                          <Button
                            size="sm"
                            onClick={() => openApprove(payout)}
                            className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          >
                            <CheckCircle2 size={14} />
                            Payer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReject(payout)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
                          >
                            <XCircle size={14} />
                            Refuser
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Wallets Tab */}
            {activeTab === "wallets" && (
              <div className="divide-y divide-[#1e1e2e]">
                {loading ? (
                  <div className="p-12 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-400" size={24} />
                  </div>
                ) : filteredWallets.length === 0 ? (
                  <div className="p-12 text-center">
                    <Wallet className="mx-auto text-[#4a4a6a] mb-3" size={40} />
                    <p className="text-[#6b6b8a]">Aucun portefeuille trouvé</p>
                  </div>
                ) : (
                  filteredWallets.map((w) => (
                    <div key={w.vendor_id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                        {w.vendors?.name?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate">{w.vendors?.name ?? "—"}</p>
                          {w.frozen && (
                            <span className="bg-red-500/15 text-red-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock size={10} /> Gelé
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-[#6b6b8a]">
                          <span>En attente: <b className="text-amber-400">{formatCFA(w.pending_balance)}</b></span>
                          <span>Disponible: <b className="text-green-400">{formatCFA(w.available_balance)}</b></span>
                          <span>Retiré: <b className="text-[#6b6b8a]">{formatCFA(w.withdrawn_balance)}</b></span>
                          <span>{w.total_sales} ventes</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCFA(w.total_earned)}</p>
                        <p className="text-xs text-[#4a4a6a]">Total gagné</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedWallet(w)}
                        className={`ml-2 gap-1 ${w.frozen ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"}`}
                      >
                        {w.frozen ? <Unlock size={14} /> : <Lock size={14} />}
                        {w.frozen ? "Réactiver" : "Geler"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div className="divide-y divide-[#1e1e2e]">
                {loading ? (
                  <div className="p-12 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-400" size={24} />
                  </div>
                ) : (data?.recent_transactions ?? []).length === 0 ? (
                  <div className="p-12 text-center">
                    <CreditCard className="mx-auto text-[#4a4a6a] mb-3" size={40} />
                    <p className="text-[#6b6b8a]">Aucune transaction récente</p>
                  </div>
                ) : (
                  (data?.recent_transactions as Array<Record<string, unknown>> ?? []).map((txn, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${txn.status === "completed" ? "bg-green-500/15" : txn.status === "failed" ? "bg-red-500/15" : "bg-amber-500/15"}`}>
                        <CreditCard size={16} className={txn.status === "completed" ? "text-green-400" : txn.status === "failed" ? "text-red-400" : "text-amber-400"} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">
                          Transaction #{String(txn.transaction_id ?? "—").slice(0, 12)}
                        </p>
                        <p className="text-xs text-[#6b6b8a]">{formatDate(String(txn.created_at))}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCFA(Number(txn.amount ?? 0))}</p>
                        {statusBadge(String(txn.status ?? ""))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedPayout && payoutAction && (
          <PayoutActionModal
            payout={selectedPayout}
            action={payoutAction}
            onClose={closeModal}
            onSuccess={() => { fetchData(); fetchAllPayouts() }}
          />
        )}
        {selectedWallet && (
          <FreezeModal
            wallet={selectedWallet}
            onClose={() => setSelectedWallet(null)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
