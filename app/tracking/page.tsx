"use client"

import { useState } from "react"
import { motion } from "framer-motion"
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
        <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Suivi de livraison en temps réel
              </h1>
              <p className="text-lg text-muted-foreground">
                Entrez votre numéro de commande pour suivre votre colis
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
              <Button className="h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                Suivre
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Tracking Result */}
        {isTracking && (
          <section className="py-12 lg:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Map Placeholder */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-2"
                >
                  <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden bg-card border border-border/50">
                    {/* Map Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20">
                      <div className="absolute inset-0 bg-grid opacity-30" />
                    </div>
                    
                    {/* Status Overlay */}
                    <div className="absolute top-4 left-4 right-4">
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Statut</p>
                            <p className="text-lg font-bold text-secondary">
                              {deliveryInfo.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Arrivée estimée</p>
                            <p className="text-lg font-bold text-foreground">
                              {deliveryInfo.eta}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Route Visualization Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
                        <p className="text-muted-foreground">
                          Carte de suivi en temps réel
                        </p>
                      </div>
                    </div>
                    
                    {/* Driver Info Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                              JP
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {deliveryInfo.driver.name}
                              </p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-secondary text-secondary" />
                                <span className="text-sm text-muted-foreground">
                                  {deliveryInfo.driver.rating}
                                </span>
                                <span className="text-sm text-muted-foreground">• Livreur</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="rounded-full">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="rounded-full">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Tracking Details */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Order Info */}
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">
                        Commande {deliveryInfo.orderId}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium">
                        {deliveryInfo.status}
                      </span>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="space-y-4">
                      {trackingSteps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.completed
                                ? step.current
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {step.completed ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-sm">{step.id}</span>
                              )}
                            </div>
                            {index < trackingSteps.length - 1 && (
                              <div className={`w-0.5 h-8 ${
                                step.completed ? "bg-primary/30" : "bg-muted"
                              }`} />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className={`font-medium ${
                              step.current ? "text-secondary" : step.completed ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {step.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Delivery Details */}
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="font-semibold text-foreground mb-4">
                      Détails de la livraison
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Point de collecte</p>
                          <p className="font-medium text-foreground">{deliveryInfo.pickup.name}</p>
                          <p className="text-sm text-muted-foreground">{deliveryInfo.pickup.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <MapPin className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Destination</p>
                          <p className="font-medium text-foreground">{deliveryInfo.dropoff.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Détails du colis</p>
                          {deliveryInfo.items.map((item, i) => (
                            <p key={i} className="font-medium text-foreground">
                              {item.name} • {item.weight}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Help */}
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Besoin d&apos;aide ?
                    </p>
                    <Button variant="link" className="text-primary">
                      Contacter le support
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}
      </div>
      
      <Footer />
    </main>
  )
}
