"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Edit3, Check, X,
  Zap, LogOut, User, Boxes, TrendingDown, Archive, Truck, Ticket, MessageSquare,
} from "lucide-react"
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { name: string; slug: string }
interface Product {
  id: string
  name: string
  price: number
  stock_quantity: number
  is_available: boolean
  images: string[] | null
  category: Category | null
}
interface Kpi {
  total: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  total_units: number
}
interface CatStat { name: string; total: number; low: number; out: number }
interface StocksData { products: Product[]; kpi: Kpi; by_category: CatStat[] }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits", href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: Boxes,      label: "Stocks",      href: "/vendor/stocks", active: true },
  { icon: Truck,      label: "Livraisons",  href: "/vendor/deliveries" },
  { icon: TrendingUp, label: "Revenus",     href: "/vendor/analytics" },
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

type StatusFilter = "all" | "in_stock" | "low" | "out"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stockStatus(qty: number): { label: string; color: string; bg: string; icon: typeof CheckCircle } {
  if (qty === 0)  return { label: "Rupture",      color: "#ef4444", bg: "bg-[#ef4444]/15", icon: XCircle }
  if (qty <= 5)   return { label: "Stock faible", color: "#f97316", bg: "bg-[#f97316]/15", icon: AlertTriangle }
  return           { label: "En stock",    color: "#a3e635", bg: "bg-[#a3e635]/15", icon: CheckCircle }
}

