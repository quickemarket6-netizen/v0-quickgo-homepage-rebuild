"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/store/cart"
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
} from "lucide-react"

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const subtotal = getTotalPrice()
  const deliveryFee = subtotal > 500000 ? 0 : 2500
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const total = subtotal + deliveryFee - discount

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "quickgo10") {
      setPromoApplied(true)
    }
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
                                {item.vendor && (
                                  <p className="text-xs text-muted-foreground mt-1">Vendeur: {item.vendor}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-end justify-between mt-4">
                              <div className="flex items-center border border-border rounded-xl">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 hover:bg-muted transition-colors rounded-l-xl"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                    onClick={clearCart}
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
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="pl-10"
                            disabled={promoApplied}
                          />
                        </div>
                        <Button variant="outline" onClick={applyPromo} disabled={promoApplied || !promoCode}>
                          {promoApplied ? <Check className="w-4 h-4" /> : "Appliquer"}
                        </Button>
                      </div>
                      {promoApplied && (
                        <p className="text-sm text-secondary mt-2 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Code QUICKGO10 appliqué (-10%)
                        </p>
                      )}
                    </div>

                    {/* Summary Lines */}
                    <div className="space-y-3 pb-6 border-b border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span className="text-foreground">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span className={deliveryFee === 0 ? "text-secondary" : "text-foreground"}>
                          {deliveryFee === 0 ? "Gratuite" : formatPrice(deliveryFee)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Réduction</span>
                          <span className="text-secondary">-{formatPrice(discount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between py-6">
                      <span className="text-lg font-bold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-foreground">{formatPrice(total)}</span>
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

                    {/* Free Delivery Progress */}
                    {deliveryFee > 0 && (
                      <div className="mt-6 p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-sm text-foreground">
                          Plus que{" "}
                          <span className="font-bold text-primary">{formatPrice(500000 - subtotal)}</span> pour la
                          livraison gratuite
                        </p>
                        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (subtotal / 500000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
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
