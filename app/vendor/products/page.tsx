"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Plus, Search, Edit2, Trash2, Eye,
  ChevronDown, ChevronRight, Zap, Boxes, Truck,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { name: string; slug: string }
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  stock_quantity: number
  is_available: boolean
  images: string[] | null
  category: Category | null
  created_at: string
}
interface Vendor {
  id: string
  name: string
  slug: string
  logo_url: string | null
  rating: number | null
  status: string
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
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
      { label: "Retraits",         href: "/vendor/payouts" },
      { label: "Historique",       href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: BarChart3,  label: "Analyses",   href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions", href: "/vendor/promotions" },
  { icon: Star,       label: "Avis",       href: "/vendor/reviews" },
  { icon: Settings,   label: "Paramètres", href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",       href: "/vendor/help" },
]

// ─── Status helpers ───────────────────────────────────────────────────────────
function getProductStatus(p: Product): { label: string; color: string; bg: string } {
  if (p.stock_quantity === 0)
    return { label: "Rupture",      color: "text-[#ef4444]", bg: "bg-[#ef4444]/15" }
  if (!p.is_available)
    return { label: "Inactif",      color: "text-white/40",  bg: "bg-white/10" }
  if (p.stock_quantity <= 5)
    return { label: "Stock faible", color: "text-[#f97316]", bg: "bg-[#f97316]/15" }
  return   { label: "Actif",        color: "text-[#a3e635]", bg: "bg-[#a3e635]/15" }
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorProductsPage() {
  const [vendor, setVendor]     = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingVendor, setLoadingVendor]   = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock">("all")
  const [selected, setSelected]       = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Produits: true,
    Portefeuille: false,
  })

  // ── Load vendor + products ────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      setLoadingVendor(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingVendor(false); return }

      const { data: v } = await supabase
        .from("vendors")
        .select("id, name, slug, logo_url, rating, status")
        .eq("owner_id", user.id)
        .single()
      setVendor(v ?? null)
      setLoadingVendor(false)

