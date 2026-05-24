"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
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
  XCircle,
  Plus,
  Filter,
  Calendar,
  RotateCcw,
} from "lucide-react"

const deliveries = [
  {
    id: "DL2026052401",
    date: "24 Mai 2026",
    status: "in_transit",
    statusLabel: "En cours",
    pickup: { address: "123 Rue Bastos, Yaounde", name: "Samuel O.", phone: "+237 6 95 55 55 55" },
    dropoff: { address: "456 Avenue Kennedy, Douala", name: "Jean Paul N.", phone: "+237 6 77 88 99 00" },
    package: { description: "Documents importants", weight: "0.5 kg" },
    price: 2250,
    eta: "14:30",
    driver: { name: "Emmanuel K.", phone: "+237 6 88 77 66 55", rating: 4.9 },
    vehicleType: "Moto",
  },
  {
    id: "DL2026052301",
    date: "23 Mai 2026",
    status: "delivered",
    statusLabel: "Livree",
    pickup: { address: "Marche Central, Yaounde", name: "Marie C.", phone: "+237 6 55 44 33 22" },
    dropoff: { address: "123 Rue Bastos, Yaounde", name: "Samuel O.", phone: "+237 6 95 55 55 55" },
    package: { description: "Colis electronique", weight: "3 kg" },
    price: 3000,
    deliveredAt: "23 Mai 2026, 16:45",
    driver: { name: "Paul M.", phone: "+237 6 11 22 33 44", rating: 4.8 },
    vehicleType: "Voiture",
  },
  {
    id: "DL2026052201",
    date: "22 Mai 2026",
    status: "delivered",
    statusLabel: "Livree",
    pickup: { address: "Aeroport Nsimalen", name: "Air France Cargo", phone: "+237 2 22 23 00 00" },
    dropoff: { address: "Bureau DL Solutions", name: "Reception", phone: "+237 6 95 55 55 55" },
    package: { description: "Equipement informatique", weight: "15 kg" },
    price: 8000,
    deliveredAt: "22 Mai 2026, 10:20",
    driver: { name: "David T.", phone: "+237 6 99 88 77 66", rating: 4.7 },
    vehicleType: "Camion",
  },
  {
    id: "DL2026052001",
    date: "20 Mai 2026",
    status: "cancelled",
    statusLabel: "Annulee",
    pickup: { address: "123 Rue Bastos, Yaounde", name: "Samuel O.", phone: "+237 6 95 55 55 55" },
    dropoff: { address: "Hopital Central", name: "Dr. Mbarga", phone: "+237 6 44 55 66 77" },
    package: { description: "Medicaments", weight: "1 kg" },
    price: 1500,
    cancelledReason: "Destinataire indisponible",
    vehicleType: "Moto",
  },
]

const statusConfig = {
  delivered: { icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/20" },
  in_transit: { icon: Truck, color: "text-primary", bg: "bg-primary/20" },
  pending: { icon: Clock, color: "text-accent", bg: "bg-accent/20" },
  cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function DeliveryHistoryPage() {
  const [filter, setFilter] = useState("all")

  const filteredDeliveries = filter === "all" 
    ? deliveries 
    : deliveries.filter(d => d.status === filter)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-20">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Mes Livraisons
              </h1>
              <p className="text-muted-foreground">
                Historique et suivi de vos livraisons
              </p>
            </div>
            <Link href="/delivery/create">
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle livraison
              </Button>
            </Link>
          </motion.div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2">
            {[
              { id: "all", label: "Toutes" },
              { id: "in_transit", label: "En cours" },
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

        {/* Deliveries List */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredDeliveries.map((delivery, index) => {
              const statusInfo = statusConfig[delivery.status as keyof typeof statusConfig]
              const StatusIcon = statusInfo.icon

              return (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground">#{delivery.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {delivery.statusLabel}
                        </span>
                        <span className="px-2 py-1 rounded-lg text-xs bg-muted text-muted-foreground">
                          {delivery.vehicleType}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {delivery.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{formatPrice(delivery.price)}</p>
                      {delivery.status === "in_transit" && delivery.eta && (
                        <p className="text-sm text-primary">ETA: {delivery.eta}</p>
                      )}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="py-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                        <div className="w-0.5 h-12 bg-border" />
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Collecte</p>
                          <p className="font-medium text-foreground">{delivery.pickup.address}</p>
                          <p className="text-sm text-muted-foreground">{delivery.pickup.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Livraison</p>
                          <p className="font-medium text-foreground">{delivery.dropoff.address}</p>
                          <p className="text-sm text-muted-foreground">{delivery.dropoff.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Package Info */}
                  <div className="py-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/20">
                        <Package className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{delivery.package.description}</p>
                        <p className="text-sm text-muted-foreground">{delivery.package.weight}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Info (for in-transit) */}
                  {delivery.status === "in_transit" && delivery.driver && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <Truck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{delivery.driver.name}</p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-3 h-3 fill-secondary text-secondary" />
                                <span>{delivery.driver.rating}</span>
                              </div>
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
                    </div>
                  )}

                  {/* Delivered Info */}
                  {delivery.status === "delivered" && delivery.deliveredAt && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Livree le {delivery.deliveredAt}</span>
                      </div>
                    </div>
                  )}

                  {/* Cancelled Info */}
                  {delivery.status === "cancelled" && delivery.cancelledReason && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <XCircle className="w-4 h-4" />
                        <span>{delivery.cancelledReason}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                    {delivery.status === "in_transit" && (
                      <Link href={`/tracking?delivery=${delivery.id}`}>
                        <Button className="rounded-xl">
                          <MapPin className="w-4 h-4 mr-2" />
                          Suivre en temps reel
                        </Button>
                      </Link>
                    )}
                    
                    {delivery.status === "delivered" && (
                      <>
                        <Button variant="outline" className="rounded-xl">
                          <Star className="w-4 h-4 mr-2" />
                          Noter le livreur
                        </Button>
                        <Link href="/delivery/create">
                          <Button variant="outline" className="rounded-xl">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Renvoyer
                          </Button>
                        </Link>
                      </>
                    )}

                    <Button variant="ghost" className="rounded-xl text-muted-foreground">
                      Voir les details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {filteredDeliveries.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Aucune livraison</h2>
              <p className="text-muted-foreground mb-8">
                Vous n&apos;avez pas encore de livraison dans cette categorie
              </p>
              <Link href="/delivery/create">
                <Button size="lg" className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Creer une livraison
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
