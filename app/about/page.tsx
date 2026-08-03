"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Target,
  Zap,
  Globe,
  Award,
  Heart,
  Truck,
  ArrowRight,
} from "lucide-react"

const stats = [
  { value: "500K+", label: "Utilisateurs actifs" },
  { value: "10K+", label: "Livreurs partenaires" },
  { value: "5K+", label: "Commercants" },
  { value: "15+", label: "Villes couvertes" },
]

const values = [
  {
    icon: Zap,
    title: "Rapidite",
    description: "Livraison en moins de 30 minutes dans les zones urbaines"
  },
  {
    icon: Heart,
    title: "Proximite",
    description: "Une equipe locale qui comprend vos besoins"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Service client de qualite superieure"
  },
  {
    icon: Globe,
    title: "Innovation",
    description: "Technologies de pointe pour une experience optimale"
  },
]

const team = [
  { name: "Marc Essomba", role: "CEO & Fondateur", image: "/team/ceo.jpg" },
  { name: "Sarah Ngo", role: "Directrice Operations", image: "/team/coo.jpg" },
  { name: "Paul Kamga", role: "CTO", image: "/team/cto.jpg" },
  { name: "Celine Mbarga", role: "Directrice Marketing", image: "/team/cmo.jpg" },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              A propos de QuickGo
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              La super app qui{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                revolutionne
              </span>{" "}
              le quotidien des Camerounais
            </h1>
            <p className="text-xl text-muted-foreground">
              Depuis 2023, QuickGo connecte les commercants locaux aux clients 
              grace a une plateforme technologique innovante et un reseau de livreurs devoues.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="p-6 rounded-2xl bg-card border border-border/50 text-center"
              >
                <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Chez QuickGo, nous croyons que chaque Camerounais merite un acces 
                facile et rapide a tout ce dont il a besoin. Notre mission est de 
                creer un ecosysteme digital qui connecte les personnes, les commerces 
                et les opportunites.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Nous ne sommes pas juste une application de livraison. Nous sommes 
                un moteur de croissance economique locale, creant des emplois et 
                soutenant les entrepreneurs camerounais.
              </p>
              <Link href="/vendors">
                <Button className="gap-2">
                  Rejoindre l&apos;aventure
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                <Target className="h-32 w-32 text-primary" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Nos Valeurs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Les principes qui guident chacune de nos decisions
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Pret a rejoindre QuickGo ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Que vous soyez client, livreur ou commercant, il y a une place pour vous dans notre ecosysteme.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Creer un compte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/driver">
                <Button size="lg" variant="outline" className="gap-2">
                  <Truck className="h-4 w-4" />
                  Devenir livreur
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
