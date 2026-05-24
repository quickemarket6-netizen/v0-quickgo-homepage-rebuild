"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Store,
  TrendingUp,
  Package,
  Users,
  Shield,
  Headphones,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const benefits = [
  {
    icon: TrendingUp,
    title: "Augmentez vos ventes",
    description: "Accédez à des milliers de clients potentiels",
  },
  {
    icon: Package,
    title: "Livraison gérée",
    description: "Nous gérons toute la logistique pour vous",
  },
  {
    icon: BarChart3,
    title: "Analytics avancés",
    description: "Suivez vos performances en temps réel",
  },
  {
    icon: Headphones,
    title: "Support dédié",
    description: "Une équipe dédiée pour vous accompagner",
  },
]

const steps = [
  { number: 1, title: "Informations", description: "Remplissez vos informations business" },
  { number: 2, title: "Documents", description: "Téléchargez vos documents légaux" },
  { number: 3, title: "Vérification", description: "Validation par notre équipe" },
  { number: 4, title: "Terminé", description: "Commencez à vendre sur QuickGo" },
]

const stats = [
  { value: "5 000+", label: "Vendeurs actifs" },
  { value: "200K+", label: "Produits listés" },
  { value: "98%", label: "Satisfaction vendeurs" },
  { value: "24h", label: "Délai vérification" },
]

const features = [
  "Tableau de bord complet",
  "Gestion des stocks en temps réel",
  "Paiements sécurisés",
  "Support prioritaire 24/7",
  "Formation et accompagnement",
  "Marketing et promotions inclus",
]

export default function VendorsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
            <div className="absolute inset-0 bg-grid opacity-30" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    DEVENEZ VENDEUR QUICKGO
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6">
                  Développez votre{" "}
                  <span className="text-gradient-blue">business</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Rejoignez la marketplace QuickGo et vendez vos produits 
                  à des milliers de clients. Nous gérons la livraison pour vous.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/auth/register?type=vendor">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8">
                      Commencer maintenant
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-14 px-8">
                    En savoir plus
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
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
                <div className="relative aspect-square max-w-lg mx-auto">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0027-AyXWtmDc6FDhYC9s31HBkM205LH8BF.jpg"
                    alt="QuickGo Vendor Dashboard"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Pourquoi vendre sur QuickGo ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des outils puissants pour développer votre activité
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
                  className="p-6 rounded-2xl bg-card border border-border/50"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Onboarding Steps */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Inscription simple en 4 étapes
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
                  className="relative text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-primary/20" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features List */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Ce qui est inclus
              </h2>
              <p className="text-lg text-muted-foreground">
                Tout ce dont vous avez besoin pour réussir
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
                  <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Prêt à développer votre business ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Rejoignez des milliers de vendeurs qui réussissent sur QuickGo
              </p>
              <Link href="/auth/register?type=vendor">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8">
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
