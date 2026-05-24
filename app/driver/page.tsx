"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Bike,
  DollarSign,
  Clock,
  MapPin,
  Star,
  Shield,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from "lucide-react"

const benefits = [
  {
    icon: DollarSign,
    title: "Gains attractifs",
    description: "Gagnez jusqu'à 25 000 CFA par jour avec les bonus",
  },
  {
    icon: Clock,
    title: "Flexibilité totale",
    description: "Travaillez quand vous voulez, où vous voulez",
  },
  {
    icon: Shield,
    title: "Assurance incluse",
    description: "Protection complète pendant vos livraisons",
  },
  {
    icon: TrendingUp,
    title: "Évolution rapide",
    description: "Montez en niveau et débloquez plus d'avantages",
  },
]

const steps = [
  { number: 1, title: "Inscrivez-vous", description: "Créez votre compte livreur en quelques minutes" },
  { number: 2, title: "Documents", description: "Soumettez vos documents pour vérification" },
  { number: 3, title: "Formation", description: "Suivez notre formation sécurité gratuite" },
  { number: 4, title: "Commencez", description: "Recevez vos premières missions et gagnez" },
]

const stats = [
  { value: "2 890+", label: "Livreurs actifs" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "25 000 CFA", label: "Gains moyens/jour" },
  { value: "27 min", label: "Temps moyen livraison" },
]

const requirements = [
  "Avoir 18 ans minimum",
  "Posséder un permis de conduire valide",
  "Avoir un smartphone Android ou iOS",
  "Véhicule en bon état (moto, vélo, voiture)",
  "Casier judiciaire vierge",
]

export default function DriverPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-background to-primary/10" />
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
                  <Bike className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">
                    DEVENEZ LIVREUR QUICKGO
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6">
                  Gagnez de l&apos;argent{" "}
                  <span className="text-gradient-lime">à votre rythme</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Rejoignez la communauté QuickGo et devenez livreur partenaire.
                  Flexibilité, bons revenus et support 24/7.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/auth/register?type=driver">
                    <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8">
                      S&apos;inscrire maintenant
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
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0022-VcwYtRjgGWLtsyMv0TfAw2nfzTvQPl.jpg"
                    alt="QuickGo Driver Dashboard"
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
                Pourquoi devenir livreur QuickGo ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des avantages exclusifs pour nos livreurs partenaires
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
                  <div className="p-3 rounded-xl bg-secondary/10 w-fit mb-4">
                    <benefit.icon className="h-6 w-6 text-secondary" />
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

        {/* How to Join */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Comment rejoindre QuickGo ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un processus simple en 4 étapes
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

        {/* Requirements */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Conditions requises
              </h2>
              <p className="text-lg text-muted-foreground">
                Vérifiez que vous remplissez les conditions
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-card border border-border/50"
            >
              <ul className="space-y-4">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                    <span className="text-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Rejoignez des milliers de livreurs qui gagnent avec QuickGo
              </p>
              <Link href="/auth/register?type=driver">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8">
                  S&apos;inscrire maintenant
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
