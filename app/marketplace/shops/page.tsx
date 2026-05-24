"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Filter,
  ChevronDown,
  Heart,
  Bike,
  ShoppingBag,
  Coffee,
  Pill,
  Shirt,
  Smartphone,
  Utensils,
  Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"

const categories = [
  { id: "all", label: "Tous", icon: ShoppingBag },
  { id: "restaurants", label: "Restaurants", icon: Utensils },
  { id: "supermarkets", label: "Supermarches", icon: ShoppingBag },
  { id: "pharmacies", label: "Pharmacies", icon: Pill },
  { id: "electronics", label: "Electronique", icon: Smartphone },
  { id: "fashion", label: "Mode", icon: Shirt },
  { id: "cafes", label: "Cafes", icon: Coffee },
  { id: "gifts", label: "Cadeaux", icon: Gift },
]

const shops = [
  {
    id: 1,
    name: "Casino Supermarche",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
    category: "supermarkets",
    rating: 4.8,
    reviews: 2340,
    deliveryTime: "25-35 min",
    deliveryFee: "500 FCFA",
    distance: "1.2 km",
    isOpen: true,
    featured: true,
    tags: ["Promo", "Livraison gratuite"]
  },
  {
    id: 2,
    name: "Le Gourmet Restaurant",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    category: "restaurants",
    rating: 4.9,
    reviews: 1856,
    deliveryTime: "20-30 min",
    deliveryFee: "750 FCFA",
    distance: "0.8 km",
    isOpen: true,
    featured: true,
    tags: ["Populaire"]
  },
  {
    id: 3,
    name: "Pharmacie du Centre",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
    category: "pharmacies",
    rating: 4.7,
    reviews: 987,
    deliveryTime: "15-25 min",
    deliveryFee: "500 FCFA",
    distance: "0.5 km",
    isOpen: true,
    featured: false,
    tags: ["24/7", "Urgences"]
  },
  {
    id: 4,
    name: "TechZone Electronics",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop",
    category: "electronics",
    rating: 4.6,
    reviews: 654,
    deliveryTime: "30-45 min",
    deliveryFee: "1000 FCFA",
    distance: "2.1 km",
    isOpen: true,
    featured: true,
    tags: ["Nouveautes"]
  },
  {
    id: 5,
    name: "Fashion Hub",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    category: "fashion",
    rating: 4.5,
    reviews: 432,
    deliveryTime: "35-50 min",
    deliveryFee: "750 FCFA",
    distance: "1.8 km",
    isOpen: true,
    featured: false,
    tags: ["Soldes -30%"]
  },
  {
    id: 6,
    name: "Cafe de Paris",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
    category: "cafes",
    rating: 4.8,
    reviews: 1234,
    deliveryTime: "15-20 min",
    deliveryFee: "500 FCFA",
    distance: "0.6 km",
    isOpen: true,
    featured: true,
    tags: ["Petit-dejeuner"]
  },
  {
    id: 7,
    name: "Santa Lucia Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "restaurants",
    rating: 4.7,
    reviews: 2100,
    deliveryTime: "25-35 min",
    deliveryFee: "500 FCFA",
    distance: "1.4 km",
    isOpen: true,
    featured: false,
    tags: ["Italien", "Pizza"]
  },
  {
    id: 8,
    name: "Bio Market",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    category: "supermarkets",
    rating: 4.6,
    reviews: 567,
    deliveryTime: "30-40 min",
    deliveryFee: "750 FCFA",
    distance: "2.0 km",
    isOpen: false,
    featured: false,
    tags: ["Bio", "Local"]
  },
]

export default function ShopsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<number[]>([])

  const filteredShops = shops.filter(shop => {
    const matchesCategory = selectedCategory === "all" || shop.category === selectedCategory
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-8 lg:py-12 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Magasins a proximite
              </h1>
              <p className="text-muted-foreground mb-6">
                Decouvrez tous les commerces partenaires pres de chez vous
              </p>
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher un magasin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-quickgo-blue/50"
                  />
                </div>
                <Button variant="outline" className="h-12 px-6 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 border-b border-border sticky top-16 lg:top-20 bg-background/95 backdrop-blur-sm z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? "bg-quickgo-blue text-white"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-quickgo-blue/50"
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shops Grid */}
        <section className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                <span className="text-foreground font-semibold">{filteredShops.length}</span> magasins trouves
              </p>
              <Button variant="ghost" className="text-muted-foreground">
                Trier par: Populaire
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredShops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link href={`/marketplace?shop=${shop.id}`}>
                    <div className="relative rounded-2xl bg-card border border-border overflow-hidden hover:border-quickgo-blue/50 transition-all">
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        <Image
                          src={shop.image}
                          alt={shop.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!shop.isOpen && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-semibold">Ferme</span>
                          </div>
                        )}
                        {shop.featured && (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-quickgo-lime text-black text-xs font-semibold">
                            Recommande
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleFavorite(shop.id)
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(shop.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground group-hover:text-quickgo-blue transition-colors">
                            {shop.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-foreground">{shop.rating}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {shop.deliveryTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {shop.distance}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {shop.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-quickgo-blue/10 text-quickgo-blue text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {shop.deliveryFee}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {filteredShops.length === 0 && (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Aucun magasin trouve</h3>
                <p className="text-muted-foreground mb-6">
                  Essayez de modifier vos criteres de recherche
                </p>
                <Button onClick={() => { setSelectedCategory("all"); setSearchQuery("") }}>
                  Reinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
