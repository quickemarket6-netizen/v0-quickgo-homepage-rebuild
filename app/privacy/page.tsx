"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield, Lock, Eye, Database, UserCheck, Bell, Globe, Mail } from "lucide-react"

const sections = [
  {
    icon: Database,
    title: "Collecte des Donnees",
    content: `Nous collectons les informations suivantes pour assurer le bon fonctionnement de nos services :

• Informations d'identification : nom, prenom, adresse email, numero de telephone
• Informations de localisation : adresse de livraison, position GPS pour le suivi des commandes
• Informations de paiement : details des transactions (traites de maniere securisee par nos partenaires)
• Donnees d'utilisation : historique des commandes, preferences, interactions avec l'application
• Informations techniques : type d'appareil, systeme d'exploitation, adresse IP

Ces donnees sont essentielles pour vous offrir une experience personnalisee et securisee.`
  },
  {
    icon: Eye,
    title: "Utilisation des Donnees",
    content: `Vos donnees sont utilisees exclusivement pour :

• Traiter et livrer vos commandes
• Personnaliser votre experience d'achat
• Ameliorer nos services et notre application
• Vous envoyer des notifications importantes sur vos commandes
• Assurer la securite de votre compte
• Respecter nos obligations legales
• Analyser et ameliorer nos performances

Nous ne vendons jamais vos donnees personnelles a des tiers.`
  },
  {
    icon: Shield,
    title: "Protection des Donnees",
    content: `La securite de vos donnees est notre priorite :

• Chiffrement SSL/TLS pour toutes les communications
• Stockage securise avec chiffrement au repos
• Acces restreint aux donnees sensibles
• Audits de securite reguliers
• Conformite aux normes internationales de protection des donnees
• Authentification a deux facteurs disponible
• Surveillance continue des menaces

Nous utilisons les meilleures pratiques de l'industrie pour proteger vos informations.`
  },
  {
    icon: UserCheck,
    title: "Vos Droits",
    content: `Vous disposez des droits suivants concernant vos donnees :

• Droit d'acces : consulter les donnees que nous detenons sur vous
• Droit de rectification : corriger vos informations personnelles
• Droit a l'effacement : demander la suppression de vos donnees
• Droit a la portabilite : recevoir vos donnees dans un format standard
• Droit d'opposition : refuser certains traitements de donnees
• Droit de limitation : restreindre l'utilisation de vos donnees

Pour exercer ces droits, contactez-nous a privacy@quickgo.cm`
  },
  {
    icon: Bell,
    title: "Cookies et Traceurs",
    content: `Nous utilisons des cookies pour :

• Maintenir votre session de connexion
• Memoriser vos preferences
• Analyser l'utilisation de notre plateforme
• Personnaliser le contenu affiche
• Ameliorer la performance de l'application

Vous pouvez gerer vos preferences de cookies a tout moment dans les parametres de votre compte ou via notre banniere de consentement.`
  },
  {
    icon: Globe,
    title: "Transferts Internationaux",
    content: `Vos donnees peuvent etre traitees dans differents pays :

• Nos serveurs principaux sont situes en Europe et en Afrique
• Nous utilisons des prestataires conformes aux standards internationaux
• Des garanties contractuelles protegent vos donnees lors des transferts
• Nous respectons les reglementations locales de chaque pays

Nous nous assurons que tous les transferts sont effectues dans le respect de votre vie privee.`
  },
]

export default function PrivacyPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Derniere mise a jour : Mai 2026</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
                Politique de Confidentialite
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Chez QuickGo, nous prenons la protection de vos donnees personnelles tres au serieux. 
                Cette politique explique comment nous collectons, utilisons et protegeons vos informations.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-card border border-border/50"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-line leading-relaxed pl-16">
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/20 shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Questions sur la confidentialite ?</h3>
                  <p className="text-muted-foreground mb-4">
                    Notre equipe de protection des donnees est disponible pour repondre a toutes vos questions.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a href="mailto:privacy@quickgo.cm" className="text-primary hover:underline font-medium">
                      privacy@quickgo.cm
                    </a>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">DL Solutions SARL - Yaounde, Cameroun</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
