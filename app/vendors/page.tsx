"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Store,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const benefits = [
  {
    image: "/images/premium/augmentez-ventes.jpg",
    title: "Augmentez vos ventes",
    description: "Accedez a des milliers de clients potentiels",
    href: "/marketplace",
  },
  {
    image: "/images/premium/livraison-geree.jpg",
    title: "Livraison geree",
    description: "Nous gerons toute la logistique pour vous",
    href: "/delivery",
  },
  {
    image: "/images/premium/analytics-avances.jpg",
    title: "Analytics avances",
    description: "Suivez vos performances en temps reel",
    href: "/vendor/dashboard",
  },
  {
    image: "/images/premium/support-dedie.jpg",
    title: "Support dedie",
    description: "Une equipe dediee pour vous accompagner",
    href: "/support",
  },
]

const steps = [
  { number: 1, title: "Informations", description: "Remplissez vos informations business" },
  { number: 2, title: "Documents", description: "Telechargez vos documents legaux" },
  { number: 3, title: "Verification", description: "Validation par notre equipe" },
  { number: 4, title: "Termine", description: "Commencez a vendre sur QuickGo" },
]

const stats = [
  { value: "5 000+", label: "Vendeurs actifs" },
  { value: "200K+", label: "Produits listes" },
  { value: "98%", label: "Satisfaction vendeurs" },
  { value: "24h", label: "Delai verification" },
]

const features = [
  "Tableau de bord complet",
  "Gestion des stocks en temps reel",
  "Paiements securises",
  "Support prioritaire 24/7",
  "Formation et accompagnement",
  "Marketing et promotions inclus",
]

export default function VendorsPage() {
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
                  <Store className="h-4 w-4 text-lime-500" />
                  <span className="text-sm font-medium text-lime-500">
                    DEVENEZ VENDEUR QUICKGO
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
                  Developpez votre{" "}
                  <span className="text-lime-500">business</span>
                </h1>
                
                <p className="text-lg text-zinc-400 mb-8 max-w-lg">
                  Rejoignez la marketplace QuickGo et vendez vos produits 
                  a des milliers de clients. Nous gerons la livraison pour vous.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/auth/register?type=vendor">
                    <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold">
                      Commencer maintenant
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-14 px-8 border-lime-500/30 text-lime-500 hover:bg-lime-500/10">
                    En savoir plus
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-lime-500/20">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <p className="text-2xl font-bold text-lime-500">{stat.value}</p>
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Right - Visual */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <Link href="/vendor/dashboard" className="block group">
                  <div className="relative aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden border border-lime-500/30 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_60px_rgba(132,204,22,0.2)]">
                    <Image
                      src="/images/premium/vendor-dashboard.jpg"
                      alt="QuickGo Vendor Dashboard"
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

        {/* Premium Benefits with Images */}
        <section className="py-16 lg:py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Pourquoi vendre sur <span className="text-lime-500">QuickGo</span> ?
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Des outils puissants pour developper votre activite
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={benefit.href} className="block group">
                    <div className="relative h-72 lg:h-80 rounded-2xl overflow-hidden border border-lime-500/20 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(132,204,22,0.2)] hover:scale-[1.02]">
                      <Image
                        src={benefit.image}
                        alt={benefit.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
                      
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime-400 transition-colors duration-300">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 mb-3">
                          {benefit.description}
                        </p>
                        
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-lime-500 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          Decouvrir
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>

                      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-lime-500/30 to-transparent transform rotate-45 translate-x-12 -translate-y-12 group-hover:from-lime-500/50 transition-colors duration-500" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Onboarding Steps */}
        <section className="py-16 lg:py-24 bg-black">
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
                Inscription simple en 4 etapes
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative text-center p-6 rounded-2xl bg-zinc-900/50 border border-lime-500/20 hover:border-lime-500/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-lime-500 text-black text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {step.description}
                  </p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-lime-500 to-lime-500/20" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features List */}
        <section className="py-16 lg:py-24 bg-zinc-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ce qui est <span className="text-lime-500">inclus</span>
              </h2>
              <p className="text-lg text-zinc-400">
                Tout ce dont vous avez besoin pour reussir
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-lime-500/20 hover:border-lime-500/40 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-lime-500 shrink-0" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </motion.div>
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
                Pret a developper votre <span className="text-lime-500">business</span> ?
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Rejoignez des milliers de vendeurs qui reussissent sur QuickGo
              </p>
              <Link href="/auth/register?type=vendor">
                <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold">
                  Commencer maintenant
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
