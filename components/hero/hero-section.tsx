"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Clock, Star, Users, CheckCircle2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "10 000+", label: "Clients satisfaits", icon: Users },
  { value: "200K+", label: "Produits disponibles", icon: Package },
  { value: "5K+", label: "Magasins vérifiés", icon: CheckCircle2 },
  { value: "30 min", label: "Livraison en moyenne", icon: Clock },
  { value: "100%", label: "Paiement sécurisé", icon: Shield },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-20 lg:pt-24">
      {/* Layer 1: Animated Dark Background with City */}
      <div className="absolute inset-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0017-VfUk2GL8cI8XZwFiuVYUELEHdaQEQW.jpg"
          alt="African city skyline at night"
          fill
          className="object-cover object-center opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Layer 2: Blue Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[800px] h-[800px] rounded-full bg-quickgo-blue/20 blur-[150px] -left-[300px] top-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-[600px] h-[600px] rounded-full bg-quickgo-cyan/20 blur-[120px] left-1/2 -translate-x-1/2 top-[200px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[500px] h-[500px] rounded-full bg-quickgo-lime/10 blur-[100px] right-[100px] top-[300px]"
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
                LIVRAISON RAPIDE & SÉCURISÉE
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-lime to-quickgo-cyan">
                Livré intelligemment.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty"
            >
              Marketplace locale, livraison express, paiements sécurisés, 
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
                  className="w-full sm:w-auto h-14 px-8 bg-quickgo-lime text-background hover:bg-quickgo-lime/90 font-semibold text-base shadow-[0_0_30px_rgba(191,255,0,0.3)]"
                >
                  Commander maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 border-white/20 bg-white/5 hover:bg-white/10 font-semibold text-base text-white"
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
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-xs font-bold text-white"
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
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE: Visual Composition - Phone + Driver + Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] sm:h-[600px] lg:h-[700px]"
          >
            {/* Central Phone Mockup */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 lg:left-[20%] lg:translate-x-0 top-[10%] z-20"
            >
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative w-[240px] sm:w-[280px] h-[480px] sm:h-[560px] rounded-[40px] bg-gradient-to-br from-gray-800 to-gray-900 p-2 shadow-2xl shadow-quickgo-blue/20">
                  <div className="w-full h-full rounded-[32px] overflow-hidden bg-background">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0016-IpaaSd5m5JlRtEUTamyVqEWz5LXvX3.jpg"
                      alt="QuickGo App Interface"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  {/* Phone Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
                </div>
                {/* Glow behind phone */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-quickgo-blue to-quickgo-cyan rounded-[40px] blur-2xl opacity-30 scale-110" />
              </div>
            </motion.div>

            {/* Driver on Scooter */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute right-0 lg:right-[-50px] bottom-[10%] z-30 hidden sm:block"
            >
              <div className="relative w-[300px] lg:w-[400px] h-[300px] lg:h-[400px]">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0021-hbRlzm2m1MSbUn3z0gbeDJE0nctAF6.jpg"
                  alt="QuickGo Delivery Driver"
                  fill
                  className="object-contain object-right-bottom"
                />
              </div>
            </motion.div>

            {/* Floating Card: Livraison Express */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="absolute top-[5%] right-[10%] z-40"
            >
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-4 border border-border/30 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-quickgo-blue/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-quickgo-blue" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Livraison Express</p>
                    <p className="text-xs text-muted-foreground">en moins de 30 min</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card: Paiement Sécurisé */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute top-[20%] right-[5%] z-40"
            >
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-4 border border-border/30 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-quickgo-lime/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-quickgo-lime" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Paiement Sécurisé</p>
                    <p className="text-xs text-muted-foreground">100% protégé</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card: Support 24/7 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute top-[35%] right-[0%] z-40"
            >
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-4 border border-border/30 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Support 24/7</p>
                    <p className="text-xs text-muted-foreground">Nous sommes là</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Live Tracking Widget */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute bottom-[20%] left-[5%] z-40 hidden lg:block"
            >
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-4 border border-quickgo-blue/30 shadow-xl w-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">En route</span>
                  <span className="flex items-center gap-1 text-quickgo-lime text-xs">
                    <span className="w-2 h-2 bg-quickgo-lime rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-white font-semibold">Arrivée estimée</p>
                <p className="text-2xl font-bold text-quickgo-blue">10 - 15 min</p>
              </div>
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
          <div className="bg-card/50 backdrop-blur-xl border border-border/30 rounded-2xl p-6 lg:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-quickgo-blue" />
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
