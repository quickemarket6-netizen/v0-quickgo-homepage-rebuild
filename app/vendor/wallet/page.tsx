"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, RefreshCw,
  Zap, ChevronRight, LogOut, User, Boxes, Truck, Plus, X,
  ArrowDownCircle, Phone, BadgeCheck, Loader2, CheckCircle, AlertCircle, Trash2, Ticket, MessageSquare,
} from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Account { id: string; payout_method: string; account_name: string; phone_number: string; is_default: boolean }
interface Payout  { id: string; amount: number; status: string; payout_method: string; reference_number: string | null; created_at: string }
interface WalletData {
  vendor_id: string
  wallet: { available_balance: number; pending_balance: number; total_earned: number; total_withdrawn: number; next_payout_date: string | null; next_payout_amount: number | null } | null
  accounts: Account[]
  recent_payouts: Payout[]
  chart: { date: string; earned: number }[]
  commission_rate: number
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
  { icon: TrendingUp, label: "Revenus", href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait",  href: "/vendor/wallet",         active: true },
      { label: "Retraits",         href: "/vendor/payouts",        active: false },
      { label: "Historique",       href: "/vendor/wallet/history", active: false },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees"     },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Ticket,     label: "Coupons",     href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",     href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages", href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications",href: "/vendor/notifications" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

const VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const PAYOUT_METHODS = [
  { value: "mtn_momo",      label: "MTN MoMo" },
  { value: "orange_money",  label: "Orange Money" },
  { value: "moov_money",    label: "Moov Money" },
  { value: "bank",          label: "Virement bancaire" },
]

function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F`
  if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} F`
  return `${Math.round(n)} F`
}
function initials(s: string) { return s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}
function methodLabel(v: string) { return PAYOUT_METHODS.find((m) => m.value === v)?.label ?? v }

function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target === 0) { setV(0); return }
    let t: number | null = null
    const step = (ts: number) => {
      if (!t) t = ts
      const p = Math.min((ts - t) / dur, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target, dur])
  return v
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-2.5 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-[#a3e635] font-bold">{formatCFA(payload[0].value)}</p>
    </div>
  )
}

