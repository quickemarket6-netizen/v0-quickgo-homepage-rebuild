"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight, ChevronLeft,
  RefreshCw, Clock, CheckCircle, XCircle, Truck, Phone, Printer,
  AlertTriangle, Zap, LogOut, User, Boxes, Search, Ticket, MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product: { id: string; name: string; images: string[] } | null
}
interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string | null
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  notes: string | null
  delivery_address: { address?: string; city?: string; phone?: string } | null
  created_at: string
  items: OrderItem[]
  customer: { full_name: string; phone: string; avatar_url: string | null } | null
  driver: { full_name: string; phone: string } | null
}
interface OrdersResponse { orders: Order[]; total: number; summary: Record<string, number> }

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:    { label: "En attente",     color: "#eab308", bg: "bg-[#eab308]/15", icon: Clock      },
  confirmed:  { label: "Confirmée",      color: "#3b82f6", bg: "bg-[#3b82f6]/15", icon: CheckCircle},
  preparing:  { label: "Préparation",    color: "#8b5cf6", bg: "bg-[#8b5cf6]/15", icon: Package    },
  ready:      { label: "Prête",          color: "#06b6d4", bg: "bg-[#06b6d4]/15", icon: CheckCircle},
  picked_up:  { label: "Récupérée",      color: "#06b6d4", bg: "bg-[#06b6d4]/15", icon: Truck      },
  delivering: { label: "En livraison",   color: "#3b82f6", bg: "bg-[#3b82f6]/15", icon: Truck      },
  delivered:  { label: "Livrée",         color: "#a3e635", bg: "bg-[#a3e635]/15", icon: CheckCircle},
  cancelled:  { label: "Annulée",        color: "#ef4444", bg: "bg-[#ef4444]/15", icon: XCircle    },
}
const VENDOR_NEXT: Record<string, string> = { pending: "confirmed", confirmed: "preparing", preparing: "ready" }
const NEXT_LABEL: Record<string, string>  = { confirmed: "Confirmer", preparing: "Préparer", ready: "Prête" }

const FILTERS = [
  { id: "all",        label: "Toutes",       color: "#3b82f6" },
  { id: "pending",    label: "En attente",   color: "#eab308" },
  { id: "confirmed",  label: "Confirmées",   color: "#3b82f6" },
  { id: "preparing",  label: "En prép.",     color: "#8b5cf6" },
  { id: "delivering", label: "En livraison", color: "#06b6d4" },
  { id: "delivered",  label: "Livrées",      color: "#a3e635" },
  { id: "cancelled",  label: "Annulées",     color: "#ef4444" },
]

const SUMMARY_CARDS = [
  { key: "pending",    label: "En attente",   color: "#eab308" },
  { key: "preparing",  label: "En préparation", color: "#8b5cf6" },
  { key: "delivering", label: "En livraison", color: "#3b82f6" },
  { key: "delivered",  label: "Livrées",      color: "#a3e635" },
]

