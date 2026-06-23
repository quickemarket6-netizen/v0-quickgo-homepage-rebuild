import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Suivi de Commande | QuickGo",
  description: "Suivez votre livraison en temps réel sur QuickGo. Localisez votre livreur et estimez votre heure d'arrivée à la minute près.",
  keywords: "suivi livraison QuickGo, tracking commande, localisation livreur temps réel",
  openGraph: {
    title: "Suivi de Commande | QuickGo",
    description: "Suivez votre livraison en temps réel sur QuickGo. Localisez votre livreur et estimez votre heure d'arrivée à la minute près.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
