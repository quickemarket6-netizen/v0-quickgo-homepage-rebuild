import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Centre d'Aide QuickGo | FAQ & Support",
  description: "Trouvez des réponses à vos questions sur les commandes, la livraison, les paiements et votre compte QuickGo. Support disponible 24h/24.",
  keywords: "aide QuickGo, FAQ, support QuickGo, problème commande, remboursement",
  openGraph: {
    title: "Centre d'Aide QuickGo | FAQ & Support",
    description: "Trouvez des réponses à vos questions sur les commandes, la livraison, les paiements et votre compte QuickGo. Support disponible 24h/24.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
