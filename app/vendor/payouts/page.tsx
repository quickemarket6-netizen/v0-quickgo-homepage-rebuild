"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, ArrowDownCircle, Clock, RefreshCw,
  CircleCheck, Ban, BadgeCheck, X, CheckCircle, Ticket, MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayoutRow {
  id: string; amount: number; status: string; payout_method: string
  reference_number: string | null; created_at: string; processed_at: string | null
}
interface KPI {
  pending_count: number; pending_amount: number; completed_month: number
  total_withdrawn: number; success_rate: number; total_count: number
}
interface WalletData { available_balance: number; pending_balance: number }
interface Account { id: string; payout_method: string; account_name: string; phone_number: string; is_default: boolean }
interface Counts { all: number; pending: number; processing: number; completed: number; failed: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const PIPELINE = ["pending", "processing", "completed"]

const STATUS_CFG: Record<string, {
  label: string; color: string
  Icon?: React.FC<{ className?: string; style?: React.CSSProperties }>
  pulse: boolean
}> = {
  pending:    { label: "En attente", color: "#eab308", Icon: Clock,        pulse: true  },
  processing: { label: "En cours",   color: "#3b82f6", Icon: RefreshCw,    pulse: true  },
  completed:  { label: "Validé",     color: "#22c55e", Icon: CircleCheck,  pulse: false },
  processed:  { label: "Validé",     color: "#22c55e", Icon: CircleCheck,  pulse: false },
  failed:     { label: "Échoué",     color: "#ef4444", Icon: Ban,          pulse: false },
  cancelled:  { label: "Annulé",     color: "#6b7280", Icon: Ban,          pulse: false },
}

const PAYOUT_LABELS: Record<string, string> = {
  mtn_momo: "MTN MoMo", orange_money: "Orange Money",
  moov_money: "Moov Money", bank_transfer: "Virement bancaire",
}

const FILTER_TABS = [
  { key: "all",        label: "Tous" },
  { key: "pending",    label: "En attente" },
  { key: "processing", label: "En cours" },
  { key: "completed",  label: "Validés" },
  { key: "failed",     label: "Échoués" },
] as const

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits",  href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: Boxes,      label: "Stocks",       href: "/vendor/stocks" },
  { icon: Truck,      label: "Livraisons",   href: "/vendor/deliveries" },
  { icon: TrendingUp, label: "Revenus",      href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts", active: true },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees"     },
  { icon: BarChart3,  label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Ticket,     label: "Coupons",     href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",     href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages", href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications",href: "/vendor/notifications" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

// ─── useCountUp ───────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, Icon, delay }: {
  label: string; value: string | number; sub: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3, boxShadow: `0 0 30px ${color}20` }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        hover:border-opacity-60 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
        style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{sub}</p>
        <p className="text-xs text-white/25 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Payout Card ──────────────────────────────────────────────────────────────
function PayoutCard({ payout, onCancel }: { payout: PayoutRow; onCancel: (id: string) => void }) {
  const cfg = STATUS_CFG[payout.status] ?? { label: payout.status, color: "#6b7280", pulse: false }
  const { Icon } = cfg
  const normalised = ["processed", "completed"].includes(payout.status) ? "completed" : payout.status
  const pipeIdx    = PIPELINE.indexOf(normalised)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      whileHover={{ borderColor: "#2a2a3e" }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 space-y-4 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.color + "22" }}>
            {Icon
              ? <Icon className="w-5 h-5" style={{ color: cfg.color }} />
              : <ArrowDownCircle className="w-5 h-5" style={{ color: cfg.color }} />}
          </div>
          <div>
            <p className="text-white font-bold">{payout.amount.toLocaleString("fr-FR")} F CFA</p>
            <p className="text-xs text-white/40">{PAYOUT_LABELS[payout.payout_method] ?? payout.payout_method}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: cfg.color + "22", color: cfg.color }}>
            {cfg.pulse && (
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: cfg.color }} />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: cfg.color }} />
              </span>
            )}
            {cfg.label}
          </div>
          {payout.status === "pending" && (
            <button onClick={() => onCancel(payout.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {pipeIdx >= 0 && (
        <div className="flex items-center gap-1">
          {PIPELINE.map((step, i) => {
            const done = i <= pipeIdx
            return (
              <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
                <div className="w-2 h-2 rounded-full transition-all" style={{ background: done ? "#a3e635" : "#ffffff15" }} />
                {i < PIPELINE.length - 1 && (
                  <div className="flex-1 h-0.5 rounded transition-all"
                    style={{ background: done && i < pipeIdx ? "#a3e635" : "#ffffff15" }} />
                )}
              </div>
            )
          })}
          <span className="text-xs text-white/30 ml-2">{STATUS_CFG[PIPELINE[pipeIdx]]?.label ?? ""}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-white/30">
        <span>Demandé le {new Date(payout.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
        {payout.processed_at && (
          <span>Traité le {new Date(payout.processed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
        )}
        {payout.reference_number && <span className="font-mono">Réf: {payout.reference_number}</span>}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PayoutsPage() {
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: true })
  const [vendorName, setVendorName]   = useState("")
  const [vendorInits, setVendorInits] = useState("")

  const [payouts, setPayouts]   = useState<PayoutRow[]>([])
  const [kpi, setKpi]           = useState<KPI>({ pending_count: 0, pending_amount: 0, completed_month: 0, total_withdrawn: 0, success_rate: 0, total_count: 0 })
  const [wallet, setWallet]     = useState<WalletData | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [counts, setCounts]     = useState<Counts>({ all: 0, pending: 0, processing: 0, completed: 0, failed: 0 })
  const [filter, setFilter]     = useState("all")
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showModal, setShowModal]       = useState(false)
  const [modalAmount, setModalAmount]   = useState("")
  const [modalAccount, setModalAccount] = useState("")
  const [submitting, setSubmitting]     = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalError, setModalError]     = useState("")

  const pendingAmt    = useCountUp(kpi.pending_amount)
  const completedMo   = useCountUp(kpi.completed_month)
  const totalWithdraw = useCountUp(kpi.total_withdrawn)

  // Video cycling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  // Vendor info
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (!user) return
      const { data: v } = await supabase.current.from("vendors").select("name").eq("owner_id", user.id).single()
      if (v) {
        const name = (v as { name: string }).name
        setVendorName(name)
        setVendorInits(name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase())
      }
    }
    void load()
  }, [])

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch(`/api/vendor/payouts?filter=${filter}`)
      if (res.ok) {
        const d = await res.json()
        setPayouts(d.payouts ?? [])
        setKpi(d.kpi ?? kpi)
        setWallet(d.wallet ?? null)
        setAccounts(d.accounts ?? [])
        setCounts(d.counts ?? counts)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void fetchData() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (id: string) => {
    await fetch("/api/vendor/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payout_id: id }),
    })
    void fetchData(true)
  }

  const handleWithdraw = async () => {
    setModalError("")
    const amt = parseFloat(modalAmount)
    if (!amt || amt <= 0 || !modalAccount) { setModalError("Veuillez renseigner le montant et le compte."); return }
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
        void fetchData(true)
      }, 2000)
    } catch { setModalError("Erreur réseau.") }
    setSubmitting(false)
  }

  const handleSignOut  = async () => { await supabase.current.auth.signOut(); window.location.href = "/auth/login" }
  const toggleSection  = (label: string) => setExpandedSections(s => ({ ...s, [label]: !s[label] }))
  const filterCount    = (key: string) => key === "all" ? counts.all : (counts[key as keyof Counts] ?? 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#8b5cf6] blur-[130px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.15", "--orb-o-max": "0.35", "--orb-dur": "9s" } as React.CSSProperties}
          />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#3b82f6] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.15", "--orb-o-max": "0.3", "--orb-dur": "11s", "--orb-delay": "3s" } as React.CSSProperties}
          />
        <div
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#06b6d4] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.15", "--orb-o-max": "0.3", "--orb-dur": "13s", "--orb-delay": "6s" } as React.CSSProperties}
          />
      </div>

      {/* ── Sidebar ── */}
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
          {SIDEBAR_ITEMS.map((item) => {
            const isExpanded  = expandedSections[item.label]
            const Icon        = item.icon
            const anyChildActive = ("expandable" in item && item.expandable) &&
              ("children" in item) && item.children?.some(c => ("active" in c) && c.active)

            return (
              <div key={item.label}>
                {("expandable" in item && item.expandable) ? (
                  <button onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      anyChildActive ? "text-[#a3e635] bg-[#a3e635]/10" : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      ("active" in item && item.active)
                        ? "bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {!!("active" in item && item.active) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                    )}
                  </Link>
                )}
                <AnimatePresence>
                  {("expandable" in item && item.expandable) && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {("children" in item && Array.isArray(item.children) ? item.children : []).map((child: { label: string; href: string; active?: boolean }) => {
                        const isActive = ("active" in child) && child.active
                        return (
                          <Link key={child.label} href={child.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                              isActive ? "text-[#a3e635] bg-[#a3e635]/10 font-medium" : "text-white/40 hover:text-white hover:bg-[#1e1e2e]/40"
                            }`}>
                            <ChevronRight className="w-3 h-3" />
                            {child.label}
                            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a3e635]" />}
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

        <div className="p-3">
          <motion.div whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-[#8b5cf6]/20 to-[#3b82f6]/20 border border-[#8b5cf6]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Gérez vos finances</p>
            <p className="text-white/40 text-[10px] mb-3">Suivez vos retraits et votre portefeuille</p>
            <Link href="/vendor/wallet"
              className="w-full py-1.5 rounded-lg bg-[#a3e635] text-[#0a0a0f] text-xs font-bold flex items-center justify-center gap-1.5">
              Voir le portefeuille
            </Link>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* ── Header with video ── */}
        <div className="relative overflow-hidden bg-[#111118]">
          <video ref={videoRef} muted loop playsInline
            onEnded={() => setVideoIdx(i => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />

          <div
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#8b5cf6] blur-3xl opacity-30 animate-orb"
            style={{ "--orb-s": "1.3", "--orb-o-min": "0.3", "--orb-o-max": "0.6", "--orb-dur": "6s" } as React.CSSProperties}
            />
          <div
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#3b82f6] blur-3xl opacity-20 animate-orb"
            style={{ "--orb-s": "1.3", "--orb-o-min": "0.2", "--orb-o-max": "0.5", "--orb-dur": "8s", "--orb-delay": "2s" } as React.CSSProperties}
            />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center"
                >
                  <ArrowDownCircle className="w-5 h-5 text-[#8b5cf6]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Retraits &{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]">
                    Virements
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Gérez vos demandes de retrait</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setShowModal(true); setModalSuccess(false); setModalError("") }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa] hover:bg-[#8b5cf6]/30 transition-all text-sm font-semibold"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Nouveau retrait
              </motion.button>

              <motion.button onClick={() => fetchData(true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
              </motion.button>

              <Link href="/vendor/notifications">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] border-2 border-[#8b5cf6]/60 shadow-[0_0_12px_rgba(139,92,246,0.25)] flex items-center justify-center">
                      <span className="text-white font-black text-sm">{vendorInits || "V"}</span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-white text-sm font-semibold leading-tight">{vendorName || "Vendeur"}</p>
                      <p className="text-white/40 text-xs">Gestionnaire</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#16161f] border-[#1e1e2e]">
                  <DropdownMenuItem asChild>
                    <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <User className="w-4 h-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <Settings className="w-4 h-4" /> Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem onClick={handleSignOut}
                    className="flex items-center gap-2 text-[#ef4444] hover:text-[#ef4444] cursor-pointer">
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* Pending banner */}
          <AnimatePresence>
            {kpi.pending_count > 0 && (
              <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-2xl px-5 py-4 flex items-center gap-3">
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-yellow-400" />
                </motion.span>
                <p className="text-sm text-white/80">
                  <span className="text-[#eab308] font-bold">{kpi.pending_count} retrait{kpi.pending_count > 1 ? "s" : ""}</span>
                  {" "}en attente — {pendingAmt.toLocaleString("fr-FR")} F CFA en cours de traitement
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="En attente"      value={kpi.pending_count}                           sub={`${pendingAmt.toLocaleString("fr-FR")} F`} color="#eab308" Icon={Clock}          delay={0}    />
            <KpiCard label="Validés ce mois" value={completedMo.toLocaleString("fr-FR") + " F"} sub="F CFA ce mois"                             color="#22c55e" Icon={CircleCheck}    delay={0.06} />
            <KpiCard label="Total retiré"    value={totalWithdraw.toLocaleString("fr-FR") + " F"} sub="F CFA cumulés"                           color="#8b5cf6" Icon={ArrowDownCircle} delay={0.12} />
            <KpiCard label="Taux de succès"  value={`${kpi.success_rate}%`}                      sub={`sur ${kpi.total_count} retraits`}         color="#3b82f6" Icon={BadgeCheck}      delay={0.18} />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  filter === tab.key
                    ? "bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20"
                    : "border-[#1e1e2e] text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                }`}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-white/5 text-white/30"
                }`}>{filterCount(tab.key)}</span>
              </button>
            ))}
          </div>

          {/* Payouts list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <ArrowDownCircle size={48} className="text-white/20" />
              </motion.div>
              <p className="text-white/40 text-center">Aucun retrait{filter !== "all" ? " avec ce statut" : ""}</p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setShowModal(true); setModalSuccess(false); setModalError("") }}
                className="px-5 py-2.5 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa] hover:bg-[#8b5cf6]/30 transition-all text-sm font-medium">
                Faire un retrait
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {payouts.map(p => <PayoutCard key={p.id} payout={p} onCancel={handleCancel} />)}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* ── Withdrawal Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 space-y-5">

              {modalSuccess ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}>
                    <CheckCircle size={52} className="text-[#a3e635]" />
                  </motion.div>
                  <p className="text-white font-semibold text-lg">Demande envoyée !</p>
                  <p className="text-white/40 text-sm text-center">Votre retrait est en cours de traitement.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-bold text-lg">Nouveau retrait</h2>
                    <button onClick={() => setShowModal(false)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <X size={14} className="text-white/40" />
                    </button>
                  </div>

                  {wallet && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                      <span className="text-sm text-white/40">Solde disponible</span>
                      <span className="text-sm font-bold text-[#a78bfa]">{wallet.available_balance.toLocaleString("fr-FR")} F CFA</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm text-white/50">Montant (F CFA)</label>
                    <div className="flex gap-2">
                      <input type="number" min="1000" value={modalAmount} onChange={e => setModalAmount(e.target.value)}
                        placeholder="Ex: 5000"
                        className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#8b5cf6]/50 placeholder-white/20" />
                      {wallet && (
                        <button onClick={() => setModalAmount(String(Math.floor(wallet.available_balance)))}
                          className="px-3 py-2.5 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors font-medium">
                          MAX
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-white/50">Compte de paiement</label>
                    <select value={modalAccount} onChange={e => setModalAccount(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#8b5cf6]/50">
                      <option value="">Sélectionner un compte</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {PAYOUT_LABELS[a.payout_method] ?? a.payout_method} — {a.phone_number} ({a.account_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {kpi.total_count > 0 && (
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <BadgeCheck size={13} className="text-[#3b82f6]" />
                      Taux de succès : <span className="text-[#3b82f6] font-medium">{kpi.success_rate}%</span>
                    </div>
                  )}

                  {modalError && <p className="text-sm text-[#ef4444]">{modalError}</p>}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleWithdraw} disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:bg-[#8b5cf6]/30 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
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
