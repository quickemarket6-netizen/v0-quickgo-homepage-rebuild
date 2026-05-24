"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  MessageSquare,
  Send,
  Headphones
} from "lucide-react"

const contactMethods = [
  {
    icon: Phone,
    title: "Telephone",
    description: "Du lundi au dimanche, 7h - 22h",
    value: "+237 6 95 55 55 55",
    action: "tel:+237695555555"
  },
  {
    icon: Mail,
    title: "Email",
    description: "Reponse sous 24h",
    value: "contact@quickgo.cm",
    action: "mailto:contact@quickgo.cm"
  },
  {
    icon: MessageSquare,
    title: "Chat en direct",
    description: "Support instantane",
    value: "Demarrer une conversation",
    action: "/support"
  },
  {
    icon: MapPin,
    title: "Adresse",
    description: "Siege social",
    value: "Bastos, Yaounde, Cameroun",
    action: "#"
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Contactez-nous
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Comment pouvons-nous vous aider ?
            </h1>
            <p className="text-lg text-muted-foreground">
              Notre equipe est disponible pour repondre a toutes vos questions. 
              Choisissez le moyen de contact qui vous convient le mieux.
            </p>
          </motion.div>

          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {contactMethods.map((method, index) => (
              <a
                key={method.title}
                href={method.action}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <method.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                <p className="text-sm font-medium text-primary">{method.value}</p>
              </a>
            ))}
          </motion.div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Envoyez-nous un message
              </h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Prenom
                    </label>
                    <Input placeholder="Votre prenom" className="h-12" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom
                    </label>
                    <Input placeholder="Votre nom" className="h-12" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="votre@email.com" className="h-12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Telephone
                  </label>
                  <Input type="tel" placeholder="+237 6XX XXX XXX" className="h-12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sujet
                  </label>
                  <Input placeholder="Comment pouvons-nous vous aider ?" className="h-12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea 
                    placeholder="Decrivez votre demande..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Envoyer le message
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col justify-center"
            >
              <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                  <Headphones className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Support Client Premium
                </h3>
                <p className="text-muted-foreground mb-6">
                  Besoin d&apos;une assistance immediate ? Notre equipe de support est 
                  disponible 7j/7 pour vous accompagner.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    Temps de reponse moyen: 5 minutes
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Headphones className="h-4 w-4 text-primary" />
                    Support en francais et anglais
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Chat, email et telephone disponibles
                  </li>
                </ul>
                <Link href="/support">
                  <Button variant="outline" className="w-full">
                    Acceder au centre d&apos;aide
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
