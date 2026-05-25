"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { 
  Bike, 
  Car, 
  Truck, 
  Zap,
  MapPin,
  Shield,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Headphones,
  CreditCard,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const transportTypes = [
  {
    id: "moto",
    name: "Moto",
    subtitle: "Rapide et flexible",
    image: "/images/transport/moto-delivery.jpg",
    recommended: true,
    features: [
      { icon: Zap, label: "Livraison ultra rapide", desc: "En moyenne 30 - 60 min" },
      { icon: MapPin, label: "Parfait pour la ville", desc: "Acces facile partout" },
      { icon: Shield, label: "Securite garantie", desc: "Livreurs verifies" },
      { icon: CreditCard, label: "Tarifs avantageux", desc: "A partir de 1 000 FCFA" }
    ]
  },
  {
    id: "voiture",
    name: "Voiture",
    subtitle: "Confortable et sur",
    image: "/images/transport/voiture-delivery.jpg",
    recommended: false,
    features: [
      { icon: Zap, label: "Livraison rapide", desc: "En moyenne 30 - 60 min" },
      { icon: MapPin, label: "Suivi en temps reel", desc: "Suivez votre commande" },
      { icon: Shield, label: "Chauffeur professionnel", desc: "Experimente et courtois" },
      { icon: Clock, label: "Disponible 24/7", desc: "A tout moment" }
    ]
  },
  {
    id: "camionnette",
    name: "Camionnette",
    subtitle: "Ideal pour colis moyens",
    image: "/images/transport/voiture-delivery.jpg",
    recommended: false,
    features: [
      { icon: Package, label: "Grande capacite", desc: "Jusqu a 500kg" },
      { icon: Shield, label: "Securite maximale", desc: "Marchandises assurees" },
      { icon: Zap, label: "Livraison optimisee", desc: "Delais garantis" },
      { icon: MapPin, label: "Suivi GPS", desc: "Localisation en direct" }
    ]
  },
  {
    id: "camion",
    name: "Camion",
    subtitle: "Pour les gros volumes",
    image: "/images/transport/camion-delivery.jpg",
    recommended: false,
    features: [
      { icon: MapPin, label: "Livraison longue distance", desc: "Toutes les villes du Cameroun" },
      { icon: Package, label: "Grande capacite", desc: "5 a 20 tonnes" },
      { icon: Shield, label: "Securite garantie", desc: "Marchandises assurees" },
      { icon: Zap, label: "Livraison rapide", desc: "Delais optimises" }
    ]
  }
]

const bottomFeatures = [
  { icon: Clock, label: "Service 24/7", desc: "Toujours disponible" },
  { icon: MapPin, label: "Suivi en temps reel", desc: "Localisation precise" },
  { icon: CreditCard, label: "Paiement securise", desc: "100% securise" },
  { icon: Headphones, label: "Support client", desc: "Assistance rapide" }
]

