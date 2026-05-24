"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { 
  Search, 
  Filter,
  Clock,
  Percent,
  Tag,
  Zap,
  ChevronRight,
  Heart,
  Star,
  ShoppingCart,
  Gift,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"

const featuredOffers = [
  {
    id: 1,
    title: "Livraison GRATUITE",
    description: "Sur toutes les commandes de plus de 10 000 FCFA",
    code: "FREESHIP",
    discount: "100%",
    type: "delivery",
    expiresIn: "2 jours",
    bgGradient: "from-quickgo-blue to-cyan-500",
    icon: Truck
  },
  {
    id: 2,
    title: "-30% Restaurants",
    description: "Sur votre premiere commande restaurant",
    code: "FOOD30",
    discount: "30%",
    type: "percentage",
    expiresIn: "5 jours",
    bgGradient: "from-orange-500 to-red-500",
    icon: Percent
  },
  {
    id: 3,
    title: "2 000 FCFA offerts",
    description: "Pour chaque ami parraine",
    code: "PARRAIN",
    discount: "2000 FCFA",
    type: "fixed",
    expiresIn: "Permanent",
    bgGradient: "from-quickgo-lime to-green-500",
    icon: Gift
  },
]

const categories = [
  { id: "all", label: "Toutes" },
  { id: "restaurants", label: "Restaurants" },
  { id: "supermarkets", label: "Supermarches" },
  { id: "electronics", label: "Electronique" },
  { id: "fashion", label: "Mode" },
  { id: "pharmacy", label: "Pharmacie" },
]

const offers = [
  {
    id: 1,
    title: "Menu Burger + Frites + Boisson",
    shop: "Burger King",
    shopImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    originalPrice: 8500,
    discountedPrice: 5950,
    discount: 30,
    category: "restaurants",
    rating: 4.7,
    soldCount: 234,
    expiresIn: "3 jours"
  },
  {
    id: 2,
    title: "Pack Courses Essentielles",
    shop: "Casino Supermarche",
    shopImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    originalPrice: 25000,
    discountedPrice: 20000,
    discount: 20,
    category: "supermarkets",
    rating: 4.8,
    soldCount: 567,
    expiresIn: "7 jours"
  },
  {
    id: 3,
    title: "Ecouteurs Bluetooth Premium",
    shop: "TechZone",
    shopImage: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    originalPrice: 35000,
    discountedPrice: 24500,
    discount: 30,
    category: "electronics",
    rating: 4.6,
    soldCount: 189,
    expiresIn: "2 jours"
  },
  {
    id: 4,
    title: "Pizza Large + 2 Sodas",
    shop: "Pizza Hut",
    shopImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    originalPrice: 12000,
    discountedPrice: 8400,
    discount: 30,
    category: "restaurants",
    rating: 4.5,
    soldCount: 432,
    expiresIn: "5 jours"
  },
  {
    id: 5,
    title: "T-shirt + Jean Combo",
    shop: "Fashion Hub",
    shopImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop",
    originalPrice: 18000,
    discountedPrice: 12600,
    discount: 30,
    category: "fashion",
    rating: 4.4,
    soldCount: 156,
    expiresIn: "10 jours"
  },
  {
    id: 6,
    title: "Kit Vitamines Complet",
    shop: "Pharmacie Centrale",
    shopImage: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
    originalPrice: 15000,
    discountedPrice: 11250,
    discount: 25,
    category: "pharmacy",
    rating: 4.9,
    soldCount: 312,
    expiresIn: "14 jours"
  },
]

const flashDeals = [
  {
    id: 1,
    title: "iPhone 14 Pro",
    originalPrice: 750000,
    discountedPrice: 650000,
    discount: 13,
    image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=200&h=200&fit=crop",
    endsIn: "02:45:30"
  },
  {
    id: 2,
    title: "AirPods Pro",
    originalPrice: 180000,
    discountedPrice: 145000,
    discount: 19,
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=200&h=200&fit=crop",
    endsIn: "01:23:15"
  },
  {
    id: 3,
    title: "MacBook Air M2",
    originalPrice: 950000,
    discountedPrice: 850000,
    discount: 11,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop",
    endsIn: "05:12:45"
  },
]

export default function OffersPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [favorites, setFavorites] = useState<number[]>([])

  const filteredOffers = offers.filter(offer => 
    selectedCategory === "all" || offer.category === selectedCategory
  )

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR') + ' FCFA'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-8 lg:py-12 bg-gradient-to-br from-quickgo-blue/20 via-transparent to-quickgo-lime/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                Offres exclusives
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Les meilleures{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-blue to-quickgo-lime">
                  promotions
                </span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Economisez sur vos achats avec nos offres speciales et codes promo exclusifs
              </p>
            </motion.div>
          </div>
        </section>

        {/* Featured Promo Codes */}
        <section className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Codes promo du moment</h2>
              <Link href="#" className="text-quickgo-blue text-sm font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {featuredOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${offer.bgGradient} overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <offer.icon className="w-10 h-10 text-white/90 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                    <p className="text-white/80 text-sm mb-4">{offer.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                        <code className="text-white font-mono font-bold">{offer.code}</code>
                      </div>
                      <span className="text-white/80 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {offer.expiresIn}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Flash Deals */}
        <section className="py-8 lg:py-12 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/20">
                  <Zap className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Ventes Flash</h2>
                  <p className="text-sm text-muted-foreground">Offres limitees dans le temps</p>
                </div>
              </div>
              <Link href="#" className="text-quickgo-blue text-sm font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashDeals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-4 rounded-2xl bg-card border border-border hover:border-red-500/50 transition-all group"
                >
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                    -{deal.discount}%
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                      <Image src={deal.image} alt={deal.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-quickgo-blue transition-colors">
                        {deal.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-foreground">{formatPrice(deal.discountedPrice)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(deal.originalPrice)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono font-bold">{deal.endsIn}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-6 border-b border-border sticky top-16 lg:top-20 bg-background/95 backdrop-blur-sm z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? "bg-quickgo-blue text-white"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-quickgo-blue/50"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Offers Grid */}
        <section className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link href={`/marketplace/product/${offer.id}`}>
                    <div className="relative rounded-2xl bg-card border border-border overflow-hidden hover:border-quickgo-blue/50 transition-all">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={offer.image}
                          alt={offer.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-red-500 text-white text-sm font-bold">
                          -{offer.discount}%
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleFavorite(offer.id)
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(offer.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                        </button>
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                            <Image src={offer.shopImage} alt={offer.shop} fill className="object-cover" />
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                            {offer.shop}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-quickgo-blue transition-colors">
                          {offer.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-foreground">{formatPrice(offer.discountedPrice)}</span>
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(offer.originalPrice)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span>{offer.rating}</span>
                            </div>
                            <span>•</span>
                            <span>{offer.soldCount} vendus</span>
                          </div>
                          <span className="flex items-center gap-1 text-red-500">
                            <Clock className="w-3.5 h-3.5" />
                            {offer.expiresIn}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