function BalanceCard({ label, value, color, icon: Icon, large, delay }: {
  label: string; value: number; color: string; icon: typeof Wallet; large?: boolean; delay: number
}) {
  const counted = useCountUp(value)
  void counted
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        transition-all duration-300 hover:border-white/10"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className={`font-black text-white leading-tight ${large ? "text-2xl" : "text-xl"}`}>
          {formatCFA(value)}
        </p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorWalletPage() {
  const [data, setData]               = useState<WalletData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [vendorName, setVendorName]   = useState("")
  const [vendorStatus, setVendorStatus] = useState("active")
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({ Produits: false, Portefeuille: true })
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx]       = useState(0)
  const supabase = useRef(createClient())

  // Withdraw modal
  const [showWithdraw, setShowWithdraw]           = useState(false)
  const [withdrawAmount, setWithdrawAmount]       = useState("")
  const [withdrawAccountId, setWithdrawAccountId] = useState("")
  const [withdrawing, setWithdrawing]             = useState(false)
  const [withdrawError, setWithdrawError]         = useState("")
  const [withdrawSuccess, setWithdrawSuccess]     = useState(false)

  // Add account form
  const [showAddAccount, setShowAddAccount]     = useState(false)
  const [newMethod, setNewMethod]               = useState("mtn_momo")
  const [newName, setNewName]                   = useState("")
  const [newPhone, setNewPhone]                 = useState("")
  const [newDefault, setNewDefault]             = useState(false)
  const [addingAccount, setAddingAccount]       = useState(false)
  const [addAccountError, setAddAccountError]   = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/vendor/wallet/summary")
      if (res.ok) {
        const d = await res.json() as WalletData
        setData(d)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void fetchData()
    const loadVendor = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (!user) return
      const { data: v } = await supabase.current.from("vendors").select("name, status").eq("owner_id", user.id).single()
      if (v) { setVendorName(v.name); setVendorStatus(v.status) }
    }
    void loadVendor()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const video = videoRef.current; if (!video) return
    video.src = VIDEOS[videoIdx]; video.load()
    const fn = () => video.play().catch(() => {})
    video.addEventListener("canplay", fn, { once: true })
    return () => video.removeEventListener("canplay", fn)
  }, [videoIdx])

  const toggleSection = (label: string) => setExpanded((s) => ({ ...s, [label]: !s[label] }))

  const handleWithdraw = async () => {
    setWithdrawError(""); setWithdrawing(true)
    try {
      const amount = parseInt(withdrawAmount.replace(/\s/g, ""), 10)
      if (isNaN(amount)) { setWithdrawError("Montant invalide"); return }
      const res = await fetch("/api/vendor/wallet/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, account_id: withdrawAccountId }),
      })
      const json = await res.json() as { error?: string; success?: boolean }
      if (!res.ok) { setWithdrawError(json.error ?? "Erreur"); return }
      setWithdrawSuccess(true)
      void fetchData()
    } finally { setWithdrawing(false) }
  }

  const handleAddAccount = async () => {
    setAddAccountError(""); setAddingAccount(true)
    try {
      if (!newName || !newPhone) { setAddAccountError("Nom et numéro requis"); return }
      const res = await fetch("/api/vendor/payout-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: data?.vendor_id, payout_method: newMethod, account_name: newName, phone_number: newPhone, is_default: newDefault }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) { setAddAccountError(json.error ?? "Erreur"); return }
      setShowAddAccount(false); setNewName(""); setNewPhone(""); setNewDefault(false)
      void fetchData()
    } finally { setAddingAccount(false) }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!data?.vendor_id) return
    await fetch(`/api/vendor/payout-accounts?account_id=${accountId}&vendor_id=${data.vendor_id}`, { method: "DELETE" })
    void fetchData()
  }

  const wallet       = data?.wallet
  const accounts     = data?.accounts ?? []
  const recentPays   = data?.recent_payouts ?? []
  const chart        = data?.chart ?? []
  const available    = wallet?.available_balance ?? 0
  const withdrawAmountNum = parseInt(withdrawAmount.replace(/\s/g, ""), 10)

  const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    pending:   { label: "En attente",  color: "text-[#eab308] bg-[#eab308]/10" },
    completed: { label: "Validé",      color: "text-[#22c55e] bg-[#22c55e]/10" },
    processed: { label: "Traité",      color: "text-[#22c55e] bg-[#22c55e]/10" },
    failed:    { label: "Échoué",      color: "text-[#ef4444] bg-[#ef4444]/10" },
    cancelled: { label: "Annulé",      color: "text-white/40 bg-white/5" },
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Orbs ────────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.28, 0.12] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/3 w-[380px] h-[380px] rounded-full bg-[#a3e635] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.2, 0.08] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-[#eab308] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.07, 0.18, 0.07] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-2/3 right-1/4 w-72 h-72 rounded-full bg-[#22c55e] blur-[120px]" />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e] relative z-10">
        <div className="px-5 py-5 border-b border-[#1e1e2e]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
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
            const isExpanded = expanded[item.label]
            return (
              <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                {item.expandable ? (
                  <>
                    <button onClick={() => toggleSection(item.label)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/40 hover:bg-white/5 hover:text-white">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-7 mt-0.5 space-y-0.5">
                          {item.children?.map((child) => (
                            <Link key={child.label} href={child.href}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                                ("active" in child) && child.active
                                  ? "bg-[#a3e635]/10 text-[#a3e635] font-semibold"
                                  : "text-white/40 hover:bg-white/5 hover:text-white"
                              }`}>
                              <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/40 hover:bg-white/5 hover:text-white">
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
            <p className="text-white/40 text-xs mb-3">Multipliez vos ventes et vos revenus.</p>
            <Button size="sm" className="w-full h-8 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-xs rounded-lg">Activer</Button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative z-10">

        {/* Hero header */}
        <div className="relative overflow-hidden">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-20"
            muted playsInline onEnded={() => setVideoIdx((i) => (i + 1) % VIDEOS.length)} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/90 to-[#0a0a0f]/60" />

          <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3 flex items-center justify-between gap-4 relative">
            <div>
              <h1 className="text-white font-bold">Portefeuille</h1>
              <p className="text-xs text-white/30">Solde &amp; Retrait</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
              </button>
              <Button variant="ghost" size="icon" onClick={() => void fetchData()} className="h-9 w-9 rounded-xl">
                <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e] focus:outline-none">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)]">
                      <span className="text-white font-bold text-xs">{vendorName ? initials(vendorName) : "?"}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#16161f] border-[#1e1e2e]">
                  <div className="px-3 py-2 border-b border-[#1e1e2e]">
                    <p className="text-white text-sm font-semibold truncate">{vendorName || "Vendeur"}</p>
                    <span className={`text-xs ${vendorStatus === "active" ? "text-[#22c55e]" : "text-[#f97316]"}`}>
                      {vendorStatus === "active" ? "● Actif" : "● Inactif"}
                    </span>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer"><User className="h-4 w-4" /> Mon profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer"><Settings className="h-4 w-4" /> Paramètres</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem onClick={async () => { await supabase.current.auth.signOut(); window.location.href = "/" }}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer focus:text-red-300">
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="relative px-6 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-full px-3 py-1 mb-3">
                <Wallet className="w-3.5 h-3.5 text-[#a3e635]" />
                <span className="text-[#a3e635] text-xs font-medium uppercase tracking-widest">Portefeuille</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">
                Solde &amp;<br /><span className="text-[#a3e635]">Retrait</span>
              </h2>
              <p className="text-white/40 text-sm max-w-md">Gérez votre solde disponible et demandez vos retraits en toute sécurité.</p>
            </motion.div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 4 balance cards */}
          {loading && !data ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <BalanceCard label="Solde disponible"   value={wallet?.available_balance ?? 0}  color="#a3e635" icon={Wallet}          large delay={0}    />
              <BalanceCard label="En attente"          value={wallet?.pending_balance ?? 0}    color="#eab308" icon={ArrowDownCircle}  large delay={0.06} />
              <BalanceCard label="Total encaissé"      value={wallet?.total_earned ?? 0}       color="#3b82f6" icon={BarChart3}         delay={0.12} />
              <BalanceCard label="Total retiré"        value={wallet?.total_withdrawn ?? 0}    color="#8b5cf6" icon={TrendingUp}        delay={0.18} />
            </div>
          )}

          {/* Next payout banner */}
          {!loading && wallet?.next_payout_date && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eab308]/20 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5 text-[#eab308]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Prochain virement automatique</p>
                  <p className="text-white/40 text-xs">Prévu le {fmtDate(wallet.next_payout_date)}</p>
                </div>
              </div>
              {wallet.next_payout_amount && (
                <p className="text-[#eab308] font-black text-lg shrink-0">{formatCFA(wallet.next_payout_amount)}</p>
              )}
            </motion.div>
          )}

          {/* CTA: Demander un retrait */}
          {!loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="flex items-center gap-3">
              <Button
                onClick={() => { setWithdrawSuccess(false); setWithdrawError(""); setWithdrawAmount(""); setWithdrawAccountId(accounts[0]?.id ?? ""); setShowWithdraw(true) }}
                className="h-11 px-6 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold rounded-xl flex items-center gap-2"
              >
                <ArrowDownCircle className="w-4 h-4" /> Demander un retrait
              </Button>
              <Link href="/vendor/wallet/history"
                className="h-11 px-5 bg-[#16161f] border border-[#1e1e2e] hover:border-white/20 text-white/60 hover:text-white font-medium rounded-xl flex items-center gap-2 text-sm transition-all">
                Voir l&apos;historique <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {/* 2-col: earnings chart + payout accounts */}
          <div className="grid xl:grid-cols-2 gap-4">

            {/* Earnings chart (30d) */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#a3e635]/15 transition-all">
              <h3 className="text-white font-semibold text-sm mb-1">Gains nets (30 derniers jours)</h3>
              <p className="text-xs text-white/30 mb-4">Après déduction de la commission QuickGo ({data?.commission_rate ?? 5}%)</p>
              {loading ? (
                <div className="h-44 bg-white/5 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={chart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a3e635" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="earned" stroke="#a3e635" strokeWidth={2}
                      fill="url(#earnGrad)" dot={false} activeDot={{ r: 4, fill: "#a3e635", stroke: "#0a0a0f", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Payout accounts */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#8b5cf6]/15 transition-all flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">Comptes de paiement</h3>
                  <p className="text-xs text-white/30 mt-0.5">{accounts.length}/5 comptes enregistrés</p>
                </div>
                {accounts.length < 5 && (
                  <button onClick={() => setShowAddAccount((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-[#a3e635] hover:text-[#a3e635]/80 transition-colors font-medium">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                )}
              </div>

              {/* Add account form */}
              <AnimatePresence>
                {showAddAccount && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-4 mb-4 space-y-3">
                      <p className="text-xs text-white/50 font-medium">Nouveau compte</p>
                      <select value={newMethod} onChange={(e) => setNewMethod(e.target.value)}
                        className="w-full bg-[#16161f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a3e635]/50">
                        {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du compte"
                        className="bg-[#16161f] border-[#1e1e2e] text-sm text-white placeholder:text-white/20 focus:border-[#a3e635]/50" />
                      <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Numéro / IBAN"
                        className="bg-[#16161f] border-[#1e1e2e] text-sm text-white placeholder:text-white/20 focus:border-[#a3e635]/50" />
                      <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                        <input type="checkbox" checked={newDefault} onChange={(e) => setNewDefault(e.target.checked)} className="accent-[#a3e635]" />
                        Définir comme compte par défaut
                      </label>
                      {addAccountError && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" />{addAccountError}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddAccount} disabled={addingAccount}
                          className="flex-1 h-8 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-xs rounded-lg">
                          {addingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddAccount(false)} className="h-8 text-white/40">
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {loading ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
              ) : accounts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <Phone className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-white/30 text-sm">Aucun compte de paiement</p>
                  <p className="text-white/20 text-xs mt-1">Ajoutez un compte MoMo ou bancaire pour recevoir vos retraits</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {accounts.map((acc, i) => (
                    <motion.div key={acc.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-3 group">
                      <div className="w-9 h-9 rounded-lg bg-[#a3e635]/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-[#a3e635]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium truncate">{acc.account_name}</p>
                          {acc.is_default && (
                            <span className="text-[10px] bg-[#a3e635]/15 text-[#a3e635] font-bold px-1.5 py-0.5 rounded-md shrink-0">Défaut</span>
                          )}
                        </div>
                        <p className="text-xs text-white/30 truncate">{methodLabel(acc.payout_method)} · {acc.phone_number}</p>
                      </div>
                      <button onClick={() => handleDeleteAccount(acc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-white/30 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent withdrawals */}
          {!loading && recentPays.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Derniers retraits</h3>
                <Link href="/vendor/wallet/history" className="text-xs text-[#a3e635] hover:text-[#a3e635]/80 flex items-center gap-1">
                  Voir tout <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentPays.map((p, i) => {
                  const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE["pending"]
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 + i * 0.04 }}
                      className="flex items-center gap-3 py-3 border-b border-[#1e1e2e] last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-[#ef4444]/10 flex items-center justify-center shrink-0">
                        <ArrowDownCircle className="w-4 h-4 text-[#ef4444]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{methodLabel(p.payout_method)}</p>
                        <p className="text-xs text-white/30">{fmtDate(p.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-bold text-sm">−{formatCFA(p.amount)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* ── Withdraw Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !withdrawing && setShowWithdraw(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl">

              {withdrawSuccess ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
                    <CheckCircle className="w-16 h-16 text-[#a3e635] mx-auto mb-4" />
                  </motion.div>
                  <p className="text-white font-black text-xl mb-2">Demande envoyée !</p>
                  <p className="text-white/40 text-sm">Votre retrait sera traité sous 24 à 48 heures ouvrées.</p>
                  <Button onClick={() => setShowWithdraw(false)} className="mt-6 w-full h-11 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold rounded-xl">
                    Fermer
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-white font-bold text-lg">Demander un retrait</h3>
                      <p className="text-xs text-white/30 mt-0.5">Solde disponible : <span className="text-[#a3e635] font-bold">{formatCFA(available)}</span></p>
                    </div>
                    <button onClick={() => setShowWithdraw(false)} className="text-white/40 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {accounts.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertCircle className="w-12 h-12 text-[#eab308] mx-auto mb-3" />
                      <p className="text-white/60 text-sm">Ajoutez d&apos;abord un compte de paiement avant de faire un retrait.</p>
                      <Button onClick={() => { setShowWithdraw(false); setShowAddAccount(true) }}
                        className="mt-4 bg-[#a3e635] text-black font-bold rounded-xl h-10 px-5">
                        Ajouter un compte
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Amount input */}
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block">Montant (min. 1 000 F)</label>
                        <div className="relative">
                          <Input
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Ex: 25 000"
                            className="bg-[#0a0a0f] border-[#1e1e2e] text-white pr-16 h-11 focus:border-[#a3e635]/50 placeholder:text-white/20"
                          />
                          <button onClick={() => setWithdrawAmount(String(available))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-[#a3e635]/10 text-[#a3e635] font-bold px-2 py-1 rounded-md hover:bg-[#a3e635]/20 transition-colors">
                            MAX
                          </button>
                        </div>
                        {!isNaN(withdrawAmountNum) && withdrawAmountNum > available && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Solde insuffisant</p>
                        )}
                      </div>

                      {/* Account selector */}
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block">Compte de paiement</label>
                        <select value={withdrawAccountId} onChange={(e) => setWithdrawAccountId(e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 h-11 text-sm text-white focus:outline-none focus:border-[#a3e635]/50">
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.account_name} — {methodLabel(acc.payout_method)} · {acc.phone_number}</option>
                          ))}
                        </select>
                      </div>

                      {withdrawError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{withdrawError}
                        </p>
                      )}

                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawing || !withdrawAccountId || isNaN(withdrawAmountNum) || withdrawAmountNum <= 0 || withdrawAmountNum > available}
                        className="w-full h-12 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-black rounded-xl disabled:opacity-40"
                      >
                        {withdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Retirer ${!isNaN(withdrawAmountNum) && withdrawAmountNum > 0 ? formatCFA(withdrawAmountNum) : ""}`}
                      </Button>
                      <p className="text-[10px] text-white/20 text-center">Traitement sous 24–48h ouvrées · Sécurisé</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