export default function DeliveryPage() {
  const [selectedTransport, setSelectedTransport] = useState("moto")
  const currentTransport = transportTypes.find(t => t.id === selectedTransport)!

  return (
    <main className="min-h-screen bg-[#0a1628]">
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section - Full Width Transport Selector */}
        <section className="relative min-h-[90vh]">
          {/* Background Image - Full screen */}
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTransport}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={currentTransport.image}
                  alt={currentTransport.name}
                  fill
                  className="object-cover object-center"
                  priority
                  quality={100}
                />
              </motion.div>
            </AnimatePresence>
            {/* Subtle gradient overlay only on edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-transparent to-[#0a1628]/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-[#0a1628]/30" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="grid lg:grid-cols-12 gap-6 items-start min-h-[80vh]">
              
              {/* Left Column - Transport Selection Menu */}
              <div className="lg:col-span-3 space-y-4">
                {/* Header Label */}
                <div className="flex items-center gap-2 text-lime-400 mb-4">
                  <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-xs font-medium uppercase tracking-wider">Type de transport</span>
                </div>

                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                    Choisissez votre<br />
                    mode de <span className="text-lime-400">livraison</span>
                  </h1>
                  <p className="text-gray-400 text-sm mt-2">
                    Rapide, securise et adapte a vos besoins.
                  </p>
                </div>

                {/* Transport Options List */}
                <div className="space-y-2 mt-6">
                  {transportTypes.map((transport) => (
                    <motion.button
                      key={transport.id}
                      onClick={() => setSelectedTransport(transport.id)}
                      className={`w-full p-3 rounded-xl border transition-all duration-300 text-left ${
                        selectedTransport === transport.id
                          ? "bg-lime-500/20 border-lime-500 shadow-lg shadow-lime-500/20"
                          : "bg-[#0a1628]/80 border-gray-700/50 hover:border-gray-600 backdrop-blur-sm"
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedTransport === transport.id ? "bg-lime-500/30" : "bg-gray-800/80"
                          }`}>
                            {transport.id === "moto" && <Bike className={`w-4 h-4 ${selectedTransport === transport.id ? "text-lime-400" : "text-gray-400"}`} />}
                            {transport.id === "voiture" && <Car className={`w-4 h-4 ${selectedTransport === transport.id ? "text-lime-400" : "text-gray-400"}`} />}
                            {transport.id === "camionnette" && <Truck className={`w-4 h-4 ${selectedTransport === transport.id ? "text-lime-400" : "text-gray-400"}`} />}
                            {transport.id === "camion" && <Truck className={`w-4 h-4 ${selectedTransport === transport.id ? "text-lime-400" : "text-gray-400"}`} />}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${selectedTransport === transport.id ? "text-white" : "text-gray-300"}`}>
                              {transport.name}
                            </p>
                            <p className="text-xs text-gray-500">{transport.subtitle}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {selectedTransport === transport.id ? (
                            <div className="w-5 h-5 rounded-full bg-lime-500 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-black" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-gray-600" />
                          )}
                          <ArrowRight className={`w-4 h-4 ${selectedTransport === transport.id ? "text-lime-400" : "text-gray-600"}`} />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Center - Empty space to show the image */}
              <div className="lg:col-span-5 hidden lg:block" />

              {/* Right Column - Transport Details Panel */}
              <div className="lg:col-span-4 space-y-4">
                {/* Security Badge - Top Right */}
                <div className="flex justify-end">
                  <div className="bg-[#0a1628]/90 border border-gray-700/50 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3">
                    <div className="p-2 bg-lime-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-lime-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Livraison securisee</p>
                      <p className="text-gray-400 text-xs">Vos colis sont entre de bonnes mains.</p>
                    </div>
                  </div>
                </div>

                {/* Transport Info Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedTransport}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-[#0f1d32]/95 to-[#0a1628]/90 border border-gray-700/50 rounded-2xl p-5 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{currentTransport.name}</h3>
                      {currentTransport.recommended && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-black flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Recommande
                        </span>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                      {currentTransport.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="p-1.5 bg-lime-500/10 rounded-lg mt-0.5">
                            <feature.icon className="w-4 h-4 text-lime-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{feature.label}</p>
                            <p className="text-gray-500 text-xs">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-8 left-4 right-4 lg:left-8 lg:right-8">
              <div className="bg-[#0a1628]/95 border border-gray-700/50 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  {/* Features */}
                  <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8">
                    {bottomFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <feature.icon className="w-4 h-4 text-lime-400" />
                        <div>
                          <p className="text-white text-xs font-medium">{feature.label}</p>
                          <p className="text-gray-500 text-[10px]">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* CTA Button */}
                  <Link href={`/delivery/create?type=${selectedTransport}`}>
                    <Button className="bg-lime-500 hover:bg-lime-400 text-black font-bold px-6 py-5 rounded-xl group whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        {selectedTransport === "moto" && <Bike className="w-5 h-5" />}
                        {selectedTransport === "voiture" && <Car className="w-5 h-5" />}
                        {selectedTransport === "camionnette" && <Truck className="w-5 h-5" />}
                        {selectedTransport === "camion" && <Truck className="w-5 h-5" />}
                        Continuer avec {currentTransport.name}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
