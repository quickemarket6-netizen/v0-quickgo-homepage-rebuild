"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, ChevronRight, Package, CreditCard, Shield, Truck, HelpCircle, Bot, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const categoryData: Record<string, {
  title: string
  description: string
  icon: React.ElementType
  articles: { title: string; summary: string; popular?: boolean }[]
}> = {
  commandes: {
    title: "Commandes & Livraison",
    description: "Tout ce que vous devez savoir sur vos commandes et livraisons",
    icon: Package,
    articles: [
      { title: "Comment suivre ma commande en temps réel ?", summary: "Accédez au suivi GPS de votre livreur depuis l'onglet Suivi.", popular: true },
      { title: "Comment annuler une commande ?", summary: "Vous pouvez annuler avant que le vendeur accepte la commande.", popular: true },
      { title: "Quels sont les délais de livraison ?", summary: "En moyenne 30 à 60 minutes selon votre zone et le vendeur.", popular: true },
      { title: "Ma commande est en retard, que faire ?", summary: "Contactez le support via le chat ou appelez le livreur directement." },
      { title: "Comment modifier l'adresse de livraison ?", summary: "Modifiez avant que le livreur prenne en charge la commande." },
      { title: "Comment laisser un avis sur ma livraison ?", summary: "Après réception, une notification vous invite à noter l'expérience." },
    ],
  },
  paiements: {
    title: "Paiements & Facturation",
    description: "Méthodes de paiement, remboursements et factures",
    icon: CreditCard,
    articles: [
      { title: "Quels moyens de paiement sont acceptés ?", summary: "Orange Money, MTN MoMo, carte bancaire Visa/Mastercard.", popular: true },
      { title: "Comment demander un remboursement ?", summary: "Le remboursement est traité sous 24-48h en cas de problème.", popular: true },
      { title: "Comment obtenir ma facture ?", summary: "Les factures sont disponibles dans Tableau de bord > Commandes." },
      { title: "Mon paiement a échoué, que faire ?", summary: "Vérifiez le solde de votre compte ou réessayez avec un autre mode." },
      { title: "Comment utiliser le cashback ?", summary: "Le cashback est crédité automatiquement sur votre portefeuille QuickGo." },
      { title: "Quand suis-je débité ?", summary: "Le débit a lieu au moment de la validation de la commande." },
    ],
  },
  compte: {
    title: "Compte & Sécurité",
    description: "Gestion de votre compte, confidentialité et sécurité",
    icon: Shield,
    articles: [
      { title: "Comment modifier mon mot de passe ?", summary: "Depuis Paramètres > Sécurité ou via le lien de réinitialisation.", popular: true },
      { title: "Comment activer la double authentification ?", summary: "Activez-la dans Paramètres > Sécurité > Authentification 2FA." },
      { title: "Mon compte a été piraté, que faire ?", summary: "Changez immédiatement le mot de passe et contactez le support." },
      { title: "Comment supprimer mon compte ?", summary: "Allez dans Paramètres > Sécurité > Zone de danger." },
      { title: "Comment modifier mon numéro de téléphone ?", summary: "Dans Paramètres > Profil, modifiez et vérifiez par SMS." },
      { title: "QuickGo partage-t-il mes données ?", summary: "Non. Consultez notre politique de confidentialité pour les détails." },
    ],
  },
  livreur: {
    title: "Devenir Livreur",
    description: "Inscription, missions, gains et conditions de livraison",
    icon: Truck,
    articles: [
      { title: "Comment devenir livreur QuickGo ?", summary: "Inscrivez-vous sur /delivery et soumettez vos documents.", popular: true },
      { title: "Quels documents sont nécessaires ?", summary: "CNI, permis de conduire, assurance véhicule et photo." },
      { title: "Combien puis-je gagner par livraison ?", summary: "Entre 500 et 2 000 CFA par course selon la distance." },
      { title: "Comment fonctionne le paiement des livreurs ?", summary: "Les gains sont reversés chaque semaine sur Orange Money ou MTN." },
      { title: "Puis-je choisir mes horaires ?", summary: "Oui, les livreurs gèrent leur disponibilité librement." },
      { title: "Comment évaluer ma performance ?", summary: "Consultez vos statistiques dans le tableau de bord livreur." },
    ],
  },
  produits: {
    title: "Produits & Services",
    description: "Catalogue, qualité des produits et politique de retour",
    icon: HelpCircle,
    articles: [
      { title: "Les produits sont-ils authentiques ?", summary: "Tous les vendeurs sont vérifiés et leurs produits contrôlés.", popular: true },
      { title: "Comment retourner un produit défectueux ?", summary: "Signalez le problème dans les 48h après réception via l'appli." },
      { title: "Puis-je commander plusieurs vendeurs à la fois ?", summary: "Oui, chaque vendeur est traité comme une commande séparée." },
      { title: "Les prix incluent-ils la livraison ?", summary: "Les frais de livraison sont affichés séparément au checkout." },
      { title: "Comment signaler un vendeur problématique ?", summary: "Utilisez le bouton Signaler sur la page du vendeur." },
      { title: "Y a-t-il une garantie sur les produits ?", summary: "La garantie dépend du vendeur et est indiquée sur la fiche produit." },
    ],
  },
  ai: {
    title: "QuickGo AI",
    description: "Comment utiliser votre assistant intelligence artificielle",
    icon: Bot,
    articles: [
      { title: "Comment accéder à QuickGo AI ?", summary: "Via le bouton IA dans la navbar ou directement sur /ai.", popular: true },
      { title: "QuickGo AI peut-il passer une commande pour moi ?", summary: "Oui, l'IA peut créer une commande en votre nom avec votre confirmation." },
      { title: "L'IA est-elle disponible 24/7 ?", summary: "Oui, QuickGo AI répond à toute heure sans interruption." },
      { title: "L'IA comprend-elle le français camerounais ?", summary: "Oui, l'IA est adaptée aux expressions locales camerounaises." },
      { title: "Mes conversations avec l'IA sont-elles privées ?", summary: "Les conversations sont chiffrées et non partagées avec des tiers." },
      { title: "Comment améliorer les réponses de l'IA ?", summary: "Donnez des retours via le bouton pouce en bas de chaque réponse." },
    ],
  },
}

export default function SupportCategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const category = categoryData[slug]

  if (!category) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-white mb-2">Catégorie introuvable</h1>
            <Link href="/support" className="text-primary hover:underline">Retour au support</Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const Icon = category.icon

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{category.title}</span>
          </nav>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{category.title}</h1>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Rechercher dans cette catégorie..." className="pl-12 h-12 bg-card border-border/50 rounded-2xl" />
            </div>
          </motion.div>

          {/* Popular articles */}
          {category.articles.some((a) => a.popular) && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Questions populaires</h2>
              <div className="space-y-2">
                {category.articles.filter((a) => a.popular).map((article, i) => (
                  <motion.button key={article.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all text-left group">
                    <div>
                      <p className="text-white font-medium">{article.title}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">{article.summary}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* All articles */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Tous les articles</h2>
            <div className="space-y-2">
              {category.articles.map((article, i) => (
                <motion.button key={article.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-card transition-all text-left group">
                  <div>
                    <p className="text-white font-medium">{article.title}</p>
                    <p className="text-muted-foreground text-sm mt-0.5">{article.summary}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Back */}
          <div className="mt-8 pt-8 border-t border-border/30">
            <Link href="/support" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour au centre d&apos;aide
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
