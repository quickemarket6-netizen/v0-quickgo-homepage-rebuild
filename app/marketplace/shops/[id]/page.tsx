"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import {
  ArrowLeft, Search, Star, Clock, Bike, BadgeCheck, Heart, Share2,
  Package, Plus, MapPin, Phone, ShoppingBag, Store,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/store/cart"

interface ShopCategory { id: string; name: string; slug: string }
interface ShopProduct {
  id: string; name: string; price: number; original_price: number | null
  image_url: string | null; images: string[] | null
  rating: number | null; stock_quantity: number | null; is_available: boolean
  category: ShopCategory | null
}
interface Shop {
  id: string; name: string; slug: string | null; description: string | null
  city: string | null; address: string | null; phone: string | null
  rating: number | null; review_count: number | null
  delivery_fee: number | null; delivery_time_min: number | null
  logo_url: string | null; cover_url: string | null
  is_verified: boolean; is_open: boolean | null
  category: { id: string; name: string; slug: string; color: string | null } | null
}
interface Review {
  id: string; rating: number; comment: string | null
  created_at: string; customer_name: string; customer_avatar: string | null
}

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " F"

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addItem } = useCart()

  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<{ count: number; average: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetch(`/api/vendors/${id}`).then((r) => (r.status === 404 ? "404" : r.ok ? r.json() : null)),
      fetch(`/api/reviews?vendor_id=${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([shopData, reviewData]) => {
        if (shopData === "404" || !shopData) { setNotFound(true); return }
        setShop(shopData.vendor)
        setProducts(shopData.products ?? [])
        if (reviewData) {
          setReviews(reviewData.reviews ?? [])
          setReviewStats(reviewData.stats ?? null)
        }
      })
      .finally(() => setLoading(false))

    try {
      const stored = JSON.parse(localStorage.getItem("qg_fav_vendors") ?? "[]")
      if (Array.isArray(stored)) setIsFav(stored.includes(id))
    } catch { /* ignore */ }
  }, [id])

  const toggleFav = () => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem("qg_fav_vendors") ?? "[]")
      const next = stored.includes(id) ? stored.filter((v) => v !== id) : [...stored, id]
      localStorage.setItem("qg_fav_vendors", JSON.stringify(next))
      setIsFav(next.includes(id))
    } catch { /* ignore */ }
  }

  const share = () => {
    if (navigator.share && shop) {
      navigator.share({ title: shop.name, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(window.location.href)
      toast.success("Lien copié")
    }
  }

  const quickAdd = (p: ShopProduct) => {
    const img = p.image_url ?? p.images?.[0] ?? undefined
    addItem({ id: p.id, name: p.name, price: p.price, image: img, vendorId: shop?.id, vendorName: shop?.name })
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: p.id, quantity: 1 }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((dbItem: { id?: string } | null) => {
        if (dbItem?.id) useCart.getState().patchItem(p.id, { cartItemDbId: dbItem.id })
      })
      .catch(() => {})
    toast.success(`${p.name} ajouté au panier`, {
      action: { label: "Voir le panier", onClick: () => router.push("/marketplace/cart") },
    })
  }

  // Catégories dérivées du catalogue de la boutique
  const shopCategories = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) if (p.category) map.set(p.category.slug, p.category.name)
    return [...map.entries()].map(([slug, name]) => ({ slug, name }))
  }, [products])

  const visibleProducts = useMemo(() => {
    let list = products
    if (catFilter !== "all") list = list.filter((p) => p.category?.slug === catFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }, [products, catFilter, search])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="h-56 md:h-72 bg-[#14141c] animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 -mt-14 space-y-4">
          <div className="h-36 rounded-3xl bg-[#16161f] animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#16161f] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 px-4">
        <Store className="w-14 h-14 text-white/10" />
        <p className="text-white/50">Cette boutique n'existe pas ou n'est plus disponible.</p>
        <Link href="/marketplace/shops">
          <Button className="rounded-full bg-[#3b82f6] hover:bg-[#3b82f6]/90">Voir les boutiques</Button>
        </Link>
      </div>
    )
  }

  const freeDelivery = shop.delivery_fee === 0
  const deliveryMin = shop.delivery_time_min ?? 25
  const ratingValue = reviewStats?.count ? reviewStats.average : shop.rating
  const ratingCount = reviewStats?.count ?? shop.review_count ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-16">

      {/* ── Cover hero ── */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {shop.cover_url ? (
          <Image src={shop.cover_url} alt={shop.name} fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/30 via-[#14141c] to-[#06b6d4]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-black/30" />

        {/* Floating controls */}
        <div className="absolute top-4 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button onClick={() => router.back()} aria-label="Retour"
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button onClick={toggleFav} aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${isFav ? "bg-[#ef4444]/90" : "bg-black/50 hover:bg-black/70"}`}>
                <Heart className={`w-5 h-5 text-white ${isFav ? "fill-current" : ""}`} />
              </button>
              <button onClick={share} aria-label="Partager"
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Shop info card ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#14141c]/95 backdrop-blur-xl border border-[#1e1e2e] rounded-3xl p-5 md:p-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-[#1e1e2e] shadow-xl shrink-0 -mt-12 md:-mt-14 bg-[#14141c]">
              {shop.logo_url ? (
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
                  <span className="text-white font-black text-3xl">{shop.name.charAt(0)}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-white truncate">{shop.name}</h1>
                {shop.is_verified && <BadgeCheck className="w-5 h-5 text-[#3b82f6] shrink-0" />}
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${shop.is_open ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-white/5 text-white/40"}`}>
                  {shop.is_open ? "Ouvert" : "Fermé"}
                </span>
              </div>
              <p className="text-sm text-white/40 mt-0.5 truncate">
                {shop.category?.name ?? "Boutique"}{shop.city ? ` · ${shop.city}` : ""}
              </p>
              {shop.description && (
                <p className="text-xs text-white/50 mt-1.5 line-clamp-2 max-w-2xl">{shop.description}</p>
              )}
            </div>
          </div>

          {/* Chips */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-[#eab308] bg-[#eab308]/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold">{ratingValue != null && ratingValue > 0 ? Number(ratingValue).toFixed(1) : "Nouveau"}</span>
              {ratingCount > 0 && <span className="text-[#eab308]/60 text-xs">({ratingCount} avis)</span>}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" /> {deliveryMin}–{deliveryMin + 15} min
            </span>
            <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full ${freeDelivery ? "text-[#a3e635] bg-[#a3e635]/10" : "text-white/60 bg-white/5"}`}>
              <Bike className="w-4 h-4" />
              {shop.delivery_fee != null ? (freeDelivery ? "Livraison gratuite" : formatPrice(shop.delivery_fee)) : "Livraison disponible"}
            </span>
            {shop.address && (
              <span className="flex items-center gap-1.5 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-full max-w-[220px]">
                <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate">{shop.address}</span>
              </span>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`}
                className="flex items-center gap-1.5 text-sm text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-full hover:bg-[#3b82f6]/20 transition-colors">
                <Phone className="w-4 h-4" /> Appeler
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Toolbar : recherche + catégories ── */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] mt-6 px-4 py-3">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input placeholder={`Rechercher chez ${shop.name}…`} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#16161f] border-[#1e1e2e] rounded-full h-10 text-sm text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
          </div>
          {shopCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              <button onClick={() => setCatFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  catFilter === "all" ? "bg-[#3b82f6] text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
                }`}>
                Tout ({products.length})
              </button>
              {shopCategories.map((cat) => (
                <button key={cat.slug} onClick={() => setCatFilter(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    catFilter === cat.slug ? "bg-[#3b82f6] text-white" : "bg-[#16161f] text-white/40 hover:text-white border border-[#1e1e2e]"
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Products grid ── */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {visibleProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">
              {products.length === 0 ? "Cette boutique n'a pas encore de produits" : "Aucun produit ne correspond à votre recherche"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {visibleProducts.map((p, i) => {
              const img = p.image_url ?? p.images?.[0] ?? null
              const discount = p.original_price && p.original_price > p.price
                ? Math.round((1 - p.price / p.original_price) * 100) : null
              const inStock = p.is_available && (p.stock_quantity ?? 1) > 0

              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), type: "spring", stiffness: 120, damping: 18 }}>
                  <Link href={`/marketplace/product/${p.id}`}
                    className="group block bg-[#14141c] border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-[#3b82f6]/40 hover:shadow-[0_10px_40px_-8px_rgba(59,130,246,0.35)] transition-all duration-300">
                    <div className="relative aspect-square bg-gradient-to-br from-[#1c1c28] to-[#101018] overflow-hidden">
                      {img ? (
                        <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width:640px) 50vw, 25vw" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-10 h-10 text-white/10" />
                        </div>
                      )}

                      {discount && (
                        <span className="absolute top-2 left-2 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">-{discount}%</span>
                      )}

                      {!inStock && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          <span className="text-white/80 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/20">Rupture de stock</span>
                        </div>
                      )}

                      {inStock && (
                        <button
                          onClick={(e) => { e.preventDefault(); quickAdd(p) }}
                          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white flex items-center justify-center shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                          aria-label="Ajouter au panier">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-white text-[13px] font-semibold line-clamp-2 leading-snug mb-2 group-hover:text-[#3b82f6] transition-colors">{p.name}</p>
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
        )}

        {/* ── Reviews ── */}
        {reviewStats && reviewStats.count > 0 && (
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Avis clients</h2>
              <span className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-[#eab308] fill-current" />
                <span className="font-bold text-white">{reviewStats.average.toFixed(1)}</span>
                <span className="text-white/40">({reviewStats.count} avis)</span>
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {reviews.slice(0, 6).map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-[#14141c] border border-[#1e1e2e]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-white">{r.customer_name}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "text-[#eab308] fill-current" : "text-white/15"}`} />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="text-xs text-white/50 leading-relaxed">{r.comment}</p>}
                  <p className="text-[10px] text-white/25 mt-2">
                    {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
