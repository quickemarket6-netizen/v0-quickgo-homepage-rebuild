"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Heart, ShoppingCart, Trash2, Star, Grid3X3, List,
  ArrowLeft, Bike, Search,
} from "lucide-react"
import { useCart } from "@/lib/store/cart"

interface FavoriteItem {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string; name: string; price: number; original_price: number | null
    image_url: string | null; images: string[] | null; rating: number | null
    stock_quantity: number | null; description: string | null
    vendor: { id: string; name: string; slug: string; delivery_fee: number | null } | null
  } | null
}

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const { addItem } = useCart()

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/favorites")
      if (r.ok) setFavorites(await r.json())
      else if (r.status === 401) setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  const removeFavorite = async (productId: string) => {
    setRemoving((s) => new Set(s).add(productId))
    await fetch(`/api/favorites?product_id=${productId}`, { method: "DELETE" })
    setFavorites((prev) => prev.filter((f) => f.product_id !== productId))
    setRemoving((s) => { const n = new Set(s); n.delete(productId); return n })
  }

  const addToCart = (fav: FavoriteItem) => {
    if (!fav.product) return
    addItem({
      id: fav.product.id,
      name: fav.product.name,
      price: fav.product.price,
      image: fav.product.image_url ?? fav.product.images?.[0],
      vendorId: fav.product.vendor?.id,
      vendorName: fav.product.vendor?.name,
    })
  }

  const filtered = favorites.filter((f) =>
    !search || f.product?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/marketplace" className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Heart className="w-6 h-6 text-destructive fill-current" /> Mes Favoris
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {loading ? "Chargement…" : `${favorites.length} article${favorites.length > 1 ? "s" : ""} sauvegardé${favorites.length > 1 ? "s" : ""}`}
              </p>
            </div>
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-9 pr-4 py-2 h-9 rounded-full bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="flex gap-1">
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-xl" onClick={() => setView("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-xl" onClick={() => setView("list")}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-card/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {search ? "Aucun résultat" : "Votre liste de favoris est vide"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {search ? "Essayez d'autres termes." : "Explorez notre marketplace et ajoutez des produits à vos favoris."}
              </p>
              <Link href="/marketplace">
                <Button size="lg" className="rounded-xl">Explorer le marketplace</Button>
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {filtered.map((fav, i) => {
                  if (!fav.product) return null
                  const p = fav.product
                  const img = p.image_url ?? p.images?.[0] ?? null
                  const inStock = (p.stock_quantity ?? 1) > 0
                  const discount = p.original_price && p.original_price > p.price
                    ? Math.round((1 - p.price / p.original_price) * 100) : null

                  if (view === "list") {
                    return (
                      <motion.div key={fav.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                        className="flex gap-4 bg-card border border-border/50 rounded-2xl p-4 items-center"
                      >
                        <Link href={`/marketplace/product/${p.id}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                          {img && <Image src={img} alt={p.name} fill className="object-cover" sizes="80px" />}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/marketplace/product/${p.id}`}>
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">{p.name}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground">{p.vendor?.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-lg font-bold text-foreground">{formatPrice(p.price)}</span>
                            {p.original_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(p.original_price)}</span>}
                            {p.rating != null && (
                              <span className="flex items-center gap-1 text-xs text-yellow-500"><Star className="w-3 h-3 fill-current" />{p.rating.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl text-destructive hover:text-destructive border-destructive/30"
                            disabled={removing.has(fav.product_id)} onClick={() => removeFavorite(fav.product_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="h-9 rounded-xl gap-2" disabled={!inStock} onClick={() => addToCart(fav)}>
                            <ShoppingCart className="w-4 h-4" /> Ajouter
                          </Button>
                        </div>
                      </motion.div>
                    )
                  }

                  return (
                    <motion.div key={fav.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}>
                      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                        {/* Image */}
                        <div className="relative h-48 bg-muted/30">
                          <Link href={`/marketplace/product/${p.id}`}>
                            {img && <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" />}
                          </Link>
                          {discount && (
                            <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
                          )}
                          {!inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">Rupture de stock</span>
                            </div>
                          )}
                          <button className="absolute top-2 right-2 p-2 rounded-full bg-destructive/90 hover:bg-destructive transition-colors"
                            disabled={removing.has(fav.product_id)} onClick={() => removeFavorite(fav.product_id)}>
                            <Heart className="w-3.5 h-3.5 text-white fill-current" />
                          </button>
                        </div>
                        {/* Info */}
                        <div className="p-4">
                          <Link href={`/marketplace/product/${p.id}`}>
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-sm mb-1">{p.name}</h3>
                          </Link>
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-xs text-muted-foreground">{p.vendor?.name}</p>
                            {p.vendor?.delivery_fee != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Bike className="w-3 h-3" />{p.vendor.delivery_fee === 0 ? "Gratuite" : formatPrice(p.vendor.delivery_fee)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-foreground">{formatPrice(p.price)}</p>
                              {p.original_price && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.original_price)}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {p.rating != null && (
                                <span className="flex items-center gap-0.5 text-xs text-yellow-500"><Star className="w-3 h-3 fill-current" />{p.rating.toFixed(1)}</span>
                              )}
                              <Button size="icon" className="h-8 w-8 rounded-xl" disabled={!inStock} onClick={() => addToCart(fav)}>
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