      if (!v) return
      setLoadingProducts(true)
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, description, price, original_price, stock_quantity, is_available, images, category:categories(name, slug), created_at")
        .eq("vendor_id", v.id)
        .order("created_at", { ascending: false })
      setProducts((prods as Product[]) ?? [])
      setLoadingProducts(false)
    }
    run()
  }, [])

  // ── Filtered products ─────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (statusFilter === "active")    return p.is_available && p.stock_quantity > 5
    if (statusFilter === "inactive")  return !p.is_available
    if (statusFilter === "low_stock") return p.stock_quantity <= 5
    return true
  })

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:    products.length,
    actifs:   products.filter((p) => p.is_available && p.stock_quantity > 0).length,
    rupture:  products.filter((p) => p.stock_quantity === 0).length,
    lowStock: products.filter((p) => p.stock_quantity <= 5 && p.stock_quantity > 0 && p.is_available).length,
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id))
  const toggleSection = (label: string) =>
    setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  const isLoading = loadingVendor || loadingProducts

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e]">
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item, idx) => {
            const isExpanded = expandedSections[item.label]
            const isActive   = item.label === "Produits"
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {item.expandable ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#a3e635]/10 text-[#a3e635]"
                          : "text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-7 mt-0.5 space-y-0.5"
                        >
                          {item.children?.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                                child.label === "Tous les produits"
                                  ? "text-[#a3e635] bg-[#a3e635]/5"
                                  : "text-white/40 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/40 hover:bg-white/5 hover:text-white"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </nav>

        {/* Booster CTA */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="bg-gradient-to-br from-[#a3e635]/15 to-[#3b82f6]/10 border border-[#a3e635]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#a3e635]" />
              <span className="text-white text-sm font-semibold">Booster</span>
            </div>
            <p className="text-white/40 text-xs mb-3">Mettez vos produits en avant et multipliez vos ventes.</p>
            <Button size="sm" className="w-full h-8 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-xs rounded-lg">
              Activer
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* ── Sticky Header with video background ─────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-[#1e1e2e] overflow-hidden" style={{ minHeight: "80px" }}>
          {/* Background video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            style={{ pointerEvents: "none" }}
          >
            <source
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4"
              type="video/mp4"
            />
          </video>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] to-[#0a0a0f]/60" />

          {/* Animated glow orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#a3e635] rounded-full blur-[120px] pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute right-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-[#3b82f6] rounded-full blur-[120px] pointer-events-none"
          />

          {/* Header content */}
          <div className="relative z-10 px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#06b6d4] leading-tight">
                Mes Produits
              </h1>
              <p className="text-xs text-white/30 mt-0.5">
                {loadingVendor ? "Chargement…" : vendor ? vendor.name : "—"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-52 bg-[#16161f]/80 border-[#1e1e2e] rounded-xl h-9 text-sm placeholder:text-white/20 text-white"
                />
              </div>
              {/* Status filter */}
              <div className="relative hidden sm:block">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="appearance-none bg-[#16161f]/80 border border-[#1e1e2e] text-white/60 text-sm rounded-xl h-9 pl-3 pr-8 focus:outline-none focus:border-[#a3e635]/50 cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="low_stock">Stock faible</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              </div>
              {/* Add product */}
              <Link href="/vendor/products/new">
                <Button className="h-9 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-sm rounded-xl gap-2 px-4">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter un produit</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── KPI stats row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total produits", value: stats.total,    color: "#3b82f6", icon: Package },
              { label: "Actifs",         value: stats.actifs,   color: "#a3e635", icon: TrendingUp },
              { label: "Rupture",        value: stats.rupture,  color: "#ef4444", icon: ShoppingBag },
              { label: "Stock faible",   value: stats.lowStock, color: "#f97316", icon: BarChart3 },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-4 flex items-center gap-3
                  hover:border-[#3b82f6]/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.07)] transition-all duration-300"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  {isLoading ? (
                    <div className="h-5 w-10 rounded bg-white/10 animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl font-black text-white leading-tight">{stat.value}</p>
                  )}
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Mobile search + filter ────────────────────────────────────── */}
          <div className="flex gap-3 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#16161f] border-[#1e1e2e] rounded-xl h-9 text-sm placeholder:text-white/20 text-white"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="appearance-none bg-[#16161f] border border-[#1e1e2e] text-white/60 text-sm rounded-xl h-9 pl-3 pr-8 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="low_stock">Stock faible</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* ── Products table card ───────────────────────────────────────── */}
          <div className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden">

            {/* Table header bar */}
            <div className="px-5 py-4 border-b border-[#1e1e2e] flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">
                {isLoading
                  ? "Chargement…"
                  : `${filtered.length} produit${filtered.length !== 1 ? "s" : ""}`}
              </h2>
              {selected.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-[#a3e635] bg-[#a3e635]/10 px-3 py-1 rounded-full font-medium"
                >
                  {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
                </motion.span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-xs text-white/30 border-b border-[#1e1e2e]">
                    <th className="px-5 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selected.length === filtered.length}
                        onChange={toggleAll}
                        className="rounded border-[#1e1e2e] bg-[#0a0a0f] accent-[#a3e635]"
                      />
                    </th>
                    <th className="px-5 py-3 text-left font-medium">Produit</th>
                    <th className="px-5 py-3 text-left font-medium">Prix</th>
                    <th className="px-5 py-3 text-left font-medium">Stock</th>
                    <th className="px-5 py-3 text-left font-medium">Statut</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e2e]">

                  {/* ── Loading skeletons ──────────────────────────────────── */}
                  {isLoading && Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="w-4 h-4 rounded bg-white/10" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-36 rounded bg-white/10" />
                            <div className="h-2.5 w-20 rounded bg-white/5" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><div className="h-3.5 w-24 rounded bg-white/10" /></td>
                      <td className="px-5 py-4"><div className="h-3.5 w-8 rounded bg-white/10" /></td>
                      <td className="px-5 py-4"><div className="h-6 w-20 rounded-full bg-white/10" /></td>
                      <td className="px-5 py-4 text-right">
                        <div className="h-7 w-20 rounded-lg bg-white/10 ml-auto" />
                      </td>
                    </tr>
                  ))}

                  {/* ── Empty state ────────────────────────────────────────── */}
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-16 h-16 rounded-2xl bg-[#a3e635]/10 flex items-center justify-center"
                          >
                            <Package className="w-8 h-8 text-[#a3e635]" />
                          </motion.div>
                          <div>
                            <p className="text-white font-semibold">
                              {search || statusFilter !== "all"
                                ? "Aucun produit trouvé"
                                : "Aucun produit"}
                            </p>
                            <p className="text-white/30 text-sm mt-1">
                              {search || statusFilter !== "all"
                                ? "Modifiez vos filtres pour voir plus de résultats."
                                : "Commencez par ajouter votre premier produit."}
                            </p>
                          </div>
                          {!search && statusFilter === "all" && (
                            <Link href="/vendor/products/new">
                              <Button className="h-9 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-sm rounded-xl gap-2">
                                <Plus className="w-4 h-4" /> Ajouter un produit
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* ── Product rows ───────────────────────────────────────── */}
                  {!isLoading && filtered.map((product, i) => {
                    const status   = getProductStatus(product)
                    const imageUrl = product.images?.[0] ?? null
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-[#16161f] transition-colors duration-150"
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="rounded border-[#1e1e2e] bg-[#0a0a0f] accent-[#a3e635]"
                          />
                        </td>

                        {/* Product name + image */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#0a0a0f] border border-[#1e1e2e] shrink-0">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-white/20" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate max-w-[200px]">
                                {product.name}
                              </p>
                              <p className="text-white/30 text-xs mt-0.5 truncate">
                                {product.category?.name ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4">
                          <p className="text-white font-semibold text-sm">{formatCFA(product.price)}</p>
                          {product.original_price && product.original_price > product.price && (
                            <p className="text-white/30 text-xs line-through mt-0.5">
                              {formatCFA(product.original_price)}
                            </p>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-5 py-4">
                          <span className={`font-semibold text-sm ${
                            product.stock_quantity === 0
                              ? "text-[#ef4444]"
                              : product.stock_quantity <= 5
                              ? "text-[#f97316]"
                              : "text-white"
                          }`}>
                            {product.stock_quantity}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] text-white/30 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#a3e635]/10 hover:text-[#a3e635] text-white/30 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#ef4444]/10 hover:text-[#ef4444] text-white/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
