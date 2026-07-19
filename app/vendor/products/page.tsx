"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Plus, Search, Edit2, Trash2, Eye,
  ChevronDown, ChevronRight, Zap, Boxes, Truck, Ticket, MessageSquare, Bell,
  Upload, Download,
} from "lucide-react"
import { useT } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ProductImageUploader } from "@/components/vendor/ProductImageUploader"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { name: string; slug: string }
interface CategoryOption { id: string; name: string }
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  stock_quantity: number
  is_available: boolean
  images: string[] | null
  category_id: string | null
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
  const { t } = useT()
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
        .select("id, name, description, price, original_price, stock_quantity, is_available, images, category_id, category:categories(name, slug), created_at")
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

  // ── Édition / suppression ─────────────────────────────────────────────────
  const [editing, setEditing] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({
    name: "", description: "", price: "", original_price: "",
    stock_quantity: "", category_id: "", is_available: true, images: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setCategories(d) })
      .catch(() => {})
  }, [])

  // Variantes (taille, contenance…) éditées avec le produit
  const [editVariants, setEditVariants] = useState<{ label: string; price: string; stock_quantity: string }[]>([])

  const openEdit = (p: Product) => {
    setEditing(p)
    setEditForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      original_price: p.original_price != null ? String(p.original_price) : "",
      stock_quantity: String(p.stock_quantity ?? 0),
      category_id: p.category_id ?? "",
      is_available: p.is_available,
      images: p.images ?? [],
    })
    setEditVariants([])
    fetch(`/api/vendor/products/${p.id}/variants`)
      .then((r) => (r.ok ? r.json() : []))
      .then((vs: { label: string; price: number; stock_quantity: number | null }[]) => {
        if (Array.isArray(vs)) {
          setEditVariants(vs.map((v) => ({
            label: v.label,
            price: String(v.price),
            stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : "",
          })))
        }
      })
      .catch(() => {})
  }

  const saveEdit = async () => {
    if (!editing) return
    const price = Number(editForm.price)
    const stock = Number(editForm.stock_quantity)
    if (!editForm.name.trim() || !Number.isFinite(price) || price <= 0) {
      toast.error("Nom et prix valides requis")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/vendor/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          price,
          original_price: editForm.original_price ? Number(editForm.original_price) : null,
          stock_quantity: Number.isFinite(stock) ? stock : 0,
          ...(editForm.category_id ? { category_id: editForm.category_id } : {}),
          is_available: editForm.is_available,
          images: editForm.images,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Enregistrement impossible"); return }

      // Variantes : remplacement du jeu complet (best-effort — nécessite la
      // migration add_vendor_features.sql)
      const cleanVariants = editVariants.filter((v) => v.label.trim() && Number(v.price) > 0)
      const vRes = await fetch(`/api/vendor/products/${editing.id}/variants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: cleanVariants.map((v, i) => ({
            label: v.label.trim(),
            price: Number(v.price),
            stock_quantity: v.stock_quantity === "" ? null : Number(v.stock_quantity),
            position: i,
          })),
        }),
      }).catch(() => null)
      if (vRes && !vRes.ok) {
        const vErr = await vRes.json().catch(() => ({}))
        toast.error(vErr.error ?? "Variantes non enregistrées")
      }

      setProducts((prev) => prev.map((p) => p.id === editing.id
        ? {
            ...p, ...data,
            category: editForm.category_id
              ? { name: categories.find((c) => c.id === editForm.category_id)?.name ?? p.category?.name ?? "", slug: p.category?.slug ?? "" }
              : p.category,
          }
        : p))
      toast.success("Produit mis à jour")
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  // ── Import / Export CSV ───────────────────────────────────────────────────
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  // Parse CSV minimal mais correct : gère les champs entre guillemets
  // (virgules et retours à la ligne inclus) et les guillemets doublés.
  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = []
    let row: string[] = [], field = "", inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++ }
          else inQuotes = false
        } else field += c
      } else if (c === '"') inQuotes = true
      else if (c === ",") { row.push(field); field = "" }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++
        row.push(field); field = ""
        if (row.some((f) => f.trim() !== "")) rows.push(row)
        row = []
      } else field += c
    }
    row.push(field)
    if (row.some((f) => f.trim() !== "")) rows.push(row)
    return rows
  }

  const importCsv = async (file: File) => {
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) { toast.error("CSV vide (en-tête + au moins une ligne attendus)"); return }

      const header = rows[0].map((h) => h.trim().toLowerCase())
      const col = (names: string[]) => header.findIndex((h) => names.includes(h))
      const iName = col(["name", "nom", "produit"])
      const iPrice = col(["price", "prix"])
      if (iName === -1 || iPrice === -1) {
        toast.error("Colonnes requises manquantes : « name/nom » et « price/prix »")
        return
      }
      const iDesc = col(["description"])
      const iOrig = col(["original_price", "prix_barre", "prix barré"])
      const iStock = col(["stock", "stock_quantity", "quantite", "quantité"])
      const iCat = col(["category", "categorie", "catégorie"])
      const iImages = col(["images", "image", "image_url"])

      const productsPayload = rows.slice(1).map((r) => ({
        name: r[iName]?.trim(),
        price: r[iPrice]?.trim(),
        description: iDesc >= 0 ? r[iDesc]?.trim() : undefined,
        original_price: iOrig >= 0 ? r[iOrig]?.trim() : undefined,
        stock_quantity: iStock >= 0 ? r[iStock]?.trim() : undefined,
        category: iCat >= 0 ? r[iCat]?.trim() : undefined,
        images: iImages >= 0 && r[iImages]?.trim()
          ? r[iImages].split(";").map((u) => u.trim()).filter(Boolean)
          : undefined,
      }))

      const res = await fetch("/api/vendor/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsPayload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Import échoué"); return }

      toast.success(`${data.created} produit${data.created > 1 ? "s" : ""} importé${data.created > 1 ? "s" : ""}`,
        data.skipped > 0
          ? { description: `${data.skipped} ligne${data.skipped > 1 ? "s" : ""} ignorée${data.skipped > 1 ? "s" : ""} : ${(data.errors as { row: number; error: string }[]).slice(0, 3).map((e) => `ligne ${e.row} (${e.error})`).join(", ")}${data.skipped > 3 ? "…" : ""}`, duration: 10_000 }
          : undefined)
      // Recharge la liste
      window.location.reload()
    } catch {
      toast.error("Fichier illisible")
    } finally {
      setImporting(false)
    }
  }

  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = String(v ?? "")
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = "name,description,price,original_price,stock_quantity,category,images"
    const lines = products.map((p) => [
      p.name, p.description ?? "", p.price, p.original_price ?? "",
      p.stock_quantity ?? 0, p.category?.name ?? "", (p.images ?? []).join(";"),
    ].map(esc).join(","))
    const blob = new Blob(["﻿" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `produits-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Supprimer « ${p.name} » ? Cette action est définitive.`)) return
    setDeletingId(p.id)
    try {
      const res = await fetch(`/api/vendor/products/${p.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Suppression impossible"); return }
      setProducts((prev) => prev.filter((x) => x.id !== p.id))
      toast.success("Produit supprimé")
    } finally {
      setDeletingId(null)
    }
  }

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
                  placeholder={t("vp.search")}
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
              {/* Import / Export CSV */}
              <Button variant="outline" onClick={() => csvInputRef.current?.click()} disabled={importing}
                className="h-9 border-[#1e1e2e] bg-transparent text-white/60 hover:text-white text-sm rounded-xl gap-2 px-3">
                <Upload className={`w-4 h-4 ${importing ? "animate-pulse" : ""}`} />
                <span className="hidden md:inline">{importing ? t("vp.importing") : t("vp.importCsv")}</span>
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={products.length === 0}
                className="h-9 border-[#1e1e2e] bg-transparent text-white/60 hover:text-white text-sm rounded-xl gap-2 px-3">
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">{t("vp.export")}</span>
              </Button>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = "" }} />
              {/* Add product */}
              <Link href="/vendor/products/new">
                <Button className="h-9 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-sm rounded-xl gap-2 px-4">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("vnav.addProduct")}</span>
                  <span className="sm:hidden">{t("vp.add")}</span>
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
                              title="Modifier"
                              onClick={() => openEdit(product)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] text-white/30 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Voir sur le marketplace"
                              asChild
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#a3e635]/10 hover:text-[#a3e635] text-white/30 transition-colors"
                            >
                              <Link href={`/marketplace/product/${product.id}`} target="_blank">
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Supprimer"
                              disabled={deletingId === product.id}
                              onClick={() => deleteProduct(product)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[#ef4444]/10 hover:text-[#ef4444] text-white/30 transition-colors"
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${deletingId === product.id ? "animate-pulse" : ""}`} />
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

      {/* ── Modal d'édition ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !saving && setEditing(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                sm:w-[560px] z-50 max-h-[90vh] overflow-y-auto
                bg-[#111118] border border-[#1e1e2e] rounded-t-3xl sm:rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Modifier le produit</h2>
                <button onClick={() => !saving && setEditing(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Photos</label>
                <ProductImageUploader
                  images={editForm.images}
                  onChange={(images) => setEditForm((f) => ({ ...f, images }))}
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Nom du produit *</label>
                <Input value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-[#16161f] border-[#1e1e2e] text-white rounded-xl h-11" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Description</label>
                <textarea value={editForm.description} rows={3}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-sm text-white
                    focus:outline-none focus:border-[#3b82f6]/50 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Prix (FCFA) *</label>
                  <Input type="number" min={1} value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                    className="bg-[#16161f] border-[#1e1e2e] text-white rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Prix barré (optionnel)</label>
                  <Input type="number" min={0} value={editForm.original_price}
                    onChange={(e) => setEditForm((f) => ({ ...f, original_price: e.target.value }))}
                    className="bg-[#16161f] border-[#1e1e2e] text-white rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Stock</label>
                  <Input type="number" min={0} value={editForm.stock_quantity}
                    onChange={(e) => setEditForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                    className="bg-[#16161f] border-[#1e1e2e] text-white rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Catégorie</label>
                  <select value={editForm.category_id}
                    onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-sm text-white
                      focus:outline-none focus:border-[#3b82f6]/50">
                    <option value="">— Choisir —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Variantes — taille, contenance, couleur… */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/40">Variantes (optionnel)</label>
                  {editVariants.length < 20 && (
                    <button type="button"
                      onClick={() => setEditVariants((v) => [...v, { label: "", price: editForm.price, stock_quantity: "" }])}
                      className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 font-medium">
                      + Ajouter une variante
                    </button>
                  )}
                </div>
                {editVariants.length === 0 ? (
                  <p className="text-xs text-white/25">
                    Ex : « 500 ml », « Rouge — M »… Chaque variante a son prix et son stock.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_90px_70px_28px] gap-2 text-[10px] text-white/30 uppercase tracking-wide px-1">
                      <span>Libellé</span><span>Prix (F)</span><span>Stock</span><span />
                    </div>
                    {editVariants.map((v, i) => (
                      <div key={i} className="grid grid-cols-[1fr_90px_70px_28px] gap-2 items-center">
                        <Input value={v.label} placeholder="Ex : 500 ml"
                          onChange={(e) => setEditVariants((arr) => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                          className="bg-[#16161f] border-[#1e1e2e] text-white rounded-lg h-9 text-sm" />
                        <Input type="number" min={1} value={v.price} placeholder="Prix"
                          onChange={(e) => setEditVariants((arr) => arr.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                          className="bg-[#16161f] border-[#1e1e2e] text-white rounded-lg h-9 text-sm" />
                        <Input type="number" min={0} value={v.stock_quantity} placeholder="∞"
                          onChange={(e) => setEditVariants((arr) => arr.map((x, j) => j === i ? { ...x, stock_quantity: e.target.value } : x))}
                          className="bg-[#16161f] border-[#1e1e2e] text-white rounded-lg h-9 text-sm" />
                        <button type="button" onClick={() => setEditVariants((arr) => arr.filter((_, j) => j !== i))}
                          className="h-9 w-7 rounded-lg text-[#ef4444]/70 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">
                          ✕
                        </button>
                      </div>
                    ))}
                    <p className="text-[10px] text-white/25">Stock vide = non suivi (illimité). Supprimer toutes les variantes repasse en produit simple.</p>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#16161f] border border-[#1e1e2e] cursor-pointer">
                <input type="checkbox" checked={editForm.is_available}
                  onChange={(e) => setEditForm((f) => ({ ...f, is_available: e.target.checked }))}
                  className="w-4 h-4 accent-[#a3e635]" />
                <div>
                  <p className="text-sm text-white font-medium">Produit visible sur le marketplace</p>
                  <p className="text-xs text-white/40">Décochez pour le retirer temporairement de la vente</p>
                </div>
              </label>

              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-[#a3e635] text-black font-bold hover:bg-[#a3e635]/90">
                  {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                </Button>
                <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}
                  className="h-11 rounded-xl border-[#1e1e2e] text-white/60 hover:text-white">
                  Annuler
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
