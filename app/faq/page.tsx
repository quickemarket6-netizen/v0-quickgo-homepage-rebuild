"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  Mail
} from "lucide-react"

const faqCategories = [
  { id: "general", label: "General" },
  { id: "orders", label: "Commandes" },
  { id: "delivery", label: "Livraison" },
  { id: "payment", label: "Paiement" },
  { id: "account", label: "Compte" },
]

const faqs = [
  {
    category: "general",
    question: "Qu'est-ce que QuickGo ?",
    answer: "QuickGo est une super application camerounaise qui vous permet de commander des produits de restaurants, supermarches, pharmacies et boutiques, et de vous les faire livrer rapidement. Nous proposons egalement des services de paiement mobile et d'assistant IA."
  },
  {
    category: "general",
    question: "Dans quelles villes QuickGo est-il disponible ?",
    answer: "QuickGo est actuellement disponible a Yaounde, Douala, Bafoussam, Bamenda, Garoua et Maroua. Nous etendons continuellement notre couverture a de nouvelles villes."
  },
  {
    category: "orders",
    question: "Comment passer une commande ?",
    answer: "Telechargez l'application QuickGo, creez un compte, selectionnez votre ville, parcourez les commercants, ajoutez des produits a votre panier et validez votre commande. Vous pouvez suivre votre livraison en temps reel."
  },
  {
    category: "orders",
    question: "Puis-je annuler ma commande ?",
    answer: "Vous pouvez annuler votre commande gratuitement tant qu'elle n'a pas encore ete recuperee par le livreur. Une fois en cours de livraison, des frais d'annulation peuvent s'appliquer."
  },
  {
    category: "orders",
    question: "Y a-t-il un minimum de commande ?",
    answer: "Le minimum de commande varie selon les commercants. Il est generalement de 2 000 CFA pour les restaurants et peut etre plus eleve pour d'autres categories."
  },
  {
    category: "delivery",
    question: "Combien coute la livraison ?",
    answer: "Les frais de livraison dependent de la distance entre le commercant et votre adresse. Ils sont calcules automatiquement et affiches avant la validation de votre commande. En moyenne, comptez entre 500 et 2 000 CFA."
  },
  {
    category: "delivery",
    question: "Quel est le delai de livraison ?",
    answer: "Nous visons une livraison en moins de 30 minutes pour les zones urbaines. Le delai exact depend du type de commande et de la distance, et est affiche lors de la commande."
  },
  {
    category: "delivery",
    question: "Puis-je suivre ma livraison en temps reel ?",
    answer: "Oui ! Une fois votre commande confirmee, vous pouvez suivre en temps reel la position de votre livreur sur une carte interactive dans l'application."
  },
  {
    category: "payment",
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "Nous acceptons Mobile Money (MTN, Orange Money), les cartes bancaires (Visa, Mastercard), le portefeuille QuickGo Pay et le paiement a la livraison (cash)."
  },
  {
    category: "payment",
    question: "Qu'est-ce que QuickGo Pay ?",
    answer: "QuickGo Pay est notre portefeuille electronique integre. Il vous permet de payer vos commandes plus rapidement, de recevoir du cashback et de transferer de l'argent a vos proches."
  },
  {
    category: "payment",
    question: "Mes paiements sont-ils securises ?",
    answer: "Absolument. Nous utilisons des technologies de cryptage de pointe pour securiser toutes vos transactions. Vos informations de paiement sont protegees et ne sont jamais partagees."
  },
  {
    category: "account",
    question: "Comment creer un compte ?",
    answer: "Telechargez l'application ou visitez notre site web, cliquez sur 'Creer un compte', entrez votre numero de telephone et suivez les instructions pour verifier votre compte."
  },
  {
    category: "account",
    question: "Comment modifier mes informations personnelles ?",
    answer: "Connectez-vous a votre compte, allez dans 'Parametres' puis 'Mon profil'. Vous pouvez y modifier votre nom, adresse email, numero de telephone et adresses de livraison."
  },
  {
    category: "account",
    question: "J'ai oublie mon mot de passe, que faire ?",
    answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublie'. Entrez votre numero de telephone ou email et suivez les instructions pour reinitialiser votre mot de passe."
  },
]

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("general")
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = faq.category === activeCategory
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              FAQ
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Questions Frequentes
            </h1>
            <p className="text-lg text-muted-foreground">
              Trouvez rapidement des reponses a vos questions
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une question..."
              className="h-14 pl-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {faqCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </motion.div>

          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                  {openQuestion === index ? (
                    <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openQuestion === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Vous n&apos;avez pas trouve votre reponse ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Notre equipe support est la pour vous aider
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/support">
                <Button className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat en direct
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Nous contacter
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
