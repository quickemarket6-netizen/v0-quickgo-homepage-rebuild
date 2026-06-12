"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Search, Star, Clock, ArrowLeft, Filter, Heart, Bike,
  ShoppingBag, UtensilsCrossed, Pill, Smartphone, Shirt, Coffee, Gift,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
  restaurant: UtensilsCrossed, supermarche: ShoppingBag, pharmacie: Pill,
  electronique: Smartphone, mode: Shirt, cafe: Coffee, cadeau: Gift,
}

interface Category { id: string; name: string; slug: string; color: string | null }
interface Vendor {
  id: string; name: string; description: string | null
  city: string | null; rating: number | null; delivery_fee: number | null
  logo_url: string | null; is_verified: boolean; status: string
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
      setVendors(vendorsRes)
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/marketplace" className="p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher un vendeur..." value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card/50 border-border/30 rounded-full h-9 text-sm" />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <button onClick={() => handleCat("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              catFilter === "all" ? "bg-quickgo-blue text-white" : "bg-card/50 text-muted-foreground hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Tous
          </button>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] ?? ShoppingBag
            return (
              <button key={cat.id} onClick={() => handleCat(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  catFilter === cat.slug ? "bg-quickgo-blue text-white" : "bg-card/50 text-muted-foreground hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {cat.name}
              </button>
            )
          })}
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? "Chargement…" : `${vendors.length} vendeur${vendors.length > 1 ? "s" : ""} trouvé${vendors.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-card/30 animate-pulse" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun vendeur trouvé</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vendors.map((vendor, i) => {
              const catSlug = vendor.category?.slug ?? ""
              const CatIcon = CATEGORY_ICONS[catSlug] ?? ShoppingBag
              return (
                <motion.div key={vendor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/marketplace/shops/${vendor.id}`}
                    className="block bg-card/50 border border-border/30 rounded-2xl overflow-hidden hover:border-quickgo-blue/30 transition-all group"
                  >
                    {/* Image */}
                    <div className="relative h-36 bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/10">
                      {vendor.logo_url ? (
                        <Image src={vendor.logo_url} alt={vendor.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CatIcon className="w-12 h-12 text-quickgo-blue/30" />
                        </div>
                      )}
                      <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 transition-colors"
                        onClick={(e) => toggleFavorite(e, vendor.id)}
                        aria-label={favorites.has(vendor.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${favorites.has(vendor.id) ? "text-red-400 fill-red-400" : "text-white"}`} />
                      </button>
                      {vendor.is_verified && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-quickgo-blue/90 text-white text-[10px] font-medium">
                          ✓ Vérifié
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-white font-semibold text-sm truncate">{vendor.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {vendor.category?.name ?? "—"}
                        {vendor.city ? ` · ${vendor.city}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {vendor.rating != null && (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <Star className="w-3 h-3 fill-current" /> {vendor.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> 25–40 min
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Bike className="w-3 h-3" />
                          {vendor.delivery_fee != null ? formatCFA(vendor.delivery_fee) : "—"}
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
