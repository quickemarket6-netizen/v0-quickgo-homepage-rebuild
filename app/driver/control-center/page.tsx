"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Clock,
  Users,
  Package,
  TrendingUp,
  Zap,
  Activity,
  Radio,
  Eye,
  BarChart3,
  Layers,
  RefreshCw,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const liveDrivers = [
  { id: 1, name: "Marc D.", status: "delivering", location: "Bastos", eta: 5, earning: 2500 },
  { id: 2, name: "Jean P.", status: "picking", location: "Centre-ville", eta: 8, earning: 3200 },
  { id: 3, name: "Alain K.", status: "idle", location: "Omnisports", eta: 0, earning: 0 },
  { id: 4, name: "Christian B.", status: "delivering", location: "Mvan", eta: 12, earning: 4100 },
  { id: 5, name: "Steve M.", status: "delivering", location: "Nlongkak", eta: 3, earning: 1800 },
]

const liveOrders = [
  { id: "#QG1234", merchant: "Le Gourmet", status: "in_transit", driver: "Marc D.", eta: 5 },
  { id: "#QG1235", merchant: "Pharmacie Plus", status: "picking", driver: "Jean P.", eta: 12 },
  { id: "#QG1236", merchant: "Santa Lucia", status: "pending", driver: null, eta: null },
  { id: "#QG1237", merchant: "Tech Store", status: "in_transit", driver: "Christian B.", eta: 8 },
]

const hotspots = [
  { name: "Bastos", orders: 24, intensity: "high" },
  { name: "Centre-ville", orders: 18, intensity: "high" },
  { name: "Omnisports", orders: 12, intensity: "medium" },
  { name: "Mvan", orders: 8, intensity: "medium" },
  { name: "Nlongkak", orders: 15, intensity: "high" },
  { name: "Mokolo", orders: 6, intensity: "low" },
]

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  delivering: { bg: "bg-quickgo-blue/20", text: "text-quickgo-blue", label: "En livraison" },
  picking: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Récupération" },
  idle: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Disponible" },
  in_transit: { bg: "bg-quickgo-blue/20", text: "text-quickgo-blue", label: "En cours" },
  pending: { bg: "bg-orange-500/20", text: "text-orange-400", label: "En attente" },
}

