"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/store/cart"
import type { CartItem } from "@/lib/store/cart"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Truck,
  Shield,
  Tag,
  X,
  Check,
  Zap,
  PackageOpen,
  Loader2,
} from "lucide-react"

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

interface ApiCartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
    vendor: { id: string; name: string } | null
  } | null
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, setItems, getTotalPrice } = useCart()
  const [promoCode, setPromoCode]           = useState("")
  const [promoApplied, setPromoApplied]     = useState(false)
  const [promoDiscount, setPromoDiscount]   = useState(0)
  const [promoDescription, setPromoDescription] = useState("")
  const [promoLoading, setPromoLoading]     = useState(false)
  const [promoError, setPromoError]         = useState("")

  // Merge DB cart into local Zustand store on mount.
  // Strategy: patch existing Zustand items with cartItemDbId+DB quantity,
  // add DB-only items (other session/device), keep Zustand-only items untouched
  // so articles added from /products or /favorites are never silently dropped.
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.ok ? r.json() : null)
      .then((data: ApiCartItem[] | null) => {
        if (!data || data.length === 0) return

        // Build a map: product_id → DB cart row
        const dbMap = new Map(
          data
            .filter((d) => d.product != null)
            .map((d) => [d.product!.id, d])
        )

        // Snapshot current local state without adding a render dependency
        const current = useCart.getState().items
        const seen = new Set<string>()

        // Patch local items that exist in DB; leave local-only items untouched
        const patched = current.map((item) => {
          seen.add(item.id)
          const db = dbMap.get(item.id)
          return db ? { ...item, cartItemDbId: db.id, quantity: db.quantity } : item
        })

        // Append DB items that have no local counterpart (added from another device/session)
        const dbOnly: CartItem[] = data
          .filter((d) => d.product != null && !seen.has(d.product!.id))
          .map((d) => ({
            id:           d.product!.id,
            cartItemDbId: d.id,
            name:         d.product!.name,
            price:        d.product!.price,
            quantity:     d.quantity,
            image:        d.product!.image_url ?? undefined,
            vendorId:     d.product!.vendor?.id,
            vendorName:   d.product!.vendor?.name,
          }))

        setItems([...patched, ...dbOnly])
      })
      .catch(() => {})
  }, [setItems])

  // Aligné sur le calcul serveur : sous-total + 2% de frais de service.
  // Les frais de livraison dépendent de l'option choisie et du nombre de
  // boutiques — ils sont calculés au checkout, pas inventés ici.
  const subtotal   = getTotalPrice()
  const serviceFee = Math.round(subtotal * 0.02)
  const total      = subtotal + serviceFee - promoDiscount

  const applyPromo = async () => {
    if (!promoCode) return
    setPromoLoading(true)
    setPromoError("")
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromoApplied(true)
        setPromoDiscount(data.discount ?? 0)
        setPromoDescription(data.description ?? `Code ${promoCode.toUpperCase()} appliqué`)
        // Transmis au checkout pour ne pas avoir à le retaper
        try { sessionStorage.setItem("quickgo-promo", promoCode.trim()) } catch { /* stockage indisponible */ }
      } else {
        setPromoError("Code promo invalide ou expiré")
      }
    } catch {
      setPromoError("Erreur lors de la validation du code")
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemove = (item: CartItem) => {
    // Always attempt the DB delete: prefer the UUID, fall back to product_id
    const url = item.cartItemDbId
      ? `/api/cart?id=${item.cartItemDbId}`
      : `/api/cart?product_id=${item.id}`
    fetch(url, { method: "DELETE" }).catch(() => {})
    removeItem(item.id)
  }

  const handleUpdateQuantity = (item: CartItem, qty: number) => {
    if (item.cartItemDbId) {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.cartItemDbId, quantity: qty }),
      }).catch(() => {})
    }
    updateQuantity(item.id, qty)
  }

  const handleClearCart = () => {
    fetch("/api/cart?clearAll=true", { method: "DELETE" }).catch(() => {})
    clearCart()
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 lg:pt-24 pb-32 lg:pb-20">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Mon Panier</h1>
            <p className="text-muted-foreground">
              {items.length} article{items.length !== 1 && "s"} dans votre panier
            </p>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {items.length > 0 ? (
              <motion.div
                key="cart-items"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid lg:grid-cols-3 gap-8"
              >
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Delivery Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-secondary/30">
                        <Zap className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Livraison Express disponible</p>
                        <p className="text-sm text-muted-foreground">Recevez votre commande en 30 min - 1h</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Items */}
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 lg:p-6 rounded-2xl bg-card border border-border/50"
                      >
                        <div className="flex gap-4">
                          <Link href={`/marketplace/product/${item.id}`} className="shrink-0">
                            <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-muted/30">
                              {item.image && (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 96px, 128px"
                                />
                              )}
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">{item.brand}</p>
                                <Link href={`/marketplace/product/${item.id}`}>
                                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                                    {item.name}
                                  </h3>
                                </Link>
                                {item.color && (
                                  <p className="text-sm text-muted-foreground mt-1">Couleur: {item.color}</p>
                                )}
                                {(item.vendor ?? item.vendorName) && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Vendeur: {item.vendor ?? item.vendorName}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemove(item)}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-end justify-between mt-4">
                              <div className="flex items-center border border-border rounded-xl">
                                <button
                                  onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                  className="p-2 hover:bg-muted transition-colors rounded-l-xl"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                  className="p-2 hover:bg-muted transition-colors rounded-r-xl"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-lg font-bold text-foreground">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear Cart */}
                  <button
                    onClick={handleClearCart}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Vider le panier
                  </button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky top-24 p-6 rounded-2xl bg-card border border-border/50"
                  >
                    <h2 className="text-xl font-bold text-foreground mb-6">Résumé de la commande</h2>

                    {/* Promo Code */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-foreground mb-2 block">Code promo</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Entrez votre code"
                            value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value); setPromoError("") }}
                            className="pl-10"
                            disabled={promoApplied}
                            onKeyDown={(e) => e.key === "Enter" && !promoApplied && applyPromo()}
                          />
                        </div>
                        <Button variant="outline" onClick={applyPromo} disabled={promoApplied || !promoCode || promoLoading}>
                          {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : promoApplied ? <Check className="w-4 h-4" /> : "Appliquer"}
                        </Button>
                      </div>
                      {promoApplied && (
                        <p className="text-sm text-secondary mt-2 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          {promoDescription}
                        </p>
                      )}
                      {promoError && (
                        <p className="text-sm text-destructive mt-2">{promoError}</p>
                      )}
                    </div>

                    {/* Summary Lines */}
                    <div className="space-y-3 pb-6 border-b border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span className="text-foreground">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frais de service (2%)</span>
                        <span className="text-foreground">{formatPrice(serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span className="text-muted-foreground text-xs">Calculée à l&apos;étape suivante</span>
                      </div>
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Réduction</span>
                          <span className="text-secondary">-{formatPrice(promoDiscount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="py-6">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-foreground">Total (hors livraison)</span>
                        <span className="text-2xl font-bold text-foreground">{formatPrice(total)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Frais de livraison selon l&apos;option choisie (Express, Standard, Programmé), par boutique.
                      </p>
                    </div>

                    {/* Checkout Button */}
                    <Link href="/marketplace/checkout">
                      <Button className="w-full h-14 rounded-xl text-base" size="lg">
                        Passer la commande
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>

                    {/* Trust Badges */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>Paiement sécurisé</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="w-4 h-4 text-primary" />
                        <span>Livraison rapide</span>
                      </div>
                    </div>

                  </motion.div>
                </div>
              </motion.div>
            ) : (
              /* Empty Cart */
              <motion.div
                key="empty-cart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                  <PackageOpen className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Votre panier est vide</h2>
                <p className="text-muted-foreground mb-8">
                  Découvrez nos produits et ajoutez-les à votre panier
                </p>
                <Link href="/marketplace">
                  <Button size="lg" className="rounded-xl">
                    Continuer mes achats
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden z-40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">{formatPrice(total)}</span>
          </div>
          <Link href="/marketplace/checkout">
            <Button className="w-full h-12 rounded-xl">Passer la commande</Button>
          </Link>
        </div>
      )}

      <Footer />
    </main>
  )
}
