"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Clock, Star, Users, CheckCircle2, Package, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

const stats = [
  { value: "10 000+", label: "Clients satisfaits", icon: Users },
  { value: "200K+", label: "Produits disponibles", icon: Package },
  { value: "5K+", label: "Magasins verifies", icon: CheckCircle2 },
  { value: "30 min", label: "Livraison en moyenne", icon: Clock },
  { value: "100%", label: "Paiement securise", icon: Shield },
]

// All videos to loop in background
const backgroundVideos = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/livraison%20video-dZWQtCi7AyA0MWFt0GqE3XOzjtIEEY.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mokup%20videos%20-MWFOWqEEekv6R5k5Q8dlveU6tmwux9.mp4",
]

export function HeroSection() {
  const [isMuted, setIsMuted] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  // Handle video end - switch to next video
  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % backgroundVideos.length)
  }

  // Update video source when index changes
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.src = backgroundVideos[currentVideoIndex]
      video.load()
      
      const handleCanPlay = () => {
        video.play().catch(() => {
          // Ignore play errors - browser autoplay policy
        })
      }
      
      video.addEventListener('canplay', handleCanPlay, { once: true })
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [currentVideoIndex])

  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-20 lg:pt-24">
      {/* Layer 1: Premium Video Background - All videos looping */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src={backgroundVideos[0]} type="video/mp4" />
        </video>
        {/* Dark overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        {/* Scan lines effect */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
        }} />
      </div>

      {/* Video Sound Control */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={toggleMute}
        className="absolute bottom-8 right-8 z-50 p-3 rounded-full bg-card/80 backdrop-blur-xl border border-border/30 hover:bg-card transition-all"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Volume2 className="w-5 h-5 text-quickgo-lime" />
        )}
      </motion.button>

      {/* Video Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {backgroundVideos.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentVideoIndex 
                ? 'bg-quickgo-lime w-6' 
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Layer 2: Animated Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] rounded-full bg-quickgo-blue/20 blur-[150px] -left-[200px] top-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-[400px] h-[400px] rounded-full bg-quickgo-cyan/15 blur-[100px] left-1/2 -translate-x-1/2 top-[200px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[350px] h-[350px] rounded-full bg-quickgo-lime/10 blur-[80px] right-[100px] top-[300px]"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-6rem)]">
          
          {/* LEFT SIDE: Marketing Copy */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left py-8 lg:py-0"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-quickgo-lime/10 border border-quickgo-lime/20 mb-6"
            >
              <Zap className="h-4 w-4 text-quickgo-lime" />
              <span className="text-sm font-medium text-quickgo-lime">
                LIVRAISON RAPIDE & SECURISEE
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-balance"
            >
              <span className="text-white">Tout ce dont</span>
              <br />
              <span className="text-white">vous avez besoin.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-lime via-quickgo-cyan to-quickgo-blue">
                Livre intelligemment.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty"
            >
              Marketplace locale, livraison express, paiements securises, 
              et bien plus encore dans une seule super app.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/marketplace">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 bg-quickgo-lime text-background hover:bg-quickgo-lime/90 font-semibold text-base shadow-[0_0_30px_rgba(191,255,0,0.3)] transition-all hover:shadow-[0_0_50px_rgba(191,255,0,0.5)]"
                >
                  Commander maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 border-white/20 bg-white/5 hover:bg-white/10 font-semibold text-base text-white backdrop-blur-sm"
                >
                  Explorer les services
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-xs font-bold text-white shadow-lg"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  10 000+ clients satisfaits
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">4.9/5</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE: Premium Visual Composition */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[450px] sm:h-[500px] lg:h-[600px]"
          >
            {/* Central Phone Mockup */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 lg:left-[20%] lg:translate-x-0 top-[8%] z-20"
            >
              <div className="relative">
                {/* Phone Frame - Proportional size */}
                <div className="relative w-[180px] sm:w-[200px] lg:w-[220px] h-[360px] sm:h-[400px] lg:h-[440px] rounded-[32px] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-1.5 shadow-2xl shadow-quickgo-blue/20">
                  <div className="w-full h-full rounded-[26px] overflow-hidden bg-background relative">
                    {/* Phone Video Content */}
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mokup%20videos%20-MWFOWqEEekv6R5k5Q8dlveU6tmwux9.mp4" type="video/mp4" />
                    </video>
                  </div>
                  {/* Phone Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-800" />
                  </div>
                </div>
                {/* Glow behind phone */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-quickgo-blue via-quickgo-cyan to-quickgo-lime rounded-[32px] blur-2xl opacity-30 scale-105" />
              </div>
            </motion.div>

            {/* Premium Scooter Image - Proper size */}
            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute right-[-10px] lg:right-[-40px] bottom-[8%] z-30 hidden sm:block"
            >
              <div className="relative w-[220px] lg:w-[280px] h-[160px] lg:h-[200px]">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2021_11_46-8mzFh4yQO9UW9LSf5eIpCGipdkYWOz.png"
                  alt="QuickGo Premium Delivery Scooter"
                  fill
                  className="object-contain object-right-bottom drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                />
                {/* Animated glow under scooter */}
                <motion.div
                  animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-3 bg-quickgo-cyan/40 blur-lg rounded-full"
                />
              </div>
            </motion.div>

            {/* AI Robot Assistant - Visible and well positioned */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5, type: "spring" }}
              className="absolute bottom-[15%] left-[5%] lg:left-[0%] z-40"
            >
              <div className="relative">
                {/* Robot Image - Good size */}
                <div className="relative w-[80px] h-[80px] lg:w-[100px] lg:h-[100px]">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2021_18_12-1TgU6hLRFeK5CWWB3UFIPnTcKRO9YR.png"
                    alt="QuickGo AI Assistant"
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]"
                  />
                </div>
                {/* Speech bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-xl rounded-xl px-3 py-2 border border-quickgo-cyan/30 whitespace-nowrap shadow-lg"
                >
                  <p className="text-[11px] lg:text-xs text-white font-medium">{"Comment puis-je vous aider?"}</p>
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-card/95 border-r border-b border-quickgo-cyan/30 rotate-45" />
                </motion.div>
                {/* Pulsing glow */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-quickgo-cyan/20 rounded-full blur-xl -z-10"
                />
              </div>
            </motion.div>

            {/* Floating Cards - Compact and well positioned */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="absolute top-[2%] right-[5%] z-40"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-quickgo-blue/30 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-quickgo-blue/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-quickgo-blue" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Livraison Express</p>
                    <p className="text-[10px] text-muted-foreground">en moins de 30 min</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute top-[18%] right-[0%] z-40"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-quickgo-lime/30 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-quickgo-lime/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-quickgo-lime" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Paiement Securise</p>
                    <p className="text-[10px] text-muted-foreground">100% protege</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute top-[34%] right-[-2%] z-40"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-cyan-500/30 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Support 24/7</p>
                    <p className="text-[10px] text-muted-foreground">Nous sommes la</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Live Tracking Widget - Compact */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute bottom-[35%] left-[-3%] z-40 hidden lg:block"
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-quickgo-blue/30 shadow-lg w-[160px]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground">En route</span>
                  <span className="flex items-center gap-1 text-quickgo-lime text-[10px]">
                    <span className="w-1.5 h-1.5 bg-quickgo-lime rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-white font-semibold text-xs">Arrivee estimee</p>
                <p className="text-lg font-bold text-quickgo-blue">10 - 15 min</p>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "65%" }}
                    transition={{ delay: 1.5, duration: 1.5 }}
                    className="h-full bg-gradient-to-r from-quickgo-blue to-quickgo-lime rounded-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="relative z-20 pb-12 lg:pb-20"
        >
          <div className="bg-card/50 backdrop-blur-xl border border-border/30 rounded-3xl p-6 lg:p-8 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-quickgo-blue group-hover:text-quickgo-lime transition-colors" />
                    <span className="text-2xl lg:text-3xl font-bold text-white">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
