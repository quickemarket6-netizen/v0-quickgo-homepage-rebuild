"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
  Filter,
  Search,
  ChevronRight,
  Star,
  Package,
  Utensils,
  ShoppingBag,
  Pill,
  Building2,
  TrendingUp,
  Navigation,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeliveryJob {
  id: string
  order_number?: string
  type: string
  merchant: string
  pickup: string
  dropoff: string
  distance: number
  earnings: number
  estimatedTime: number
  surge: number
  rating: number
  difficulty: "easy" | "medium" | "hard"
  traffic: "light" | "moderate" | "heavy"
  featured: boolean
  // true = livraison de colis P2P (table delivery_requests), acceptée via
  // /api/delivery/[id] et non /api/driver/available
  isParcel?: boolean
}

const _STATIC_MISSIONS: DeliveryJob[] = [
  {
    id: "1",
    type: "restaurant",
    merchant: "Restaurant Le Gourmet",
    pickup: "Bastos, Yaoundé",
    dropoff: "Elig-Essono",
    distance: 2.8,
    earnings: 2500,
    estimatedTime: 18,
    surge: 1.2,
    rating: 4.8,
    difficulty: "easy",
    traffic: "light",
    featured: true,
  },
  {
    id: "2",
    type: "pharmacy",
    merchant: "Pharmacie du Centre",
    pickup: "Centre-ville",
    dropoff: "Mvan",
    distance: 5.2,
    earnings: 4200,
    estimatedTime: 28,
    surge: 1.5,
    rating: 4.9,
    difficulty: "medium",
    traffic: "moderate",
    featured: false,
  },
  {
    id: "3",
    type: "supermarket",
    merchant: "Santa Lucia",
    pickup: "Omnisports",
    dropoff: "Nsimeyong",
    distance: 3.5,
    earnings: 3100,
    estimatedTime: 22,
    surge: 1.0,
    rating: 4.7,
    difficulty: "easy",
    traffic: "light",
    featured: false,
  },
  {
    id: "4",
    type: "package",
    merchant: "Express Colis",
    pickup: "Mokolo",
    dropoff: "Nlongkak",
    distance: 4.1,
    earnings: 3500,
    estimatedTime: 25,
    surge: 1.3,
    rating: 4.6,
    difficulty: "medium",
    traffic: "heavy",
    featured: true,
  },
  {
    id: "5",
    type: "office",
    merchant: "Tech Solutions",
    pickup: "Bastos",
    dropoff: "Hippodrome",
    distance: 6.8,
    earnings: 5500,
    estimatedTime: 35,
    surge: 1.8,
    rating: 4.9,
    difficulty: "hard",
    traffic: "moderate" as const,
    featured: false,
  },
]

const typeIcons: Record<string, typeof Utensils> = {
  restaurant: Utensils,
  pharmacy: Pill,
  supermarket: ShoppingBag,
  package: Package,
  office: Building2,
}

const typeColors: Record<string, string> = {
  restaurant: "bg-orange-500/20 text-orange-400",
  pharmacy: "bg-red-500/20 text-red-400",
  supermarket: "bg-green-500/20 text-green-400",
  package: "bg-purple-500/20 text-purple-400",
  office: "bg-blue-500/20 text-blue-400",
}

const difficultyColors: Record<string, { bg: string; text: string }> = {
  easy: { bg: "bg-quickgo-lime/20", text: "text-quickgo-lime" },
  medium: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  hard: { bg: "bg-red-500/20", text: "text-red-400" },
}

const trafficColors: Record<string, { bg: string; text: string }> = {
  light: { bg: "bg-quickgo-lime/20", text: "text-quickgo-lime" },
  moderate: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  heavy: { bg: "bg-red-500/20", text: "text-red-400" },
}

