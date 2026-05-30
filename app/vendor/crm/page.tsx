"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  RefreshCw, Search, Phone, Award, Crown, Zap, LogOut, User, Truck,
  Boxes, ShoppingCart, TrendingDown, UserPlus, Activity,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Customer {
  id: string
  full_name: string
  phone: string
  avatar_url: string | null
  joined_at: string
  total_orders: number
  total_spent: number
  last_order_at: string
  avg_cart: number
  segment: "vip" | "regular" | "new"
}
interface Kpi {
  total: number
  active: number
  new_week: number
  avg_cart: number
  avg_orders: number
}
interface CrmData { customers: Customer[]; kpi: Kpi }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

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
  { icon: TrendingUp, label: "Revenus",    href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait",  href: "/vendor/wallet" },
      { label: "Historique",       href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm", active: true },
  { icon: BarChart3,  label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Star,       label: "Avis",        href: "/vendor/reviews" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

type SegmentFilter = "all" | "vip" | "regular" | "new"

const SEGMENT_CFG = {
  vip:     { label: "VIP",       color: "#eab308", icon: Crown,    desc: "10+ commandes" },
  regular: { label: "Réguliers", color: "#3b82f6", icon: Activity, desc: "3–9 commandes" },
  new:     { label: "Nouveaux",  color: "#a3e635", icon: UserPlus, desc: "1–2 commandes" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F`
  if (n >= 1_000)     return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} F`
  return `${Math.round(n)} F`
}
function relTime(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1)   return "À l'instant"
  if (mins < 60)  return `Il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24)     return `Il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7)   return `Il y a ${days}j`
  if (days < 30)  return `Il y a ${Math.floor(days / 7)} sem.`
  return `Il y a ${Math.floor(days / 30)} mois`
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 700) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setV(Math.round(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return v
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon, delay }: {
  label: string; value: number; sub?: string; color: string; icon: typeof Users; delay: number
}) {
  const counted = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
        style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">
          {sub ? sub : counted}
        </p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, index }: { customer: Customer; index: number }) {
  const seg = SEGMENT_CFG[customer.segment]
  const SegIcon = seg.icon

  const avatarGradients: Record<string, string> = {
    vip:     "from-[#eab308] to-[#f97316]",
    regular: "from-[#3b82f6] to-[#06b6d4]",
    new:     "from-[#a3e635] to-[#22c55e]",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 150, damping: 22 }}
      whileHover={{ y: -2, borderColor: `${seg.color}40` }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
    >
      {/* rank glow */}
      {index < 3 && (
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-10"
          style={{ background: seg.color }} />
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradients[customer.segment]} flex items-center justify-center`}>
            <span className="text-white font-black text-sm">{initials(customer.full_name)}</span>
          </div>
          {index < 3 && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0a0f]"
              style={{ background: seg.color }}>
              <span className="text-[#0a0a0f] text-[9px] font-black">#{index + 1}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-white font-semibold text-sm truncate">{customer.full_name}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: `${seg.color}20`, color: seg.color }}>
              <SegIcon className="w-2.5 h-2.5" />{seg.label}
            </span>
          </div>
          {customer.phone && (
            <a href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-[#3b82f6] transition-colors mb-3">
              <Phone className="w-3 h-3" />{customer.phone}
            </a>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#111118] rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-sm">{customer.total_orders}</p>
              <p className="text-white/30 text-[10px]">commandes</p>
            </div>
            <div className="bg-[#111118] rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-sm">{fmtCFA(customer.total_spent)}</p>
              <p className="text-white/30 text-[10px]">dépensé</p>
            </div>
            <div className="bg-[#111118] rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-sm">{fmtCFA(customer.avg_cart)}</p>
              <p className="text-white/30 text-[10px]">panier moy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e1e2e]">
        <p className="text-white/30 text-xs">Dernière commande · {relTime(customer.last_order_at)}</p>
        <div className="flex items-center gap-2">
          {/* Retention dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: seg.color }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: seg.color }} />
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorCRMPage() {
  const [data, setData]       = useState<CrmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]   = useState("")
  const [segment, setSegment] = useState<SegmentFilter>("all")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [vendorName, setVendorName]     = useState("")
  const [vendorInitials, setVendorInitials] = useState("")
  const supabase  = useRef(createClient())
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

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

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/vendor/customers")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSignOut = async () => {
    await supabase.current.auth.signOut()
    window.location.href = "/auth/login"
  }

  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const customers = data?.customers ?? []
  const kpi = data?.kpi

  const filtered = customers.filter((c) => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const matchSegment = segment === "all" || c.segment === segment
    return matchSearch && matchSegment
  })

  const segmentCounts = {
    vip:     customers.filter((c) => c.segment === "vip").length,
    regular: customers.filter((c) => c.segment === "regular").length,
    new:     customers.filter((c) => c.segment === "new").length,
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#8b5cf6] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity, delay: 3 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#eab308] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
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
                        ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />}
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
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-0 right-1/3 w-40 h-20 rounded-full bg-[#8b5cf6] blur-3xl opacity-30" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#8b5cf6]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  CRM{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]">
                    Clients
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Gérez et fidélisez vos clients</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button onClick={() => fetchData(true)}
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
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
                    <Link href="/profile" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
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
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-[#16161f] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Total clients"    value={kpi?.total ?? 0}      color="#8b5cf6" icon={Users}       delay={0}    />
              <KpiCard label="Actifs (30j)"     value={kpi?.active ?? 0}     color="#a3e635" icon={Activity}    delay={0.06} />
              <KpiCard label="Nouveaux (7j)"    value={kpi?.new_week ?? 0}   color="#3b82f6" icon={UserPlus}    delay={0.12} />
              <KpiCard label="Panier moyen"     value={kpi?.avg_cart ?? 0}   sub={fmtCFA(kpi?.avg_cart ?? 0)} color="#f97316" icon={ShoppingCart} delay={0.18} />
              <KpiCard label="Cmd. moy./client" value={kpi?.avg_orders ?? 0} color="#eab308" icon={Award}       delay={0.24} />
            </div>
          )}

          {/* Segment summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4">
            {(["vip", "regular", "new"] as const).map((seg) => {
              const cfg = SEGMENT_CFG[seg]
              const Icon = cfg.icon
              const count = segmentCounts[seg]
              return (
                <motion.button key={seg} onClick={() => setSegment(segment === seg ? "all" : seg)}
                  whileHover={{ y: -2 }}
                  className="bg-[#16161f]/80 backdrop-blur-xl border rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden"
                  style={{
                    borderColor: segment === seg ? `${cfg.color}40` : "#1e1e2e",
                    background: segment === seg ? `${cfg.color}08` : undefined,
                  }}>
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15"
                    style={{ background: cfg.color }} />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${cfg.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{cfg.label}</p>
                      <p className="text-white/30 text-[10px]">{cfg.desc}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black" style={{ color: cfg.color }}>{loading ? "—" : count}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {loading || !kpi?.total ? "" : `${Math.round((count / kpi.total) * 100)}% du total`}
                  </p>
                </motion.button>
              )
            })}
          </motion.div>

          {/* Search + filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom ou téléphone..."
                className="h-10 pl-9 pr-4 bg-[#16161f]/80 border border-[#1e1e2e] rounded-xl text-sm text-white
                  placeholder-white/30 focus:outline-none focus:border-[#8b5cf6]/50 w-56 transition-colors backdrop-blur-xl" />
            </div>
            {(["all", "vip", "regular", "new"] as const).map((f) => {
              const labels = { all: "Tous", vip: "VIP", regular: "Réguliers", new: "Nouveaux" }
              const colors = { all: "#3b82f6", vip: "#eab308", regular: "#3b82f6", new: "#a3e635" }
              const active = segment === f
              return (
                <button key={f} onClick={() => setSegment(f)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? `${colors[f]}20` : "transparent",
                    color: active ? colors[f] : "#ffffff50",
                    border: active ? `1px solid ${colors[f]}40` : "1px solid transparent",
                  }}>
                  {labels[f]}
                </button>
              )
            })}
            <p className="text-white/30 text-xs ml-auto">
              {loading ? "" : `${filtered.length} client${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Customers grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-[#16161f] animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Users className="w-16 h-16 text-white/10" />
              </motion.div>
              <p className="text-white/40 font-semibold">Aucun client trouvé</p>
              <p className="text-white/20 text-sm">
                {search ? "Essayez un autre nom ou numéro" : "Vos clients apparaîtront ici dès la première commande"}
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <CustomerCard key={c.id} customer={c} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Top 3 podium (only when all shown) */}
          {!loading && segment === "all" && search === "" && customers.slice(0, 3).length === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-[#eab308]" />
                <p className="text-white font-bold">Top 3 meilleurs clients</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {customers.slice(0, 3).map((c, i) => {
                  const podiumColors = ["#eab308", "#94a3b8", "#f97316"]
                  const heights = ["h-24", "h-16", "h-20"]
                  return (
                    <div key={c.id} className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center font-black text-white text-sm
                        ${i === 0 ? "from-[#eab308] to-[#f97316]" : i === 1 ? "from-[#94a3b8] to-[#64748b]" : "from-[#f97316] to-[#ef4444]"}`}>
                        {initials(c.full_name)}
                      </div>
                      <p className="text-white text-xs font-semibold text-center truncate w-full">{c.full_name.split(" ")[0]}</p>
                      <p className="text-[10px] text-white/40">{fmtCFA(c.total_spent)}</p>
                      <div className={`w-full ${heights[i]} rounded-xl flex items-end justify-center pb-2`}
                        style={{ background: `${podiumColors[i]}20`, borderBottom: `3px solid ${podiumColors[i]}` }}>
                        <span className="text-sm font-black" style={{ color: podiumColors[i] }}>#{i + 1}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Retention tip */}
          {!loading && (kpi?.active ?? 0) < (kpi?.total ?? 0) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-2xl px-5 py-4 flex items-center gap-3">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <TrendingDown className="w-5 h-5 text-[#8b5cf6]" />
              </motion.div>
              <div>
                <p className="text-white/80 text-sm">
                  <span className="text-[#8b5cf6] font-bold">{(kpi?.total ?? 0) - (kpi?.active ?? 0)} client{((kpi?.total ?? 0) - (kpi?.active ?? 0)) > 1 ? "s" : ""}</span>
                  {" "}inactif{((kpi?.total ?? 0) - (kpi?.active ?? 0)) > 1 ? "s" : ""} depuis 30 jours —
                  pensez à leur envoyer une promotion pour les réactiver.
                </p>
              </div>
              <Link href="/vendor/promotions" className="ml-auto">
                <button className="px-3 py-1.5 rounded-xl bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs font-semibold hover:bg-[#8b5cf6]/30 transition-colors whitespace-nowrap border border-[#8b5cf6]/30">
                  Créer une promo
                </button>
              </Link>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
