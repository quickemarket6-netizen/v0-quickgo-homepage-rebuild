"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  Zap, 
  Shield, 
  Clock, 
  ArrowRight, 
  Truck,
  Headphones,
  Bot,
  Sparkles
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Livraison ultra rapide",
    description: "En moins de 30 minutes dans toute la ville",
    cta: "Commander maintenant",
    href: "/marketplace",
    gradient: "from-quickgo-blue to-quickgo-cyan",
  },
  {
    icon: Shield,
    title: "Paiement 100% securise",
    description: "Vos transactions sont protegees et cryptees",
    cta: "En savoir plus",
    href: "/wallet",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Notre equipe est disponible a tout moment",
    cta: "Contacter le support",
    href: "/support",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Truck,
    title: "Devenez vendeur",
    description: "Developpez votre business avec QuickGo",
    cta: "Commencer maintenant",
    href: "/vendors",
    gradient: "from-orange-500 to-amber-500",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 lg:py-24 bg-muted/20 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-quickgo-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-quickgo-lime/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={feature.href}>
                <div className="group relative h-full p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-quickgo-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-quickgo-blue/10">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-quickgo-blue group-hover:gap-3 transition-all">
                    {feature.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-5`} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* AI Assistant Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/ai">
            <div className="group relative rounded-3xl overflow-hidden border border-quickgo-blue/30 hover:border-quickgo-blue/60 transition-all duration-500 hover:shadow-2xl hover:shadow-quickgo-blue/20">
              {/* Background Image */}
              <div className="relative h-[300px] lg:h-[400px]">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_22_18-MJbF5ZuTXc8ldqWNTJC2uMXkxI10oy.png"
                  alt="QuickGo AI Assistant"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="100vw"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-center max-w-xl">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-quickgo-cyan" />
                    </motion.div>
                    <span className="text-sm font-medium text-quickgo-cyan">Powered by AI</span>
                  </div>

                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                    AI Assistant QuickGo
                  </h2>
                  <p className="text-lg text-white/80 mb-6">
                    Votre assistant intelligent pour vous aider a trouver les meilleurs produits, suivre vos commandes et repondre a toutes vos questions.
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white border border-white/20">
                      Reponses instantanees
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white border border-white/20">
                      Aide intelligente
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white border border-white/20">
                      Suggestions personnalisees
                    </span>
                  </div>

                  {/* CTA Button */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-quickgo-blue text-white font-medium group-hover:bg-quickgo-blue/90 transition-colors w-fit">
                    <Bot className="w-5 h-5" />
                    <span>Demander a l&apos;IA</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Animated glow */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-quickgo-blue/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
