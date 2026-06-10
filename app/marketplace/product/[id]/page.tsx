"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/store/cart"
import {
  Star, Heart, ShoppingCart, Plus, Minus, ChevronLeft,
  Truck, Shield, RotateCcw, Check, Store, Clock,
  Zap, MapPin, Phone, ArrowRight, Share2,
} from "lucide-react"

interface Product {
  id: string; name: string; price: number; original_price: number | null
  description: string | null; stock_quantity: number | null; rating: number | null
  images: string[] | null; image_url: string | null; is_available: boolean
  vendor: {
    id: string; name: string; slug: string; rating: number | null
    phone: string | null; address: string | null
    delivery_fee: number | null; is_open: boolean | null
  } | null
  category: { id: string; name: string; slug: string; color: string | null } | null
}

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA"

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addItem, items } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.ok ? r.json() : null
      })
      .then((data) => { if (data) setProduct(data) })
      .finally(() => setLoading(false))

    // check if already in favorites
    fetch(`/api/favorites`)
      .then((r) => r.ok ? r.json() : [])
      .then((favs: { product_id: string }[]) => setIsFavorite(favs.some((f) => f.product_id === id)))
      .catch(() => {})
  }, [id])

  const cartQty = items.find((i) => i.id === id)?.quantity ?? 0

  const toggleFavorite = async () => {
    setFavLoading(true)
    if (isFavorite) {
      await fetch(`/api/favorites?product_id=${id}`, { method: "DELETE" })
      setIsFavorite(false)
      toast.info("Retiré des favoris")
    } else {
      const r = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: id }) })
      if (r.ok || r.status === 400) { setIsFavorite(true); toast.success("Ajouté aux favoris") }
      else if (r.status === 401) { toast.error("Connectez-vous pour sauvegarder des favoris") }
    }
    setFavLoading(false)
  }

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url ?? product.images?.[0],
        vendorId: product.vendor?.id,
        vendorName: product.vendor?.name,
      })
    }
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity }),
    }).catch(() => {})
    toast.success(`${quantity}× ${product.name} ajouté au panier`, {
      action: { label: "Voir le panier", onClick: () => router.push("/marketplace/cart") },
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push("/marketplace/checkout")
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 lg:pt-24 max-w-6xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square rounded-3xl bg-card/30 animate-pulse" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({length:4}).map((_,i) => <div key={i} className="aspect-square rounded-xl bg-card/30 animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({length:6}).map((_,i) => <div key={i} className="h-8 rounded-xl bg-card/30 animate-pulse" style={{width:`${80-i*10}%`}} />)}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Produit introuvable</h1>
          <p className="text-muted-foreground mb-6">Ce produit n&apos;existe pas ou a été supprimé.</p>
          <Link href="/marketplace"><Button className="rounded-xl">Retour au marketplace</Button></Link>
        </div>
        <Footer />
      </main>
    )
  }

  const images = [product.image_url, ...(product.images ?? [])].filter(Boolean) as string[]
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : null
  const inStock = product.is_available && (product.stock_quantity == null || product.stock_quantity > 0)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-32 lg:pb-20">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={`/marketplace/shops?cat=${product.category.slug}`} className="hover:text-foreground transition-colors">{product.category.name}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">{product.name}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* ── Images ── */}
            <div className="space-y-4">
              <motion.div className="relative aspect-square rounded-3xl overflow-hidden bg-card/50 border border-border/30 group"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {images.length > 0 ? (
                  <Image src={images[selectedImg]} alt={product.name} fill className="object-cover" sizes="600px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
                {discount && (
                  <div className="absolute top-4 left-4 bg-destructive text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</div>
                )}
                <button className="absolute top-4 right-4 p-2.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  onClick={toggleFavorite} disabled={favLoading}>
                  <Heart className={`w-5 h-5 transition-colors ${isFavorite ? "text-destructive fill-current" : "text-foreground"}`} />
                </button>
              </motion.div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.slice(0, 4).map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${i === selectedImg ? "border-primary" : "border-border/30"}`}>
                      <Image src={img} alt={`${product.name} ${i+1}`} fill className="object-cover" sizes="120px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {product.category && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${product.category.color ?? "#3b82f6"}20`, color: product.category.color ?? "#3b82f6" }}>
                  {product.category.name}
                </span>
              )}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">{product.name}</h1>
                {product.rating != null && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {Array.from({length:5}).map((_,i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating!) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-foreground">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through mb-0.5">{formatPrice(product.original_price)}</span>
                )}
              </div>

              {/* Stock */}
              <div className={`flex items-center gap-2 text-sm font-medium ${inStock ? "text-green-500" : "text-destructive"}`}>
                {inStock ? <Check className="w-4 h-4" /> : null}
                {inStock
                  ? product.stock_quantity != null && product.stock_quantity < 10
                    ? `Plus que ${product.stock_quantity} en stock`
                    : "En stock"
                  : "Rupture de stock"}
              </div>

              {product.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              )}

              {/* Quantity + Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-muted transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity((q) => Math.min(product.stock_quantity ?? 99, q + 1))} className="px-4 py-3 hover:bg-muted transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">Total : <span className="font-bold text-foreground">{formatPrice(product.price * quantity)}</span></span>
                </div>
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1 h-14 rounded-xl gap-2" disabled={!inStock} onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5" />
                    {cartQty > 0 ? `Ajouter (${cartQty} déjà)` : "Ajouter au panier"}
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 h-14 rounded-xl gap-2" disabled={!inStock} onClick={handleBuyNow}>
                    <Zap className="w-5 h-5" /> Commander
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Truck, label: `Livraison ${product.vendor?.delivery_fee === 0 ? "gratuite" : product.vendor?.delivery_fee != null ? formatPrice(product.vendor.delivery_fee) : "disponible"}` },
                  { icon: Shield, label: "Paiement sécurisé" },
                  { icon: RotateCcw, label: "Retour 7 jours" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/30 text-center">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* Vendor */}
              {product.vendor && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/30">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{product.vendor.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {product.vendor.rating != null && (
                        <span className="flex items-center gap-1 text-xs text-yellow-500">
                          <Star className="w-3 h-3 fill-current" />{product.vendor.rating.toFixed(1)}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs ${product.vendor.is_open ? "text-green-500" : "text-muted-foreground"}`}>
                        <Clock className="w-3 h-3" />
                        {product.vendor.is_open ? "Ouvert" : "Fermé"}
                      </span>
                      {product.vendor.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <MapPin className="w-3 h-3" />{product.vendor.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {product.vendor.phone && (
                      <a href={`tel:${product.vendor.phone}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><Phone className="w-4 h-4" /></Button>
                      </a>
                    )}
                    <Link href={`/marketplace/shops/${product.vendor.id}`}>
                      <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1">Boutique <ArrowRight className="w-3 h-3" /></Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-sm text-muted-foreground">Partager ce produit</span>
                <Button variant="ghost" size="sm" className="gap-2 rounded-xl" onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}>
                  <Share2 className="w-4 h-4" /> Partager
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
