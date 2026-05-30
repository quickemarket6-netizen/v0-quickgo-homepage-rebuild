"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  User,
  Phone,
  MessageSquare,
  Star,
} from "lucide-react"

const trackingSteps = [
  { id: 1, label: "Commande confirmée", time: "12:45", completed: true },
  { id: 2, label: "Préparation", time: "12:48", completed: true },
  { id: 3, label: "En route", time: "13:01", completed: true, current: true },
  { id: 4, label: "Arrivée", time: "~13:11", completed: false },
  { id: 5, label: "Livré", time: "~13:15", completed: false },
]

const deliveryInfo = {
  orderId: "#QG12345",
  status: "En route",
  eta: "10 - 15 min",
  driver: {
    name: "Jean Paul N.",
    rating: 4.9,
    phone: "+237 6 XX XX XX XX",
    vehicle: "Honda PCX 125",
    photo: "/driver.jpg",
  },
  pickup: {
    name: "Restaurant Le Gourmet",
    address: "Rue des Saveurs, Bastos",
  },
  dropoff: {
    address: "Immeuble SOPECAM, Yaoundé",
  },
  items: [
    { name: "1 colis", weight: "2.3 kg" },
  ],
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isTracking, setIsTracking] = useState(true)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 lg:pt-24">
        {/* Search Section */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
          {/* Animated background glow orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-[100px] -left-[100px] top-0"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] right-0 bottom-0"
            />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Suivi de livraison en{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  temps réel
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Entrez votre numéro de commande pour suivre votre colis
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ex: #QG12345"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-card border-border/50 text-base"
                />
              </div>
              <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button className="h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Suivre
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Tracking Result */}
        <AnimatePresence>
        {isTracking && (
          <section className="py-12 lg:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Map — SVG path draw + rider glow */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 18 }}
                  className="lg:col-span-2"
                >
                  <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden bg-card border border-border/50"
                    style={{ background: "linear-gradient(135deg, #0d1117, #161b22)" }}>
                    {/* SVG map with animated dashed path */}
                    <svg viewBox="0 0 800 500" className="absolute inset-0 w-full h-full">
                      <defs>
                        <pattern id="trackgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e2030" strokeWidth="0.6" />
                        </pattern>
                      </defs>
                      <rect width="800" height="500" fill="url(#trackgrid)" />
                      {/* Animated path draw */}
                      <motion.path
                        d="M100,420 Q200,200 380,300 Q520,380 680,140"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="12 6"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
                      />
                      {/* Vendor pin */}
                      <circle cx="100" cy="420" r="10" fill="#8b5cf6" stroke="#fff" strokeWidth="2.5" />
                      <text x="112" y="435" fontSize="11" fill="#8b5cf6" fontWeight="600">📦 Vendeur</text>
                      {/* Destination pin */}
                      <circle cx="680" cy="140" r="10" fill="#22c55e" stroke="#fff" strokeWidth="2.5" />
                      <text x="580" y="128" fontSize="11" fill="#22c55e" fontWeight="600">🏠 Destination</text>
                      {/* Rider emoji circle — animated glow */}
                      <circle cx="380" cy="295" r="18" fill="#3b82f6" stroke="#fff" strokeWidth="3" />
                      <text x="371" y="302" fontSize="16">🛵</text>
                    </svg>

                    {/* Rider glow — pulsing box shadow via motion */}
                    <motion.div
                      animate={{ boxShadow: ["0 0 0px #3b82f6", "0 0 30px #3b82f6", "0 0 0px #3b82f6"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute rounded-full w-10 h-10 pointer-events-none"
                      style={{ left: "calc(47% - 20px)", top: "calc(59% - 20px)" }}
                    />

                    {/* Status Overlay */}
                    <div className="absolute top-4 left-4 right-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 120, delay: 0.4 }}
                        className="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-white/50">Statut</p>
                            {/* "En direct" badge with ping dot */}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                              </span>
                              <p className="text-lg font-bold text-green-400">{deliveryInfo.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-white/50">Arrivée estimée</p>
                            <p className="text-lg font-bold text-white">{deliveryInfo.eta}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Driver Info Overlay — spring entrance */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.6 }}
                      className="absolute bottom-4 left-4 right-4"
                    >
                      <div className="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center text-white font-bold">
                              JP
                            </div>
                            <div>
                              <p className="font-semibold text-white">{deliveryInfo.driver.name}</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-white/60">{deliveryInfo.driver.rating}</span>
                                <span className="text-sm text-white/40">• Livreur</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button size="icon" variant="outline" className="rounded-full border-white/20 hover:bg-white/10">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button size="icon" variant="outline" className="rounded-full border-white/20 hover:bg-white/10">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Tracking Details */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.1 }}
                  className="space-y-6"
                >
                  {/* ETA block — spring entrance */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.25 }}
                    className="p-6 rounded-2xl bg-gradient-to-r from-[#3b82f6]/20 to-[#06b6d4]/10 border border-[#3b82f6]/25"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-[#3b82f6]" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Arrivée estimée</p>
                        <p className="text-2xl font-black text-white">{deliveryInfo.eta}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-white/40">Commande {deliveryInfo.orderId}</span>
                      {/* "En direct" badge with ping dot */}
                      <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2.5 py-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-green-400 text-[10px] font-semibold">En direct</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Order Info — staggered steps */}
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Commande {deliveryInfo.orderId}</h3>
                      <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium">
                        {deliveryInfo.status}
                      </span>
                    </div>

                    {/* Progress Steps — staggered entrance */}
                    <div className="space-y-4">
                      {trackingSteps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.12, type: "spring", stiffness: 120, damping: 16 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.completed
                                ? step.current
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {step.completed ? (
                                /* Checkmark springs in for done steps */
                                <motion.div
                                  initial={step.current ? {} : { scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.4 + index * 0.12 }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </motion.div>
                              ) : (
                                <span className="text-sm">{step.id}</span>
                              )}
                            </div>
                            {index < trackingSteps.length - 1 && (
                              <div className={`w-0.5 h-8 ${step.completed ? "bg-primary/30" : "bg-muted"}`} />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className={`font-medium ${
                              step.current ? "text-secondary" : step.completed ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">{step.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="font-semibold text-foreground mb-4">Détails de la livraison</h3>
                    <div className="space-y-4">
                      {[
                        { icon: <MapPin className="h-4 w-4 text-primary" />, bg: "bg-primary/10", label: "Point de collecte", value: deliveryInfo.pickup.name, sub: deliveryInfo.pickup.address },
                        { icon: <MapPin className="h-4 w-4 text-secondary" />, bg: "bg-secondary/10", label: "Destination", value: deliveryInfo.dropoff.address },
                        { icon: <Package className="h-4 w-4 text-muted-foreground" />, bg: "bg-muted", label: "Détails du colis", value: `${deliveryInfo.items[0].name} • ${deliveryInfo.items[0].weight}` },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.06, type: "spring", stiffness: 120, damping: 18 }}
                          className="flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>{item.icon}</div>
                          <div>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                            <p className="font-medium text-foreground">{item.value}</p>
                            {item.sub && <p className="text-sm text-muted-foreground">{item.sub}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Help */}
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Besoin d&apos;aide ?</p>
                    <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Button variant="link" className="text-primary">
                        Contacter le support →
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}
        </AnimatePresence>
      </div>
      
      <Footer />
    </main>
  )
}
