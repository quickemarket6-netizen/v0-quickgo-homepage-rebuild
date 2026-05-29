"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/store/cart"
import { useRouter } from "next/navigation"
import {
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Share2,
  MessageCircle,
  Store,
  Clock,
  Zap,
} from "lucide-react"

// Mock product data - in real app would come from API
const product = {
  id: 1,
  name: "iPhone 15 Pro Max 256GB",
  brand: "Apple",
  price: 850000,
  originalPrice: 950000,
  rating: 4.8,
  reviews: 256,
  sold: 1523,
  images: [
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=800&fit=crop",
  ],
  colors: [
    { name: "Titane Naturel", hex: "#a0a0a0", available: true },
    { name: "Titane Bleu", hex: "#3f5a73", available: true },
    { name: "Titane Blanc", hex: "#e8e8e8", available: true },
    { name: "Titane Noir", hex: "#2d2d2d", available: false },
  ],
  storage: [
    { size: "128GB", price: 750000, available: true },
    { size: "256GB", price: 850000, available: true },
    { size: "512GB", price: 1050000, available: true },
    { size: "1TB", price: 1250000, available: false },
  ],
  description: `L'iPhone 15 Pro Max. Forge en titane avec le tout nouveau design contoured edge en titane de qualite aerospatiale. Un concentre de performances avec la puce A17 Pro et son GPU 6 coeurs revolutionnaire.

Caracteristiques principales:
- Ecran Super Retina XDR 6,7 pouces avec ProMotion
- Puce A17 Pro avec GPU 6 coeurs
- Systeme photo pro 48 Mpx
- Titanium Grade 5 ultra-resistant
- USB-C avec USB 3 pour des transferts 20x plus rapides
- Bouton Action personnalisable`,
  specifications: [
    { label: "Ecran", value: "6,7 pouces Super Retina XDR" },
    { label: "Processeur", value: "A17 Pro" },
    { label: "Camera", value: "48MP Principal + 12MP Ultra grand-angle" },
    { label: "Batterie", value: "29h de lecture video" },
    { label: "Stockage", value: "256GB" },
    { label: "OS", value: "iOS 17" },
  ],
  vendor: {
    name: "Apple Store Cameroun",
    rating: 4.9,
    products: 156,
    verified: true,
    responseTime: "< 1 heure",
  },
  inStock: true,
  stockCount: 15,
  deliveryTime: "30 min - 1h",
  freeDelivery: true,
}

const relatedProducts = [
  { id: 2, name: "AirPods Pro 2", price: 150000, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400", rating: 4.9 },
  { id: 3, name: "Apple Watch Series 9", price: 280000, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400", rating: 4.7 },
  { id: 4, name: "MacBook Air M2", price: 1150000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", rating: 4.8 },
  { id: 5, name: "iPad Pro 12.9", price: 750000, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400", rating: 4.6 },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function ProductPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedStorage, setSelectedStorage] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const { addItem } = useCart()
  const router = useRouter()

  const currentPrice = product.storage[selectedStorage].price

  const handleAddToCart = () => {
    addItem({
      id: String(product.id),
      productId: String(product.id),
      name: product.name,
      brand: product.brand,
      price: currentPrice,
      originalPrice: product.originalPrice,
      image: product.images[0],
      color: product.colors[selectedColor].name,
      vendor: product.vendor.name,
    })
    toast.success("Ajouté au panier", {
      description: `${product.name} × ${quantity}`,
      action: { label: "Voir le panier", onClick: () => router.push("/marketplace/cart") },
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push("/marketplace/checkout")
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">Marketplace</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link href="/marketplace?category=electronics" className="text-muted-foreground hover:text-foreground">Electronique</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Smartphones</span>
          </nav>
        </div>

        {/* Product Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-card border border-border/50">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                <button
                  onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                      selectedImage === idx ? "border-primary" : "border-border/50"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link href="#vendor" className="text-sm text-primary hover:underline">{product.brand}</Link>
                  <span className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full">Officiel</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">{product.name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-medium">{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviews} avis)</span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">{product.sold} vendus</span>
                </div>
              </div>

              {/* Price */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">{formatPrice(currentPrice)}</span>
                  {product.originalPrice > currentPrice && (
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                  )}
                  <span className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded-lg">
                    -{Math.round((1 - currentPrice / product.originalPrice) * 100)}%
                  </span>
                </div>
                {product.freeDelivery && (
                  <p className="text-sm text-secondary mt-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Livraison gratuite
                  </p>
                )}
              </div>

              {/* Color Selection */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Couleur: <span className="text-muted-foreground">{product.colors[selectedColor].name}</span>
                </h3>
                <div className="flex gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => color.available && setSelectedColor(idx)}
                      disabled={!color.available}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === idx ? "border-primary ring-2 ring-primary/30" : "border-border"
                      } ${!color.available && "opacity-30 cursor-not-allowed"}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selectedColor === idx && (
                        <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage Selection */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Stockage</h3>
                <div className="flex flex-wrap gap-3">
                  {product.storage.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => option.available && setSelectedStorage(idx)}
                      disabled={!option.available}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedStorage === idx
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/50"
                      } ${!option.available && "opacity-30 cursor-not-allowed line-through"}`}
                    >
                      {option.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Quantite</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-xl">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-3 hover:bg-muted transition-colors rounded-l-xl"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(product.stockCount, prev + 1))}
                      className="p-3 hover:bg-muted transition-colors rounded-r-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stockCount} articles disponibles
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  className="flex-1 h-14 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ajouter au panier
                </Button>
                <Button
                  size="lg"
                  onClick={handleBuyNow}
                  className="flex-1 h-14 rounded-xl"
                >
                  Acheter maintenant
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={`h-14 w-14 rounded-xl shrink-0 ${isFavorite && "text-destructive border-destructive"}`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`w-5 h-5 ${isFavorite && "fill-current"}`} />
                </Button>
                <Button size="lg" variant="outline" className="h-14 w-14 rounded-xl shrink-0">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Livraison</p>
                  <p className="text-sm font-medium">{product.deliveryTime}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Garantie</p>
                  <p className="text-sm font-medium">1 an</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Retour</p>
                  <p className="text-sm font-medium">7 jours</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vendor Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            id="vendor"
            className="mt-12 p-6 rounded-2xl bg-card border border-border/50"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{product.vendor.name}</h3>
                    {product.vendor.verified && (
                      <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verifie
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-secondary text-secondary" />
                      {product.vendor.rating}
                    </span>
                    <span>{product.vendor.products} produits</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {product.vendor.responseTime}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button variant="outline" className="rounded-xl">
                  Voir la boutique
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Description & Specifications */}
          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Specifications</h2>
              <div className="space-y-3">
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="font-medium text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Related Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-foreground mb-8">Produits similaires</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/marketplace/product/${item.id}`}>
                  <div className="group p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/30 mb-3">
                      <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{formatPrice(item.price)}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-secondary text-secondary" />
                        <span className="text-xs">{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
