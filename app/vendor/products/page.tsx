"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  TrendingUp,
  Star,
  BarChart3,
  Image as ImageIcon,
  Check,
  X,
  Copy,
} from "lucide-react"

const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max 256GB",
    sku: "APL-IPH15PM-256",
    price: 850000,
    stock: 15,
    status: "active",
    category: "Electronique",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200",
    sales: 45,
    views: 1250,
    rating: 4.8,
  },
  {
    id: 2,
    name: "AirPods Pro 2",
    sku: "APL-APP2-WHT",
    price: 150000,
    stock: 32,
    status: "active",
    category: "Electronique",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200",
    sales: 89,
    views: 2100,
    rating: 4.9,
  },
  {
    id: 3,
    name: "MacBook Air M2",
    sku: "APL-MBA-M2-256",
    price: 1150000,
    stock: 8,
    status: "low_stock",
    category: "Electronique",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200",
    sales: 23,
    views: 890,
    rating: 4.9,
  },
  {
    id: 4,
    name: "Apple Watch Series 9",
    sku: "APL-AW9-45-BLK",
    price: 280000,
    stock: 0,
    status: "out_of_stock",
    category: "Electronique",
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200",
    sales: 67,
    views: 1540,
    rating: 4.6,
  },
  {
    id: 5,
    name: "Sony WH-1000XM5",
    sku: "SNY-WH1000-BLK",
    price: 180000,
    stock: 25,
    status: "active",
    category: "Audio",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=200",
    sales: 34,
    views: 980,
    rating: 4.8,
  },
  {
    id: 6,
    name: "Samsung Galaxy S24 Ultra",
    sku: "SAM-GS24U-256",
    price: 650000,
    stock: 12,
    status: "active",
    category: "Electronique",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200",
    sales: 28,
    views: 1120,
    rating: 4.7,
  },
]

const statusConfig = {
  active: { label: "Actif", color: "text-secondary", bg: "bg-secondary/20" },
  low_stock: { label: "Stock faible", color: "text-orange-500", bg: "bg-orange-500/20" },
  out_of_stock: { label: "Rupture", color: "text-destructive", bg: "bg-destructive/20" },
  draft: { label: "Brouillon", color: "text-muted-foreground", bg: "bg-muted" },
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function VendorProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelect = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 p-6 hidden lg:block">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-xl font-bold text-white">Q</span>
          </div>
          <div>
            <span className="font-bold text-foreground">QuickGo</span>
            <span className="text-xs text-muted-foreground block">Espace Vendeur</span>
          </div>
        </Link>

        <nav className="space-y-2">
          {[
            { icon: BarChart3, label: "Tableau de bord", href: "/vendor/dashboard" },
            { icon: Package, label: "Produits", href: "/vendor/products", active: true },
            { icon: TrendingUp, label: "Commandes", href: "/vendor/orders" },
            { icon: BarChart3, label: "Analytics", href: "/vendor/analytics" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Mes Produits</h1>
            <p className="text-muted-foreground">{products.length} produits</p>
          </div>
          <Button className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Produits", value: products.length, icon: Package },
            { label: "En Stock", value: products.filter(p => p.status === "active").length, icon: Check },
            { label: "Rupture", value: products.filter(p => p.status === "out_of_stock").length, icon: X },
            { label: "Ventes ce mois", value: products.reduce((sum, p) => sum + p.sales, 0), icon: TrendingUp },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 mb-6 rounded-xl bg-primary/10 border border-primary/20"
          >
            <span className="text-sm font-medium text-foreground">
              {selectedProducts.length} produit(s) selectionne(s)
            </span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" className="rounded-lg">
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </Button>
              <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </motion.div>
        )}

        {/* Products Table */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Produit</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Prix</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Ventes</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = statusConfig[product.status as keyof typeof statusConfig]
                  return (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/30 shrink-0">
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground font-mono">{product.sku}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${product.stock === 0 ? "text-destructive" : product.stock < 10 ? "text-orange-500" : "text-foreground"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{product.sales}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            {product.views}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="rounded-lg">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-lg">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-lg text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
