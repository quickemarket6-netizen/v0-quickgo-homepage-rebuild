"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Navigation,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronUp,
  AlertTriangle,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  User,
  Package,
  CheckCircle,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const routeSteps = [
  { id: 1, instruction: "Tournez à gauche sur Rue des Saveurs", distance: "150m", completed: true },
  { id: 2, instruction: "Continuez tout droit pendant 800m", distance: "800m", completed: true },
  { id: 3, instruction: "Tournez à droite sur Avenue Kennedy", distance: "200m", completed: false, current: true },
  { id: 4, instruction: "Votre destination sera sur la droite", distance: "50m", completed: false },
]

type ActiveDelivery = {
  type: string
  reference: string
  destination: string
  customer_name: string
  customer_phone: string | null
  earning: number
  tip: number
  order_type: string
}

export default function DriverNavigationPage() {
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [progress, setProgress] = useState(65)
  const [delivery, setDelivery] = useState<ActiveDelivery | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetch("/api/driver/active-delivery")
      .then((r) => r.json())
      .then((data) => { if (data) setDelivery(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(p + 0.5, 100))
    }, 2000)
    return () => clearInterval(progressTimer)
  }, [])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Full Screen Map Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] to-[#050816]">
        {/* Animated Map Grid */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Simulated Map with Glow Routes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {/* Background Roads */}
          <path
            d="M 0 500 Q 250 450 500 500 T 1000 500"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="40"
          />
          <path
            d="M 500 0 Q 450 250 500 500 T 500 1000"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="40"
          />
          
          {/* Main Route with Glow */}
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="50%" stopColor="#00AEEF" />
              <stop offset="100%" stopColor="#B6FF00" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Animated Route Path */}
          <motion.path
            d="M 100 800 Q 200 700 300 650 T 500 500 T 700 400 T 850 300"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Route Points */}
          <motion.circle
            cx="100"
            cy="800"
            r="15"
            fill="#0066FF"
            filter="url(#glow)"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <motion.circle
            cx="850"
            cy="300"
            r="15"
            fill="#B6FF00"
            filter="url(#glow)"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          />
          
          {/* Current Position */}
          <motion.g
            initial={{ x: 100, y: 800 }}
            animate={{ x: 500, y: 500 }}
            transition={{ duration: 30, ease: "linear" }}
          >
            <circle r="20" fill="#0066FF" opacity="0.3" />
            <circle r="12" fill="#0066FF" />
            <circle r="5" fill="white" />
          </motion.g>
        </svg>

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-quickgo-blue/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-quickgo-cyan/15 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      {/* Top Navigation Bar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-0 left-0 right-0 z-50"
      >
        <div className="glass-dark px-4 py-3 mx-4 mt-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/driver/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <p className="text-xs text-muted-foreground">En route vers</p>
                <p className="text-white font-semibold">{delivery?.destination ?? "Chargement..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Weather */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white">28°C</span>
              </div>

              {/* Time */}
              <div className="px-3 py-1.5 rounded-full bg-white/5">
                <span className="text-sm text-white font-mono">
                  {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Audio Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/5"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/5"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Large ETA Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-32 left-1/2 -translate-x-1/2 text-center z-40"
      >
        <div className="glass-dark px-8 py-6 rounded-3xl">
          <p className="text-muted-foreground text-sm mb-1">Arrivée estimée</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold text-white">12</span>
            <span className="text-4xl font-bold text-quickgo-lime">min</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-quickgo-blue" />
              <span className="text-muted-foreground">2.8 km</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-quickgo-lime" />
              <span className="text-muted-foreground">Trafic fluide</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Traffic Alert */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-32 right-4 z-40"
      >
        <div className="glass-dark px-4 py-3 rounded-2xl border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-yellow-500 text-sm font-medium">Ralentissement</p>
              <p className="text-xs text-muted-foreground">Carrefour Nlongkak +3 min</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Voice Command Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute top-1/3 left-4 z-40"
      >
        <div className="glass-dark p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-12 h-12 rounded-full bg-quickgo-blue/30 flex items-center justify-center"
            >
              <Radio className="w-6 h-6 text-quickgo-blue" />
            </motion.div>
            <div>
              <p className="text-white font-medium text-sm">Commandes vocales</p>
              <p className="text-xs text-quickgo-lime">Actives</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-0 left-0 right-0 z-50"
          >
            {/* Panel Toggle */}
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="absolute -top-4 left-1/2 -translate-x-1/2 glass-dark p-2 rounded-full"
            >
              <ChevronUp className={`w-5 h-5 text-white transition-transform ${showPanel ? "rotate-180" : ""}`} />
            </button>

            <div className="glass-dark rounded-t-3xl border-t border-white/10">
              {/* Current Instruction */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-quickgo-blue/20 flex items-center justify-center">
                    <Navigation className="w-7 h-7 text-quickgo-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">Tournez à droite</p>
                    <p className="text-muted-foreground">sur Avenue Kennedy</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">200</p>
                    <p className="text-sm text-muted-foreground">mètres</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-quickgo-blue via-quickgo-cyan to-quickgo-lime h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Route Steps */}
              <div className="p-4 max-h-48 overflow-auto">
                <div className="space-y-3">
                  {routeSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        step.current ? "bg-quickgo-blue/20 border border-quickgo-blue/30" : "bg-white/5"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? "bg-quickgo-lime" : step.current ? "bg-quickgo-blue" : "bg-white/10"
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-4 h-4 text-background" />
                        ) : (
                          <span className={`text-sm font-bold ${step.current ? "text-white" : "text-muted-foreground"}`}>
                            {step.id}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${step.current ? "text-white font-medium" : "text-muted-foreground"}`}>
                          {step.instruction}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{step.distance}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Client Info & Actions */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-quickgo-blue" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-quickgo-lime flex items-center justify-center">
                        <Package className="w-3 h-3 text-background" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">{delivery?.customer_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">Client en attente</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-full border-quickgo-blue/50 text-quickgo-blue">
                      <MessageSquare className="w-5 h-5" />
                    </Button>
                    {delivery?.customer_phone ? (
                      <a href={`tel:${delivery.customer_phone}`}>
                        <Button size="icon" className="rounded-full bg-quickgo-lime text-background">
                          <Phone className="w-5 h-5" />
                        </Button>
                      </a>
                    ) : (
                      <Button size="icon" className="rounded-full bg-quickgo-lime text-background" disabled>
                        <Phone className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Gain</p>
                    <p className="text-white font-bold">{delivery ? new Intl.NumberFormat("fr-FR").format(delivery.earning) + " CFA" : "—"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Pourboire</p>
                    <p className="text-quickgo-lime font-bold">{delivery && delivery.tip > 0 ? "+" + new Intl.NumberFormat("fr-FR").format(delivery.tip) + " CFA" : "—"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-quickgo-cyan font-bold">{delivery?.order_type ?? "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Panel Button */}
      <AnimatePresence>
        {!showPanel && (
          <motion.button
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={() => setShowPanel(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-dark px-6 py-3 rounded-full flex items-center gap-3 z-50"
          >
            <ChevronUp className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Afficher les détails</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
