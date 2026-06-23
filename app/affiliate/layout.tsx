import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Programme d'Affiliation QuickGo | Gagnez jusqu'à 15%",
  description: "Rejoignez le programme d'affiliation QuickGo et gagnez des commissions sur chaque vente générée. Jusqu'à 15% de commission sur vos recommandations.",
  keywords: "affiliation QuickGo, programme affiliation Cameroun, commission vente, revenus passifs",
  openGraph: {
    title: "Programme d'Affiliation QuickGo | Gagnez jusqu'à 15%",
    description: "Rejoignez le programme d'affiliation QuickGo et gagnez des commissions sur chaque vente générée. Jusqu'à 15% de commission sur vos recommandations.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
