"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  ArrowLeft, Plus, X, Check, ImagePlus, Zap, LogOut, User, Boxes, Truck,
  AlertCircle, Loader2,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; slug: string; color: string; icon: string }

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
      { label: "Ajouter un produit", href: "/vendor/products/new",        active: true  },
      { label: "Catégories",          href: "/vendor/products/categories", active: false },
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
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: BarChart3,  label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Star,       label: "Avis",        href: "/vendor/reviews" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-white/70">
        {label}{required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-white/30">{hint}</p>}
      {error && <p className="text-xs text-[#ef4444] flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter()
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const [vendorName, setVendorName]     = useState("")
  const [vendorInitials, setVendorInitials] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: true, Portefeuille: false })
  const [categories, setCategories]   = useState<Category[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [success, setSuccess]         = useState(false)
  const [errors, setErrors]           = useState<Record<string, string>>({})

  // Form state
  const [name, setName]                     = useState("")
  const [description, setDescription]       = useState("")
  const [price, setPrice]                   = useState("")
  const [originalPrice, setOriginalPrice]   = useState("")
  const [categoryId, setCategoryId]         = useState("")
  const [stock, setStock]                   = useState("0")
  const [isFeatured, setIsFeatured]         = useState(false)
  const [imageUrls, setImageUrls]           = useState<string[]>([""])

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

  // ── Auth + categories ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      const { data: v } = await supabase.current.from("vendors").select("name").eq("owner_id", user.id).single()
      if (v) { setVendorName((v as { name: string }).name); setVendorInitials(initials((v as { name: string }).name)) }
    }
    void load()

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d: Category[]) => setCategories(d))
      .catch(() => {})
  }, [router])

  const handleSignOut = async () => {
    await supabase.current.auth.signOut()
    window.location.href = "/auth/login"
  }
  const toggleSection = (label: string) => setExpandedSections((s) => ({ ...s, [label]: !s[label] }))

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim())           e.name  = "Le nom est obligatoire"
    const p = parseFloat(price)
    if (isNaN(p) || p <= 0)    e.price = "Prix invalide"
    const op = originalPrice ? parseFloat(originalPrice) : null
    if (op !== null && op <= p) e.originalPrice = "Le prix barré doit être supérieur au prix"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(price),
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          category_id: categoryId || null,
          stock_quantity: parseInt(stock) || 0,
          is_featured: isFeatured,
          images: imageUrls.filter(Boolean),
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/vendor/products"), 1500)
      } else {
        const d = await res.json()
        setErrors({ submit: d.error ?? "Erreur lors de la création" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Image URL helpers ─────────────────────────────────────────────────────
  const addImageUrl    = () => setImageUrls((u) => [...u, ""])
  const removeImageUrl = (i: number) => setImageUrls((u) => u.filter((_, j) => j !== i))
  const updateImageUrl = (i: number, v: string) => setImageUrls((u) => u.map((x, j) => j === i ? v : x))

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#a3e635] blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, delay: 4 }}
          className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-[#3b82f6] blur-[120px]" />
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
                              ? "bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20"
                              : "text-white/40 hover:text-white hover:bg-[#1e1e2e]/40"
                          }`}>
                          <ChevronRight className="w-3 h-3" />{child.label}
                          {("active" in child) && child.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a3e635]" />}
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
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/3 w-32 h-16 rounded-full bg-[#a3e635] blur-3xl opacity-25" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/vendor/products">
                <motion.div whileHover={{ x: -3 }}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-9 h-9 rounded-2xl bg-[#a3e635]/20 border border-[#a3e635]/30 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-[#a3e635]" />
                  </motion.div>
                  <h1 className="text-xl font-black text-white">
                    Ajouter un{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#a3e635] to-[#22c55e]">
                      produit
                    </span>
                  </h1>
                </div>
                <p className="text-white/40 text-sm">Renseignez les informations de votre nouveau produit</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/vendor/dashboard">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#22c55e] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
                      <span className="text-[#0a0a0f] font-black text-sm">{vendorInitials || "V"}</span>
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

        {/* Form */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#a3e635]" />
                  <p className="text-[#a3e635] font-semibold text-sm">Produit créé avec succès ! Redirection...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {errors.submit && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-2xl px-5 py-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0" />
                <p className="text-[#ef4444] text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Section 1 — Informations générales */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-6 space-y-5">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-[#a3e635]" /> Informations générales
              </h2>

              <Field label="Nom du produit" required error={errors.name}>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="ex : Poulet DG, iPhone 15 Pro..."
                  className="w-full h-11 px-4 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-white placeholder-white/30
                    focus:outline-none focus:border-[#a3e635]/50 text-sm transition-colors" />
              </Field>

              <Field label="Description" hint="Décrivez votre produit en quelques phrases">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingrédients, caractéristiques, avantages..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-white placeholder-white/30
                    focus:outline-none focus:border-[#a3e635]/50 text-sm transition-colors resize-none" />
              </Field>

              <Field label="Catégorie">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all"
                      style={{
                        background: categoryId === cat.id ? `${cat.color}20` : "transparent",
                        borderColor: categoryId === cat.id ? `${cat.color}50` : "#1e1e2e",
                        color: categoryId === cat.id ? cat.color : "#ffffff50",
                      }}>
                      <span className="text-xl">{cat.icon}</span>
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </motion.div>

            {/* Section 2 — Prix */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-6 space-y-5">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#f97316]" /> Prix
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix de vente (FCFA)" required error={errors.price}>
                  <div className="relative">
                    <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="50"
                      placeholder="0"
                      className="w-full h-11 px-4 pr-12 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-white placeholder-white/30
                        focus:outline-none focus:border-[#f97316]/50 text-sm transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">F</span>
                  </div>
                </Field>

                <Field label="Prix barré (optionnel)" error={errors.originalPrice}
                  hint="Affiché comme prix original avant remise">
                  <div className="relative">
                    <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} type="number" min="0" step="50"
                      placeholder="0"
                      className="w-full h-11 px-4 pr-12 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-white placeholder-white/30
                        focus:outline-none focus:border-[#f97316]/50 text-sm transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">F</span>
                  </div>
                </Field>
              </div>

              {price && originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#a3e635]" />
                  <p className="text-[#a3e635] text-xs font-semibold">
                    Remise de {Math.round((1 - parseFloat(price) / parseFloat(originalPrice)) * 100)}%
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Section 3 — Stock & visibilité */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-6 space-y-5">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#3b82f6]" /> Stock & visibilité
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Quantité en stock" hint="0 = affiché comme rupture">
                  <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0"
                    placeholder="0"
                    className="w-full h-11 px-4 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-white placeholder-white/30
                      focus:outline-none focus:border-[#3b82f6]/50 text-sm transition-colors" />
                </Field>

                <Field label="Mise en avant">
                  <button type="button" onClick={() => setIsFeatured((f) => !f)}
                    className={`w-full h-11 rounded-xl border flex items-center gap-3 px-4 transition-all text-sm font-semibold ${
                      isFeatured
                        ? "bg-[#eab308]/15 border-[#eab308]/40 text-[#eab308]"
                        : "bg-[#0a0a0f] border-[#1e1e2e] text-white/40"
                    }`}>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                      isFeatured ? "bg-[#eab308]" : "bg-white/10"
                    }`}>
                      {isFeatured && <Check className="w-3 h-3 text-[#0a0a0f]" />}
                    </div>
                    {isFeatured ? "Mis en avant ⭐" : "Non mis en avant"}
                  </button>
                </Field>
              </div>
            </motion.div>

            {/* Section 4 — Images */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-[#8b5cf6]" /> Images
              </h2>
              <p className="text-white/40 text-xs">Ajoutez des URLs d&apos;images (JPG, PNG, WebP). La première sera l&apos;image principale.</p>

              <div className="space-y-3">
                {imageUrls.map((url, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] overflow-hidden shrink-0 flex items-center justify-center">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                      ) : (
                        <ImagePlus className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                    <input value={url} onChange={(e) => updateImageUrl(i, e.target.value)}
                      placeholder={`URL de l'image ${i + 1}…`}
                      className="flex-1 h-10 px-4 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl text-white placeholder-white/30
                        focus:outline-none focus:border-[#8b5cf6]/50 text-sm transition-colors" />
                    {imageUrls.length > 1 && (
                      <button type="button" onClick={() => removeImageUrl(i)}
                        className="w-8 h-8 rounded-lg bg-[#ef4444]/10 hover:bg-[#ef4444]/20 flex items-center justify-center text-[#ef4444] transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {imageUrls.length < 5 && (
                <button type="button" onClick={addImageUrl}
                  className="flex items-center gap-2 text-xs text-[#8b5cf6] hover:text-[#8b5cf6]/80 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter une image
                </button>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex items-center gap-4 pb-6">
              <Link href="/vendor/products">
                <button type="button"
                  className="px-6 py-3 rounded-xl bg-white/5 border border-[#1e1e2e] text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold">
                  Annuler
                </button>
              </Link>
              <motion.button type="submit" disabled={submitting || success}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-[#a3e635] hover:bg-[#a3e635]/90 text-[#0a0a0f] font-black text-sm
                  flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours...</>
                ) : success ? (
                  <><Check className="w-4 h-4" /> Produit créé !</>
                ) : (
                  <><Plus className="w-4 h-4" /> Créer le produit</>
                )}
              </motion.button>
            </motion.div>

          </form>
        </div>
      </main>
    </div>
  )
}
