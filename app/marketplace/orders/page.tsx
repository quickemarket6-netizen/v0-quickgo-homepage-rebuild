"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  MapPin,
  Phone,
  MessageSquare,
  Star,
  RotateCcw,
  XCircle,
  Filter,
} from "lucide-react"

const orders = [
  {
    id: "QG2026052401",
    date: "24 Mai 2026",
    status: "delivered",
    statusLabel: "Livree",
    total: 1150000,
    items: [
      { name: "iPhone 15 Pro Max 256GB", quantity: 1, price: 850000, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200" },
      { name: "AirPods Pro 2", quantity: 2, price: 150000, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200" },
    ],
    deliveryAddress: "123 Rue Bastos, Yaounde",
    deliveredAt: "24 Mai 2026, 14:32",
    canReview: true,
  },
  {
    id: "QG2026052302",
    date: "23 Mai 2026",
    status: "in_transit",
    statusLabel: "En livraison",
    total: 280000,
    items: [
      { name: "Apple Watch Series 9", quantity: 1, price: 280000, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200" },
    ],
    deliveryAddress: "456 Avenue Kennedy, Douala",
    estimatedDelivery: "23 Mai 2026, 16:00",
    driverName: "Jean Paul N.",
    driverPhone: "+237 6 77 88 99 00",
  },
  {
    id: "QG2026052203",
    date: "22 Mai 2026",
    status: "processing",
    statusLabel: "En preparation",
    total: 1150000,
    items: [
      { name: "MacBook Air M2", quantity: 1, price: 1150000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200" },
    ],
    deliveryAddress: "123 Rue Bastos, Yaounde",
    estimatedDelivery: "22 Mai 2026, 18:00",
  },
  {
    id: "QG2026052004",
    date: "20 Mai 2026",
    status: "cancelled",
    statusLabel: "Annulee",
    total: 650000,
    items: [
      { name: "Samsung Galaxy S24 Ultra", quantity: 1, price: 650000, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200" },
    ],
    deliveryAddress: "123 Rue Bastos, Yaounde",
    cancelledReason: "Annule par le client",
  },
]

const statusConfig = {
  delivered: { icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/20" },
  in_transit: { icon: Truck, color: "text-primary", bg: "bg-primary/20" },
  processing: { icon: Package, color: "text-accent", bg: "bg-accent/20" },
  cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function OrdersPage() {
  const [filter, setFilter] = useState("all")

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status === filter)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-20">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Mes Commandes
            </h1>
            <p className="text-muted-foreground">
              Suivez et gerez toutes vos commandes
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2">
            {[
              { id: "all", label: "Toutes" },
              { id: "in_transit", label: "En livraison" },
              { id: "processing", label: "En cours" },
              { id: "delivered", label: "Livrees" },
              { id: "cancelled", label: "Annulees" },
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
              const StatusIcon = statusInfo.icon

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground">Commande #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {order.statusLabel}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{formatPrice(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} article{order.items.length > 1 && "s"}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="py-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                          {item.quantity > 1 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{formatPrice(item.price)} x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Adresse de livraison</p>
                        <p className="text-sm font-medium text-foreground">{order.deliveryAddress}</p>
                      </div>
                    </div>

                    {order.status === "delivered" && order.deliveredAt && (
                      <div className="flex items-center gap-2 text-sm text-secondary mb-4">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Livree le {order.deliveredAt}</span>
                      </div>
                    )}

                    {order.status === "in_transit" && order.driverName && (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{order.driverName}</p>
                              <p className="text-sm text-muted-foreground">Livreur</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="rounded-full">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.status === "cancelled" && order.cancelledReason && (
                      <div className="flex items-center gap-2 text-sm text-destructive mb-4">
                        <XCircle className="w-4 h-4" />
                        <span>{order.cancelledReason}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {order.status === "in_transit" && (
                        <Link href={`/tracking?order=${order.id}`}>
                          <Button className="rounded-xl">
                            <MapPin className="w-4 h-4 mr-2" />
                            Suivre la livraison
                          </Button>
                        </Link>
                      )}
                      
                      {order.status === "delivered" && order.canReview && (
                        <Button variant="outline" className="rounded-xl">
                          <Star className="w-4 h-4 mr-2" />
                          Laisser un avis
                        </Button>
                      )}

                      {order.status === "delivered" && (
                        <Button variant="outline" className="rounded-xl">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Commander a nouveau
                        </Button>
                      )}

                      <Button variant="ghost" className="rounded-xl text-muted-foreground">
                        Voir les details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
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
              <p className="text-muted-foreground mb-8">
                Vous n&apos;avez pas encore de commande dans cette categorie
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
