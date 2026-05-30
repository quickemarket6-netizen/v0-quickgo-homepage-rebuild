"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Search, Star, Heart, ShoppingCart, SlidersHorizontal,
  ArrowLeft, ChevronDown, X, Bike,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/store/cart"

interface Product {
  id: string; name: string; price: number; original_price: number | null
  image_url: string | null; images: string[] | null; rating: number | null
  stock_quantity: number | null
  vendor: { id: string; name: string; slug: string; delivery_fee: number | null } | null
  category: { id: string; name: string; slug: string; color: string | null } | null
}
interface Category { id: string; name: string; slug: string; color: string | null }

const SORT_OPTIONS = [
  { value: "newest",    label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc",label: "Prix décroissant" },
  { value: "rating",    label: "Mieux notés" },
]

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA"

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const initialCat = searchParams.get("cat") ?? ""
  const initialQ   = searchParams.get("q") ?? ""

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialQ)
  const [catFilter, setCatFilter] = useState(initialCat)
  const [sort, setSort] = useState("newest")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const { addItem } = useCart()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  const fetchProducts = useCallback(async (q: string, cat: string, pg: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pg * LIMIT) })
      if (q) params.set("search", q)
      if (cat) params.set("category", cat)
      const r = await fetch(`/api/products?${params}`)
      if (r.ok) {
        const json = await r.json()
        setProducts(pg === 0 ? (json.data ?? []) : (prev: Product[]) => [...prev, ...(json.data ?? [])])
        setTotal(json.count ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch("/api/categories").then((r) => r.ok ? r.json() : []).then(setCategories).catch(() => {})
    fetch("/api/favorites").then((r) => r.ok ? r.json() : [])
      .then((favs: { product_id: string }[]) => setFavorites(new Set(favs.map((f) => f.product_id))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setPage(0)
    fetchProducts(search, catFilter, 0)
  }, [catFilter, fetchProducts]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); fetchProducts(val, catFilter, 0) }, 350)
  }

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (favorites.has(productId)) {
      await fetch(`/api/favorites?product_id=${productId}`, { method: "DELETE" })
      setFavorites((s) => { const n = new Set(s); n.delete(productId); return n })
    } else {
      await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: productId }) })
      setFavorites((s) => new Set(s).add(productId))
    }
  }

  // client-side sort
  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc")  return a.price - b.price
    if (sort === "price_desc") return b.price - a.price
    if (sort === "rating")     return (b.rating ?? 0) - (a.rating ?? 0)
    return 0
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="pl-10 bg-[#16161f] border-[#1e1e2e] rounded-full h-10 text-sm text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-white/30" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-[#1e1e2e] shrink-0"
            onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="max-w-6xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <button onClick={() => { setCatFilter(""); setPage(0) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              catFilter === "" ? "bg-[#3b82f6] text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
            }`}>
            Tous
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => { setCatFilter(cat.slug); setPage(0) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                catFilter === cat.slug ? "text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
              }`}
              style={catFilter === cat.slug ? { background: cat.color ?? "#3b82f6" } : {}}>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Sort + count bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-white/40">
            {loading ? "Chargement…" : `${total} produit${total > 1 ? "s" : ""}`}
          </p>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-[#16161f] border border-[#1e1e2e] text-white/60 text-xs rounded-xl px-3 pr-8 py-2 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Grid */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#16161f] animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-white/40">Aucun produit trouvé</p>
            {(search || catFilter) && (
              <Button size="sm" variant="outline" className="mt-4 rounded-xl border-[#1e1e2e] text-white/40"
                onClick={() => { setSearch(""); setCatFilter(""); setPage(0); fetchProducts("", "", 0) }}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sorted.map((p, i) => {
                const img = p.image_url ?? p.images?.[0] ?? null
                const discount = p.original_price && p.original_price > p.price
                  ? Math.round((1 - p.price / p.original_price) * 100) : null
                const inStock = (p.stock_quantity ?? 1) > 0
                const isFav = favorites.has(p.id)

                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link href={`/marketplace/product/${p.id}`}
                      className="block bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-[#3b82f6]/30 transition-all group">
                      <div className="relative h-44 bg-[#1c1c28]">
                        {img ? (
                          <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="300px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                        {discount && (
                          <span className="absolute top-2 left-2 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
                        )}
                        {!inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white/70 text-xs font-medium">Rupture</span>
                          </div>
                        )}
                        <button className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${isFav ? "bg-[#ef4444]/90" : "bg-black/40 hover:bg-[#ef4444]/80"}`}
                          onClick={(e) => toggleFavorite(p.id, e)}>
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "text-white fill-current" : "text-white"}`} />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">{p.name}</p>
                        <p className="text-white/30 text-[10px] mb-2 truncate">{p.vendor?.name}</p>
                        {p.vendor?.delivery_fee != null && (
                          <p className="text-white/30 text-[10px] flex items-center gap-1 mb-1.5">
                            <Bike className="w-3 h-3" />
                            {p.vendor.delivery_fee === 0 ? "Livraison gratuite" : formatPrice(p.vendor.delivery_fee)}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#a3e635] font-bold text-sm">{formatPrice(p.price)}</p>
                            {p.original_price && <p className="text-white/20 text-[10px] line-through">{formatPrice(p.original_price)}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.rating != null && (
                              <span className="flex items-center gap-0.5 text-[10px] text-[#eab308]">
                                <Star className="w-2.5 h-2.5 fill-current" />{p.rating.toFixed(1)}
                              </span>
                            )}
                            <button
                              className="w-7 h-7 rounded-xl bg-[#3b82f6]/20 hover:bg-[#3b82f6]/40 flex items-center justify-center transition-colors"
                              disabled={!inStock}
                              onClick={(e) => {
                                e.preventDefault()
                                addItem({ id: p.id, name: p.name, price: p.price, image: img ?? undefined, vendorId: p.vendor?.id, vendorName: p.vendor?.name })
                              }}>
                              <ShoppingCart className="w-3.5 h-3.5 text-[#3b82f6]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Load more */}
            {products.length < total && (
              <div className="text-center mt-8">
                <Button variant="outline" className="rounded-xl border-[#1e1e2e] text-white/60 hover:text-white"
                  onClick={() => { const np = page + 1; setPage(np); fetchProducts(search, catFilter, np) }}
                  disabled={loading}>
                  {loading ? "Chargement…" : "Charger plus de produits"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
