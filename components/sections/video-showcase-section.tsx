"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import Image from "next/image"
import { Play, Pause, Smartphone, Truck, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const showcaseItems = [
  {
    id: 1,
    title: "Marketplace Premium",
    description: "Decouvrez des milliers de produits de qualite livres chez vous en un temps record.",
    video: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
    icon: Smartphone,
    color: "quickgo-blue",
    href: "/marketplace",
  },
  {
    id: 2,
    title: "Livraison Express",
    description: "Nos livreurs professionnels assurent une livraison rapide et securisee partout.",
    video: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/livraison%20video-dZWQtCi7AyA0MWFt0GqE3XOzjtIEEY.mp4",
    icon: Truck,
    color: "quickgo-lime",
    href: "/delivery",
  },
]

export function VideoShowcaseSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [playingVideo, setPlayingVideo] = useState<number | null>(null)

  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-quickgo-blue/5 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-quickgo-cyan/10 border border-quickgo-cyan/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-quickgo-cyan" />
            <span className="text-sm font-medium text-quickgo-cyan">EXPERIENCE PREMIUM</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
            Une experience{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-cyan to-quickgo-blue">
              immersive
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Decouvrez QuickGo en action. Une technologie de pointe au service de votre quotidien.
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.2 }}
              className="group relative"
            >
              {/* Video Container */}
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-card border border-border/30">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={item.video} type="video/mp4" />
                </video>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 lg:p-8 flex flex-col justify-end">
                  <div className={`w-12 h-12 rounded-2xl bg-${item.color}/20 flex items-center justify-center mb-4`}>
                    <item.icon className={`w-6 h-6 text-${item.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">{item.description}</p>
                  <Link href={item.href}>
                    <Button 
                      variant="outline" 
                      className="w-fit border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    >
                      Decouvrir
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Glow Effect on Hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-${item.color}/20 to-transparent pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Phone Mockup Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-20 relative"
        >
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/30 rounded-3xl p-8 lg:p-12 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-quickgo-blue/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {"L'application qui"}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-lime to-quickgo-cyan">
                    {" change tout"}
                  </span>
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Telechargez QuickGo et profitez de la meilleure experience de livraison en Afrique. 
                  Marketplace, livraison express, paiements securises - tout dans une seule app.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-2 h-2 rounded-full bg-quickgo-lime" />
                    <span>+200K produits</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-2 h-2 rounded-full bg-quickgo-blue" />
                    <span>Livraison 30 min</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-2 h-2 rounded-full bg-quickgo-cyan" />
                    <span>Paiement securise</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="h-14 px-8 bg-quickgo-lime text-background hover:bg-quickgo-lime/90 font-semibold">
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    App Store
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 border-white/20 bg-white/5 hover:bg-white/10 font-semibold">
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    Google Play
                  </Button>
                </div>
              </div>

              {/* Phone Mockup with Video */}
              <div className="relative flex justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  {/* Phone Frame */}
                  <div className="relative w-[280px] h-[560px] rounded-[40px] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[32px] overflow-hidden bg-background relative">
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
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full" />
                  </div>
                  
                  {/* Glow */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-quickgo-blue via-quickgo-cyan to-quickgo-lime rounded-[40px] blur-3xl opacity-30 scale-110" />
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-xl rounded-2xl p-3 border border-quickgo-lime/30 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-quickgo-lime/20 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-quickgo-lime" />
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium">En route</p>
                      <p className="text-[10px] text-muted-foreground">15 min</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0], x: [0, -5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-card/90 backdrop-blur-xl rounded-2xl p-3 border border-quickgo-blue/30 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-quickgo-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium">-30%</p>
                      <p className="text-[10px] text-muted-foreground">Promo</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
