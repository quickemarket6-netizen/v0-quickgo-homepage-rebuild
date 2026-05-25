"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowRight, 
  Bot,
  Sparkles
} from "lucide-react"

const features = [
  {
    image: "/images/premium/livraison-express.jpg",
    title: "Livraison ultra rapide",
    description: "En moins de 30 minutes dans toute la ville",
    cta: "Commander maintenant",
    href: "/marketplace",
  },
  {
    image: "/images/premium/securise.jpg",
    title: "Paiement 100% securise",
    description: "Vos transactions sont protegees et cryptees",
    cta: "En savoir plus",
    href: "/wallet",
  },
  {
    image: "/images/premium/support-dedie.jpg",
    title: "Support 24/7",
    description: "Notre equipe est disponible a tout moment",
    cta: "Contacter le support",
    href: "/support",
  },
  {
    image: "/images/premium/developpez-business.jpg",
    title: "Devenez vendeur",
    description: "Developpez votre business avec QuickGo",
    cta: "Commencer maintenant",
    href: "/vendors",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 lg:py-24 bg-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Pourquoi choisir <span className="text-lime-500">QuickGo</span> ?
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Des services premium pour une experience exceptionnelle
          </p>
        </motion.div>

        {/* Premium Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={feature.href} className="block group">
                <div className="relative h-72 lg:h-80 rounded-2xl overflow-hidden border border-lime-500/20 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(132,204,22,0.2)] hover:scale-[1.02]">
                  {/* Image */}
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 mb-3">
                      {feature.description}
                    </p>
                    
                    {/* CTA */}
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-lime-500 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {feature.cta}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-lime-500/30 to-transparent transform rotate-45 translate-x-12 -translate-y-12 group-hover:from-lime-500/50 transition-colors duration-500" />
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
            <div className="group relative rounded-3xl overflow-hidden border border-lime-500/30 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_60px_rgba(132,204,22,0.2)]">
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
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-center max-w-xl">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-lime-500" />
                    </motion.div>
                    <span className="text-sm font-medium text-lime-500">Powered by AI</span>
                  </div>

                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                    AI Assistant QuickGo
                  </h2>
                  <p className="text-lg text-white/80 mb-6">
                    Votre assistant intelligent pour vous aider a trouver les meilleurs produits, suivre vos commandes et repondre a toutes vos questions.
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1.5 rounded-full bg-lime-500/10 backdrop-blur-sm text-sm text-lime-400 border border-lime-500/30">
                      Reponses instantanees
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-lime-500/10 backdrop-blur-sm text-sm text-lime-400 border border-lime-500/30">
                      Aide intelligente
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-lime-500/10 backdrop-blur-sm text-sm text-lime-400 border border-lime-500/30">
                      Suggestions personnalisees
                    </span>
                  </div>

                  {/* CTA Button */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-lime-500 text-black font-bold group-hover:bg-lime-400 transition-colors w-fit">
                    <Bot className="w-5 h-5" />
                    <span>Demander a l&apos;IA</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Animated glow */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-lime-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Bottom line glow */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
