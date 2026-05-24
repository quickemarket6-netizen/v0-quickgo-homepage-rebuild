"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Shield,
  Clock,
  MapPin,
  Package,
  Truck,
  Bike,
  Car,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react"

const deliveryOptions = [
  {
    id: "moto",
    icon: Bike,
    name: "Moto",
    description: "Idéal pour les petits colis",
    price: "1 500 CFA",
    time: "15-30 min",
    maxWeight: "5 kg",
    selected: true,
  },
  {
    id: "voiture",
    icon: Car,
    name: "Voiture",
    description: "Pour vos colis moyens",
    price: "3 500 CFA",
    time: "20-40 min",
    maxWeight: "20 kg",
  },
  {
    id: "camion",
    icon: Truck,
    name: "Camion",
    description: "Pour les gros colis",
    price: "7 000 CFA",
    time: "45-90 min",
    maxWeight: "100 kg",
  },
]

const features = [
  {
    icon: Zap,
    title: "Rapide",
    description: "Livraison en moins de 30 minutes",
  },
  {
    icon: Shield,
    title: "Sécurisé",
    description: "Vos colis sont 100% protégés",
  },
  {
    icon: MapPin,
    title: "Suivi en temps réel",
    description: "Suivez votre commande à chaque étape",
  },
  {
    icon: Clock,
    title: "24/7",
    description: "Service disponible à toute heure",
  },
]

const steps = [
  { number: 1, title: "Créez votre commande", description: "Indiquez les détails de votre livraison" },
  { number: 2, title: "Choisissez le transport", description: "Moto, voiture ou camion selon vos besoins" },
  { number: 3, title: "Un livreur accepte", description: "Un livreur proche de vous accepte la mission" },
  { number: 4, title: "Suivez en direct", description: "Suivez votre colis en temps réel sur la carte" },
  { number: 5, title: "Recevez votre colis", description: "Confirmation par QR code ou signature" },
]

export default function DeliveryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
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
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    LIVRAISON EXPRESS
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6">
                  Livraison ultra rapide{" "}
                  <span className="text-gradient-lime">où que vous soyez</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Envoyez ou recevez vos colis en toute sécurité avec suivi en temps réel.
                  Service disponible 24h/24, 7j/7.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8">
                    Livraison Express
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8">
                    Livraison Standard
                  </Button>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {feature.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
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
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0021-dgKJ81EuwzeYWtrOOVhRgCeDHterip.jpg"
                    alt="QuickGo Delivery"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Delivery Options */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Choisissez votre type de transport
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Sélectionnez le véhicule adapté à la taille de votre colis
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {deliveryOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    option.selected
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border/50 hover:border-primary/30"
                  }`}>
                    {option.selected && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                      <option.icon className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {option.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {option.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prix</span>
                        <span className="font-semibold text-secondary">{option.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Temps estimé</span>
                        <span className="font-medium text-foreground">{option.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Poids max</span>
                        <span className="font-medium text-foreground">{option.maxWeight}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
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
                En 5 étapes simples, votre colis est livré
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
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-primary/20" />
                  )}
                </motion.div>
              ))}
            </div>
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
                Prêt à envoyer votre colis ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Créez votre première livraison en moins de 2 minutes
              </p>
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8">
                Commander une livraison
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
