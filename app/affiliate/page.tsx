"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  Users, 
  DollarSign, 
  Share2, 
  Gift, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Globe,
  Zap,
  Star,
  Copy,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"

const benefits = [
  {
    icon: DollarSign,
    title: "Commissions attractives",
    description: "Gagnez jusqu'a 15% de commission sur chaque vente generee par votre lien.",
    highlight: "15%"
  },
  {
    icon: Users,
    title: "Parrainage illimite",
    description: "Aucune limite sur le nombre de personnes que vous pouvez parrainer.",
    highlight: "Illimite"
  },
  {
    icon: Gift,
    title: "Bonus de bienvenue",
    description: "Recevez 5 000 FCFA de bonus des votre premiere conversion reussie.",
    highlight: "5 000 FCFA"
  },
  {
    icon: TrendingUp,
    title: "Revenus passifs",
    description: "Continuez a gagner tant que vos filleuls utilisent QuickGo.",
    highlight: "Passif"
  }
]

const steps = [
  {
    step: "01",
    title: "Inscrivez-vous",
    description: "Creez votre compte affilié gratuitement en quelques minutes."
  },
  {
    step: "02",
    title: "Obtenez votre lien",
    description: "Recevez votre lien de parrainage unique et vos outils marketing."
  },
  {
    step: "03",
    title: "Partagez",
    description: "Partagez votre lien sur vos reseaux sociaux, blog ou site web."
  },
  {
    step: "04",
    title: "Gagnez",
    description: "Recevez vos commissions directement sur votre compte QuickGo Pay."
  }
]

const tiers = [
  {
    name: "Bronze",
    requirement: "0-10 filleuls",
    commission: "10%",
    color: "from-amber-600 to-amber-800"
  },
  {
    name: "Argent",
    requirement: "11-50 filleuls",
    commission: "12%",
    color: "from-gray-400 to-gray-600"
  },
  {
    name: "Or",
    requirement: "51-100 filleuls",
    commission: "15%",
    color: "from-yellow-400 to-yellow-600"
  },
  {
    name: "Platine",
    requirement: "100+ filleuls",
    commission: "20%",
    color: "from-cyan-400 to-blue-600"
  }
]

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-quickgo-blue/20 via-transparent to-quickgo-lime/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-quickgo-blue/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-quickgo-lime/20 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-quickgo-lime/20 text-quickgo-lime text-sm font-medium mb-6"
              >
                <Gift className="w-4 h-4" />
                Programme Affiliation QuickGo
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold text-foreground mb-6"
              >
                Gagnez de l&apos;argent en{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-blue to-quickgo-lime">
                  partageant QuickGo
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              >
                Rejoignez notre programme d&apos;affiliation et gagnez jusqu&apos;a 20% de commission sur chaque nouvelle inscription et commande.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/auth/register?type=affiliate">
                  <Button size="lg" className="bg-quickgo-lime text-black hover:bg-quickgo-lime/90 font-semibold px-8 h-14 text-lg rounded-xl">
                    Devenir affilié
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl">
                  En savoir plus
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pourquoi devenir affilié ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des avantages exclusifs pour nos partenaires affiliés
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-6 rounded-2xl bg-card border border-border hover:border-quickgo-blue/50 transition-all group"
                >
                  <div className="absolute top-4 right-4 text-3xl font-bold text-quickgo-blue/20 group-hover:text-quickgo-blue/40 transition-colors">
                    {benefit.highlight}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-quickgo-blue/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-quickgo-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comment ca marche ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                4 etapes simples pour commencer a gagner
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="text-6xl font-bold text-quickgo-blue/10 mb-4">{step.step}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-quickgo-blue/50 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission Tiers */}
        <section className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Niveaux de commission
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Plus vous parrainez, plus vous gagnez
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-6 rounded-2xl bg-card border border-border overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-10`} />
                  <div className="relative">
                    <div className="text-sm text-muted-foreground mb-2">{tier.requirement}</div>
                    <div className="text-2xl font-bold text-foreground mb-1">{tier.name}</div>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-quickgo-blue to-quickgo-lime">
                      {tier.commission}
                    </div>
                    <div className="text-sm text-muted-foreground">de commission</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-12 rounded-3xl bg-gradient-to-br from-quickgo-blue/20 to-quickgo-lime/20 border border-quickgo-blue/30"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pret a commencer ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoignez des milliers d&apos;affiliés qui gagnent deja de l&apos;argent avec QuickGo.
              </p>
              <Link href="/auth/register?type=affiliate">
                <Button size="lg" className="bg-quickgo-lime text-black hover:bg-quickgo-lime/90 font-semibold px-8 h-14 text-lg rounded-xl">
                  Creer mon compte affilié
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
