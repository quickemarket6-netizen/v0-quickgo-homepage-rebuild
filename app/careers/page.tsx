"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Briefcase,
  MapPin,
  Clock,
  Users,
  Zap,
  Heart,
  Gift,
  ArrowRight,
  Search
} from "lucide-react"

const benefits = [
  { icon: Zap, title: "Croissance rapide", description: "Evoluer dans une startup en pleine expansion" },
  { icon: Heart, title: "Culture inclusive", description: "Un environnement diversifie et bienveillant" },
  { icon: Gift, title: "Avantages", description: "Assurance, repas, transport et plus" },
  { icon: Users, title: "Equipe talentueuse", description: "Travailler avec les meilleurs du Cameroun" },
]

const positions = [
  {
    title: "Developpeur Full Stack Senior",
    department: "Technologie",
    location: "Yaounde",
    type: "CDI",
    description: "Rejoignez notre equipe tech pour construire la super app africaine."
  },
  {
    title: "Product Manager",
    department: "Produit",
    location: "Yaounde",
    type: "CDI",
    description: "Definissez la vision produit et guidez le developpement."
  },
  {
    title: "Operations Manager",
    department: "Operations",
    location: "Douala",
    type: "CDI",
    description: "Gerez les operations de livraison dans la region du Littoral."
  },
  {
    title: "UX/UI Designer",
    department: "Design",
    location: "Remote",
    type: "CDI",
    description: "Creez des experiences utilisateur exceptionnelles."
  },
  {
    title: "Responsable Marketing Digital",
    department: "Marketing",
    location: "Yaounde",
    type: "CDI",
    description: "Dirigez nos initiatives marketing et acquisition."
  },
  {
    title: "Data Analyst",
    department: "Data",
    location: "Yaounde",
    type: "CDI",
    description: "Analysez les donnees pour optimiser nos operations."
  },
]

export default function CareersPage() {
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
              Carrieres chez QuickGo
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Construisez l&apos;avenir du{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                commerce africain
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez une equipe passionnee qui revolutionne le quotidien 
              de millions de Camerounais. Ensemble, faisons de QuickGo la 
              super app de reference en Afrique.
            </p>
            <Button size="lg" className="gap-2">
              Voir les postes ouverts
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="p-6 rounded-2xl bg-card border border-border/50 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Postes Ouverts
            </h2>
            <p className="text-lg text-muted-foreground">
              Trouvez le poste qui correspond a vos ambitions
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un poste..."
                className="h-14 pl-12 text-lg"
              />
            </div>
          </motion.div>

          {/* Positions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {positions.map((position, index) => (
              <div
                key={position.title}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{position.title}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {position.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{position.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {position.location}
                      </span>
                    </div>
                  </div>
                  <Button className="gap-2 shrink-0">
                    Postuler
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Vous ne trouvez pas le poste ideal ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Envoyez-nous votre candidature spontanee. Nous sommes toujours 
              a la recherche de talents exceptionnels.
            </p>
            <Button size="lg" variant="outline" className="gap-2">
              Candidature spontanee
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
