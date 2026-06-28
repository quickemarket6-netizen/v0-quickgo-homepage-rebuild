"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  RefreshCw, Zap, LogOut, User, Boxes, Plus, ArrowRight, Truck,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; slug: string; color: string; icon: string }
interface Product {
  id: string; name: string; price: number; stock_quantity: number
  is_available: boolean; images: string[] | null
  category: { id: string; name: string } | null
}

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
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true, defaultOpen: true,
    children: [
      { label: "Tous les produits",  href: "/vendor/products",            active: false },
      { label: "Ajouter un produit", href: "/vendor/products/new",        active: false },
      { label: "Catégories",          href: "/vendor/products/categories", active: true  },
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
  { icon: BarChart3,  label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Star,       label: "Avis",        href: "/vendor/reviews" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorCategoriesPage() {
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx]       = useState(0)
  const [vendorName, setVendorName]   = useState("")
  const [vendorInitials, setVendorInitials] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: true, Portefeuille: false })
  const [categories, setCategories]   = useState<Category[]>([])
  const [products, setProducts]       = useState<Product[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [selected, setSelected]       = useState<string | null>(null)

  // ── Video ──────────────────────────────────────────────────────────────────
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

  // ── Data ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/vendor/products"),
      ])
      if (catsRes.ok) setCategories(await catsRes.json())
      if (prodsRes.ok) setProducts(await prodsRes.json())
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

  // ── Derived ─────────────────────────────────────────────────────────────────
  // Map categoryId → products
  const productsByCat = new Map<string | null, Product[]>()
  for (const p of products) {
    const key = p.category?.id ?? null
    productsByCat.set(key, [...(productsByCat.get(key) ?? []), p])
  }
  const uncategorized = productsByCat.get(null) ?? []

  // Enrich categories with counts
  const enriched = categories.map((c) => {
    const prods = productsByCat.get(c.id) ?? []
    return {
      ...c,
      count:     prods.length,
      active:    prods.filter((p) => p.is_available && p.stock_quantity > 0).length,
      lowStock:  prods.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
      outStock:  prods.filter((p) => p.stock_quantity === 0).length,
      revenue:   prods.reduce((s, p) => s + p.price * (p.stock_quantity > 0 ? 1 : 0), 0),
      products:  prods,
    }
  }).filter((c) => c.count > 0) // Only show categories where vendor has products
    .sort((a, b) => b.count - a.count)

  const selectedCat = enriched.find((c) => c.id === selected)
  const displayProds = selected === "uncategorized" ? uncategorized : (selectedCat?.products ?? [])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-[#06b6d4] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, delay: 4 }}
          className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-[#a3e635] blur-[120px]" />
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
            const isExpanded = expandedSections[item.label] ?? item.defaultOpen
            const Icon = item.icon
            return (
              <div key={item.label}>
                {item.expandable ? (
                  <button onClick={() => toggleSection(item.label)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-[#1e1e2e]/60 transition-all text-sm">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-white/50 hover:text-white hover:bg-[#1e1e2e]/60">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
                <AnimatePresence>
                  {item.expandable && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {item.children?.map((child) => (
                        <Link key={child.href} href={child.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            ("active" in child) && child.active
                              ? "bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20"
                              : "text-white/40 hover:text-white hover:bg-[#1e1e2e]/40"
                          }`}>
                          <ChevronRight className="w-3 h-3" />{child.label}
                          {("active" in child) && child.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06b6d4]" />}
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
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#06b6d4] blur-3xl opacity-25" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
                  className="w-10 h-10 rounded-2xl bg-[#06b6d4]/20 border border-[#06b6d4]/30 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-[#06b6d4]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Mes{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6]">
                    Catégories
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Parcourez vos produits par catégorie</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button onClick={() => fetchData(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
              </motion.button>
              <Link href="/vendor/products/new">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[#a3e635] text-[#0a0a0f] text-xs font-bold transition-colors hover:bg-[#a3e635]/90">
                  <Plus className="w-3.5 h-3.5" /> Nouveau produit
                </motion.div>
              </Link>
              <Link href="/vendor/dashboard">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
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
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-6">

            {/* Left: category list */}
            <div className="w-72 shrink-0 space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold px-1">
                {loading ? "Chargement..." : `${enriched.length} catégorie${enriched.length !== 1 ? "s" : ""} · ${products.length} produits`}
              </p>

              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-[#16161f] animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                ))
              ) : enriched.length === 0 ? (
                <div className="bg-[#16161f]/80 border border-[#1e1e2e] rounded-2xl p-6 text-center">
                  <Package className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">Aucun produit créé</p>
                  <Link href="/vendor/products/new">
                    <button className="mt-3 text-xs text-[#a3e635] hover:underline flex items-center gap-1 mx-auto">
                      <Plus className="w-3 h-3" /> Ajouter un produit
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  {enriched.map((cat, i) => (
                    <motion.button key={cat.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(selected === cat.id ? null : cat.id)}
                      whileHover={{ x: 4 }}
                      className="w-full text-left bg-[#16161f]/80 backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200"
                      style={{
                        borderColor: selected === cat.id ? `${cat.color}40` : "#1e1e2e",
                        background: selected === cat.id ? `${cat.color}08` : undefined,
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: `${cat.color}20` }}>
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-semibold text-sm">{cat.name}</p>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${cat.color}20`, color: cat.color }}>
                              {cat.count}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {cat.outStock > 0 && (
                              <span className="text-[10px] text-[#ef4444]">{cat.outStock} rupture</span>
                            )}
                            {cat.lowStock > 0 && (
                              <span className="text-[10px] text-[#f97316]">{cat.lowStock} faible</span>
                            )}
                            {cat.outStock === 0 && cat.lowStock === 0 && (
                              <span className="text-[10px] text-[#a3e635]">{cat.active} actif{cat.active !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}

                  {uncategorized.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: enriched.length * 0.05 }}
                      onClick={() => setSelected(selected === "uncategorized" ? null : "uncategorized")}
                      whileHover={{ x: 4 }}
                      className="w-full text-left bg-[#16161f]/80 border rounded-2xl p-4 transition-all"
                      style={{ borderColor: selected === "uncategorized" ? "#ffffff30" : "#1e1e2e" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">📦</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-white/60 font-semibold text-sm">Sans catégorie</p>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/40">
                              {uncategorized.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* Right: product list for selected category */}
            <div className="flex-1 min-w-0">
              {!selected ? (
                /* Overview grid when nothing selected */
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {loading ? (
                    [...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />)
                  ) : (
                    enriched.map((cat, i) => (
                      <motion.button key={cat.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -3 }}
                        onClick={() => setSelected(cat.id)}
                        className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 text-left
                          hover:border-white/10 transition-all relative overflow-hidden">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20"
                          style={{ background: cat.color }} />
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: `${cat.color}20` }}>
                            {cat.icon}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{cat.name}</p>
                            <p className="text-white/40 text-xs">{cat.count} produit{cat.count !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#111118] rounded-xl p-2.5 text-center">
                            <p className="text-white font-bold text-sm">{cat.active}</p>
                            <p className="text-white/30 text-[10px]">actifs</p>
                          </div>
                          <div className="bg-[#111118] rounded-xl p-2.5 text-center">
                            <p className="text-white font-bold text-sm">{fmtCFA(cat.products.reduce((s, p) => s + p.price, 0) / (cat.count || 1))}</p>
                            <p className="text-white/30 text-[10px]">prix moy.</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e1e2e]">
                          <p className="text-white/30 text-xs">Voir les produits</p>
                          <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              ) : (
                /* Product list for selected category */
                <AnimatePresence mode="wait">
                  <motion.div key={selected}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-bold text-lg">
                          {selected === "uncategorized" ? "Sans catégorie" : selectedCat?.name}
                        </p>
                        <p className="text-white/40 text-sm">{displayProds.length} produit{displayProds.length !== 1 ? "s" : ""}</p>
                      </div>
                      <Link href="/vendor/products/new">
                        <motion.div whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20 text-xs font-bold hover:bg-[#a3e635]/20 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Ajouter dans cette catégorie
                        </motion.div>
                      </Link>
                    </div>

                    {displayProds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                          <Package className="w-14 h-14 text-white/10" />
                        </motion.div>
                        <p className="text-white/30 text-sm">Aucun produit dans cette catégorie</p>
                      </div>
                    ) : displayProds.map((p, i) => {
                      const st = p.stock_quantity === 0
                        ? { label: "Rupture",      color: "#ef4444" }
                        : p.stock_quantity <= 5
                        ? { label: "Stock faible", color: "#f97316" }
                        : { label: "Actif",        color: "#a3e635" }
                      return (
                        <motion.div key={p.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-[#111118] border border-[#1e1e2e] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-white/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                            <p className="text-white/40 text-xs mt-0.5">{fmtCFA(p.price)}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ color: st.color, background: `${st.color}20` }}>
                              {st.label}
                            </span>
                            <span className="text-white/30 text-xs">{p.stock_quantity} u.</span>
                            <Link href={`/vendor/products`}>
                              <motion.span whileHover={{ x: 2 }}
                                className="text-xs text-white/30 hover:text-[#3b82f6] transition-colors cursor-pointer flex items-center gap-1">
                                Modifier <ArrowRight className="w-3 h-3" />
                              </motion.span>
                            </Link>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