function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setValue(Math.round(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon, delay }: {
  label: string; value: number; color: string; icon: typeof Boxes; delay: number
}) {
  const counted = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3, boxShadow: `0 0 30px ${color}20` }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        hover:border-opacity-60 transition-all duration-300 relative overflow-hidden"
      style={{ "--hover-color": color } as React.CSSProperties}
    >
      {/* subtle glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
        style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">{counted}</p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/60 mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Inline stock editor ──────────────────────────────────────────────────────
function StockEditor({ product, onSaved }: { product: Product; onSaved: (id: string, qty: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(product.stock_quantity.toString())
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => { setVal(product.stock_quantity.toString()); setEditing(true); setTimeout(() => inputRef.current?.select(), 50) }
  const cancel = () => setEditing(false)

  const save = async () => {
    const qty = parseInt(val)
    if (isNaN(qty) || qty < 0) return
    setSaving(true)
    const res = await fetch("/api/vendor/stocks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, stock_quantity: qty }),
    })
    setSaving(false)
    if (res.ok) { onSaved(product.id, qty); setEditing(false) }
  }

  if (!editing) {
    return (
      <button onClick={open}
        className="flex items-center gap-1.5 group/edit text-white font-bold text-sm hover:text-[#a3e635] transition-colors">
        {product.stock_quantity}
        <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover/edit:opacity-100 transition-opacity text-white/40" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel() }}
        className="w-20 h-7 text-sm text-center bg-[#0a0a0f] border-[#a3e635]/50 focus:border-[#a3e635]"
        type="number" min="0"
      />
      <button onClick={save} disabled={saving}
        className="w-7 h-7 rounded-lg bg-[#a3e635]/20 hover:bg-[#a3e635]/30 flex items-center justify-center transition-colors">
        <Check className="w-3.5 h-3.5 text-[#a3e635]" />
      </button>
      <button onClick={cancel}
        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
        <X className="w-3.5 h-3.5 text-white/40" />
      </button>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function VendorStocksPage() {
  const [data, setData] = useState<StocksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [vendorName, setVendorName] = useState("")
  const [vendorInitials, setVendorInitials] = useState("")
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
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

  // ── Auth + vendor name ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadVendor = async () => {
      const { data: { user: u } } = await supabase.current.auth.getUser()
      if (!u) return
      const { data: v } = await supabase.current.from("vendors").select("name").eq("user_id", u.id).single()
      if (v) { setVendorName((v as { name: string }).name); setVendorInitials(initials((v as { name: string }).name)) }
    }
    void loadVendor()
  }, [])

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/vendor/stocks")
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

  const handleSaved = (id: string, qty: number) => {
    setData((prev) => {
      if (!prev) return prev
      const products = prev.products.map((p) => p.id === id ? { ...p, stock_quantity: qty, is_available: qty > 0 } : p)
      const kpi: Kpi = {
        total: products.length,
        in_stock: products.filter((p) => p.stock_quantity > 5).length,
        low_stock: products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
        out_of_stock: products.filter((p) => p.stock_quantity === 0).length,
        total_units: products.reduce((s, p) => s + p.stock_quantity, 0),
      }
      const catMap = new Map<string, CatStat>()
      for (const p of products) {
        const cat = p.category?.name ?? "Autre"
        const cur = catMap.get(cat) ?? { name: cat, total: 0, low: 0, out: 0 }
        cur.total++
        if (p.stock_quantity === 0) cur.out++
        else if (p.stock_quantity <= 5) cur.low++
        catMap.set(cat, cur)
      }
      return { products, kpi, by_category: Array.from(catMap.values()) }
    })
  }

  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const filtered = (data?.products ?? []).filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === "all" ? true :
      statusFilter === "in_stock" ? p.stock_quantity > 5 :
      statusFilter === "low" ? (p.stock_quantity > 0 && p.stock_quantity <= 5) :
      p.stock_quantity === 0
    return matchSearch && matchStatus
  })

  const kpi = data?.kpi
  const byCategory = (data?.by_category ?? []).sort((a, b) => b.total - a.total)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Background orbs ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#f97316] blur-[130px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.15", "--orb-o-max": "0.35", "--orb-dur": "9s" } as React.CSSProperties}
          />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#a3e635] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.15", "--orb-o-max": "0.3", "--orb-dur": "11s", "--orb-delay": "3s" } as React.CSSProperties}
          />
        <div
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#ef4444] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.15", "--orb-o-max": "0.3", "--orb-dur": "13s", "--orb-delay": "6s" } as React.CSSProperties}
          />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
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
                        ? "bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                    )}
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
                          <ChevronRight className="w-3 h-3" />
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Boost banner */}
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

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* ── Video Header ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-[#111118]">
          {/* video */}
          <video
            ref={videoRef}
            muted loop playsInline
            onEnded={() => setVideoIdx((i) => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          {/* gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />

          {/* Glow orbs in header */}
          <div
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#f97316] blur-3xl opacity-30 animate-orb"
            style={{ "--orb-s": "1.3", "--orb-o-min": "0.3", "--orb-o-max": "0.6", "--orb-dur": "6s" } as React.CSSProperties}
            />
          <div
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#a3e635] blur-3xl opacity-20 animate-orb"
            style={{ "--orb-s": "1.3", "--orb-o-min": "0.2", "--orb-o-max": "0.5", "--orb-dur": "8s", "--orb-delay": "2s" } as React.CSSProperties}
            />

          {/* Header content */}
          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#f97316]/20 border border-[#f97316]/30 flex items-center justify-center"
                >
                  <Boxes className="w-5 h-5 text-[#f97316]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Gestion des{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f97316] to-[#eab308]">
                    Stocks
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Suivez et mettez à jour vos niveaux de stock en temps réel</p>
            </div>

            {/* Right: refresh + avatar */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => fetchData(true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
              </motion.button>

              <Link href="/vendor/dashboard">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#eab308] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
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

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Total produits"   value={kpi?.total ?? 0}         color="#3b82f6" icon={Package}      delay={0} />
              <KpiCard label="En stock"         value={kpi?.in_stock ?? 0}      color="#a3e635" icon={CheckCircle}  delay={0.06} />
              <KpiCard label="Stock faible"     value={kpi?.low_stock ?? 0}     color="#f97316" icon={AlertTriangle}delay={0.12} />
              <KpiCard label="En rupture"       value={kpi?.out_of_stock ?? 0}  color="#ef4444" icon={XCircle}      delay={0.18} />
              <KpiCard label="Unités totales"   value={kpi?.total_units ?? 0}   color="#8b5cf6" icon={Archive}      delay={0.24} />
            </div>
          )}

          {/* Alerts banner */}
          <AnimatePresence>
            {!loading && (kpi?.out_of_stock ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-2xl px-5 py-4 flex items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                </motion.div>
                <p className="text-sm text-white/80">
                  <span className="text-[#ef4444] font-bold">{kpi?.out_of_stock} produit{(kpi?.out_of_stock ?? 0) > 1 ? "s" : ""}</span>
                  {" "}en rupture de stock — mettez à jour vos quantités pour éviter les commandes manquées.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chart + Low stock warning */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Bar chart by category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5"
            >
              <p className="text-white font-bold mb-1">Stock par catégorie</p>
              <p className="text-white/40 text-xs mb-4">Répartition des produits par statut</p>
              {loading ? (
                <div className="h-48 rounded-xl bg-[#111118] animate-pulse" />
              ) : byCategory.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-white/30 text-sm">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byCategory} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="#3b82f6">
                      {byCategory.map((_, i) => <Cell key={i} fill="#3b82f6" />)}
                    </Bar>
                    <Bar dataKey="low"   name="Faible" radius={[4, 4, 0, 0]} fill="#f97316" />
                    <Bar dataKey="out"   name="Rupture" radius={[4, 4, 0, 0]} fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Low stock quick list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-bold">Alertes critiques</p>
                <span className="text-[10px] bg-[#f97316]/15 text-[#f97316] px-2 py-0.5 rounded-full font-semibold">
                  {(data?.products ?? []).filter(p => p.stock_quantity <= 5).length} produits
                </span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-[#111118] animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-52">
                  {(data?.products ?? []).filter(p => p.stock_quantity <= 5).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <CheckCircle className="w-10 h-10 text-[#a3e635]/40" />
                      </motion.div>
                      <p className="text-white/30 text-sm">Tous les stocks sont bons !</p>
                    </div>
                  ) : (
                    (data?.products ?? []).filter(p => p.stock_quantity <= 5).map((p, i) => {
                      const st = stockStatus(p.stock_quantity)
                      const StIcon = st.icon
                      return (
                        <motion.div key={p.id}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#111118] border border-[#1e1e2e]"
                        >
                          <StIcon className="w-4 h-4 shrink-0" style={{ color: st.color }} />
                          <p className="flex-1 text-xs text-white/80 truncate">{p.name}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.bg}`} style={{ color: st.color }}>
                            {p.stock_quantity === 0 ? "0" : `${p.stock_quantity} u.`}
                          </span>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Product table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden"
          >
            {/* Table header + filters */}
            <div className="p-5 border-b border-[#1e1e2e] flex flex-wrap items-center gap-3">
              <div>
                <p className="text-white font-bold">Tous les produits</p>
                <p className="text-white/40 text-xs">{filtered.length} produit{filtered.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-2 justify-end">
                {/* Search */}
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="h-9 pl-3 pr-3 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a3e635]/50 w-52 transition-colors"
                  />
                </div>
                {/* Filter chips */}
                {(["all", "in_stock", "low", "out"] as StatusFilter[]).map((f) => {
                  const labels = { all: "Tous", in_stock: "En stock", low: "Faible", out: "Rupture" }
                  const colors = { all: "#3b82f6", in_stock: "#a3e635", low: "#f97316", out: "#ef4444" }
                  const active = statusFilter === f
                  return (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: active ? `${colors[f]}20` : "transparent",
                        color: active ? colors[f] : "#ffffff60",
                        border: active ? `1px solid ${colors[f]}40` : "1px solid transparent",
                      }}>
                      {labels[f]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    {["Produit", "Catégorie", "Prix", "Stock actuel", "Statut", "Mise à jour"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs text-white/30 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-[#1e1e2e]/50">
                        {[...Array(6)].map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 rounded-lg bg-[#1e1e2e] animate-pulse"
                              style={{ width: `${[60, 40, 30, 20, 25, 20][j]}%`, opacity: 1 - i * 0.12 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="inline-block mb-3"
                        >
                          <TrendingDown className="w-12 h-12 text-white/10 mx-auto" />
                        </motion.div>
                        <p className="text-white/30 text-sm">Aucun produit trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filtered.map((p, i) => {
                        const st = stockStatus(p.stock_quantity)
                        const StIcon = st.icon
                        const img = p.images?.[0]
                        return (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ delay: i * 0.03, type: "spring", stiffness: 150, damping: 22 }}
                            className="border-b border-[#1e1e2e]/50 hover:bg-white/[0.02] transition-colors group"
                          >
                            {/* Product */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#111118] border border-[#1e1e2e] overflow-hidden shrink-0 flex items-center justify-center">
                                  {img ? (
                                    <Image src={img} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-white/20" />
                                  )}
                                </div>
                                <span className="text-white font-medium text-sm truncate max-w-[180px]">{p.name}</span>
                              </div>
                            </td>
                            {/* Category */}
                            <td className="px-5 py-3.5">
                              <span className="text-white/50 text-xs">{p.category?.name ?? "—"}</span>
                            </td>
                            {/* Price */}
                            <td className="px-5 py-3.5">
                              <span className="text-white/70 text-sm font-medium">{fmtCFA(p.price)}</span>
                            </td>
                            {/* Stock (editable) */}
                            <td className="px-5 py-3.5">
                              <StockEditor product={p} onSaved={handleSaved} />
                            </td>
                            {/* Status badge */}
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg}`}
                                style={{ color: st.color }}>
                                <StIcon className="w-3 h-3" />
                                {st.label}
                              </span>
                            </td>
                            {/* Update button */}
                            <td className="px-5 py-3.5">
                              <Link href={`/vendor/products`}>
                                <motion.span whileHover={{ scale: 1.05 }}
                                  className="text-xs text-white/30 hover:text-[#3b82f6] transition-colors underline-offset-2 hover:underline cursor-pointer">
                                  Modifier
                                </motion.span>
                              </Link>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!loading && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="px-5 py-3 border-t border-[#1e1e2e] flex items-center justify-between"
              >
                <p className="text-white/30 text-xs">
                  {filtered.length} sur {data?.products.length ?? 0} produits · {kpi?.total_units ?? 0} unités totales
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/30">
                    <span className="w-2 h-2 rounded-full bg-[#a3e635]" /> En stock
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/30">
                    <span className="w-2 h-2 rounded-full bg-[#f97316]" /> Faible
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/30">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Rupture
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  )
}
