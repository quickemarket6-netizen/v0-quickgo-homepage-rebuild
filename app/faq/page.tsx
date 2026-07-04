import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { safeJsonLd } from "@/lib/seo/safe-json-ld"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import FAQContent from "./_components/FAQContent"

export const metadata: Metadata = {
  title: "Questions Fréquentes",
  description: "Trouvez rapidement des réponses à vos questions sur QuickGo : commandes, livraison, paiement, compte et plus encore.",
  openGraph: {
    title: "Questions Fréquentes — QuickGo",
    description: "Toutes les réponses à vos questions sur QuickGo.",
    url: "https://quickgo.cm/faq",
    type: "website",
  },
  alternates: { canonical: "https://quickgo.cm/faq" },
}

export const revalidate = 3600  // ISR: refresh every hour

interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
  sort_order: number
}
interface FaqCategory {
  id: string
  label: string
  items: FaqItem[]
}

const STATIC_CATEGORIES: FaqCategory[] = [
  { id:"general", label:"Général", items:[
    { id:"s1", category:"general", question:"Qu'est-ce que QuickGo ?", answer:"QuickGo est une super application camerounaise qui vous permet de commander des produits de restaurants, supermarchés, pharmacies et boutiques, et de vous les faire livrer rapidement.", sort_order:1 },
    { id:"s2", category:"general", question:"Dans quelles villes QuickGo est-il disponible ?", answer:"QuickGo est actuellement disponible à Yaoundé, Douala, Bafoussam, Bamenda, Garoua et Maroua. Nous étendons continuellement notre couverture à de nouvelles villes.", sort_order:2 },
  ]},
  { id:"orders", label:"Commandes", items:[
    { id:"s3", category:"orders", question:"Comment passer une commande ?", answer:"Téléchargez l'application QuickGo, créez un compte, sélectionnez votre ville, parcourez les commerçants, ajoutez des produits à votre panier et validez votre commande.", sort_order:1 },
    { id:"s4", category:"orders", question:"Puis-je annuler ma commande ?", answer:"Vous pouvez annuler votre commande gratuitement tant qu'elle n'a pas encore été récupérée par le livreur.", sort_order:2 },
  ]},
  { id:"delivery", label:"Livraison", items:[
    { id:"s5", category:"delivery", question:"Combien coûte la livraison ?", answer:"Les frais de livraison dépendent de la distance entre le commerçant et votre adresse. En moyenne, comptez entre 500 et 2 000 FCFA.", sort_order:1 },
    { id:"s6", category:"delivery", question:"Quel est le délai de livraison ?", answer:"Nous visons une livraison en moins de 30 minutes pour les zones urbaines.", sort_order:2 },
  ]},
  { id:"payment", label:"Paiement", items:[
    { id:"s7", category:"payment", question:"Quels modes de paiement acceptez-vous ?", answer:"Nous acceptons Mobile Money (MTN, Orange Money), les cartes bancaires (Visa, Mastercard), QuickGo Pay et le paiement à la livraison (cash).", sort_order:1 },
    { id:"s8", category:"payment", question:"Mes paiements sont-ils sécurisés ?", answer:"Absolument. Nous utilisons des technologies de chiffrement de pointe pour sécuriser toutes vos transactions.", sort_order:2 },
  ]},
  { id:"account", label:"Compte", items:[
    { id:"s9", category:"account", question:"Comment créer un compte ?", answer:"Téléchargez l'application ou visitez notre site, cliquez sur 'Créer un compte', entrez votre numéro de téléphone et suivez les instructions.", sort_order:1 },
  ]},
]

async function getCategories(): Promise<FaqCategory[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("faq_items")
      .select("id,category,question,answer,sort_order")
      .eq("is_active", true)
      .order("category")
      .order("sort_order")

    if (!data || data.length === 0) return STATIC_CATEGORIES

    const LABEL_MAP: Record<string, string> = {
      general: "Général", orders: "Commandes", delivery: "Livraison",
      payment: "Paiement", account: "Compte",
    }

    const grouped: Record<string, FaqItem[]> = {}
    data.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    })

    return Object.entries(grouped).map(([id, items]) => ({
      id,
      label: LABEL_MAP[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
      items,
    }))
  } catch {
    return STATIC_CATEGORIES
  }
}

export default async function FAQPage() {
  const categories = await getCategories()

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap(cat =>
      cat.items.map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      }))
    ),
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <Navbar />
      <FAQContent categories={categories} />
      <Footer />
    </main>
  )
}
