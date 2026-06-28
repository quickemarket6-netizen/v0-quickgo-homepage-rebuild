"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  Truck, CheckCircle, Clock, AlertTriangle, Phone, MapPin,
  RefreshCw, Zap, LogOut, User, Boxes, Activity, Ticket, MessageSquare,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string
  order_number: string
  status: string
  total: number | null
  total_amount: number | null
  created_at: string
  delivered_at: string | null
  estimated_delivery_time: string | null
  delivery_address: { address?: string; city?: string } | null
  customer: { full_name: string; phone: string; avatar_url: string | null } | null
  driver: { full_name: string; phone: string; avatar_url: string | null } | null
  items: { product_name: string; quantity: number }[]
}
interface Kpi { active: number; delivered_today: number; delivered_month: number; late: number }
interface DeliveriesData { orders: Order[]; kpi: Kpi }

type Filter = "all" | "active" | "delivered" | "late"

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  { icon: Boxes,           label: "Stocks",          href: "/vendor/stocks" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits", href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: Truck,      label: "Livraisons",   href: "/vendor/deliveries", active: true },
  { icon: TrendingUp, label: "Revenus",      href: "/vendor/analytics" },
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
  { icon: BarChart3,  label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Ticket,     label: "Coupons",     href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",     href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages", href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications",href: "/vendor/notifications" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

const STATUS_CFG: Record<string, { label: string; color: string; icon: typeof Truck; pulse: boolean }> = {
  ready:      { label: "Prête",        color: "#06b6d4", icon: CheckCircle, pulse: false },
  picked_up:  { label: "Récupérée",    color: "#8b5cf6", icon: Truck,       pulse: true  },
  delivering: { label: "En livraison", color: "#3b82f6", icon: Truck,       pulse: true  },
  delivered:  { label: "Livrée",       color: "#a3e635", icon: CheckCircle, pulse: false },
}

const FILTERS: { id: Filter; label: string; color: string }[] = [
  { id: "all",       label: "Toutes",      color: "#3b82f6" },
  { id: "active",    label: "En cours",    color: "#8b5cf6" },
  { id: "delivered", label: "Livrées",     color: "#a3e635" },
  { id: "late",      label: "En retard",   color: "#ef4444" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}
function etaLabel(eta: string | null): { text: string; late: boolean } {
  if (!eta) return { text: "—", late: false }
  const diff = new Date(eta).getTime() - Date.now()
  if (diff < 0) return { text: `Retard ${Math.abs(Math.round(diff / 60000))} min`, late: true }
  const mins = Math.round(diff / 60000)
  if (mins < 60) return { text: `~${mins} min`, late: false }
  return { text: `~${Math.floor(mins / 60)}h${mins % 60 > 0 ? (mins % 60) + "m" : ""}`, late: false }
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}
function orderTotal(o: Order) { return o.total_amount ?? o.total ?? 0 }

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

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon, delay }: {
  label: string; value: number; color: string; icon: typeof Truck; delay: number
}) {
  const counted = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">{counted}</p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Delivery Card ────────────────────────────────────────────────────────────
function DeliveryCard({ order, index }: { order: Order; index: number }) {
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.delivering
  const StatusIcon = cfg.icon
  const eta = etaLabel(order.estimated_delivery_time)
  const total = orderTotal(order)
  const itemsSummary = order.items.slice(0, 2).map((i) => `${i.product_name} x${i.quantity}`).join(" · ")
    + (order.items.length > 2 ? ` +${order.items.length - 2}` : "")

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 150, damping: 22 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white font-bold">#{order.order_number}</span>

          {/* Status badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: `${cfg.color}20` }}>
            {cfg.pulse ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.color }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: cfg.color }} />
              </span>
            ) : (
              <StatusIcon className="w-3 h-3" />
            )}
            {cfg.label}
          </span>

          {/* ETA */}
          {order.status !== "delivered" && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              eta.late ? "bg-[#ef4444]/15 text-[#ef4444]" : "bg-white/5 text-white/50"
            }`}>
              {eta.late ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : <Clock className="w-3 h-3 inline mr-1" />}
              {eta.text}
            </span>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-white font-bold">{fmtCFA(total)}</p>
          <p className="text-white/30 text-xs">
            {order.status === "delivered" && order.delivered_at
              ? `Livré à ${fmtTime(order.delivered_at)}`
              : fmtDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1e1e2e]">

        {/* Articles */}
        <div className="px-5 py-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Articles</p>
          <p className="text-sm text-white/70 leading-relaxed">{itemsSummary || "—"}</p>
        </div>

        {/* Client */}
        <div className="px-5 py-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Client</p>
          {order.customer ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3b82f6]/30 to-[#06b6d4]/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
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
          ) : <p className="text-white/30 text-sm">—</p>}

          {order.delivery_address?.address && (
            <p className="text-xs text-white/40 mt-2 flex items-start gap-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-white/30" />
              <span className="truncate">{order.delivery_address.address}{order.delivery_address.city ? `, ${order.delivery_address.city}` : ""}</span>
            </p>
          )}
        </div>

        {/* Livreur */}
        <div className="px-5 py-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Livreur</p>
          {order.driver ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8b5cf6]/30 to-[#06b6d4]/30 flex items-center justify-center text-white font-bold text-xs shrink-0 relative">
                {initials(order.driver.full_name)}
                {/* Live dot for active deliveries */}
                {cfg.pulse && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3b82f6] border border-[#0a0a0f]" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/80 truncate">{order.driver.full_name}</p>
                <a href={`tel:${order.driver.phone}`}
                  className="text-xs text-[#8b5cf6] flex items-center gap-1 hover:underline">
                  <Phone className="w-2.5 h-2.5" />{order.driver.phone}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/30">
              <Truck className="w-4 h-4" />
              <p className="text-sm">Pas encore assigné</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer — progress bar */}
      {order.status !== "delivered" && (
        <div className="px-5 py-3 border-t border-[#1e1e2e]">
          <div className="flex items-center gap-3">
            {["ready", "picked_up", "delivering", "delivered"].map((s, i) => {
              const steps = ["ready", "picked_up", "delivering", "delivered"]
              const currentIdx = steps.indexOf(order.status)
              const done = i <= currentIdx
              const colors: Record<string, string> = {
                ready: "#06b6d4", picked_up: "#8b5cf6", delivering: "#3b82f6", delivered: "#a3e635"
              }
              return (
                <div key={s} className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full transition-all"
                    style={{ background: done ? colors[s] : "#1e1e2e" }} />
                  {i < 3 && (
                    <div className="flex-1 h-0.5 rounded-full transition-all"
                      style={{ background: done && i < currentIdx ? colors[s] : "#1e1e2e" }} />
                  )}
                </div>
              )
            })}
            <p className="text-white/30 text-xs shrink-0">
              {["Prête", "Récupérée", "En livraison", "Livrée"][["ready", "picked_up", "delivering", "delivered"].indexOf(order.status)] ?? ""}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorDeliveriesPage() {
  const [data, setData]       = useState<DeliveriesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]   = useState<Filter>("all")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [vendorName, setVendorName]     = useState("")
  const [vendorInitials, setVendorInitials] = useState("")
  const supabase  = useRef(createClient())
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Video ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (!user) return
      const { data: v } = await supabase.current.from("vendors").select("name").eq("owner_id", user.id).single()
      if (v) { setVendorName((v as { name: string }).name); setVendorInitials(initials((v as { name: string }).name)) }
    }
    void load()
  }, [])

  // ── Fetch (with auto-refresh every 30s) ────────────────────────────────────
  const fetchData = useCallback(async (f: Filter, quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch(`/api/vendor/deliveries?filter=${f}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData(filter)
    intervalRef.current = setInterval(() => fetchData(filter, true), 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [filter, fetchData])

  const handleSignOut = async () => {
    await supabase.current.auth.signOut()
    window.location.href = "/auth/login"
  }
  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const orders = data?.orders ?? []
  const kpi    = data?.kpi
  const hasActive = (kpi?.active ?? 0) > 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#3b82f6] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity, delay: 3 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#8b5cf6] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 13, repeat: Infinity, delay: 6 }}
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#a3e635] blur-[120px]" />
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
                <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#3b82f6]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Suivi des{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">
                    Livraisons
                  </span>
                </h1>
                {/* Live badge */}
                {hasActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]" />
                    </span>
                    <span className="text-[#3b82f6] text-xs font-bold">LIVE</span>
                  </motion.div>
                )}
              </div>
              <p className="text-white/40 text-sm">Actualisation auto toutes les 30 secondes</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button onClick={() => fetchData(filter, true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
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

          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-[#16161f] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="En cours"          value={kpi?.active ?? 0}          color="#3b82f6" icon={Activity}    delay={0}    />
              <KpiCard label="Livrées aujourd'hui" value={kpi?.delivered_today ?? 0} color="#a3e635" icon={CheckCircle} delay={0.07} />
              <KpiCard label="Livrées ce mois"   value={kpi?.delivered_month ?? 0} color="#8b5cf6" icon={Truck}       delay={0.14} />
              <KpiCard label="En retard"          value={kpi?.late ?? 0}            color="#ef4444" icon={AlertTriangle} delay={0.21} />
            </div>
          )}

          {/* Late alert */}
          <AnimatePresence>
            {!loading && (kpi?.late ?? 0) > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-2xl px-5 py-4 flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                </motion.div>
                <p className="text-sm text-white/80">
                  <span className="text-[#ef4444] font-bold">{kpi?.late} livraison{(kpi?.late ?? 0) > 1 ? "s" : ""} en retard</span>
                  {" "}— contactez le livreur ou le support.
                </p>
                <button onClick={() => setFilter("late")}
                  className="ml-auto px-3 py-1.5 rounded-xl bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/30 transition-colors border border-[#ef4444]/30 whitespace-nowrap">
                  Voir les retards
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter chips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id
              const count = f.id === "all" ? orders.length
                : f.id === "active"    ? (kpi?.active ?? 0)
                : f.id === "delivered" ? (kpi?.delivered_month ?? 0)
                : (kpi?.late ?? 0)
              return (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  style={{
                    background: active ? `${f.color}20` : "transparent",
                    color: active ? f.color : "#ffffff50",
                    border: active ? `1px solid ${f.color}40` : "1px solid transparent",
                  }}>
                  {f.label}
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: active ? `${f.color}30` : "#ffffff10", color: active ? f.color : "#ffffff40" }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>

          {/* Orders */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-[#16161f] animate-pulse" style={{ opacity: 1 - i * 0.25 }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4">
              <motion.div animate={{ x: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Truck className="w-16 h-16 text-white/10" />
              </motion.div>
              <p className="text-white/40 font-semibold">Aucune livraison</p>
              <p className="text-white/20 text-sm">
                {filter !== "all" ? "Essayez un autre filtre" : "Les livraisons apparaîtront ici dès qu'une commande part en livraison"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {orders.map((order, i) => (
                  <DeliveryCard key={order.id} order={order} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
