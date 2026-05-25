"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const deliveryOptions = [
  {
    id: "moto",
    image: "/images/premium/transfert-scooter.jpg",
    name: "Moto",
    description: "Ideal pour les petits colis",
    price: "1 500 CFA",
    time: "15-30 min",
    maxWeight: "5 kg",
    href: "/delivery/create?type=moto",
    selected: true,
  },
  {
    id: "voiture",
    image: "/images/premium/livraison-geree.jpg",
    name: "Voiture",
    description: "Pour vos colis moyens",
    price: "3 500 CFA",
    time: "20-40 min",
    maxWeight: "20 kg",
    href: "/delivery/create?type=voiture",
  },
  {
    id: "camion",
    image: "/images/premium/camion-gros-colis.jpg",
    name: "Camion",
    description: "Pour les gros colis",
    price: "7 000 CFA",
    time: "45-90 min",
    maxWeight: "100 kg",
    href: "/delivery/create?type=camion",
  },
]

const features = [
  {
    image: "/images/premium/livraison-express.jpg",
    title: "Rapide",
    description: "Livraison en moins de 30 minutes",
    href: "/delivery/create",
  },
  {
    image: "/images/premium/securise.jpg",
    title: "Securise",
    description: "Vos colis sont 100% proteges",
    href: "/security",
  },
  {
    image: "/images/premium/transfert-intelligent.jpg",
    title: "Suivi en temps reel",
    description: "Suivez votre commande a chaque etape",
    href: "/tracking",
  },
  {
    image: "/images/premium/support-dedie.jpg",
    title: "Support 24/7",
    description: "Service disponible a toute heure",
    href: "/support",
  },
]

const steps = [
  { number: 1, title: "Creez votre commande", description: "Indiquez les details de votre livraison" },
  { number: 2, title: "Choisissez le transport", description: "Moto, voiture ou camion selon vos besoins" },
  { number: 3, title: "Un livreur accepte", description: "Un livreur proche de vous accepte la mission" },
  { number: 4, title: "Suivez en direct", description: "Suivez votre colis en temps reel sur la carte" },
  { number: 5, title: "Recevez votre colis", description: "Confirmation par QR code ou signature" },
]

export default function DeliveryPage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 via-black to-lime-500/5" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/30 mb-6">
                  <Zap className="h-4 w-4 text-lime-500" />
                  <span className="text-sm font-medium text-lime-500">
                    LIVRAISON EXPRESS
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
                  Livraison ultra rapide{" "}
                  <span className="text-lime-500">ou que vous soyez</span>
                </h1>
                
                <p className="text-lg text-zinc-400 mb-8 max-w-lg">
                  Envoyez ou recevez vos colis en toute securite avec suivi en temps reel.
                  Service disponible 24h/24, 7j/7.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/delivery/create">
                    <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold">
                      Livraison Express
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-14 px-8 border-lime-500/30 text-lime-500 hover:bg-lime-500/10">
                    Livraison Standard
                  </Button>
                </div>
              </motion.div>
              
              {/* Right - Visual */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <Link href="/delivery/create" className="block group">
                  <div className="relative aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden border border-lime-500/30 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_60px_rgba(132,204,22,0.2)]">
                    <Image
                      src="/images/premium/livraison-express.jpg"
                      alt="QuickGo Delivery"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Premium Features with Images */}
        <section className="py-16 lg:py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Pourquoi choisir <span className="text-lime-500">QuickGo Delivery</span> ?
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Une experience de livraison premium
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={feature.href} className="block group">
                    <div className="relative h-64 rounded-2xl overflow-hidden border border-lime-500/20 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(132,204,22,0.2)] hover:scale-[1.02]">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
                      
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime-400 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Options with Premium Images */}
        <section className="py-16 lg:py-24 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Choisissez votre <span className="text-lime-500">type de transport</span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Selectionnez le vehicule adapte a la taille de votre colis
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {deliveryOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={option.href} className="block group">
                    <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-[1.02] ${
                      option.selected
                        ? "border-lime-500 shadow-[0_0_30px_rgba(132,204,22,0.3)]"
                        : "border-lime-500/20 hover:border-lime-500/60"
                    }`}>
                      {option.selected && (
                        <div className="absolute top-4 right-4 z-20">
                          <CheckCircle2 className="h-6 w-6 text-lime-500" />
                        </div>
                      )}
                      
                      {/* Image */}
                      <div className="relative h-48">
                        <Image
                          src={option.image}
                          alt={option.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative p-5 bg-zinc-900">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-lime-400 transition-colors">
                          {option.name}
                        </h3>
                        <p className="text-sm text-zinc-400 mb-4">
                          {option.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Prix</span>
                            <span className="font-semibold text-lime-500">{option.price}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Temps estime</span>
                            <span className="font-medium text-white">{option.time}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Poids max</span>
                            <span className="font-medium text-white">{option.maxWeight}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-lime-500/20">
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-lime-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            Selectionner
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 lg:py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Comment ca <span className="text-lime-500">marche</span> ?
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                En 5 etapes simples, votre colis est livre
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="text-center p-4 rounded-2xl bg-zinc-900/50 border border-lime-500/20 hover:border-lime-500/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-lime-500 text-black text-xl font-bold flex items-center justify-center mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {step.description}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-lime-500 to-lime-500/20" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-lime-500/10 via-black to-lime-500/10 border-t border-lime-500/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Pret a envoyer votre <span className="text-lime-500">colis</span> ?
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Creez votre premiere livraison en moins de 2 minutes
              </p>
              <Link href="/delivery/create">
                <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold">
                  Commander une livraison
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