export default function DriverMissionsPage() {
  const [filter, setFilter] = useState("all")
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const [missions, setMissions] = useState<DeliveryJob[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  const fetchMissions = useCallback(async () => {
    setLoading(true)
    try {
      // Deux sources : commandes marketplace prêtes + demandes de colis P2P
      const [ordersRes, parcelsRes] = await Promise.all([
        fetch("/api/driver/available"),
        fetch("/api/delivery"),
      ])
      const orders: DeliveryJob[] = ordersRes.ok ? await ordersRes.json() : []

      let parcels: DeliveryJob[] = []
      if (parcelsRes.ok) {
        const raw = await parcelsRes.json()
        if (Array.isArray(raw)) {
          parcels = raw.map((r: {
            id: string; tracking_number: string | null
            pickup_address: string | null; delivery_address: string | null
            price: number | null; distance_km: number | null
            distance_from_driver: number | null; estimated_duration: number | null
            package_type: string | null
          }) => ({
            id: r.id,
            order_number: r.tracking_number ?? undefined,
            type: "package",
            isParcel: true,
            merchant: `Colis ${r.tracking_number ?? ""}`.trim(),
            pickup: r.pickup_address ?? "Point de retrait",
            dropoff: r.delivery_address ?? "Destination",
            distance: r.distance_from_driver ?? r.distance_km ?? 0,
            earnings: r.price ?? 0,
            estimatedTime: r.estimated_duration ?? 30,
            surge: 1,
            rating: 5,
            difficulty: (r.package_type === "large" || r.package_type === "fragile" ? "medium" : "easy") as DeliveryJob["difficulty"],
            traffic: "moderate" as const,
            featured: false,
          }))
        }
      }

      setMissions([...(Array.isArray(orders) ? orders : []), ...parcels])
    } catch {
      setMissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMissions() }, [fetchMissions])

  const handleAccept = async (missionId: string) => {
    setAccepting(missionId)
    try {
      const mission = missions.find((m) => m.id === missionId)
      // Colis P2P et commandes marketplace ont des endpoints d'acceptation distincts
      const res = mission?.isParcel
        ? await fetch(`/api/delivery/${missionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "accept" }),
          })
        : await fetch("/api/driver/available", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: missionId }),
          })
      if (res.ok) {
        setMissions(prev => prev.filter(m => m.id !== missionId))
        setSelectedMission(null)
      }
    } finally {
      setAccepting(null)
    }
  }

  const filteredMissions = filter === "all"
    ? missions
    : missions.filter(m => m.type === filter)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/driver/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Missions disponibles</h1>
                <p className="text-sm text-muted-foreground">{loading ? "…" : `${missions.length} missions proches de vous`}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 rounded-full bg-white/5 border border-border/30 text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-quickgo-blue"
                />
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { id: "all", label: "Toutes", icon: Package },
              { id: "restaurant", label: "Restaurants", icon: Utensils },
              { id: "pharmacy", label: "Pharmacies", icon: Pill },
              { id: "supermarket", label: "Marchés", icon: ShoppingBag },
              { id: "package", label: "Colis", icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? "bg-quickgo-blue text-white"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 mb-6">
            <div className="h-48 rounded-3xl bg-white/5 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Featured Mission */}
        {!loading && filteredMissions.length > 0 && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-quickgo-lime" />
            <h2 className="text-lg font-semibold text-white">Mission recommandée</h2>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-quickgo-blue/30 via-quickgo-cyan/20 to-quickgo-lime/30 border border-quickgo-blue/30">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full bg-quickgo-lime text-background text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Haute rentabilité
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                {(() => {
                  const top = filteredMissions[0]
                  const TopIcon = typeIcons[top.type] ?? Package
                  const topColor = typeColors[top.type] ?? "bg-blue-500/20 text-blue-400"
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${topColor}`}>
                          <TopIcon className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{top.merchant}</h3>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-white">{top.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-quickgo-blue" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="text-sm text-white">{top.pickup}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-quickgo-lime" />
                          <div>
                            <p className="text-xs text-muted-foreground">Dropoff</p>
                            <p className="text-sm text-white">{top.dropoff}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-quickgo-lime/20 text-quickgo-lime text-xs">
                          {top.distance} km
                        </span>
                        <span className="px-3 py-1 rounded-full bg-quickgo-blue/20 text-quickgo-blue text-xs">
                          {top.estimatedTime} min
                        </span>
                        <span className="px-3 py-1 rounded-full bg-quickgo-lime/20 text-quickgo-lime text-xs">
                          Trafic fluide
                        </span>
                        {top.surge > 1 && <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Surge x{top.surge}
                        </span>}
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="lg:text-right flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gain estimé</p>
                  <p className="text-4xl font-bold text-quickgo-lime">{filteredMissions[0]?.earnings.toLocaleString()} <span className="text-lg">CFA</span></p>
                </div>
                <Button
                  disabled={accepting === filteredMissions[0]?.id}
                  onClick={() => filteredMissions[0] && handleAccept(filteredMissions[0].id)}
                  className="mt-4 bg-quickgo-lime text-background hover:bg-quickgo-lime/90 rounded-full h-12 px-8"
                >
                  {accepting === filteredMissions[0]?.id ? "Acceptation…" : "Accepter la mission"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Decorative */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-quickgo-blue/30 rounded-full blur-3xl" />
          </div>
        </motion.div>}

        {/* Missions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredMissions.map((mission, index) => {
              const TypeIcon = typeIcons[mission.type]
              const typeColor = typeColors[mission.type]
              const diffColor = difficultyColors[mission.difficulty]
              const traffColor = trafficColors[mission.traffic]

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedMission(mission.id === selectedMission ? null : mission.id)}
                  className={`relative overflow-hidden rounded-2xl p-5 border transition-all cursor-pointer ${
                    selectedMission === mission.id
                      ? "bg-quickgo-blue/20 border-quickgo-blue/50 scale-[1.02]"
                      : "bg-card/50 border-border/30 hover:border-quickgo-blue/30"
                  }`}
                >
                  {mission.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="w-2 h-2 bg-quickgo-lime rounded-full animate-pulse" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${typeColor}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{mission.merchant}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-muted-foreground">{mission.rating}</span>
                        </div>
                      </div>
                    </div>
                    {mission.surge > 1 && (
                      <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        x{mission.surge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-quickgo-blue" />
                      <span className="text-muted-foreground">{mission.pickup}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-white">{mission.dropoff}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white text-xs">
                      {mission.distance} km
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/10 text-white text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mission.estimatedTime} min
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${diffColor.bg} ${diffColor.text}`}>
                      {mission.difficulty === "easy" ? "Facile" : mission.difficulty === "medium" ? "Moyen" : "Difficile"}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${traffColor.bg} ${traffColor.text}`}>
                      {mission.traffic === "light" ? "Fluide" : mission.traffic === "moderate" ? "Modéré" : "Dense"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Gain estimé</p>
                      <p className="text-xl font-bold text-quickgo-lime">{mission.earnings.toLocaleString()} CFA</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={accepting === mission.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (selectedMission === mission.id) handleAccept(mission.id)
                        else setSelectedMission(mission.id)
                      }}
                      className={`rounded-full ${
                        selectedMission === mission.id
                          ? "bg-quickgo-lime text-background"
                          : "bg-quickgo-blue hover:bg-quickgo-blue/90"
                      }`}
                    >
                      {accepting === mission.id ? "…" : selectedMission === mission.id ? "Accepter" : "Détails"}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* No Missions State */}
        {filteredMissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-quickgo-blue" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune mission disponible</h3>
            <p className="text-muted-foreground">Vérifiez plus tard ou changez de zone</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
