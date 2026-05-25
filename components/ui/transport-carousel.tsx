"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Bike, Car, Truck, Zap, Shield, Clock, MapPin, Star } from "lucide-react"

interface TransportCarouselProps {
  selectedType: string
  onSelect: (type: string) => void
}

const transportTypes = [
  {
    id: "moto",
    name: "Moto",
    subtitle: "Rapide et flexible",
    description: "Ideal pour les petits colis en ville. Livraison ultra rapide en 30-60 minutes.",
    image: "/images/transport/moto-premium.jpg",
    icon: Bike,
    capacity: "1-5 kg",
    speed: "30-60 min",
    price: "A partir de 1 000 FCFA",
    features: [
      { icon: Zap, text: "Livraison express" },
      { icon: MapPin, text: "Parfait pour la ville" },
      { icon: Shield, text: "Livreurs verifies" },
      { icon: Clock, text: "30-60 min en moyenne" },
    ],
    recommended: true,
  },
  {
    id: "voiture",
    name: "Voiture",
    subtitle: "Confortable et sur",
    description: "Parfait pour les colis moyens avec suivi en temps reel et chauffeur professionnel.",
    image: "/images/transport/voiture-premium.jpg",
    icon: Car,
    capacity: "5-30 kg",
    speed: "45-90 min",
    price: "A partir de 2 000 FCFA",
    features: [
      { icon: Zap, text: "Livraison rapide" },
      { icon: MapPin, text: "Suivi GPS en direct" },
      { icon: Shield, text: "100% securise" },
      { icon: Star, text: "Chauffeur pro" },
    ],
    recommended: false,
  },
  {
    id: "camion",
    name: "Camion",
    subtitle: "Pour les gros volumes",
    description: "Solution ideale pour demenagements et livraisons volumineuses.",
    image: "/images/transport/camion-delivery.jpg",
    icon: Truck,
    capacity: "50-500 kg",
    speed: "2-4 heures",
    price: "A partir de 10 000 FCFA",
    features: [
      { icon: Zap, text: "Grande capacite" },
      { icon: MapPin, text: "Toutes distances" },
      { icon: Shield, text: "Assurance incluse" },
      { icon: Star, text: "Equipe dediee" },
    ],
    recommended: false,
  },
]

export function TransportCarousel({ selectedType, onSelect }: TransportCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Find selected transport index
  useEffect(() => {
    const index = transportTypes.findIndex(t => t.id === selectedType)
    if (index !== -1 && index !== currentIndex) {
      setDirection(index > currentIndex ? 1 : -1)
      setCurrentIndex(index)
    }
  }, [selectedType, currentIndex])

  const currentTransport = transportTypes[currentIndex]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3,
      },
    }),
  }

  const goToPrevious = () => {
    setDirection(-1)
    const newIndex = currentIndex === 0 ? transportTypes.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    onSelect(transportTypes[newIndex].id)
  }

  const goToNext = () => {
    setDirection(1)
    const newIndex = currentIndex === transportTypes.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
    onSelect(transportTypes[newIndex].id)
  }

  return (
    <div className="relative w-full">
      {/* Main Carousel Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1628] to-[#0d1e36] border border-blue-500/20">
        {/* Image Section */}
        <div className="relative h-[300px] md:h-[400px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              <Image
                src={currentTransport.image}
                alt={currentTransport.name}
                fill
                className="object-cover"
                priority
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Transport Type Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 backdrop-blur-sm border border-blue-500/30">
              <currentTransport.icon className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">{currentTransport.name}</span>
            </div>
          </div>

          {/* Recommended Badge */}
          {currentTransport.recommended && (
            <div className="absolute top-4 right-4 z-10">
              <div className="px-3 py-1.5 rounded-full bg-lime-500 text-black text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Recommande
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Title and Subtitle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentTransport.name}</h3>
                  <p className="text-lime-400 text-sm">{currentTransport.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{currentTransport.price}</p>
                  <p className="text-gray-400 text-xs">{currentTransport.speed}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4">{currentTransport.description}</p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {currentTransport.features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <feature.icon className="w-4 h-4 text-lime-400" />
                    <span className="text-white text-xs">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Capacity Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Capacite:</span>
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-sm font-medium">
                    {currentTransport.capacity}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 pb-4">
          {transportTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
                onSelect(transportTypes[index].id)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "w-8 bg-lime-400" 
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
