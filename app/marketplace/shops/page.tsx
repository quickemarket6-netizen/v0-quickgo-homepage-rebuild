"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Search, Star, Clock, ArrowLeft, Heart, Bike, BadgeCheck,
  ShoppingBag, UtensilsCrossed, Pill, Smartphone, Shirt, Coffee, Gift,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { FeaturedHero } from "@/components/marketplace/FeaturedHero"
import { EmptyState } from "@/components/marketplace/EmptyState"

const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
  restaurant: UtensilsCrossed, supermarche: ShoppingBag, pharmacie: Pill,
  electronique: Smartphone, mode: Shirt, cafe: Coffee, cadeau: Gift,
}

interface Category { id: string; name: string; slug: string; color: string | null }
interface Vendor {
  id: string; name: string; description: string | null
  city: string | null; rating: number | null; delivery_fee: number | null
  logo_url: string | null; cover_url: string | null; is_verified: boolean; status: string
  delivery_time_min: number | null
  category: { id: string; name: string; slug: string; color: string | null } | null
}

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " F"
}

export default function MarketplaceShopsPage() {
  const searchParams = useSearchParams()
  const initialCat = searchParams.get("cat") ?? "all"

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState(initialCat)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const categoriesRef = useRef<Category[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("qg_fav_vendors") ?? "[]")
      if (Array.isArray(stored)) setFavorites(new Set(stored))
    } catch { /* ignore */ }
  }, [])

  const toggleFavorite = (e: React.MouseEvent, vendorId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(vendorId)) next.delete(vendorId)
      else next.add(vendorId)
      localStorage.setItem("qg_fav_vendors", JSON.stringify([...next]))
      return next
    })
  }

  const fetchVendors = useCallback(async (q: string, cat: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("search", q)
      if (cat !== "all") params.set("category", cat)
      const [vendorsRes, catsRes] = await Promise.all([
        fetch(`/api/vendors?${params}`).then((r) => r.ok ? r.json() : []),
        categoriesRef.current.length
          ? Promise.resolve(categoriesRef.current)
          : fetch("/api/categories").then((r) => r.ok ? r.json() : []),
      ])
      setVendors(Array.isArray(vendorsRes) ? vendorsRes : [])
      if (!categoriesRef.current.length) {
        categoriesRef.current = catsRes
        setCategories(catsRes)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVendors("", initialCat) }, [fetchVendors, initialCat])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchVendors(val, catFilter), 350)
  }

  const handleCat = (slug: string) => {
    setCatFilter(slug)
    fetchVendors(search, slug)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3 mb-3">
          <Link href="/marketplace" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input placeholder="Rechercher une boutique…" value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-[#16161f] border-[#1e1e2e] rounded-full h-10 text-sm text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
          </div>
        </div>
        {/* Category tabs */}
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <button onClick={() => handleCat("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              catFilter === "all" ? "bg-[#3b82f6] text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
            }`}>
            <ShoppingBag className="w-3.5 h-3.5" /> Tous
          </button>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] ?? ShoppingBag
            return (
              <button key={cat.id} onClick={() => handleCat(cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  catFilter === cat.slug ? "bg-[#3b82f6] text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {cat.name}
              </button>
            )
          })}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Hero — only on the default view */}
        {!search && catFilter === "all" && <FeaturedHero />}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {catFilter !== "all" ? categories.find((c) => c.slug === catFilter)?.name ?? "Boutiques" : search ? "Résultats" : "Toutes les boutiques"}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              {loading ? "Chargement…" : `${vendors.length} boutique${vendors.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl bg-[#16161f] animate-pulse" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aucune boutique trouvée"
            description="Essayez une autre catégorie, ou parcourez tous les produits déjà disponibles sur le marché."
            ctaLabel="Voir tous les produits"
            ctaHref="/marketplace/products"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor, i) => {
              const catSlug = vendor.category?.slug ?? ""
              const CatIcon = CATEGORY_ICONS[catSlug] ?? ShoppingBag
              const isFav = favorites.has(vendor.id)
              const freeDelivery = vendor.delivery_fee === 0
              const deliveryMin = vendor.delivery_time_min ?? 25
              return (
                <motion.div key={vendor.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <Link href={`/marketplace/shops/${vendor.id}`}
                    className="group block bg-[#14141c] border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-[#3b82f6]/40 hover:shadow-[0_10px_40px_-8px_rgba(59,130,246,0.35)] transition-all duration-300">
                    {/* Cover */}
                    <div className="relative h-32 bg-gradient-to-br from-[#3b82f6]/25 to-[#06b6d4]/10 overflow-hidden">
                      {vendor.cover_url ? (
                        <Image src={vendor.cover_url} alt={vendor.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 100vw, 33vw" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CatIcon className="w-12 h-12 text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent" />

                      {freeDelivery && (
                        <span className="absolute top-2 left-2 bg-[#a3e635] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow inline-flex items-center gap-1">
                          <Bike className="w-2.5 h-2.5" /> Livraison gratuite
                        </span>
                      )}
                      <button
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isFav ? "bg-[#ef4444]/90" : "bg-black/40 hover:bg-black/60"}`}
                        onClick={(e) => toggleFavorite(e, vendor.id)}
                        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
                        <Heart className={`w-4 h-4 ${isFav ? "text-white fill-current" : "text-white"}`} />
                      </button>

                      {/* Logo */}
                      <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-2xl bg-[#14141c] border-2 border-[#14141c] shadow-lg overflow-hidden">
                        {vendor.logo_url ? (
                          <Image src={vendor.logo_url} alt={vendor.name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
                            <span className="text-white font-black text-lg">{vendor.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 pt-8">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-white font-bold text-sm truncate">{vendor.name}</h3>
                        {vendor.is_verified && <BadgeCheck className="w-4 h-4 text-[#3b82f6] shrink-0" />}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5 truncate">
                        {vendor.category?.name ?? "Boutique"}{vendor.city ? ` · ${vendor.city}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5 text-xs">
                        <span className="flex items-center gap-1 text-[#eab308] bg-[#eab308]/10 px-1.5 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-current" />
                          {vendor.rating != null && vendor.rating > 0 ? vendor.rating.toFixed(1) : "Nouveau"}
                        </span>
                        <span className="flex items-center gap-1 text-white/50">
                          <Clock className="w-3 h-3" /> {deliveryMin}–{deliveryMin + 15} min
                        </span>
                        <span className="flex items-center gap-1 text-white/50">
                          <Bike className="w-3 h-3" />
                          {vendor.delivery_fee != null ? (freeDelivery ? "Gratuit" : formatCFA(vendor.delivery_fee)) : "—"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
