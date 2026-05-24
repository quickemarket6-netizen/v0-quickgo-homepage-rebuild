"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ChevronRight,
  Phone,
  MessageSquare,
  Printer,
  BarChart3,
  TrendingUp,
} from "lucide-react"

const orders = [
  {
    id: "QG2026052401",
    date: "24 Mai 2026, 10:32",
    status: "pending",
    statusLabel: "En attente",
    customer: { name: "Jean Paul N.", phone: "+237 6 77 88 99 00", address: "456 Avenue Kennedy, Douala" },
    items: [
      { name: "iPhone 15 Pro Max 256GB", quantity: 1, price: 850000, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100" },
    ],
    total: 850000,
    deliveryType: "Express",
  },
  {
    id: "QG2026052402",
    date: "24 Mai 2026, 09:15",
    status: "processing",
    statusLabel: "En preparation",
    customer: { name: "Marie C.", phone: "+237 6 55 44 33 22", address: "Marche Central, Yaounde" },
    items: [
      { name: "AirPods Pro 2", quantity: 2, price: 150000, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=100" },
      { name: "Apple Watch Series 9", quantity: 1, price: 280000, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=100" },
    ],
    total: 580000,
    deliveryType: "Standard",
  },
  {
    id: "QG2026052301",
    date: "23 Mai 2026, 16:45",
    status: "shipped",
    statusLabel: "En livraison",
    customer: { name: "Paul M.", phone: "+237 6 11 22 33 44", address: "Bastos, Yaounde" },
    items: [
      { name: "MacBook Air M2", quantity: 1, price: 1150000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100" },
    ],
    total: 1150000,
    deliveryType: "Express",
    driver: { name: "Emmanuel K.", phone: "+237 6 88 77 66 55" },
  },
  {
    id: "QG2026052201",
    date: "22 Mai 2026, 14:20",
    status: "delivered",
    statusLabel: "Livree",
    customer: { name: "Samuel O.", phone: "+237 6 95 55 55 55", address: "123 Rue Bastos, Yaounde" },
    items: [
      { name: "Sony WH-1000XM5", quantity: 1, price: 180000, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=100" },
    ],
    total: 180000,
    deliveryType: "Standard",
    deliveredAt: "22 Mai 2026, 17:35",
  },
  {
    id: "QG2026052101",
    date: "21 Mai 2026, 11:00",
    status: "cancelled",
    statusLabel: "Annulee",
    customer: { name: "Alice B.", phone: "+237 6 33 22 11 00", address: "Akwa, Douala" },
    items: [
      { name: "Samsung Galaxy S24 Ultra", quantity: 1, price: 650000, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100" },
    ],
    total: 650000,
    deliveryType: "Express",
    cancelledReason: "Client indisponible",
  },
]

const statusConfig = {
  pending: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/20" },
  processing: { icon: Package, color: "text-accent", bg: "bg-accent/20" },
  shipped: { icon: Truck, color: "text-primary", bg: "bg-primary/20" },
  delivered: { icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/20" },
  cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function VendorOrdersPage() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === "all" || o.status === filter
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

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
            { icon: Package, label: "Produits", href: "/vendor/products" },
            { icon: TrendingUp, label: "Commandes", href: "/vendor/orders", active: true },
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Commandes</h1>
            <p className="text-muted-foreground">{orders.length} commandes au total</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "En attente", value: orders.filter(o => o.status === "pending").length, color: "text-orange-500" },
            { label: "En preparation", value: orders.filter(o => o.status === "processing").length, color: "text-accent" },
            { label: "En livraison", value: orders.filter(o => o.status === "shipped").length, color: "text-primary" },
            { label: "Livrees", value: orders.filter(o => o.status === "delivered").length, color: "text-secondary" },
            { label: "Annulees", value: orders.filter(o => o.status === "cancelled").length, color: "text-destructive" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border/50 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "all", label: "Toutes" },
              { id: "pending", label: "En attente" },
              { id: "processing", label: "En prep." },
              { id: "shipped", label: "En livraison" },
              { id: "delivered", label: "Livrees" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
            const StatusIcon = statusInfo.icon

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-foreground">#{order.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {order.statusLabel}
                      </span>
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-lg">
                        {order.deliveryType}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{formatPrice(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} article(s)</p>
                  </div>
                </div>

                {/* Customer & Items */}
                <div className="grid md:grid-cols-2 gap-6 py-4">
                  {/* Items */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Articles</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted/30 shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                            <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-foreground">{formatPrice(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Client</p>
                    <div className="p-4 rounded-xl bg-muted/30">
                      <p className="font-medium text-foreground">{order.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                      <p className="text-sm text-muted-foreground mt-1">{order.customer.address}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                {order.status === "shipped" && order.driver && (
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{order.driver.name}</p>
                          <p className="text-sm text-muted-foreground">Livreur</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-lg">
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                  {order.status === "pending" && (
                    <Button className="rounded-xl">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accepter la commande
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button className="rounded-xl">
                      <Truck className="w-4 h-4 mr-2" />
                      Marquer comme expediee
                    </Button>
                  )}
                  <Button variant="outline" className="rounded-xl">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimer
                  </Button>
                  <Button variant="ghost" className="rounded-xl text-muted-foreground">
                    Voir les details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Aucune commande</h2>
            <p className="text-muted-foreground">
              Aucune commande ne correspond a vos criteres
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
