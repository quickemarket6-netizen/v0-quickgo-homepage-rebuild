"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Search, Star, Heart, ShoppingCart, SlidersHorizontal,
  ArrowLeft, ChevronDown, X, Bike, Plus, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/store/cart"
import { FeaturedHero } from "@/components/marketplace/FeaturedHero"

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
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const { addItem } = useCart()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  const fetchProducts = useCallback(async (q: string, cat: string, pg: number, srt: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pg * LIMIT) })
      if (q) params.set("search", q)
      if (cat) params.set("category", cat)
      if (srt && srt !== "newest") params.set("sort", srt)
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
    fetchProducts(search, catFilter, 0, sort)
  }, [catFilter, sort, fetchProducts]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); fetchProducts(val, catFilter, 0, sort) }, 350)
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
          <Link href="/marketplace" className="p-2 hover:bg-white/5 rounded-full transition-colors">
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
          <Link href="/marketplace/cart" className="relative p-2.5 rounded-full bg-[#16161f] border border-[#1e1e2e] hover:border-[#3b82f6]/40 transition-colors shrink-0">
            <ShoppingCart className="w-4 h-4 text-white/60" />
          </Link>
        </div>

        {/* Categories — animated active indicator */}
        <div className="max-w-6xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => { setCatFilter(""); setPage(0) }}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              catFilter === "" ? "text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
            }`}
          >
            {catFilter === "" && (
              <motion.span layoutId="catIndicator" className="absolute inset-0 rounded-full bg-[#3b82f6]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span className="relative z-10">Tous</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCatFilter(cat.slug); setPage(0) }}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                catFilter === cat.slug ? "text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
              }`}
            >
              {catFilter === cat.slug && (
                <motion.span layoutId="catIndicator" className="absolute inset-0 rounded-full"
                  style={{ background: cat.color ?? "#3b82f6" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
              <span className="relative z-10">{cat.name}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Hero — only on the default view (no search / no category) */}
        {!search && !catFilter && <FeaturedHero />}

        {/* Section title + sort bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {catFilter ? categories.find((c) => c.slug === catFilter)?.name ?? "Produits" : search ? "Résultats" : "Tous les produits"}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/40 mt-0.5">
              {loading ? "Chargement…" : `${total} produit${total > 1 ? "s" : ""}`}
            </motion.p>
          </div>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-[#16161f] border border-[#1e1e2e] text-white/60 text-xs rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Grid */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                className="h-72 rounded-2xl bg-[#16161f]" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <motion.p animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl mb-4">🔍</motion.p>
            <p className="text-white/40">Aucun produit trouvé</p>
            {(search || catFilter) && (
              <Button size="sm" variant="outline" className="mt-4 rounded-xl border-[#1e1e2e] text-white/40"
                onClick={() => { setSearch(""); setCatFilter(""); setPage(0); fetchProducts("", "", 0, sort) }}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {sorted.map((p, i) => {
                const img = p.image_url ?? p.images?.[0] ?? null
                const discount = p.original_price && p.original_price > p.price
                  ? Math.round((1 - p.price / p.original_price) * 100) : null
                const inStock = (p.stock_quantity ?? 1) > 0
                const isFav = favorites.has(p.id)
                const freeDelivery = p.vendor?.delivery_fee === 0

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3), type: "spring", stiffness: 120, damping: 18 }}
                  >
                    <Link href={`/marketplace/product/${p.id}`}
                      className="group block bg-[#14141c] border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-[#3b82f6]/40 hover:shadow-[0_10px_40px_-8px_rgba(59,130,246,0.35)] transition-all duration-300">
                      {/* Image */}
                      <div className="relative aspect-square bg-gradient-to-br from-[#1c1c28] to-[#101018] overflow-hidden">
                        {img ? (
                          <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width:640px) 50vw, 25vw" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-10 h-10 text-white/10" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                          {discount && (
                            <span className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">-{discount}%</span>
                          )}
                          {freeDelivery && (
                            <span className="bg-[#a3e635] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow inline-flex items-center gap-1">
                              <Bike className="w-2.5 h-2.5" /> Gratuit
                            </span>
                          )}
                        </div>

                        {/* Wishlist */}
                        <button
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isFav ? "bg-[#ef4444]/90" : "bg-black/40 hover:bg-black/60"}`}
                          onClick={(e) => toggleFavorite(p.id, e)}
                          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
                          <Heart className={`w-4 h-4 ${isFav ? "text-white fill-current" : "text-white"}`} />
                        </button>

                        {!inStock && (
                          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                            <span className="text-white/80 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/20">Rupture de stock</span>
                          </div>
                        )}

                        {/* Quick add — slides up on hover */}
                        {inStock && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              addItem({ id: p.id, name: p.name, price: p.price, image: img ?? undefined, vendorId: p.vendor?.id ?? undefined, vendorName: p.vendor?.name ?? undefined })
                            }}
                            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white flex items-center justify-center shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                            aria-label="Ajouter au panier">
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-white text-[13px] font-semibold line-clamp-2 leading-snug mb-1 group-hover:text-[#3b82f6] transition-colors">{p.name}</p>
                        <p className="text-white/30 text-[11px] mb-2 truncate">{p.vendor?.name ?? "QuickGo"}</p>
                        <div className="flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[#a3e635] font-black text-[15px] leading-none">{formatPrice(p.price)}</p>
                            {p.original_price && p.original_price > p.price && (
                              <p className="text-white/25 text-[10px] line-through mt-0.5">{formatPrice(p.original_price)}</p>
                            )}
                          </div>
                          {p.rating != null && p.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-[#eab308] bg-[#eab308]/10 px-1.5 py-0.5 rounded-md shrink-0">
                              <Star className="w-3 h-3 fill-current" />{p.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Load more */}
            {products.length < total && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  className={`rounded-full px-8 border-[#1e1e2e] text-white/60 hover:text-white hover:border-[#3b82f6]/50 transition-all ${loading ? "animate-pulse" : ""}`}
                  onClick={() => { const np = page + 1; setPage(np); fetchProducts(search, catFilter, np, sort) }}
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
