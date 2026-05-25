"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  HelpCircle,
  Package,
  CreditCard,
  Shield,
  Truck,
  Bot,
} from "lucide-react"

const categories = [
  {
    icon: Package,
    title: "Commandes & Livraison",
    description: "Questions sur vos commandes et livraisons",
    articles: 24,
    slug: "commandes",
  },
  {
    icon: CreditCard,
    title: "Paiements & Facturation",
    description: "Méthodes de paiement, remboursements",
    articles: 18,
    slug: "paiements",
  },
  {
    icon: Shield,
    title: "Compte & Sécurité",
    description: "Gestion de compte, confidentialité",
    articles: 15,
    slug: "compte",
  },
  {
    icon: Truck,
    title: "Devenir Livreur",
    description: "Inscription, missions, gains",
    articles: 12,
    slug: "livreur",
  },
  {
    icon: HelpCircle,
    title: "Produits & Services",
    description: "Catalogue, qualité, retours",
    articles: 21,
    slug: "produits",
  },
  {
    icon: Bot,
    title: "QuickGo AI",
    description: "Utilisation de l'assistant IA",
    articles: 8,
    slug: "ai",
  },
]

const popularQuestions = [
  { label: "Comment suivre ma commande ?", slug: "commandes" },
  { label: "Comment annuler une commande ?", slug: "commandes" },
  { label: "Quels sont les délais de livraison ?", slug: "commandes" },
  { label: "Comment demander un remboursement ?", slug: "paiements" },
  { label: "Comment devenir livreur ?", slug: "livreur" },
  { label: "Comment contacter le support ?", slug: "compte" },
]

const contactMethods = [
  {
    icon: MessageSquare,
    title: "Chat en direct",
    description: "Réponse instantanée",
    availability: "24/7",
    action: "Démarrer le chat",
    primary: true,
  },
  {
    icon: Phone,
    title: "Téléphone",
    description: "+237 6 95 55 55 55",
    availability: "8h - 22h",
    action: "Appeler",
  },
  {
    icon: Mail,
    title: "Email",
    description: "support@quickgo.cm",
    availability: "Réponse sous 24h",
    action: "Envoyer un email",
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="absolute inset-0 bg-grid opacity-30" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Comment pouvons-nous vous aider ?
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Recherchez un article, guide, problème...
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher dans le centre d'aide..."
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border-border/50 text-base"
                />
              </div>
              
              {/* Popular Questions */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-muted-foreground">Questions populaires:</span>
                {popularQuestions.slice(0, 3).map((q) => (
                  <Link
                    key={q.label}
                    href={`/support/${q.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Catégories populaires
              </h2>
              <p className="text-lg text-muted-foreground">
                Trouvez rapidement les réponses à vos questions
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/support/${category.slug}`}>
                    <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <category.icon className="h-6 w-6 text-primary" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-4 mb-2">
                        {category.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>
                      <span className="text-xs text-primary font-medium">
                        {category.articles} articles
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Besoin de plus d&apos;aide ?
              </h2>
              <p className="text-lg text-muted-foreground">
                Notre équipe est là pour vous
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl border ${
                    method.primary
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border/50"
                  }`}
                >
                  <div className={`p-3 rounded-xl w-fit mb-4 ${
                    method.primary ? "bg-primary/20" : "bg-muted"
                  }`}>
                    <method.icon className={`h-6 w-6 ${
                      method.primary ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {method.title}
                  </h3>
                  <p className="text-sm text-foreground mb-1">
                    {method.description}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Disponible: {method.availability}
                  </p>
                  <Link href={method.primary ? "/dashboard/messages" : method.title === "Email" ? "mailto:support@quickgo.cm" : "tel:+237695555555"}>
                    <Button
                      className={method.primary ? "bg-primary text-primary-foreground" : ""}
                      variant={method.primary ? "default" : "outline"}
                      size="sm"
                    >
                      {method.action}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      Nos bureaux
                    </h3>
                    <p className="text-muted-foreground">
                      Bastos, Yaoundé, Cameroun
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Lun - Ven: 8h - 18h</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline">
                  Voir sur la carte
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
