"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users,
  BarChart3, Tag, Star, Settings, HelpCircle, Bell, ChevronDown, RefreshCw,
  Zap, ChevronRight, LogOut, User, Boxes, Truck, ArrowUpCircle, ArrowDownCircle,
  Percent, Download, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tx {
  id: string
  type: "earning" | "payout" | "commission"
  amount: number
  description: string
  date: string
  status: string
  detail?: string
  reference?: string
}
interface HistoryData {
  transactions: Tx[]
  summary: { totalEarned: number; totalCommission: number; totalWithdrawn: number; pendingPayouts: number }
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
      { label: "Solde & Retrait",  href: "/vendor/wallet",         active: false },
      { label: "Retraits",         href: "/vendor/payouts",        active: false },
      { label: "Historique",       href: "/vendor/wallet/history", active: true  },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Star,       label: "Avis",        href: "/vendor/reviews" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

const VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const FILTERS = [
  { value: "all",         label: "Toutes" },
  { value: "earnings",    label: "Gains" },
  { value: "payouts",     label: "Retraits" },
  { value: "commissions", label: "Commissions" },
] as const
type FilterValue = typeof FILTERS[number]["value"]

function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F`
  if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} F`
  return `${Math.round(n)} F`
}
function initials(s: string) { return s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function useCountUp(target: number, dur = 800) {
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

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  completed:  { label: "Validé",    color: "text-[#22c55e] bg-[#22c55e]/10" },
  processed:  { label: "Traité",    color: "text-[#22c55e] bg-[#22c55e]/10" },
  pending:    { label: "En attente", color: "text-[#eab308] bg-[#eab308]/10" },
  deducted:   { label: "Déduit",    color: "text-[#f97316] bg-[#f97316]/10" },
  failed:     { label: "Échoué",    color: "text-[#ef4444] bg-[#ef4444]/10" },
  cancelled:  { label: "Annulé",    color: "text-white/30 bg-white/5" },
}

function TxIcon({ type }: { type: Tx["type"] }) {
  if (type === "earning")    return <div className="w-10 h-10 rounded-xl bg-[#a3e635]/10 flex items-center justify-center shrink-0"><ArrowUpCircle   className="w-5 h-5 text-[#a3e635]" /></div>
  if (type === "payout")     return <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center shrink-0"><ArrowDownCircle  className="w-5 h-5 text-[#ef4444]" /></div>
  return                            <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center shrink-0"><Percent          className="w-5 h-5 text-[#f97316]" /></div>
}

function SummaryCard({ label, value, color, icon: Icon, delay }: {
  label: string; value: number; color: string; icon: typeof BarChart3; delay: number
}) {
  const counted = useCountUp(value)
  void counted
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-black text-white">{formatCFA(value)}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorWalletHistoryPage() {
  const [data, setData]         = useState<HistoryData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<FilterValue>("all")
  const [vendorName, setVendorName]     = useState("")
  const [vendorStatus, setVendorStatus] = useState("active")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: true })
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const supabase  = useRef(createClient())

  const fetchData = useCallback(async (f: FilterValue) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/wallet/history?filter=${f}`)
      if (res.ok) setData(await res.json() as HistoryData)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void fetchData("all")
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

  const handleFilter = (f: FilterValue) => { setFilter(f); void fetchData(f) }
  const toggleSection = (label: string) => setExpanded((s) => ({ ...s, [label]: !s[label] }))

  const txs      = data?.transactions ?? []
  const summary  = data?.summary

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Orbs ─────────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.22, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-[#8b5cf6] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-[#3b82f6] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.07, 0.16, 0.07] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#a3e635] blur-[120px]" />
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
          <div className="bg-gradient-to-br from-[#8b5cf6]/15 to-[#3b82f6]/10 border border-[#8b5cf6]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-white text-sm font-semibold">Booster</span>
            </div>
            <p className="text-white/40 text-xs mb-3">Multipliez vos revenus avec nos offres.</p>
            <Button size="sm" className="w-full h-8 bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-bold text-xs rounded-lg">Activer</Button>
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
              <h1 className="text-white font-bold">Historique des transactions</h1>
              <p className="text-xs text-white/30">Gains, retraits et commissions</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white flex items-center gap-1.5 text-xs border border-[#1e1e2e]">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
              </button>
              <Button variant="ghost" size="icon" onClick={() => void fetchData(filter)} className="h-9 w-9 rounded-xl">
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
                    <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer"><User className="h-4 w-4" /> Mon profil</Link>
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
              <div className="inline-flex items-center gap-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full px-3 py-1 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-[#8b5cf6]" />
                <span className="text-[#8b5cf6] text-xs font-medium uppercase tracking-widest">Historique</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">
                Transactions<br /><span className="text-[#8b5cf6]">&amp; Mouvements</span>
              </h2>
              <p className="text-white/40 text-sm max-w-md">
                Retrouvez l&apos;ensemble de vos gains, retraits et commissions en un seul endroit.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Summary cards */}
          {loading && !data ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-[#16161f] animate-pulse" />)}
            </div>
          ) : summary && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <SummaryCard label="Total des gains"   value={summary.totalEarned}     color="#a3e635" icon={ArrowUpCircle}   delay={0}    />
              <SummaryCard label="Commissions"        value={summary.totalCommission} color="#f97316" icon={Percent}         delay={0.06} />
              <SummaryCard label="Total retiré"       value={summary.totalWithdrawn}  color="#ef4444" icon={ArrowDownCircle} delay={0.12} />
              <SummaryCard label="Retraits en attente" value={summary.pendingPayouts} color="#eab308" icon={BarChart3}        delay={0.18} />
            </div>
          )}

          {/* Filter tabs + transaction list */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden">

            {/* Filter bar */}
            <div className="flex items-center gap-1 p-3 border-b border-[#1e1e2e] overflow-x-auto">
              {FILTERS.map(({ value, label }) => (
                <button key={value} onClick={() => handleFilter(value)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    filter === value ? "bg-[#8b5cf6] text-white font-bold" : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >{label}</button>
              ))}
              <span className="ml-auto text-xs text-white/30 shrink-0 pr-1">{txs.length} transactions</span>
            </div>

            {/* Transaction list */}
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : txs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-12 h-12 text-white/10 mb-4" />
                <p className="text-white/30 text-sm">Aucune transaction pour ce filtre</p>
                <p className="text-white/20 text-xs mt-1">Les transactions apparaîtront ici dès que vous commencerez à vendre.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                {txs.map((tx, i) => {
                  const badge = STATUS_CFG[tx.status] ?? STATUS_CFG["pending"]
                  const isPos = tx.type === "earning"
                  const isNeg = tx.type === "payout"
                  return (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.025 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <TxIcon type={tx.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                        {tx.detail && <p className="text-xs text-white/30 truncate mt-0.5">{tx.detail}</p>}
                        {tx.reference && <p className="text-[10px] text-white/20 mt-0.5">Réf: {tx.reference}</p>}
                        <p className="text-[11px] text-white/25 mt-0.5">{fmtDate(tx.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-base ${isPos ? "text-[#a3e635]" : isNeg ? "text-[#ef4444]" : "text-[#f97316]"}`}>
                          {isPos ? "+" : "−"}{formatCFA(tx.amount)}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Back link */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Link href="/vendor/wallet" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
              ← Retour au portefeuille
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