export default function ControlCenterPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mapLayer, setMapLayer] = useState<"drivers" | "orders" | "heatmap">("drivers")

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  // Stats
  const activeDrivers = liveDrivers.filter(d => d.status !== "idle").length
  const pendingOrders = liveOrders.filter(o => o.status === "pending").length

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
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Centre de contrôle en temps réel
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full bg-red-500"
                  />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Live • {currentTime.toLocaleTimeString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleRefresh}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Livreurs actifs", value: activeDrivers, total: liveDrivers.length, icon: Users, color: "quickgo-blue" },
            { label: "Commandes en cours", value: liveOrders.filter(o => o.status !== "pending").length, icon: Package, color: "quickgo-lime" },
            { label: "En attente", value: pendingOrders, icon: Clock, color: "orange-500", alert: pendingOrders > 0 },
            { label: "Revenus live", value: "45 200 CFA", icon: TrendingUp, color: "quickgo-cyan" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-4 border border-border/30 bg-card/50 ${
                stat.alert ? "border-orange-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                {stat.alert && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 rounded-full bg-orange-500"
                  />
                )}
              </div>
              <p className="text-2xl font-bold text-white">
                {typeof stat.value === "number" && stat.total
                  ? `${stat.value}/${stat.total}`
                  : stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden"
          >
            {/* Map Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-quickgo-blue/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-quickgo-blue" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Carte temps réel</h2>
                  <p className="text-xs text-muted-foreground">Yaoundé, Cameroun</p>
                </div>
              </div>

              {/* Map Layer Toggle */}
              <div className="flex items-center gap-2">
                {[
                  { id: "drivers", icon: Users, label: "Livreurs" },
                  { id: "orders", icon: Package, label: "Commandes" },
                  { id: "heatmap", icon: Layers, label: "Heatmap" },
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setMapLayer(layer.id as typeof mapLayer)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                      mapLayer === layer.id
                        ? "bg-quickgo-blue text-white"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    <layer.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{layer.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Map Container */}
            <div className="relative h-[400px] bg-gradient-to-br from-[#0a1628] to-[#050816]">
              {/* Grid Overlay */}
              <div className="absolute inset-0 bg-grid opacity-20" />

              {/* Map SVG */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="hotspot-high" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="hotspot-medium" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="hotspot-low" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Heatmap Layer */}
                {mapLayer === "heatmap" && (
                  <>
                    <circle cx="200" cy="120" r="80" fill="url(#hotspot-high)" />
                    <circle cx="400" cy="200" r="70" fill="url(#hotspot-high)" />
                    <circle cx="550" cy="150" r="60" fill="url(#hotspot-medium)" />
                    <circle cx="300" cy="300" r="50" fill="url(#hotspot-medium)" />
                    <circle cx="600" cy="280" r="55" fill="url(#hotspot-high)" />
                    <circle cx="150" cy="280" r="40" fill="url(#hotspot-low)" />
                  </>
                )}

                {/* Driver Markers */}
                {mapLayer === "drivers" && liveDrivers.map((driver, i) => {
                  const positions = [
                    { x: 200, y: 120 },
                    { x: 400, y: 200 },
                    { x: 550, y: 150 },
                    { x: 300, y: 300 },
                    { x: 600, y: 280 },
                  ]
                  const pos = positions[i]
                  const isActive = driver.status !== "idle"

                  return (
                    <motion.g key={driver.id}>
                      {isActive && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r="25"
                          fill="none"
                          stroke="#0066FF"
                          strokeWidth="2"
                          opacity="0.5"
                          initial={{ r: 15, opacity: 0.8 }}
                          animate={{ r: 30, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="12"
                        fill={isActive ? "#0066FF" : "#6b7280"}
                      />
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="5"
                        fill="white"
                      />
                    </motion.g>
                  )
                })}

                {/* Order Markers */}
                {mapLayer === "orders" && liveOrders.map((order, i) => {
                  const positions = [
                    { x: 180, y: 140 },
                    { x: 420, y: 180 },
                    { x: 280, y: 260 },
                    { x: 580, y: 300 },
                  ]
                  const pos = positions[i]
                  const color = order.status === "pending" ? "#f59e0b" : "#B6FF00"

                  return (
                    <motion.g key={order.id}>
                      <motion.rect
                        x={pos.x - 10}
                        y={pos.y - 10}
                        width="20"
                        height="20"
                        rx="4"
                        fill={color}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                      />
                    </motion.g>
                  )
                })}
              </svg>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 glass-dark rounded-xl p-3">
                <div className="flex items-center gap-4 text-xs">
                  {mapLayer === "drivers" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-quickgo-blue" />
                        <span className="text-muted-foreground">Actif</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gray-500" />
                        <span className="text-muted-foreground">Inactif</span>
                      </div>
                    </>
                  )}
                  {mapLayer === "orders" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-quickgo-lime" />
                        <span className="text-muted-foreground">En cours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-orange-500" />
                        <span className="text-muted-foreground">En attente</span>
                      </div>
                    </>
                  )}
                  {mapLayer === "heatmap" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Élevée</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-muted-foreground">Moyenne</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Faible</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats Overlay */}
              <div className="absolute top-4 right-4 glass-dark rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-quickgo-lime" />
                  <span className="text-white font-semibold">250</span>
                  <span className="text-muted-foreground">m/s avg</span>
                </div>
              </div>
            </div>

            {/* Hotspots Bar */}
            <div className="p-4 border-t border-border/30">
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Zones actives:</span>
                {hotspots.map((spot) => (
                  <div
                    key={spot.name}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap ${
                      spot.intensity === "high"
                        ? "bg-red-500/20 text-red-400"
                        : spot.intensity === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    <span className="text-sm font-medium">{spot.name}</span>
                    <span className="text-xs opacity-75">{spot.orders}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Live Drivers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-4 border border-border/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Radio className="w-4 h-4 text-quickgo-blue" />
                  Livreurs en direct
                </h2>
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {liveDrivers.map((driver) => {
                  const status = statusColors[driver.status]
                  return (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                            <span className="text-quickgo-blue font-semibold text-sm">{driver.name.charAt(0)}</span>
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                            driver.status === "idle" ? "bg-gray-500" : "bg-quickgo-lime"
                          }`} />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        {driver.eta > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{driver.eta} min</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Live Orders */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-4 border border-border/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-quickgo-lime" />
                  Commandes en temps réel
                </h2>
                <span className="text-xs text-muted-foreground">{liveOrders.length} actives</span>
              </div>

              <div className="space-y-3">
                {liveOrders.map((order) => {
                  const status = statusColors[order.status]
                  return (
                    <div
                      key={order.id}
                      className={`p-3 rounded-xl ${
                        order.status === "pending" ? "bg-orange-500/10 border border-orange-500/30" : "bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-mono text-sm">{order.id}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{order.merchant}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {order.driver || "En attente d'affectation"}
                        </span>
                        {order.eta && (
                          <span className="text-quickgo-lime">ETA {order.eta} min</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
