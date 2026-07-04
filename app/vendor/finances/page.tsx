"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Clock,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Plus,
  ChevronRight, CreditCard, Banknote, Smartphone, Lock,
  Shield, Bell, Package, BarChart3, Store, Settings,
  LayoutDashboard, ShoppingBag, Users, UserCog, Activity, Info,
  X, Eye, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useVendorWallet, useFinancialNotifications } from "@/lib/payments/realtime"

// ─── Types ───────────────────────────────────────────────────────
interface VendorWalletData {
  wallet: {
    pending_balance: number
    available_balance: number
    withdrawn_balance: number
    total_earned: number
    total_sales: number
    frozen: boolean
    freeze_reason: string | null
  } | null
  payouts: Payout[]
  commissions: Commission[]
  payout_accounts: PayoutAccount[]
  analytics: { last_30_days: DailyAnalytic[] }
}

interface Payout {
  id: string
  amount: number
  payout_method: string
  payout_phone: string
  status: string
  created_at: string
  rejection_reason?: string
  cinetpay_reference?: string
}

interface Commission {
  id: string
  gross_amount: number
  vendor_net_amount: number
  quickgo_commission: number
  status: string
  created_at: string
}

interface PayoutAccount {
  id: string
  payout_method: string
  account_name: string
  phone_number: string
  is_default: boolean
  verified: boolean
}

interface DailyAnalytic {
  gross_amount: number
  vendor_net_amount: number
  quickgo_commission: number
  created_at: string
}

// ─── Sidebar ─────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: Package, label: "Produits", href: "/vendor/products" },
  { icon: ShoppingBag, label: "Commandes", href: "/vendor/orders" },
  { icon: Users, label: "Clients CRM", href: "/vendor/crm" },
  { icon: Wallet, label: "Finances", href: "/vendor/finances", active: true },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
]

// ─── Helpers ─────────────────────────────────────────────────────
function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}
function payoutMethodLabel(m: string) {
  return m === "orange_money" ? "Orange Money" : m === "mtn_momo" ? "MTN MoMo" : "Virement bancaire"
}
function payoutMethodIcon(m: string) {
  return m === "orange_money" ? "🟠" : m === "mtn_momo" ? "💛" : "🏦"
}

