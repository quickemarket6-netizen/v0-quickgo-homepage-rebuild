"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Clock, Star, Users, CheckCircle2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "10 000+", label: "Clients satisfaits", icon: Users },
  { value: "200K+", label: "Produits disponibles", icon: Package },
  { value: "5K+", label: "Magasins verifies", icon: CheckCircle2 },
  { value: "30 min", label: "Livraison en moyenne", icon: Clock },
  { value: "100%", label: "Paiement securise", icon: Shield },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-20 lg:pt-24">
      {/* Optimized Background - Static gradient instead of video */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-quickgo-blue/10 via-background to-quickgo-lime/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      {/* Static Glow Effects - No animations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-quickgo-blue/15 blur-[120px] -left-[150px] top-[100px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-quickgo-cyan/10 blur-[80px] left-1/2 -translate-x-1/2 top-[200px]" />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-quickgo-lime/8 blur-[60px] right-[100px] top-[300px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-6rem)]">
          
          {/* LEFT SIDE: Marketing Copy - No animations */}
          <div className="text-center lg:text-left py-8 lg:py-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-quickgo-lime/10 border border-quickgo-lime/20 mb-6">
              <Zap className="h-4 w-4 text-quickgo-lime" />
              <span className="text-sm font-medium text-quickgo-lime">
                LIVRAISON RAPIDE & SECURISEE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-balance">
              <span className="text-white">Tout ce dont</span>
              <br />
              <span className="text-white">vous avez besoin.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-lime via-quickgo-cyan to-quickgo-blue">
                Livre intelligemment.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty">
              Marketplace locale, livraison express, paiements securises, 
              et bien plus encore dans une seule super app.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex items-center gap-4 justify-center lg:justify-start">
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
            </div>
          </div>

          {/* RIGHT SIDE: Static Visual Composition */}
          <div className="relative h-[450px] sm:h-[500px] lg:h-[600px]">
            {/* Central Phone Mockup with Static Image */}
            <div className="absolute left-1/2 -translate-x-1/2 lg:left-[20%] lg:translate-x-0 top-[8%] z-20">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative w-[180px] sm:w-[200px] lg:w-[220px] h-[360px] sm:h-[400px] lg:h-[440px] rounded-[32px] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-1.5 shadow-2xl shadow-quickgo-blue/20">
                  <div className="w-full h-full rounded-[26px] overflow-hidden bg-background relative">
                    {/* Static Phone Screen Image */}
                    <Image
                      src="/images/premium/vendor-dashboard.jpg"
                      alt="QuickGo App"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Phone Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-800" />
                  </div>
                </div>
                {/* Static Glow */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-quickgo-blue via-quickgo-cyan to-quickgo-lime rounded-[32px] blur-2xl opacity-30 scale-105" />
              </div>
            </div>

            {/* Scooter Image - Optimized */}
            <div className="absolute right-[-10px] lg:right-[-40px] bottom-[8%] z-30 hidden sm:block">
              <div className="relative w-[220px] lg:w-[280px] h-[160px] lg:h-[200px]">
                <Image
                  src="/images/transport/moto-premium.jpg"
                  alt="QuickGo Livraison"
                  fill
                  className="object-contain object-right-bottom drop-shadow-[0_0_20px_rgba(0,212,255,0.3)] rounded-xl"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Floating Cards - Static, no animations */}
            <div className="absolute top-[2%] right-[5%] z-40">
              <div className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-quickgo-blue/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-quickgo-blue/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-quickgo-blue" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Livraison Express</p>
                    <p className="text-[10px] text-muted-foreground">en moins de 30 min</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-[18%] right-[0%] z-40">
              <div className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-quickgo-lime/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-quickgo-lime/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-quickgo-lime" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Paiement Securise</p>
                    <p className="text-[10px] text-muted-foreground">100% protege</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-[34%] right-[-2%] z-40">
              <div className="bg-card/90 backdrop-blur-xl rounded-xl p-3 border border-cyan-500/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs">Support 24/7</p>
                    <p className="text-[10px] text-muted-foreground">Nous sommes la</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-3"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-quickgo-lime" />
                <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
