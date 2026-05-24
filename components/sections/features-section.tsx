"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  Zap, 
  Shield, 
  Clock, 
  Package, 
  ArrowRight, 
  Truck,
  CreditCard,
  Headphones,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Zap,
    title: "Livraison ultra rapide",
    description: "En moins de 30 minutes",
    cta: "Commander",
    href: "/marketplace",
    color: "primary",
  },
  {
    icon: Shield,
    title: "Paiement 100% sécurisé",
    description: "Vos transactions sont protégées",
    cta: "En savoir plus",
    href: "/wallet",
    color: "secondary",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Nous sommes là pour vous",
    cta: "Contacter le support",
    href: "/support",
    color: "accent",
  },
  {
    icon: Truck,
    title: "Devenez vendeur",
    description: "Développez votre business avec QuickGo",
    cta: "Commencer maintenant",
    href: "/vendors",
    color: "primary",
  },
]

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
}

export function FeaturesSection() {
  return (
    <section className="py-16 lg:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={feature.href}>
                <div className="group relative h-full p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className={`inline-flex p-3 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    {feature.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
