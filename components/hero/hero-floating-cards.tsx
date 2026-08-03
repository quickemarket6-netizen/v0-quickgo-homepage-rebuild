"use client"

import { motion } from "framer-motion"
import {
  Zap,
  Shield,
  Headphones,
  MapPin,
} from "lucide-react"

const floatingCards = [
  {
    id: "delivery-express",
    icon: Zap,
    title: "Livraison Express",
    subtitle: "en moins de 30 min",
    position: "top-[5%] right-[5%] lg:right-[25%]",
    color: "primary",
    delay: 0.5,
  },
  {
    id: "payment-secure",
    icon: Shield,
    title: "Paiement Sécurisé",
    subtitle: "100% sécurisé",
    position: "top-[25%] right-[0%] lg:right-[5%]",
    color: "secondary",
    delay: 0.7,
  },
  {
    id: "support-247",
    icon: Headphones,
    title: "Support 24/7",
    subtitle: "Nous sommes là",
    position: "top-[50%] right-[0%] lg:right-[0%]",
    color: "accent",
    delay: 0.9,
  },
  {
    id: "tracking",
    icon: MapPin,
    title: "En route",
    subtitle: "Arrivée estimée 10-15 min",
    position: "bottom-[35%] left-[5%] lg:left-[0%]",
    color: "primary",
    delay: 0.6,
    isLarge: true,
  },
]

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: "text-primary",
    glow: "shadow-primary/20",
  },
  secondary: {
    bg: "bg-secondary/10",
    border: "border-secondary/20",
    icon: "text-secondary",
    glow: "shadow-secondary/20",
  },
  accent: {
    bg: "bg-accent/10",
    border: "border-accent/20",
    icon: "text-accent",
    glow: "shadow-accent/20",
  },
}

export function HeroFloatingCards() {
  return (
    <>
      {floatingCards.map((card, index) => {
        const colors = colorClasses[card.color as keyof typeof colorClasses]
        
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: card.delay,
              type: "spring",
              stiffness: 100,
            }}
            className={`absolute ${card.position} z-30`}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              }}
            >
              <div
                className={`
                  glass rounded-2xl p-4 
                  ${card.isLarge ? "min-w-[180px]" : "min-w-[140px]"}
                  border ${colors.border}
                  shadow-lg ${colors.glow}
                  backdrop-blur-xl
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${colors.bg}`}>
                    <card.icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {card.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
                
                {card.isLarge && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                      JP
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Jean Paul N.</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-secondary">★ 4.9</span>
                        <span className="text-[10px] text-muted-foreground">Livreur</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )
      })}
      
      {/* Live Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-[20%] right-[30%] lg:right-[40%] z-30"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="glass rounded-full px-4 py-2 flex items-center gap-2 border border-secondary/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <span className="text-xs font-medium text-foreground">
              256 livreurs actifs
            </span>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