// ─── Status badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-amber-100 text-amber-700", label: "En attente" },
    approved: { cls: "bg-blue-100 text-blue-700", label: "Approuvé" },
    processing: { cls: "bg-purple-100 text-purple-700", label: "En cours" },
    completed: { cls: "bg-green-100 text-green-700", label: "Complété" },
    rejected: { cls: "bg-red-100 text-red-700", label: "Refusé" },
    failed: { cls: "bg-gray-100 text-gray-600", label: "Échoué" },
    held: { cls: "bg-amber-100 text-amber-700", label: "En attente" },
    released: { cls: "bg-green-100 text-green-700", label: "Libéré" },
  }
  const m = map[status] ?? { cls: "bg-gray-100 text-gray-600", label: status }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.cls}`}>{m.label}</span>
}

// ─── Mini Bar Chart ───────────────────────────────────────────────
function MiniBarChart({ data }: { data: DailyAnalytic[] }) {
  if (!data.length) return <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Pas encore de données</div>
  const max = Math.max(...data.map((d) => d.vendor_net_amount), 1)
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-quickgo-blue/60 to-quickgo-cyan/80 hover:from-quickgo-blue hover:to-quickgo-cyan transition-all cursor-pointer"
            style={{ height: `${Math.max(4, (d.vendor_net_amount / max) * 100)}%` }}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} — {formatCFA(d.vendor_net_amount)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Payout Request Modal ─────────────────────────────────────────
function PayoutRequestModal({
  vendorId,
  availableBalance,
  payoutAccounts,
  onClose,
  onSuccess,
}: {
  vendorId: string
  availableBalance: number
  payoutAccounts: PayoutAccount[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<PayoutAccount | null>(
    payoutAccounts.find((a) => a.is_default) ?? payoutAccounts[0] ?? null,
  )
  const [loading, setLoading] = useState(false)

  async function handleRequest() {
    const amt = parseFloat(amount)
    if (!amt || amt < 5000) { toast.error("Montant minimum: 5 000 F"); return }
    if (amt > availableBalance) { toast.error("Solde insuffisant"); return }
    if (!selectedAccount) { toast.error("Sélectionnez un compte de paiement"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          amount: amt,
          payout_method: selectedAccount.payout_method,
          payout_phone: selectedAccount.phone_number,
          payout_account_id: selectedAccount.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      toast.success("Demande de retrait envoyée — en attente de validation")
      onSuccess()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  const amounts = [10000, 25000, 50000, 100000].filter((a) => a <= availableBalance)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Demande de retrait</h2>
            <p className="text-sm text-gray-500">Disponible: <span className="font-semibold text-green-600">{formatCFA(availableBalance)}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Montant (FCFA)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 50000"
                min="5000"
                max={availableBalance}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-quickgo-blue/20 focus:border-quickgo-blue outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">FCFA</span>
            </div>
            {amounts.length > 0 && (
              <div className="flex gap-2 mt-2">
                {amounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className="flex-1 text-xs bg-gray-100 hover:bg-quickgo-blue/10 hover:text-quickgo-blue rounded-lg py-1.5 font-medium transition-colors"
                  >
                    {new Intl.NumberFormat("fr-FR").format(a)}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(String(availableBalance))}
                  className="flex-1 text-xs bg-gray-100 hover:bg-quickgo-blue/10 hover:text-quickgo-blue rounded-lg py-1.5 font-medium transition-colors"
                >
                  Max
                </button>
              </div>
            )}
          </div>

          {/* Account selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Compte de réception</label>
            {payoutAccounts.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Aucun compte configuré</p>
                <Link href="/vendor/payout-accounts" onClick={onClose} className="text-quickgo-blue text-sm font-medium hover:underline">
                  + Ajouter un compte
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {payoutAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selectedAccount?.id === acc.id ? "border-quickgo-blue bg-quickgo-blue/5" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <span className="text-2xl">{payoutMethodIcon(acc.payout_method)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{acc.account_name}</p>
                      <p className="text-xs text-gray-500">{payoutMethodLabel(acc.payout_method)} · {acc.phone_number}</p>
                    </div>
                    {acc.is_default && (
                      <span className="text-xs bg-quickgo-blue/10 text-quickgo-blue px-2 py-0.5 rounded-full">Défaut</span>
                    )}
                    {selectedAccount?.id === acc.id && <CheckCircle2 size={16} className="text-quickgo-blue shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-700">
              Votre demande sera traitée dans les 24 heures ouvrées. Minimum: 5 000 F · Maximum journalier: 2 000 000 F
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button
              onClick={handleRequest}
              disabled={loading || !selectedAccount || !amount}
              className="flex-1 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0"
            >
              {loading && <RefreshCw size={14} className="animate-spin mr-2" />}
              Demander le retrait
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────
export default function VendorFinancesPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [walletData, setWalletData] = useState<VendorWalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"payouts" | "commissions">("payouts")
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  const realtimeWallet = useVendorWallet(vendorId)
  const { notifications, unreadCount, markRead } = useFinancialNotifications(userId)

  const fetchVendorAndData = useCallback(async () => {
    try {
      const profileRes = await fetch("/api/profile")
      if (!profileRes.ok) return
      const profile = await profileRes.json()
      setUserId(profile?.id ?? null)

      const vendorRes = await fetch("/api/vendors?my=true")
      if (!vendorRes.ok) return
      const vendors = await vendorRes.json()
      const vid = Array.isArray(vendors) ? vendors[0]?.id : vendors?.id
      if (!vid) return
      setVendorId(vid)

      const walletRes = await fetch(`/api/vendor/wallet?vendor_id=${vid}`)
      if (walletRes.ok) setWalletData(await walletRes.json())
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVendorAndData() }, [fetchVendorAndData])

  const wallet = walletData?.wallet
  const pendingBalance = realtimeWallet.loading ? (wallet?.pending_balance ?? 0) : realtimeWallet.pendingBalance
  const availableBalance = realtimeWallet.loading ? (wallet?.available_balance ?? 0) : realtimeWallet.availableBalance
  const withdrawnBalance = realtimeWallet.loading ? (wallet?.withdrawn_balance ?? 0) : realtimeWallet.withdrawnBalance
  const totalEarned = realtimeWallet.loading ? (wallet?.total_earned ?? 0) : realtimeWallet.totalEarned
  const isFrozen = realtimeWallet.loading ? (wallet?.frozen ?? false) : realtimeWallet.frozen

  const analytic30 = walletData?.analytics?.last_30_days ?? []
  const revenue30 = analytic30.reduce((s, d) => s + d.vendor_net_amount, 0)
  const commission30 = analytic30.reduce((s, d) => s + d.quickgo_commission, 0)
  const gross30 = revenue30 + commission30
  // Effective commission rate derived from real data (gross vs. QuickGo cut)
  const commissionRate = gross30 > 0 ? Math.round((commission30 / gross30) * 100) : null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-quickgo-blue to-quickgo-cyan rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold bg-gradient-to-r from-quickgo-blue to-quickgo-cyan bg-clip-text text-transparent">QuickGo</span>
          </Link>
          <span className="text-xs text-gray-500 mt-0.5 block">Espace Vendeur</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${item.active
                ? "bg-gradient-to-r from-quickgo-blue/10 to-quickgo-cyan/10 text-quickgo-blue font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <item.icon size={17} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mon portefeuille</h1>
            <p className="text-sm text-gray-500">Suivi des revenus et gestion des retraits</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Bell size={18} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <Button
              onClick={() => setShowPayoutModal(true)}
              disabled={isFrozen || availableBalance < 5000}
              className="gap-2 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0 shadow-sm"
            >
              <ArrowUpRight size={16} />
              Retirer les fonds
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Frozen wallet alert */}
          {isFrozen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4"
            >
              <Lock className="text-red-600 shrink-0" size={24} />
              <div>
                <p className="font-semibold text-red-900">Portefeuille temporairement gelé</p>
                <p className="text-sm text-red-700">
                  {((realtimeWallet as unknown) as Record<string, unknown>).freezeReason as string ?? wallet?.freeze_reason ?? "Vérification en cours"}
                  . Contactez le support: support@quickgo.cm
                </p>
              </div>
            </motion.div>
          )}

          {/* Balance Cards */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-28">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-7 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: "Disponible au retrait",
                  value: formatCFA(availableBalance),
                  icon: Wallet,
                  gradient: "from-green-500 to-emerald-600",
                  sub: availableBalance >= 5000 ? "Prêt à retirer" : "Min. 5 000 F requis",
                  highlight: true,
                },
                {
                  label: "En attente livraison",
                  value: formatCFA(pendingBalance),
                  icon: Clock,
                  gradient: "from-amber-500 to-orange-500",
                  sub: "Libéré à la livraison",
                },
                {
                  label: "Total retiré",
                  value: formatCFA(withdrawnBalance),
                  icon: ArrowUpRight,
                  gradient: "from-blue-500 to-indigo-600",
                  sub: "Depuis le début",
                },
                {
                  label: "Total gagné",
                  value: formatCFA(totalEarned),
                  icon: TrendingUp,
                  gradient: "from-purple-500 to-violet-600",
                  sub: `${wallet?.total_sales ?? 0} commandes`,
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`bg-white rounded-2xl p-5 shadow-sm border ${card.highlight ? "border-green-200 ring-2 ring-green-100" : "border-gray-100"} relative overflow-hidden`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm mb-3`}>
                    <card.icon className="text-white" size={18} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* 30-day stats + chart */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Revenus — 30 derniers jours</h3>
                  <p className="text-sm text-gray-500">Montant net perçu quotidiennement</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatCFA(revenue30)}</p>
                  <p className="text-xs text-gray-400">Net vendeur / 30j</p>
                </div>
              </div>
              <MiniBarChart data={analytic30} />
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-900">Répartition</h3>
              <div className="space-y-3">
                {[
                  { label: "Vos revenus nets", amount: revenue30, color: "bg-green-500" },
                  { label: `Commission QuickGo${commissionRate != null ? ` (${commissionRate}%)` : ""}`, amount: commission30, color: "bg-quickgo-blue" },
                ].map((item, i) => {
                  const total = revenue30 + commission30
                  const pct = total > 0 ? (item.amount / total) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-900">{formatCFA(item.amount)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick actions */}
              <div className="pt-2 space-y-2">
                <Link
                  href="/vendor/payout-accounts"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Comptes de paiement</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/vendor/payouts"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Historique des retraits</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Financial Notifications */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Notifications financières</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-quickgo-blue" : "bg-gray-200"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                    {n.amount && <p className="text-sm font-bold text-gray-900 shrink-0">{formatCFA(n.amount)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs: Payouts + Commissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 px-5">
              {(["payouts", "commissions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? "border-quickgo-blue text-quickgo-blue" : "border-transparent text-gray-500 hover:text-gray-900"}`}
                >
                  {tab === "payouts" ? "Mes retraits" : "Commissions & commandes"}
                </button>
              ))}
            </div>

            {/* Payouts list */}
            {activeTab === "payouts" && (
              <div className="divide-y divide-gray-50">
                {!walletData?.payouts?.length ? (
                  <div className="p-12 text-center">
                    <ArrowUpRight className="mx-auto text-gray-300 mb-3" size={36} />
                    <p className="text-gray-500 font-medium">Aucun retrait effectué</p>
                    <p className="text-sm text-gray-400 mt-1">Votre historique de retraits apparaîtra ici</p>
                    {availableBalance >= 5000 && (
                      <Button
                        onClick={() => setShowPayoutModal(true)}
                        className="mt-4 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0"
                      >
                        Faire votre premier retrait
                      </Button>
                    )}
                  </div>
                ) : (
                  (walletData?.payouts ?? []).map((p) => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <span className="text-2xl">{payoutMethodIcon(p.payout_method)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{payoutMethodLabel(p.payout_method)}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.payout_phone} · {formatDate(p.created_at)}
                        </p>
                        {p.rejection_reason && (
                          <p className="text-xs text-red-600 mt-0.5">Raison: {p.rejection_reason}</p>
                        )}
                      </div>
                      <p className="font-bold text-gray-900">{formatCFA(p.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Commissions list */}
            {activeTab === "commissions" && (
              <div className="divide-y divide-gray-50">
                {!walletData?.commissions?.length ? (
                  <div className="p-12 text-center">
                    <BarChart3 className="mx-auto text-gray-300 mb-3" size={36} />
                    <p className="text-gray-500 font-medium">Aucune commission</p>
                    <p className="text-sm text-gray-400 mt-1">Vos commissions apparaîtront après vos premières ventes</p>
                  </div>
                ) : (
                  (walletData?.commissions ?? []).map((c) => (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">Vente — {formatDate(c.created_at)}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Brut: {formatCFA(c.gross_amount)} · Commission QuickGo: {formatCFA(c.quickgo_commission)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{formatCFA(c.vendor_net_amount)}</p>
                        <p className="text-xs text-gray-400">Net vendeur</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && vendorId && (
          <PayoutRequestModal
            vendorId={vendorId}
            availableBalance={availableBalance}
            payoutAccounts={walletData?.payout_accounts ?? []}
            onClose={() => setShowPayoutModal(false)}
            onSuccess={() => { fetchVendorAndData() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
