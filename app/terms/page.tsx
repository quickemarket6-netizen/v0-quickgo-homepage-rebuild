"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FileText, Users, ShoppingBag, Truck, CreditCard, AlertTriangle, Scale, HelpCircle } from "lucide-react"

const sections = [
  {
    icon: Users,
    title: "1. Acceptation des Conditions",
    content: `En accedant a QuickGo ou en utilisant nos services, vous acceptez d'etre lie par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.

Ces conditions s'appliquent a :
• L'application mobile QuickGo
• Le site web quickgo.cm et ses sous-domaines
• Tous les services associes (QuickGo Market, QuickGo Delivery, QuickGo Pay)

Nous nous reservons le droit de modifier ces conditions a tout moment. Les modifications entrent en vigueur des leur publication.`
  },
  {
    icon: ShoppingBag,
    title: "2. Services QuickGo Market",
    content: `QuickGo Market est une place de marche qui met en relation acheteurs et vendeurs :

• Les produits sont vendus par des vendeurs tiers verifies
• QuickGo agit en tant qu'intermediaire pour faciliter les transactions
• Les prix affiches incluent toutes les taxes applicables
• La disponibilite des produits peut varier selon votre localisation
• Les images des produits sont a titre indicatif

Processus de commande :
• Ajoutez les articles a votre panier
• Validez votre commande et choisissez le mode de paiement
• Recevez une confirmation par email et dans l'application
• Suivez votre livraison en temps reel`
  },
  {
    icon: Truck,
    title: "3. Livraison et Expedition",
    content: `Nos services de livraison sont soumis aux conditions suivantes :

Delais de livraison :
• Express : 30 minutes a 2 heures (selon disponibilite)
• Standard : 24 a 48 heures
• Les delais peuvent varier selon votre zone geographique

Zones couvertes :
• Yaounde : Tous les quartiers principaux
• Douala : Tous les quartiers principaux
• Extension progressive vers d'autres villes

Responsabilites :
• Le livreur doit remettre la commande a l'adresse indiquee
• Vous devez etre present ou designer un representant
• En cas d'absence, une nouvelle tentative sera programmee`
  },
  {
    icon: CreditCard,
    title: "4. Paiements et Remboursements",
    content: `Modes de paiement acceptes :
• Orange Money
• MTN Mobile Money
• Cartes bancaires (Visa, Mastercard)
• QuickGo Pay (portefeuille integre)
• Paiement a la livraison (zones selectionnees)

Politique de remboursement :
• Remboursement complet si la commande n'est pas livree
• Remboursement partiel ou total en cas de produit defectueux
• Delai de traitement : 5 a 10 jours ouvrables
• Le remboursement est effectue via le mode de paiement original

Annulations :
• Annulation gratuite avant expedition
• Frais d'annulation possibles apres expedition`
  },
  {
    icon: AlertTriangle,
    title: "5. Responsabilites et Limitations",
    content: `Responsabilites de QuickGo :
• Assurer le bon fonctionnement de la plateforme
• Verifier l'identite des vendeurs et livreurs
• Faciliter la resolution des litiges
• Proteger vos donnees personnelles

Limitations :
• QuickGo n'est pas responsable de la qualite des produits vendus par des tiers
• Les delais de livraison sont indicatifs et non garantis
• Nous ne sommes pas responsables des dommages indirects
• Notre responsabilite est limitee au montant de votre commande

Vos responsabilites :
• Fournir des informations exactes
• Respecter les vendeurs et livreurs
• Ne pas utiliser la plateforme a des fins illegales`
  },
  {
    icon: Scale,
    title: "6. Propriete Intellectuelle",
    content: `Tous les elements de QuickGo sont proteges :

• La marque QuickGo et son logo
• Le design et l'interface de l'application
• Les contenus textuels et visuels
• Les algorithmes et technologies proprietaires

Vous ne pouvez pas :
• Copier ou reproduire nos contenus sans autorisation
• Utiliser notre marque sans accord ecrit
• Decompiler ou modifier notre application
• Extraire des donnees de maniere automatisee`
  },
  {
    icon: HelpCircle,
    title: "7. Support et Litiges",
    content: `En cas de probleme :

1. Contactez notre support client 24/7
2. Ouvrez un ticket dans l'application
3. Nous nous engageons a repondre sous 24h

Resolution des litiges :
• Tentative de resolution amiable en priorite
• Mediation possible via un organisme agree
• Juridiction competente : Tribunaux de Yaounde, Cameroun

Contact :
• Email : support@quickgo.cm
• Telephone : +237 6 95 55 55 55
• Adresse : DL Solutions SARL, Bastos, Yaounde`
  },
]

export default function TermsPage() {
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
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Version 2.0 - Mai 2026</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
                Conditions Generales d&apos;Utilisation
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Ces conditions regissent votre utilisation de la plateforme QuickGo et de tous ses services associes.
                Veuillez les lire attentivement avant d&apos;utiliser nos services.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Sommaire</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                  <a
                    key={index}
                    href={`#section-${index + 1}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-8 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  id={`section-${index + 1}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-card border border-border/50 scroll-mt-32"
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
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
