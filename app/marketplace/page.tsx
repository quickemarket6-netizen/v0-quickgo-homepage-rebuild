"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  Star,
  Heart,
  ShoppingCart,
  Plus,
  ChevronRight,
  Zap,
  Clock,
  Truck,
} from "lucide-react"

const categories = [
  { id: "all", name: "Tout", icon: "🛍️" },
  { id: "electronics", name: "Électronique", icon: "📱" },
  { id: "fashion", name: "Mode", icon: "👕" },
  { id: "food", name: "Restaurants", icon: "🍔" },
  { id: "pharmacy", name: "Pharmacie", icon: "💊" },
  { id: "supermarket", name: "Supermarché", icon: "🛒" },
  { id: "beauty", name: "Beauté", icon: "💄" },
  { id: "sports", name: "Sports", icon: "⚽" },
]

const featuredProducts = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    price: 500000,
    originalPrice: 545000,
    rating: 4.8,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: 650000,
    originalPrice: 700000,
    rating: 4.7,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    badge: "-8%",
    inStock: true,
  },
  {
    id: 3,
    name: "AirPods Pro 2",
    brand: "Apple",
    price: 120000,
    originalPrice: 150000,
    rating: 4.9,
    reviews: 412,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
    badge: "-20%",
    inStock: true,
  },
  {
    id: 4,
    name: "MacBook Air M2",
    brand: "Apple",
    price: 1150000,
    originalPrice: 1250000,
    rating: 4.9,
    reviews: 324,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    badge: "Nouveau",
    inStock: true,
  },
  {
    id: 5,
    name: "Apple Watch Series 9",
    brand: "Apple",
    price: 250000,
    originalPrice: 280000,
    rating: 4.6,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: 6,
    name: "Sony WH-1000XM5",
    brand: "Sony",
    price: 180000,
    originalPrice: 210000,
    rating: 4.8,
    reviews: 267,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    badge: "-14%",
    inStock: true,
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " CFA"
}

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Header */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Explorer la Marketplace
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez des milliers de produits de qualité livrés chez vous en moins de 30 minutes
              </p>
            </motion.div>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un produit, une catégorie, un magasin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-24 rounded-2xl bg-card border-border/50 text-base"
                />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Offres du moment
                </h2>
                <p className="text-muted-foreground">
                  Les meilleurs produits à prix réduits
                </p>
              </div>
              <Button variant="ghost" className="text-primary">
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/marketplace/product/${product.id}`}>
                    <div className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                      {/* Image */}
                      <div className="relative aspect-square bg-muted/30">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Badge */}
                        {product.badge && (
                          <span className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold ${
                            product.badge === "Best Seller" 
                              ? "bg-secondary text-secondary-foreground" 
                              : product.badge === "Nouveau"
                              ? "bg-primary text-primary-foreground"
                              : "bg-destructive text-destructive-foreground"
                          }`}>
                            {product.badge}
                          </span>
                        )}
                        {/* Wishlist */}
                        <button className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors">
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {product.brand}
                        </p>
                        <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                          <span className="text-xs font-medium text-foreground">
                            {product.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviews})
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-bold text-foreground">
                              {formatPrice(product.price)}
                            </p>
                            {product.originalPrice > product.price && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                              </p>
                            )}
                          </div>
                          <button className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Delivery Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-border/50"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Livraison Express disponible
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Recevez vos commandes en moins de 30 minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-secondary" />
                    <span className="text-sm font-medium text-foreground">Express</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium text-foreground">30 min</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
