"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Clock, Star, MapPin, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroFloatingCards } from "./hero-floating-cards"
import { HeroPhoneMockup } from "./hero-phone-mockup"
import { HeroDriverVisual } from "./hero-driver-visual"

const stats = [
  { value: "10 000+", label: "Clients satisfaits", icon: Star },
  { value: "200K+", label: "Produits disponibles", icon: CheckCircle2 },
  { value: "5K+", label: "Magasins vérifiés", icon: Shield },
  { value: "30 min", label: "Livraison en moyenne", icon: Clock },
  { value: "100%", label: "Paiement sécurisé", icon: Shield },
]

const trustIndicators = [
  { src: "/avatars/user1.jpg", alt: "User 1" },
  { src: "/avatars/user2.jpg", alt: "User 2" },
  { src: "/avatars/user3.jpg", alt: "User 3" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-20 lg:pt-24">
      {/* Layer 1: Animated Background */}
      <div className="absolute inset-0">
        {/* City Skyline Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0017-VfUk2GL8cI8XZwFiuVYUELEHdaQEQW.jpg"
            alt="City background"
            fill
            className="object-cover object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      {/* Layer 2: Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary Blue Glow - Left */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="hero-glow-orb w-[600px] h-[600px] bg-primary/30 -left-[200px] top-[100px]"
        />
        
        {/* Cyan Glow - Center */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="hero-glow-orb w-[500px] h-[500px] bg-accent/30 left-1/2 -translate-x-1/2 top-[200px]"
        />
        
        {/* Lime Glow - Right */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="hero-glow-orb w-[400px] h-[400px] bg-secondary/20 right-[100px] top-[300px]"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6"
            >
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">
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
              <span className="text-foreground">Tout ce dont</span>
              <br />
              <span className="text-foreground">vous avez besoin.</span>
              <br />
              <span className="text-gradient-lime">Livré intelligemment.</span>
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
                  className="w-full sm:w-auto h-14 px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-base glow-lime"
                >
                  Commander maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 border-border/50 hover:bg-muted/50 font-semibold text-base"
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
              {/* Avatars */}
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  10 000+ clients satisfaits
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-secondary text-secondary"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE: Visual Composition */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] sm:h-[600px] lg:h-[700px]"
          >
            {/* Phone Mockup - Center */}
            <HeroPhoneMockup />
            
            {/* Driver Visual - Right */}
            <HeroDriverVisual />
            
            {/* Floating Cards */}
            <HeroFloatingCards />
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-20 pb-12 lg:pb-20"
        >
          <div className="glass rounded-2xl p-6 lg:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-primary" />
                    <span className="text-2xl lg:text-3xl font-bold text-foreground">
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
