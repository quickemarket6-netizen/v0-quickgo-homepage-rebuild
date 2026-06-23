import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Boutiques & Commerçants | Marketplace QuickGo",
  description: "Découvrez les boutiques et commerçants partenaires QuickGo à Yaoundé et Douala. Restaurants, épiceries, pharmacies, mode et plus.",
  openGraph: {
    title: "Boutiques & Commerçants | Marketplace QuickGo",
    description: "Tous les commerçants partenaires QuickGo près de chez vous.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
