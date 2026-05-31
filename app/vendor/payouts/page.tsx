"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Truck, Wallet, TrendingUp, Settings, Bell, MessageSquare,
  ChevronRight, LogOut, ArrowDownCircle, Clock, RefreshCw,
  CircleCheck, Ban, BadgeCheck, X, CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayoutRow {
  id: string
  amount: number
  status: string
  payout_method: string
  reference_number: string | null
  created_at: string
  processed_at: string | null
}
interface KPI {
  pending_count: number
  pending_amount: number
  completed_month: number
  total_withdrawn: number
  success_rate: number
  total_count: number
}
interface WalletData { available_balance: number; pending_balance: number }
interface Account { id: string; payout_method: string; account_name: string; phone_number: string; is_default: boolean }
interface Counts { all: number; pending: number; processing: number; completed: number; failed: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const PIPELINE = ["pending", "processing", "completed"]

const STATUS_CFG: Record<string, { label: string; color: string; Icon?: React.FC<{ size?: number; style?: React.CSSProperties }>; pulse: boolean }> = {
  pending:    { label: "En attente", color: "#eab308", Icon: Clock,        pulse: true  },
  processing: { label: "En cours",   color: "#3b82f6", Icon: RefreshCw,    pulse: true  },
  completed:  { label: "Validé",     color: "#22c55e", Icon: CircleCheck,  pulse: false },
  processed:  { label: "Validé",     color: "#22c55e", Icon: CircleCheck,  pulse: false },
  failed:     { label: "Échoué",     color: "#ef4444", Icon: Ban,          pulse: false },
  cancelled:  { label: "Annulé",     color: "#6b7280", Icon: Ban,          pulse: false },
}

const PAYOUT_LABELS: Record<string, string> = {
  mtn_momo:      "MTN MoMo",
  orange_money:  "Orange Money",
  moov_money:    "Moov Money",
  bank_transfer: "Virement bancaire",
}

const FILTER_TABS = [
  { key: "all",        label: "Tous" },
  { key: "pending",    label: "En attente" },
  { key: "processing", label: "En cours" },
  { key: "completed",  label: "Validés" },
  { key: "failed",     label: "Échoués" },
] as const

const VIDEO_URLS = [
  "https://ljqqgzftkumpnixqiuuh.supabase.co/storage/v1/object/public/assets/bg1.mp4",
  "https://ljqqgzftkumpnixqiuuh.supabase.co/storage/v1/object/public/assets/bg2.mp4",
]

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  {
    icon: Package, label: "Produits", href: "/vendor/products",
    children: [
      { label: "Tous les produits",  href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: ShoppingCart,  label: "Commandes",     href: "/vendor/orders" },
  { icon: Package,       label: "Stocks",        href: "/vendor/stocks" },
  { icon: Truck,         label: "Livraisons",    href: "/vendor/deliveries" },
  { icon: Users,         label: "CRM",           href: "/vendor/crm" },
  { icon: TrendingUp,    label: "Revenus",       href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet",
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts", active: true },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: BarChart3,     label: "Analyses",      href: "/vendor/analytics" },
  { icon: Settings,      label: "Paramètres",    href: "/vendor/settings" },
  { icon: Bell,          label: "Notifications", href: "/vendor/notifications" },
  { icon: MessageSquare, label: "Messages",      href: "/vendor/messages" },
]

// ─── useCountUp ───────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(e * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ─── PayoutCard ───────────────────────────────────────────────────────────────
function PayoutCard({ payout, onCancel }: { payout: PayoutRow; onCancel: (id: string) => void }) {
  const cfg = STATUS_CFG[payout.status] ?? { label: payout.status, color: "#6b7280", pulse: false }
  const { Icon } = cfg
  const normalised = ["processed", "completed"].includes(payout.status) ? "completed" : payout.status
  const pipeIdx = PIPELINE.indexOf(normalised)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.color + "22" }}>
            {Icon
              ? <Icon size={18} style={{ color: cfg.color }} />
              : <ArrowDownCircle size={18} style={{ color: cfg.color }} />}
          </div>
          <div>
            <p className="text-white font-semibold">{payout.amount.toLocaleString("fr-FR")} F CFA</p>
            <p className="text-xs text-gray-400">{PAYOUT_LABELS[payout.payout_method] ?? payout.payout_method}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: cfg.color + "22", color: cfg.color }}>
            {cfg.pulse && (
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.color }} />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: cfg.color }} />
              </span>
            )}
            {cfg.label}
          </div>
          {payout.status === "pending" && (
            <button
              onClick={() => onCancel(payout.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Pipeline bar */}
      {pipeIdx >= 0 && (
        <div className="flex items-center gap-1">
          {PIPELINE.map((step, i) => {
            const done = i <= pipeIdx
            return (
              <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
                <div className="w-2 h-2 rounded-full transition-all" style={{ background: done ? "#a3e635" : "#1e1e2e" }} />
                {i < PIPELINE.length - 1 && (
                  <div className="flex-1 h-0.5 rounded transition-all" style={{ background: done && i < pipeIdx ? "#a3e635" : "#1e1e2e" }} />
                )}
              </div>
            )
          })}
          <span className="text-xs text-gray-500 ml-2">{STATUS_CFG[PIPELINE[pipeIdx]]?.label ?? ""}</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span>Demandé le {new Date(payout.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
        {payout.processed_at && (
          <span>Traité le {new Date(payout.processed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
        )}
        {payout.reference_number && (
          <span className="font-mono text-gray-500">Réf: {payout.reference_number}</span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PayoutsPage() {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: true })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [payouts, setPayouts]   = useState<PayoutRow[]>([])
  const [kpi, setKpi]           = useState<KPI>({ pending_count: 0, pending_amount: 0, completed_month: 0, total_withdrawn: 0, success_rate: 0, total_count: 0 })
  const [wallet, setWallet]     = useState<WalletData | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [counts, setCounts]     = useState<Counts>({ all: 0, pending: 0, processing: 0, completed: 0, failed: 0 })
  const [filter, setFilter]     = useState<string>("all")
  const [loading, setLoading]   = useState(true)

  const [showModal, setShowModal]       = useState(false)
  const [modalAmount, setModalAmount]   = useState("")
  const [modalAccount, setModalAccount] = useState("")
  const [submitting, setSubmitting]     = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalError, setModalError]     = useState("")

  const pendingAmt    = useCountUp(kpi.pending_amount)
  const completedMo   = useCountUp(kpi.completed_month)
  const totalWithdraw = useCountUp(kpi.total_withdrawn)

  const fetchData = async (f = filter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/payouts?filter=${f}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setPayouts(d.payouts ?? [])
      setKpi(d.kpi ?? kpi)
      setWallet(d.wallet ?? null)
      setAccounts(d.accounts ?? [])
      setCounts(d.counts ?? counts)
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { fetchData(filter) }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch("/api/vendor/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: id }),
      })
      if (res.ok) fetchData(filter)
    } catch { /* silent */ }
  }

  const handleWithdraw = async () => {
    setModalError("")
    const amt = parseFloat(modalAmount)
    if (!amt || amt <= 0 || !modalAccount) {
      setModalError("Veuillez renseigner le montant et le compte.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/vendor/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, account_id: modalAccount }),
      })
      const d = await res.json()
      if (!res.ok) { setModalError(d.error ?? "Erreur lors du retrait."); setSubmitting(false); return }
      setModalSuccess(true)
      setTimeout(() => {
        setShowModal(false); setModalSuccess(false); setModalAmount(""); setModalAccount("")
        fetchData(filter)
      }, 2000)
    } catch { setModalError("Erreur réseau.") }
    setSubmitting(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/auth/login" }
  const toggleSection = (label: string) => setExpandedSections(s => ({ ...s, [label]: !s[label] }))
  const filterCount = (key: string) => key === "all" ? counts.all : (counts[key as keyof Counts] ?? 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex overflow-hidden relative">
      {/* Video BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          ref={videoRef} autoPlay muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          onEnded={() => setVideoIdx(i => (i + 1) % VIDEO_URLS.length)}
          key={videoIdx} src={VIDEO_URLS[videoIdx]}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f]/80 via-[#0a0a0f]/60 to-[#0a0a0f]/80" />
      </div>

      {/* Glow orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[
          { color: "#8b5cf6", x: "10%", y: "15%", size: 350, d: 5 },
          { color: "#3b82f6", x: "75%", y: "60%", size: 280, d: 7 },
          { color: "#06b6d4", x: "50%", y: "85%", size: 220, d: 4 },
        ].map((o, i) => (
          <motion.div key={i} className="absolute rounded-full blur-3xl opacity-10"
            style={{ left: o.x, top: o.y, width: o.size, height: o.size, background: o.color }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
            transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-30 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0d0d14]/95 backdrop-blur-xl border-r border-[#1e1e2e]"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#1e1e2e]">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#a3e635]/20 flex items-center justify-center">
                <span className="text-[#a3e635] font-bold text-sm">Q</span>
              </div>
              <span className="font-bold text-white">QuickGo</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="w-8 h-8 rounded-lg bg-[#1e1e2e] flex items-center justify-center hover:bg-[#2a2a3e] transition-colors ml-auto"
          >
            <ChevronRight size={14} className={`text-gray-400 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const hasChildren = "children" in item && !!item.children
            const isExpanded = expandedSections[item.label]
            const Icon = item.icon
            const anyChildActive = hasChildren && item.children.some(c => ("active" in c) && c.active)

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${anyChildActive ? "bg-[#a3e635]/10 text-[#a3e635]" : "text-gray-400 hover:bg-[#1e1e2e] hover:text-white"}`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-gray-400 hover:bg-[#1e1e2e] hover:text-white"
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )}

                <AnimatePresence>
                  {hasChildren && isExpanded && !sidebarCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="ml-9 mt-1 space-y-1 overflow-hidden"
                    >
                      {item.children.map((child) => {
                        const isActive = ("active" in child) && child.active
                        return (
                          <Link key={child.label} href={child.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-all ${isActive ? "bg-[#a3e635]/15 text-[#a3e635] font-medium" : "text-gray-500 hover:text-white hover:bg-[#1e1e2e]"}`}>
                            {child.label}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Retraits & Virements</h1>
              <p className="text-sm text-gray-400 mt-1">Gérez vos demandes de retrait</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setShowModal(true); setModalSuccess(false); setModalError("") }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all font-medium text-sm"
            >
              <ArrowDownCircle size={16} />
              Nouveau retrait
            </motion.button>
          </div>

          {/* Pending banner */}
          <AnimatePresence>
            {kpi.pending_count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10"
              >
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-yellow-400" />
                </span>
                <p className="text-sm text-yellow-300">
                  <strong>{kpi.pending_count} retrait{kpi.pending_count > 1 ? "s" : ""}</strong> en attente
                  {" — "}{pendingAmt.toLocaleString("fr-FR")} F CFA en cours de traitement
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "En attente",
                value: kpi.pending_count,
                sub: `${pendingAmt.toLocaleString("fr-FR")} F`,
                color: "#eab308", Icon: Clock, fmt: false,
              },
              {
                label: "Validés ce mois",
                value: completedMo,
                sub: "F CFA ce mois",
                color: "#22c55e", Icon: CircleCheck, fmt: true,
              },
              {
                label: "Total retiré",
                value: totalWithdraw,
                sub: "F CFA cumulés",
                color: "#8b5cf6", Icon: ArrowDownCircle, fmt: true,
              },
              {
                label: "Taux de succès",
                value: kpi.success_rate,
                sub: `sur ${kpi.total_count} retraits`,
                color: "#3b82f6", Icon: BadgeCheck, fmt: false, suffix: "%",
              },
            ].map((card, i) => (
              <motion.div key={card.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.color + "22" }}>
                  <card.Icon size={18} style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {card.fmt ? card.value.toLocaleString("fr-FR") : card.value}{card.suffix ?? ""}
                  </p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
                <p className="text-xs text-gray-500">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filter === tab.key
                  ? "bg-[#a3e635]/15 border-[#a3e635]/40 text-[#a3e635]"
                  : "border-[#1e1e2e] text-gray-400 hover:border-[#2a2a3e] hover:text-white"}`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-[#1e1e2e] text-gray-500"}`}>
                  {filterCount(tab.key)}
                </span>
              </button>
            ))}
          </div>

          {/* Payouts list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-[#111118] border border-[#1e1e2e] animate-pulse" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <ArrowDownCircle size={48} className="text-gray-600" />
              </motion.div>
              <p className="text-gray-400 text-center">Aucun retrait{filter !== "all" ? " avec ce statut" : ""}</p>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setShowModal(true); setModalSuccess(false); setModalError("") }}
                className="px-5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all text-sm font-medium"
              >
                Faire un retrait
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {payouts.map(p => (
                  <PayoutCard key={p.id} payout={p} onCancel={handleCancel} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* ── Withdrawal Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 space-y-5"
            >
              {modalSuccess ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    <CheckCircle size={52} className="text-[#a3e635]" />
                  </motion.div>
                  <p className="text-white font-semibold text-lg">Demande envoyée !</p>
                  <p className="text-gray-400 text-sm text-center">Votre retrait est en cours de traitement.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold text-lg">Nouveau retrait</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-8 h-8 rounded-lg bg-[#1e1e2e] flex items-center justify-center hover:bg-[#2a2a3e] transition-colors"
                    >
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>

                  {wallet && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <span className="text-sm text-gray-400">Solde disponible</span>
                      <span className="text-sm font-semibold text-purple-300">{wallet.available_balance.toLocaleString("fr-FR")} F CFA</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Montant (F CFA)</label>
                    <div className="flex gap-2">
                      <input
                        type="number" min="1000" value={modalAmount}
                        onChange={e => setModalAmount(e.target.value)}
                        placeholder="Ex: 5000"
                        className="flex-1 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
                      />
                      {wallet && (
                        <button
                          onClick={() => setModalAmount(String(Math.floor(wallet.available_balance)))}
                          className="px-3 py-2.5 rounded-xl bg-[#1e1e2e] text-gray-300 text-xs hover:bg-[#2a2a3e] transition-colors font-medium"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Compte de paiement</label>
                    <select
                      value={modalAccount} onChange={e => setModalAccount(e.target.value)}
                      className="w-full bg-[#0d0d14] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">Sélectionner un compte</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {PAYOUT_LABELS[a.payout_method] ?? a.payout_method} — {a.phone_number} ({a.account_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {kpi.total_count > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BadgeCheck size={13} className="text-blue-400" />
                      Taux de succès : <span className="text-blue-400 font-medium">{kpi.success_rate}%</span>
                    </div>
                  )}

                  {modalError && <p className="text-sm text-red-400">{modalError}</p>}

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleWithdraw} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Envoi en cours…" : "Confirmer le retrait"}
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
