import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tous les Produits | Marketplace QuickGo",
  description: "Parcourez notre catalogue complet de produits locaux. Filtrez par catégorie, prix et disponibilité. Livraison express partout au Cameroun.",
  openGraph: {
    title: "Tous les Produits | Marketplace QuickGo",
    description: "Catalogue complet — alimentation, mode, électronique et plus.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
