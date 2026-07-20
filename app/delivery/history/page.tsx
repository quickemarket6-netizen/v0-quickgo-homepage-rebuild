"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ListSkeleton } from "@/components/ui/list-skeleton"
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
  Calendar,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"

interface ApiDeliveryRequest {
  id: string
  tracking_number?: string | null
  created_at: string
  updated_at?: string | null
  status: string
  pickup_address?: string | null
  pickup_contact?: string | null
  pickup_phone?: string | null
  delivery_address?: string | null
  dropoff_address?: string | null
  delivery_contact?: string | null
  delivery_phone?: string | null
  package_type?: string | null
  package_description?: string | null
  notes?: string | null
  price?: number | null
  distance_km?: number | null
  estimated_duration?: number | null
  driver?: {
    id?: string
    rating?: number | null
    vehicle_type?: string | null
    user?: { full_name?: string | null; phone?: string | null } | null
  } | null
}

interface Delivery {
  id: string
  reference: string
  date: string
  status: "pending" | "in_transit" | "delivered" | "cancelled"
  statusLabel: string
  pickup: { address: string; name: string; phone: string }
  dropoff: { address: string; name: string; phone: string }
  package: { description: string; detail: string }
  price: number
  deliveredAt?: string
  cancelledReason?: string
  driver?: { name: string; phone: string; rating: number } | null
  vehicleType?: string | null
}

const statusConfig = {
  delivered: { icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/20" },
  in_transit: { icon: Truck, color: "text-primary", bg: "bg-primary/20" },
  pending: { icon: Clock, color: "text-accent", bg: "bg-accent/20" },
  cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

function mapStatus(status: string): { status: Delivery["status"]; label: string } {
  switch (status) {
    case "delivered":
      return { status: "delivered", label: "Livree" }
    case "accepted":
    case "picked_up":
    case "in_transit":
      return { status: "in_transit", label: "En cours" }
    case "cancelled":
    case "rejected":
      return { status: "cancelled", label: "Annulee" }
    default:
      return { status: "pending", label: "En attente" }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function mapApiDelivery(req: ApiDeliveryRequest): Delivery {
  const { status, label } = mapStatus(req.status)
  const driver = req.driver
  return {
    id: req.id,
    reference: req.tracking_number || req.id.slice(0, 8).toUpperCase(),
    date: formatDate(req.created_at),
    status,
    statusLabel: label,
    pickup: {
      address: req.pickup_address || "Adresse de collecte",
      name: req.pickup_contact || "",
      phone: req.pickup_phone || "",
    },
    dropoff: {
      address: req.delivery_address || req.dropoff_address || "Adresse de livraison",
      name: req.delivery_contact || "",
      phone: req.delivery_phone || "",
    },
    package: {
      description: req.package_description || req.notes || "Colis",
      detail: [
        req.package_type ? capitalize(req.package_type) : null,
        req.distance_km ? `${req.distance_km} km` : null,
      ]
        .filter(Boolean)
        .join(" • "),
    },
    price: req.price ?? 0,
    deliveredAt: status === "delivered" && req.updated_at ? formatDateTime(req.updated_at) : undefined,
    cancelledReason: status === "cancelled" ? "Livraison annulee" : undefined,
    driver: driver?.user?.full_name
      ? {
          name: driver.user.full_name,
          phone: driver.user.phone || "",
          rating: driver.rating ?? 0,
        }
      : null,
    vehicleType: driver?.vehicle_type ? capitalize(driver.vehicle_type) : null,
  }
}

export default function DeliveryHistoryPage() {
  const [filter, setFilter] = useState("all")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDeliveries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/delivery/history")
      if (res.status === 401) {
        setError("Veuillez vous connecter pour voir vos livraisons")
        return
      }
      if (!res.ok) {
        throw new Error("Erreur serveur")
      }
      const data: ApiDeliveryRequest[] = await res.json()
      setDeliveries(Array.isArray(data) ? data.map(mapApiDelivery) : [])
    } catch {
      setError("Impossible de charger vos livraisons. Veuillez reessayer.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

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
              { id: "pending", label: "En attente" },
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
          {/* Loading State */}
          {loading && <ListSkeleton rows={5} />}

          {/* Error State */}
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h2>
              <p className="text-muted-foreground mb-8">{error}</p>
              <Button size="lg" className="rounded-xl" onClick={loadDeliveries}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reessayer
              </Button>
            </motion.div>
          )}

          {!loading && !error && (
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
                        <h3 className="font-bold text-foreground">#{delivery.reference}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {delivery.statusLabel}
                        </span>
                        {delivery.vehicleType && (
                          <span className="px-2 py-1 rounded-lg text-xs bg-muted text-muted-foreground">
                            {delivery.vehicleType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {delivery.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{formatPrice(delivery.price)}</p>
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
                          {delivery.pickup.name && (
                            <p className="text-sm text-muted-foreground">{delivery.pickup.name}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Livraison</p>
                          <p className="font-medium text-foreground">{delivery.dropoff.address}</p>
                          {delivery.dropoff.name && (
                            <p className="text-sm text-muted-foreground">{delivery.dropoff.name}</p>
                          )}
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
                        {delivery.package.detail && (
                          <p className="text-sm text-muted-foreground">{delivery.package.detail}</p>
                        )}
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
                            {delivery.driver.phone && (
                              <a href={`tel:${delivery.driver.phone}`}>
                                <Button size="sm" variant="outline" className="rounded-full">
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </a>
                            )}
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
                      <Link href={`/tracking?delivery=${delivery.reference}`}>
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
          )}

          {!loading && !error && filteredDeliveries.length === 0 && (
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
