"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Plus,
  Grid3X3,
  List,
  Share2,
} from "lucide-react"

const favoriteItems = [
  {
    id: 1,
    name: "iPhone 15 Pro Max 256GB",
    brand: "Apple",
    price: 850000,
    originalPrice: 950000,
    rating: 4.8,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400",
    inStock: true,
    addedAt: "Il y a 2 jours",
  },
  {
    id: 2,
    name: "AirPods Pro 2",
    brand: "Apple",
    price: 150000,
    originalPrice: 180000,
    rating: 4.9,
    reviews: 412,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400",
    inStock: true,
    addedAt: "Il y a 1 semaine",
  },
  {
    id: 3,
    name: "MacBook Air M2",
    brand: "Apple",
    price: 1150000,
    originalPrice: 1250000,
    rating: 4.9,
    reviews: 324,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    inStock: true,
    addedAt: "Il y a 2 semaines",
  },
  {
    id: 4,
    name: "Apple Watch Series 9",
    brand: "Apple",
    price: 280000,
    originalPrice: 320000,
    rating: 4.6,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400",
    inStock: false,
    addedAt: "Il y a 3 semaines",
  },
  {
    id: 5,
    name: "Sony WH-1000XM5",
    brand: "Sony",
    price: 180000,
    originalPrice: 220000,
    rating: 4.8,
    reviews: 267,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400",
    inStock: true,
    addedAt: "Il y a 1 mois",
  },
  {
    id: 6,
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: 650000,
    originalPrice: 750000,
    rating: 4.7,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
    inStock: true,
    addedAt: "Il y a 1 mois",
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function FavoritesPage() {
  const [items, setItems] = useState(favoriteItems)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-20">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Mes Favoris
              </h1>
              <p className="text-muted-foreground">
                {items.length} article{items.length > 1 && "s"} enregistre{items.length > 1 && "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                className="rounded-xl"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="rounded-xl"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Favorites */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {items.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-muted/30">
                      <Link href={`/marketplace/product/${item.id}`}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                            Rupture de stock
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                      {item.originalPrice > item.price && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold bg-destructive text-destructive-foreground">
                          -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{item.brand}</p>
                      <Link href={`/marketplace/product/${item.id}`}>
                        <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                        <span className="text-xs font-medium text-foreground">{item.rating}</span>
                        <span className="text-xs text-muted-foreground">({item.reviews})</span>
                      </div>
                      
                      {/* Price & Add to Cart */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-bold text-foreground">{formatPrice(item.price)}</p>
                          {item.originalPrice > item.price && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(item.originalPrice)}
                            </p>
                          )}
                        </div>
                        <button
                          disabled={!item.inStock}
                          className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 lg:p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex gap-4 lg:gap-6">
                      {/* Image */}
                      <Link href={`/marketplace/product/${item.id}`} className="shrink-0">
                        <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-muted/30">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                          {!item.inStock && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">Rupture</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">{item.brand}</p>
                            <Link href={`/marketplace/product/${item.id}`}>
                              <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                              <span className="text-xs font-medium">{item.rating}</span>
                              <span className="text-xs text-muted-foreground">({item.reviews} avis)</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Ajoute {item.addedAt}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">{formatPrice(item.price)}</p>
                            {item.originalPrice > item.price && (
                              <p className="text-sm text-muted-foreground line-through">
                                {formatPrice(item.originalPrice)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <Button
                            disabled={!item.inStock}
                            className="rounded-xl"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Ajouter au panier
                          </Button>
                          <Button variant="outline" size="icon" className="rounded-xl">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Aucun favori</h2>
              <p className="text-muted-foreground mb-8">
                Enregistrez vos produits preferes pour les retrouver facilement
              </p>
              <Link href="/marketplace">
                <Button size="lg" className="rounded-xl">
                  Decouvrir les produits
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