const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders", active: true },
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
  { icon: TrendingUp, label: "Revenus",    href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait",  href: "/vendor/wallet" },
      { label: "Retraits",         href: "/vendor/payouts" },
      { label: "Historique",       href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees"     },
  { icon: BarChart3,  label: "Analyses",   href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions", href: "/vendor/promotions" },
  { icon: Ticket,     label: "Coupons",    href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",     href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages", href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications",href: "/vendor/notifications" },
  { icon: Settings,   label: "Paramètres", href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",       href: "/vendor/help" },
]

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 600, 1)
      setV(Math.round(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return v
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color, onClick }: { label: string; value: number; color: string; onClick: () => void }) {
  const counted = useCountUp(value)
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 150, damping: 18 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 text-left relative overflow-hidden
        hover:border-opacity-60 transition-all duration-300 w-full"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{ background: color }} />
      <p className="text-3xl font-black leading-tight" style={{ color }}>{counted}</p>
      <p className="text-xs text-white/40 mt-1.5">{label}</p>
    </motion.button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorOrdersPage() {
  const [data, setData]           = useState<OrdersResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState("all")
  const [search, setSearch]       = useState("")
  const [page, setPage]           = useState(0)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [vendorName, setVendorName]     = useState("")
  const [vendorInitials, setVendorInitials] = useState("")
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase    = useRef(createClient())
  const videoRef    = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  // ── Video cycling ────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadVendor = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (!user) return
      const { data: v } = await supabase.current.from("vendors").select("name").eq("owner_id", user.id).single()
      if (v) {
        setVendorName((v as { name: string }).name)
        setVendorInitials(initials((v as { name: string }).name))
      }
    }
    void loadVendor()
  }, [])

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (q: string, f: string, p: number, quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(p * PAGE_SIZE) })
      if (f && f !== "all") params.set("status", f)
      if (q) params.set("search", q)
      const res = await fetch(`/api/vendor/orders?${params}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  // debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); fetchOrders(search, filter, 0) }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, filter, fetchOrders])

  useEffect(() => { fetchOrders(search, filter, page) }, [page]) // eslint-disable-line

  // ── Advance status ───────────────────────────────────────────────────────────
  const advanceStatus = async (orderId: string, nextStatus: string) => {
    setAdvancing(orderId)
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) fetchOrders(search, filter, page, true)
    } finally {
      setAdvancing(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.current.auth.signOut()
    window.location.href = "/auth/login"
  }

  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const orders     = data?.orders ?? []
  const summary    = data?.summary ?? {}
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 9, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#3b82f6] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity, delay: 3 }} className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#8b5cf6] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 13, repeat: Infinity, delay: 6 }} className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#a3e635] blur-[120px]" />
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
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
            const isExpanded = expandedSections[item.label]
            const Icon = item.icon
            return (
              <div key={item.label}>
                {item.expandable ? (
                  <button onClick={() => toggleSection(item.label)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-[#1e1e2e]/60 transition-all text-sm">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      item.active
                        ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                  </Link>
                )}
                <AnimatePresence>
                  {item.expandable && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {item.children?.map((child) => (
                        <Link key={child.href} href={child.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-[#1e1e2e]/40 transition-all">
                          <ChevronRight className="w-3 h-3" />{child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        <div className="p-3">
          <motion.div whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-[#a3e635]/20 to-[#3b82f6]/20 border border-[#a3e635]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Développez votre activité</p>
            <p className="text-white/40 text-[10px] mb-3">Boostez vos ventes avec QuickGo</p>
            <button className="w-full py-1.5 rounded-lg bg-[#a3e635] text-[#0a0a0f] text-xs font-bold flex items-center justify-center gap-1.5">
              <Zap className="w-3 h-3" /> Booster
            </button>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Video Header */}
        <div className="relative overflow-hidden bg-[#111118]">
          <video ref={videoRef} muted loop playsInline onEnded={() => setVideoIdx((i) => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/3 w-40 h-20 rounded-full bg-[#3b82f6] blur-3xl opacity-30" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#3b82f6]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Commandes{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#06b6d4]">
                    {loading ? "" : `(${total})`}
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Gérez et suivez toutes vos commandes en temps réel</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button onClick={() => fetchOrders(search, filter, page, true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
              </motion.button>

              <Link href="/vendor/dashboard">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
                      <span className="text-white font-black text-sm">{vendorInitials || "V"}</span>
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
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-[#ef4444] hover:text-[#ef4444] cursor-pointer">
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SUMMARY_CARDS.map((s, i) => (
              <motion.div key={s.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <SummaryCard
                  label={s.label}
                  value={loading ? 0 : (summary[s.key] ?? 0)}
                  color={s.color}
                  onClick={() => { setFilter(s.key); setPage(0) }}
                />
              </motion.div>
            ))}
          </div>

          {/* Search + filter chips */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="N° de commande..."
                className="h-10 pl-9 pr-4 bg-[#16161f]/80 border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-white/30
                  focus:outline-none focus:border-[#3b82f6]/50 w-52 transition-colors backdrop-blur-xl"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const active = filter === f.id
                const count = f.id !== "all" ? (summary[f.id] ?? 0) : total
                return (
                  <button key={f.id} onClick={() => { setFilter(f.id); setPage(0) }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: active ? `${f.color}20` : "transparent",
                      color: active ? f.color : "#ffffff50",
                      border: active ? `1px solid ${f.color}40` : "1px solid transparent",
                    }}>
                    {f.label}
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: active ? `${f.color}30` : "#ffffff15", color: active ? f.color : "#ffffff40" }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Orders */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-[#16161f] animate-pulse"
                  style={{ opacity: 1 - i * 0.2 }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <ShoppingBag className="w-16 h-16 text-white/10" />
              </motion.div>
              <p className="text-white/40 font-semibold">Aucune commande</p>
              <p className="text-white/20 text-sm">
                {filter !== "all" ? "Essayez un autre filtre" : "Vos commandes apparaîtront ici"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {orders.map((order, i) => {
                  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending
                  const StatusIcon = cfg.icon
                  const nextStatus = VENDOR_NEXT[order.status]
                  const isAdvancing = advancing === order.id

                  return (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 150, damping: 22 }}
                      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden
                        hover:border-white/10 transition-colors"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-white font-bold">#{order.order_number}</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ color: cfg.color, background: `${cfg.color}20` }}>
                            <StatusIcon className="w-3 h-3" />{cfg.label}
                          </span>
                          {order.payment_status === "paid" && (
                            <span className="text-xs bg-[#a3e635]/15 text-[#a3e635] px-2 py-0.5 rounded-full">Payé</span>
                          )}
                          {order.delivery_fee > 0 && (
                            <span className="text-xs bg-[#06b6d4]/15 text-[#06b6d4] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Livraison
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-bold">{fmtCFA(order.total)}</p>
                          <p className="text-white/30 text-xs">{fmtDate(order.created_at)}</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1e1e2e]">
                        {/* Items */}
                        <div className="px-5 py-4">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
                            Articles · {order.items.length}
                          </p>
                          <div className="space-y-2">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#111118] border border-[#1e1e2e] overflow-hidden shrink-0 flex items-center justify-center">
                                  {item.product?.images?.[0] ? (
                                    <Image src={item.product.images[0]} alt={item.product?.name ?? ""} width={36} height={36} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-white/20" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white/80 truncate">{item.product?.name ?? "Produit supprimé"}</p>
                                  <p className="text-xs text-white/30">x{item.quantity} · {fmtCFA(item.unit_price)}</p>
                                </div>
                                <p className="text-sm text-white font-semibold shrink-0">{fmtCFA(item.total_price)}</p>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-white/30">+{order.items.length - 3} autre(s)</p>
                            )}
                          </div>
                        </div>

                        {/* Customer + delivery */}
                        <div className="px-5 py-4 space-y-3">
                          {order.customer && (
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Client</p>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6]/30 to-[#06b6d4]/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                  {initials(order.customer.full_name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm text-white/80 truncate">{order.customer.full_name}</p>
                                  <a href={`tel:${order.customer.phone}`}
                                    className="text-xs text-[#3b82f6] flex items-center gap-1 hover:underline">
                                    <Phone className="w-2.5 h-2.5" />{order.customer.phone}
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                          {order.delivery_address?.address && (
                            <p className="text-xs text-white/40 truncate">
                              📍 {order.delivery_address.address}
                              {order.delivery_address.city && `, ${order.delivery_address.city}`}
                            </p>
                          )}
                          {order.driver && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20">
                              <Truck className="w-4 h-4 text-[#06b6d4] shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-white/70 truncate">{order.driver.full_name}</p>
                                <p className="text-[10px] text-[#06b6d4]">Livreur</p>
                              </div>
                              <a href={`tel:${order.driver.phone}`} className="text-[#06b6d4] hover:text-[#06b6d4]/80">
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-xs text-[#eab308]/80 bg-[#eab308]/10 border border-[#eab308]/20 rounded-xl px-3 py-2 truncate">
                              💬 {order.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 px-5 py-3 border-t border-[#1e1e2e] bg-[#111118]/40">
                        {nextStatus && (
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => advanceStatus(order.id, nextStatus)}
                            disabled={isAdvancing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white transition-colors disabled:opacity-60"
                          >
                            {isAdvancing
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <CheckCircle className="w-3.5 h-3.5" />}
                            {NEXT_LABEL[nextStatus] ?? nextStatus}
                          </motion.button>
                        )}
                        {["pending", "confirmed", "preparing"].includes(order.status) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => advanceStatus(order.id, "cancelled")}
                            disabled={isAdvancing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/20 transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Annuler
                          </motion.button>
                        )}
                        <button onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
                          <Printer className="w-3.5 h-3.5" /> Imprimer
                        </button>
                        <Link href={`/vendor/orders/${order.id}`} className="ml-auto">
                          <motion.span whileHover={{ x: 2 }}
                            className="flex items-center gap-1 text-xs text-white/30 hover:text-[#3b82f6] transition-colors cursor-pointer">
                            Détails <ChevronRight className="w-3.5 h-3.5" />
                          </motion.span>
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}
                className="gap-1.5 bg-[#16161f] border-[#1e1e2e] text-white/60 hover:text-white hover:bg-[#1e1e2e]">
                <ChevronLeft className="w-4 h-4" /> Précédent
              </Button>
              <span className="text-sm text-white/40">Page {page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading}
                className="gap-1.5 bg-[#16161f] border-[#1e1e2e] text-white/60 hover:text-white hover:bg-[#1e1e2e]">
                Suivant <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Error state */}
          {!loading && !data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <AlertTriangle className="w-12 h-12 text-[#ef4444]/40" />
              </motion.div>
              <p className="text-white/40 font-semibold">Erreur de chargement</p>
              <button onClick={() => fetchOrders(search, filter, page)}
                className="px-4 py-2 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] text-sm font-semibold hover:bg-[#3b82f6]/30 transition-colors border border-[#3b82f6]/30">
                Réessayer
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
